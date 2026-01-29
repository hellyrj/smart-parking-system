import sequelize from "../config/db.js";
import {
  User,
  parkingSpace,
  parkingSession,
  payment,
  parkingLocation,
  notification
} from "../models/index.js";

// Reserve a parking spot
export const reserveParkingSpot = async (req, res) => {
  try {
    const { parkingId, vehiclePlate, vehicleModel } = req.body;
    
    const parking = await parkingSpace.findByPk(parkingId);
    
    if (!parking) {
      return res.status(404).json({ message: "Parking not found" });
    }
    
    if (!parking.is_active || parking.available_spots <= 0) {
      return res.status(400).json({ message: "Parking not available" });
    }
    
    // Reserve spot
    await parking.occupySpot();
    
    // Create reservation session
    const reservedUntil = new Date();
    reservedUntil.setMinutes(reservedUntil.getMinutes() + 30); // 30 min reservation
    
    const session = await parkingSession.create({
      user_id: req.user.id,
      parking_id: parkingId,
      session_type: 'reserved',
      reserved_until: reservedUntil,
      vehicle_plate: vehiclePlate,
      vehicle_model: vehicleModel,
      reservation_status: 'waiting'
    });
    
    // Notify owner
    await notification.create({
      user_id: parking.owner_id,
      type: 'new_session',
      title: 'New Reservation',
      message: `New reservation at ${parking.name}`,
      data: JSON.stringify({ session_id: session.id })
    });
    
    res.json({
      message: "Parking spot reserved successfully",
      reservation_id: session.id,
      reserved_until: reservedUntil
    });
  } catch (error) {
    console.error("Reservation error:", error);
    res.status(500).json({ message: "Failed to reserve parking spot" });
  }
};

// Start parking session (convert reservation to active)
export const startParkingSession = async (req, res) => {
  try {
    const { reservationId } = req.body;
    
    const session = await parkingSession.findByPk(reservationId, {
      include: [parkingSpace]
    });
    
    if (!session || session.user_id !== req.user.id) {
      return res.status(404).json({ message: "Reservation not found" });
    }
    
    if (session.isReservationExpired()) {
      await session.autoCancelExpiredReservation();
      return res.status(400).json({ message: "Reservation expired" });
    }
    
    // Convert to active session
    session.session_type = 'active';
    session.actual_start_time = new Date();
    session.arrival_confirmed = true;
    session.arrival_confirmed_at = new Date();
    await session.save();
    
    res.json({
      message: "Parking session started",
      session_id: session.id,
      start_time: session.actual_start_time
    });
  } catch (error) {
    console.error("Start session error:", error);
    res.status(500).json({ message: "Failed to start parking session" });
  }
};

/**
 * 🏁 END PARKING SESSION
 */
/**
 * 🏁 END PARKING SESSION - FIXED VERSION
 */
export const endParkingSession = async (req, res) => {
  const { sessionId } = req.body;
  const userId = req.user.id;

  console.log("🔍 Ending session - Session ID:", sessionId, "User ID:", userId);

  try {
    const result = await sequelize.transaction(async (t) => {
      // 1️⃣ Find SPECIFIC session
      const session = await parkingSession.findOne({
        where: { 
          id: sessionId,
          user_id: userId, 
          end_time: null 
        },
        include: [{ model: parkingSpace }],
        transaction: t,
      });

      if (!session) {
        throw new Error(`No active parking session found with ID: ${sessionId}`);
      }

      console.log("✅ Found session:", session.id, "Type:", session.session_type);
      console.log("✅ Current session_status:", session.session_status);

      // 2️⃣ Get parking
      const parking = session.parkingSpace;
      if (!parking) {
        throw new Error("Parking space not found");
      }

      // 3️⃣ End session - Set ALL relevant fields
      const endTime = new Date();
      session.end_time = endTime;
      
      // FIX: Only update session_status (not status)
      session.session_status = "completed";
      
      // IMPORTANT: If the model has a 'status' field (deprecated), also update it
      // but check if it exists first
      if (session.dataValues.hasOwnProperty('status')) {
        session.status = "completed";
      }
      
      await session.save({ transaction: t });
      console.log("✅ Session ended, session_status updated to:", session.session_status);

      // 4️⃣ Calculate duration
      const startTime = session.actual_start_time || session.start_time;
      const durationMs = endTime - startTime;
      const hours = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60)));

      // 5️⃣ Calculate amount
      const amount = hours * parking.price_per_hour;

      // 6️⃣ Update total_amount in session
      session.total_amount = amount;
      await session.save({ transaction: t });
      console.log("✅ Total amount updated:", amount);

      // 7️⃣ Release spot
      await parking.releaseSpot(t);
      console.log("✅ Parking spot released");

      // 8️⃣ Create payment
      const paymentRecord = await payment.createCompletedPayment(
        {
          session_id: session.id,
          amount,
          payment_method: "wallet",
        },
        t
      );

      console.log("✅ Payment created:", paymentRecord.id);

      return { 
        sessionId: session.id,
        hours, 
        amount,
        payment: paymentRecord,
        start_time: startTime,
        end_time: endTime,
        session_status: session.session_status
      };
    });

    res.json({
      message: "Parking session ended successfully",
      session_id: result.sessionId,
      duration_hours: result.hours,
      total_amount: result.amount,
      payment: result.payment,
      start_time: result.start_time,
      end_time: result.end_time,
      session_status: result.session_status
    });
    
  } catch (error) {
    console.error("❌ Error ending session:", error);
    res.status(400).json({ 
      message: error.message || "Failed to end session",
      error: error.toString()
    });
  }
};


