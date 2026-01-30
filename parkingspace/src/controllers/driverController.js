import sequelize from "../config/db.js";
import { Op } from "sequelize";
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


// Get driver's active reservations - FIXED WITH Op IMPORT
export const getDriverReservations = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("Getting reservations for user:", userId);
    
    // Find all reservations for this user
    const reservations = await parkingSession.findAll({
      where: {
        user_id: userId,
        session_type: 'reserved'
      },
      include: [{
        model: parkingSpace,
        as: 'parkingSpace',
        include: [{
          model: parkingLocation,
          as: 'parkingLocations'
        }]
      }],
      order: [['reserved_until', 'ASC']] // Sort by soonest expiration
    });
    
    console.log(`Found ${reservations.length} reservations`);
    
    // Check for expired reservations and auto-cancel them
    const now = new Date();
    const updatedReservations = [];
    
    for (const reservation of reservations) {
      try {
        // Check if reservation has isReservationExpired method
        if (reservation.isReservationExpired && typeof reservation.isReservationExpired === 'function') {
          if (reservation.isReservationExpired()) {
            console.log(`Reservation ${reservation.id} is expired, auto-cancelling...`);
            // Auto-cancel expired reservation
            try {
              await reservation.autoCancelExpiredReservation();
              console.log(`Auto-cancelled expired reservation: ${reservation.id}`);
              continue; // Skip adding to list since it's now cancelled
            } catch (autoCancelError) {
              console.error(`Error auto-cancelling reservation ${reservation.id}:`, autoCancelError);
              // Continue with the reservation even if auto-cancel failed
            }
          }
        } else {
          console.log(`Reservation ${reservation.id} doesn't have isReservationExpired method`);
        }
        
        updatedReservations.push(reservation);
      } catch (reservationError) {
        console.error(`Error processing reservation ${reservation.id}:`, reservationError);
        // Skip this reservation if there's an error
      }
    }
    
    // Format response
    const formattedReservations = updatedReservations.map(reservation => {
      try {
        const data = reservation.toJSON();
        
        // Calculate time remaining
        let timeRemaining = null;
        let minutesRemaining = null;
        
        if (data.reserved_until) {
          const reservedUntil = new Date(data.reserved_until);
          const timeLeft = reservedUntil - now;
          minutesRemaining = Math.max(0, Math.floor(timeLeft / (1000 * 60)));
          
          if (minutesRemaining > 0) {
            const hours = Math.floor(minutesRemaining / 60);
            const mins = minutesRemaining % 60;
            timeRemaining = `${hours}h ${mins}m`;
          } else {
            timeRemaining = "Expired";
          }
        }
        
        // Determine reservation status
        let reservationStatus = 'active';
        if (data.session_status === 'cancelled') {
          reservationStatus = 'cancelled';
        } else if (data.reserved_until && new Date(data.reserved_until) < now) {
          reservationStatus = 'expired';
        } else if (data.reservation_status === 'waiting') {
          reservationStatus = 'waiting';
        }
        
        return {
          id: data.id,
          parking_id: data.parking_id,
          user_id: data.user_id,
          vehicle_plate: data.vehicle_plate,
          vehicle_model: data.vehicle_model,
          session_type: data.session_type,
          reservation_status: reservationStatus,
          reserved_until: data.reserved_until,
          created_at: data.createdAt,
          updated_at: data.updatedAt,
          time_remaining: timeRemaining,
          minutes_remaining: minutesRemaining,
          parkingSpace: data.parkingSpace ? {
            id: data.parkingSpace.id,
            name: data.parkingSpace.name,
            price_per_hour: data.parkingSpace.price_per_hour,
            total_spots: data.parkingSpace.total_spots,
            available_spots: data.parkingSpace.available_spots,
            is_active: data.parkingSpace.is_active,
            parkingLocations: data.parkingSpace.parkingLocations || []
          } : null
        };
      } catch (formatError) {
        console.error(`Error formatting reservation ${reservation.id}:`, formatError);
        return null;
      }
    }).filter(reservation => reservation !== null); // Remove null entries
    
    // Get recent (non-active) reservations for history - FIXED WITH Op
    const recentReservations = await parkingSession.findAll({
      where: {
        user_id: userId,
        [Op.or]: [ // FIXED: Using imported Op
          { session_type: 'reserved', session_status: 'cancelled' },
          { session_type: 'reserved', session_status: 'completed' }
        ]
      },
      include: [{
        model: parkingSpace,
        as: 'parkingSpace'
      }],
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    
    const formattedRecent = recentReservations.map(reservation => {
      try {
        const data = reservation.toJSON();
        return {
          id: data.id,
          parking_id: data.parking_id,
          vehicle_plate: data.vehicle_plate,
          reservation_status: data.session_status === 'cancelled' ? 'cancelled' : 'expired',
          reserved_until: data.reserved_until,
          created_at: data.createdAt,
          parkingSpace: data.parkingSpace ? {
            name: data.parkingSpace.name,
            price_per_hour: data.parkingSpace.price_per_hour
          } : null
        };
      } catch (error) {
        console.error(`Error formatting recent reservation ${reservation.id}:`, error);
        return null;
      }
    }).filter(reservation => reservation !== null);
    
    res.json({
      success: true,
      reservations: formattedReservations,
      recent_reservations: formattedRecent,
      count: formattedReservations.length
    });
    
  } catch (error) {
    console.error("Error getting driver reservations:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch reservations", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Check reservation status - FIXED WITH Op
export const checkReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const reservation = await parkingSession.findOne({
      where: {
        id: id,
        user_id: userId,
        session_type: 'reserved'
      },
      include: [parkingSpace]
    });
    
    if (!reservation) {
      return res.status(404).json({ 
        success: false, 
        message: "Reservation not found",
        expired: true
      });
    }
    
    const now = new Date();
    const reservedUntil = new Date(reservation.reserved_until);
    const isExpired = reservedUntil < now;
    
    // Auto-cancel if expired
    if (isExpired && reservation.reservation_status !== 'cancelled') {
      await reservation.autoCancelExpiredReservation();
      
      res.json({
        success: true,
        expired: true,
        status: 'expired',
        message: "Reservation has expired"
      });
    } else {
      const minutesRemaining = Math.max(0, Math.floor((reservedUntil - now) / (1000 * 60)));
      
      res.json({
        success: true,
        expired: false,
        status: 'active',
        reservation_id: reservation.id,
        reserved_until: reservation.reserved_until,
        minutes_remaining: minutesRemaining,
        parking_name: reservation.parkingSpace?.name || 'Unknown',
        vehicle_plate: reservation.vehicle_plate
      });
    }
    
  } catch (error) {
    console.error("Error checking reservation status:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to check reservation status",
      error: error.message 
    });
  }
};

