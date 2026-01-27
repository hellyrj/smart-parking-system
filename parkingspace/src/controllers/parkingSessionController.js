import sequelize from "../config/db.js";
import {
  parkingSpace,
  parkingSession,
  payment as PaymentModel,
} from "../models/index.js";

/**
 * 🚗 START PARKING SESSION
 */
export const startParkingSession = async (req, res) => {
  const { parking_id } = req.body;
  const userId = req.user.id;

  try {
    const session = await sequelize.transaction(async (t) => {
      // 1️⃣ Check if user already has active session
      const activeSession = await parkingSession.findOne({
        where: { user_id: userId, end_time: null },
        transaction: t,
      });

      if (activeSession) {
        throw new Error("User already has an active parking session");
      }

      // 2️⃣ Get parking
      const parking = await parkingSpace.findByPk(parking_id, {
        transaction: t,
      });

      if (!parking || !parking.is_active) {
        throw new Error("Parking not available");
      }

      // 3️⃣ Occupy spot (MODEL LOGIC)
      await parking.occupySpot(t);

      // 4️⃣ Create session
      return await parkingSession.create(
        {
          user_id: userId,
          parking_id,
        },
        { transaction: t }
      );
    });

    res.status(201).json({
      message: "Parking session started",
      session,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * 🏁 END PARKING SESSION
 */

export const endParkingSession = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await sequelize.transaction(async (t) => {
      // 1️⃣ Find active session
      const session = await parkingSession.findOne({
        where: { user_id: userId, end_time: null },
        transaction: t,
      });

      if (!session) {
        throw new Error("No active parking session found");
      }

      // 2️⃣ Get parking
      const parking = await parkingSpace.findByPk(session.parking_id, {
        transaction: t,
      });

      if (!parking) {
        throw new Error("Parking space not found");
      }

      // 3️⃣ End session - BOTH end_time AND status
      const endTime = new Date();
      session.end_time = endTime;
      session.status = "completed"; // ADD THIS LINE
      await session.save({ transaction: t });

      // 4️⃣ Calculate duration (hours, minimum 1)
      const durationMs = endTime - session.start_time;
      const hours = Math.max(
        1,
        Math.ceil(durationMs / (1000 * 60 * 60))
      );

      // 5️⃣ Calculate amount
      const amount = hours * parking.price_per_hour;

      // 6️⃣ Release spot
      await parking.releaseSpot(t);

      // 7️⃣ Create & complete payment
      const paymentRecord = await PaymentModel.createCompletedPayment(
        {
          session_id: session.id,
          amount,
          payment_method: "wallet",
        },
        t
      );

      return { 
        sessionId: session.id,
        hours, 
        amount,
        payment: paymentRecord,
        start_time: session.start_time,
        end_time: endTime
      };
    });

    res.json({
      message: "Parking session ended successfully",
      session_id: result.sessionId,
      duration_hours: result.hours,
      total_amount: result.amount,
      payment: result.payment,
      start_time: result.start_time,
      end_time: result.end_time
    });
    
  } catch (error) {
    console.error("Error ending session:", error);
    res.status(400).json({ 
      message: error.message || "Failed to end session",
      error: error.toString()
    });
  }
};

export const getMyActiveSession = async (req, res) => {
  try {
    console.log("Fetching active session for user ID:", req.user.id);
    
    const session = await parkingSession.findOne({
      where: {
        user_id: req.user.id,
        end_time: null,
      },
      include: [
        {
          model: parkingSpace,
          attributes: ["id", "name", "price_per_hour"], // REMOVE 'title' and 'price'
        },
      ],
    });

    console.log("Found session:", session ? "Yes" : "No");
    
    if (!session) {
      return res.json(null); // Return null instead of empty object
    }

    // Format the response
    const response = {
      id: session.id,
      start_time: session.start_time,
      parking_id: session.parking_id,
      user_id: session.user_id,
      // Include parking space data
      parkingSpace: session.parkingSpace ? {
        id: session.parkingSpace.id,
        name: session.parkingSpace.name,
        price_per_hour: session.parkingSpace.price_per_hour,
        // Don't include title and price since they don't exist
      } : null
    };

    console.log("Returning session data:", response);
    res.json(response);
    
  } catch (err) {
    console.error("Error fetching active session:", err);
    console.error("Error stack:", err.stack);
    
    res.status(500).json({ 
      message: "Failed to fetch active session",
      error: err.message,
    });
  }
};