// Get driver's active sessions
export const getDriverSessions = async (req, res) => {
    try {
        const sessions = await parkingSession.findAll({
            where: {
                user_id: req.user.id,
                end_time: null
            },
            include: [{
                model: parkingSpace,
                as: 'parkingSpace', // Make sure this alias matches your model association
                include: [{
                    model: parkingLocation,
                    as: 'parkingLocations' // Make sure this alias matches
                }]
            }],
            order: [['start_time', 'DESC']]
        });
        
        // Format the response properly
        const formattedSessions = sessions.map(session => {
            const sessionData = session.toJSON();
            
            // Calculate duration if session is active
            let duration = null;
            let currentCost = null;
            
            if (session.start_time && !session.end_time) {
                const startTime = new Date(session.start_time);
                const now = new Date();
                duration = Math.floor((now - startTime) / (1000 * 60)); // minutes
                
                // Calculate cost if parking space has price
                if (session.parkingSpace && session.parkingSpace.price_per_hour) {
                    currentCost = (duration / 60) * session.parkingSpace.price_per_hour;
                }
            }
            
            return {
                id: session.id,
                user_id: session.user_id,
                parking_id: session.parking_id,
                session_type: session.session_type,
                start_time: session.start_time,
                end_time: session.end_time,
                total_amount: session.total_amount,
                vehicle_plate: session.vehicle_plate,
                vehicle_model: session.vehicle_model,
                duration_minutes: duration,
                current_cost: currentCost ? currentCost.toFixed(2) : null,
                parkingSpace: session.parkingSpace ? {
                    id: session.parkingSpace.id,
                    name: session.parkingSpace.name,
                    price_per_hour: session.parkingSpace.price_per_hour,
                    total_spots: session.parkingSpace.total_spots,
                    available_spots: session.parkingSpace.available_spots,
                    is_active: session.parkingSpace.is_active,
                    parkingLocation: session.parkingSpace.parkingLocation ? {
                        id: session.parkingSpace.parkingLocation.id,
                        address: session.parkingSpace.parkingLocation.address,
                        city: session.parkingSpace.parkingLocation.city,
                        latitude: session.parkingSpace.parkingLocation.latitude,
                        longitude: session.parkingSpace.parkingLocation.longitude
                    } : null
                } : null,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt
            };
        });
        
        res.json(formattedSessions);
    } catch (error) {
        console.error("Get sessions error:", error);
        res.status(500).json({ message: "Failed to fetch sessions", error: error.message });
    }
};

// Cancel reservation (driver side)
export const cancelDriverReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    
    const session = await parkingSession.findByPk(reservationId, {
      include: [parkingSpace]
    });
    
    if (!session || session.user_id !== req.user.id) {
      return res.status(404).json({ message: "Reservation not found" });
    }
    
    if (session.session_type !== 'reserved') {
      return res.status(400).json({ message: "Not a reservation" });
    }
    
    // Release parking spot
    await session.parkingSpace.releaseSpot();
    
    // Update session
    session.end_time = new Date();
    session.session_status = 'cancelled';
    session.reservation_status = 'cancelled';
    await session.save();
    
    // Notify owner
    await notification.create({
      user_id: session.parkingSpace.owner_id,
      type: 'reservation_cancelled',
      title: 'Reservation Cancelled',
      message: `Reservation cancelled by user`,
      data: JSON.stringify({ session_id: session.id })
    });
    
    res.json({ 
      message: "Reservation cancelled successfully"
    });
  } catch (error) {
    console.error("Cancel reservation error:", error);
    res.status(500).json({ message: "Failed to cancel reservation" });
  }
};