// Cancel reservation (driver side) - FIXED WITH Op
export const cancelDriverReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const session = await parkingSession.findOne({
      where: {
        id: id,
        user_id: userId,
        session_type: 'reserved'
      },
      include: [parkingSpace]
    });
    
    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: "Reservation not found" 
      });
    }
    
    // Check if already cancelled
    if (session.session_status === 'cancelled') {
      return res.json({ 
        success: true, 
        message: "Reservation already cancelled" 
      });
    }
    
    // Check if already expired
    if (session.isReservationExpired && session.isReservationExpired()) {
      return res.status(400).json({ 
        success: false, 
        message: "Reservation has already expired" 
      });
    }
    
    // Use transaction for consistency
    const result = await sequelize.transaction(async (t) => {
      // Release parking spot
      if (session.parkingSpace) {
        await session.parkingSpace.releaseSpot(t);
      }
      
      // Update session status
      session.session_status = 'cancelled';
      session.reservation_status = 'cancelled';
      session.end_time = new Date();
      await session.save({ transaction: t });
      
      // Notify owner
      if (session.parkingSpace) {
        await notification.create({
          user_id: session.parkingSpace.owner_id,
          type: 'reservation_cancelled',
          title: 'Reservation Cancelled',
          message: `Reservation #${session.id} has been cancelled by user`,
          data: JSON.stringify({ 
            session_id: session.id,
            parking_name: session.parkingSpace.name,
            vehicle_plate: session.vehicle_plate
          })
        }, { transaction: t });
      }
      
      return session;
    });
    
    res.json({
      success: true,
      message: "Reservation cancelled successfully",
      reservation_id: result.id,
      cancelled_at: result.end_time
    });
    
  } catch (error) {
    console.error("Cancel reservation error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to cancel reservation", 
      error: error.message 
    });
  }
};

// Get reservation by ID (detailed view) - FIXED WITH Op
export const getReservationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const reservation = await parkingSession.findOne({
      where: {
        id: id,
        user_id: userId
      },
      include: [{
        model: parkingSpace,
        as: 'parkingSpace',
        include: [{
          model: parkingLocation,
          as: 'parkingLocations'
        }]
      }]
    });
    
    if (!reservation) {
      return res.status(404).json({ 
        success: false, 
        message: "Reservation not found" 
      });
    }
    
    // Check if expired
    const now = new Date();
    const reservedUntil = new Date(reservation.reserved_until);
    const isExpired = reservedUntil < now && reservation.session_type === 'reserved';
    
    if (isExpired && reservation.session_status !== 'cancelled') {
      await reservation.autoCancelExpiredReservation();
      reservation.session_status = 'expired';
    }
    
    const minutesRemaining = Math.max(0, Math.floor((reservedUntil - now) / (1000 * 60)));
    
    const response = {
      success: true,
      reservation: {
        id: reservation.id,
        parking_id: reservation.parking_id,
        user_id: reservation.user_id,
        vehicle_plate: reservation.vehicle_plate,
        vehicle_model: reservation.vehicle_model,
        session_type: reservation.session_type,
        session_status: reservation.session_status,
        reservation_status: reservation.reservation_status,
        reserved_until: reservation.reserved_until,
        start_time: reservation.start_time,
        end_time: reservation.end_time,
        created_at: reservation.createdAt,
        updated_at: reservation.updatedAt,
        minutes_remaining: minutesRemaining,
        is_expired: isExpired,
        parkingSpace: reservation.parkingSpace ? {
          id: reservation.parkingSpace.id,
          name: reservation.parkingSpace.name,
          price_per_hour: reservation.parkingSpace.price_per_hour,
          total_spots: reservation.parkingSpace.total_spots,
          available_spots: reservation.parkingSpace.available_spots,
          is_active: reservation.parkingSpace.is_active,
          operating_hours: reservation.parkingSpace.operating_hours,
          description: reservation.parkingSpace.description,
          parkingLocations: reservation.parkingSpace.parkingLocations || []
        } : null
      }
    };
    
    res.json(response);
    
  } catch (error) {
    console.error("Error getting reservation:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch reservation", 
      error: error.message 
    });
  }
};