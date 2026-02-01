import { Op, literal } from "sequelize";
import fs from "fs";
import path from "path";
import multer from "multer";
import sequelize from "../config/db.js";
import { 
  parkingSpace, 
  parkingLocation, 
  parkingImage,
  User,
  UserDocument,
  PaymentProof,
  parkingSession,
  payment,
  notification
} from "../models/index.js";

// ADD MULTER CONFIGURATION at the top (after imports)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dir = 'uploads/';
    if (file.fieldname === 'parking_images') dir += 'parking_images/';
    else if (file.fieldname === 'legal_document') dir += 'documents/';
    else if (file.fieldname === 'payment_proof') dir += 'payment_proofs/';
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}_${req.user.id}_${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = {
      'parking_images': ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/heic', 'image/heif'],
      'legal_document': [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ],
      'payment_proof': ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif', 'application/pdf']
    };

    const allowedExt = {
      'parking_images': ['.jpg', '.jpeg', '.png', '.gif', '.heic', '.heif'],
      'legal_document': ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'],
      'payment_proof': ['.pdf', '.jpg', '.jpeg', '.png', '.heic', '.heif']
    };

    const ext = path.extname(file.originalname || '').toLowerCase();
    
    const isAllowedByMime =
      allowedTypes[file.fieldname] && allowedTypes[file.fieldname].includes(file.mimetype);
    const isAllowedByExt =
      allowedExt[file.fieldname] && allowedExt[file.fieldname].includes(ext);

    if (isAllowedByMime || isAllowedByExt) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type for ${file.fieldname}`), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// ADD THESE FUNCTIONS at the bottom of ownerController.js:
// Create parking with file upload middleware
export const createParkingWithUpload = [
  upload.fields([
    { name: 'parking_images', maxCount: 10 },
    { name: 'legal_document', maxCount: 1 },
    { name: 'payment_proof', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const {
        name,
        description,
        total_spots,
        price_per_hour,
        latitude,
        longitude,
        address,
        city,
        subscription_plan
      } = req.body;

      console.log("Request body:", req.body);
      console.log("Uploaded files:", req.files);

      if (!name || !total_spots || !price_per_hour || !latitude || !longitude) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check if user is owner, if not, make them owner
      if (req.user.role !== "owner") {
        req.user.role = "owner";
        req.user.verification_status = "pending";
        await req.user.save();
        
        console.log(`User ${req.user.id} became owner by creating parking`);
      }

 

      // Distance in KM (0.02 km = 20 meters)
      const DISTANCE_LIMIT = 0.02;

      // Haversine formula
      const distanceFormula = literal(`
        (6371 * ACOS(
          COS(RADIANS(${parseFloat(latitude)})) *
          COS(RADIANS(latitude)) *
          COS(RADIANS(longitude) - RADIANS(${parseFloat(longitude)})) +
          SIN(RADIANS(${parseFloat(latitude)})) *
          SIN(RADIANS(latitude))
        ))
      `);

      const nearbyParking = await parkingLocation.findOne({
        where: sequelize.where(distanceFormula, '<', DISTANCE_LIMIT),
      });

      if (nearbyParking) {
        return res.status(400).json({
          message: "A parking spot already exists at this location",
        });
      }

      // Create parking space
      const parking = await parkingSpace.create({
        owner_id: req.user.id,
        name,
        description,
        total_spots,
        available_spots: total_spots,
        price_per_hour,
        approval_status: "pending",
        is_active: false,
      });

      // Create parking location
      await parkingLocation.create({
        parking_id: parking.id,
        latitude,
        longitude,
        address,
        city,
      });

      // Save parking images
      if (req.files && req.files.parking_images) {
        for (const file of req.files.parking_images) {
          await parkingImage.create({
            parking_id: parking.id,
            image_url: `/uploads/parking_images/${file.filename}`
          });
        }
      }

      // Save legal document
      if (req.files && req.files.legal_document) {
        await UserDocument.create({
          user_id: req.user.id,
          document_type: 'ownership_proof',
          file_url: `/uploads/documents/${req.files.legal_document[0].filename}`,
          status: 'pending'
        });
      }

      // Save payment proof
      if (req.files && req.files.payment_proof) {
        const existingProof = await PaymentProof.findOne({
          where: { 
            user_id: req.user.id, 
            status: 'pending' 
          }
        });
        
        if (!existingProof) {
          await PaymentProof.create({
            user_id: req.user.id,
            payment_type: 'subscription',
            amount: 0,
            file_url: `/uploads/payment_proofs/${req.files.payment_proof[0].filename}`,
            status: 'pending'
          });
        }
      }

      res.status(201).json({
        message: "Parking spot registered successfully",
        parking_id: parking.id,
      });
    } catch (error) {
      console.error("Create parking error:", error);
      res.status(500).json({ 
        message: "Failed to register parking spot",
        error: error.message 
      });
    }
  }
];




export const getMyParkings = async (req, res) => {
  try {
    const parkings = await parkingSpace.findAll({
      where: { owner_id: req.user.id },
      include: [
        {
          model: parkingLocation,
          attributes: ["latitude", "longitude", "address", "city"],
        },
        {
          model: parkingImage,
          attributes: ["image_url"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(parkings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch your parking spots" });
  }
};

// Get active sessions for owner's parking spaces
export const getOwnerActiveSessions = async (req, res) => {
  try {
    // Get all parking spaces owned by the user
    const parkings = await parkingSpace.findAll({
      where: { owner_id: req.user.id },
      attributes: ['id']
    });
    
    const parkingIds = parkings.map(p => p.id);
    
    // Get active sessions for these parking spaces
    const sessions = await parkingSession.findAll({
      where: {
        parking_id: { [Op.in]: parkingIds },
        end_time: null
      },
      include: [
        {
          model: User,
          attributes: ['email', 'phone_number']
        },
        {
          model: parkingSpace,
          attributes: ['name', 'price_per_hour']
        }
      ],
      order: [['start_time', 'DESC']]
    });
    
    // Format response
    const formattedSessions = sessions.map(session => {
      const duration = Math.floor((new Date() - new Date(session.start_time)) / (1000 * 60)); // minutes
      const currentCost = (duration / 60) * session.parkingSpace.price_per_hour;
      
      return {
        id: session.id,
        parking_name: session.parkingSpace.name,
        user_email: session.User.email,
        user_phone: session.User.phone_number,
        start_time: new Date(session.start_time).toLocaleString(),
        duration_minutes: duration,
        current_cost: currentCost.toFixed(2),
        session_type: session.session_type,
        expires_in_minutes: session.session_type === 'reserved' ? 
          Math.max(0, 30 - Math.floor((new Date() - new Date(session.start_time)) / (1000 * 60))) : null
      };
    });
    
    res.json(formattedSessions);
  } catch (error) {
    console.error("Error fetching active sessions:", error);
    res.status(500).json({ message: "Failed to fetch active sessions" });
  }
}

// Get reservations for owner's parking spaces
export const getOwnerReservations = async (req, res) => {
  try {
    const parkings = await parkingSpace.findAll({
      where: { owner_id: req.user.id },
      attributes: ['id']
    });
    
    const parkingIds = parkings.map(p => p.id);
    
    const reservations = await parkingSession.findAll({
      where: {
        parking_id: { [Op.in]: parkingIds },
        session_type: 'reserved',
        end_time: null,
        start_time: {
          [Op.gte]: new Date(new Date() - 30 * 60 * 1000) // Last 30 minutes
        }
      },
      include: [
        {
          model: User,
          attributes: ['email', 'phone_number']
        },
        {
          model: parkingSpace,
          attributes: ['name']
        }
      ],
      order: [['start_time', 'ASC']]
    });
    
    res.json(reservations);
  } catch (error) {
    console.error("Error fetching reservations:", error);
    res.status(500).json({ message: "Failed to fetch reservations" });
  }
};

// Confirm user arrival (convert reservation to active session)
export const confirmUserArrival = async (req, res) => {
  try {
    const { id } = req.params;
    
    const session = await parkingSession.findByPk(id, {
      include: [{
        model: parkingSpace,
        where: { owner_id: req.user.id }
      }]
    });
    
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    
    // Convert reservation to active session
    session.session_type = 'active';
    await session.save();
    
    // Create notification for user
    await notification.create({
      user_id: session.user_id,
      type: 'arrival_confirmed',
      title: 'Arrival Confirmed',
      message: `Your arrival at ${session.parkingSpace.name} has been confirmed by the owner.`,
      is_read: false
    });
    
    res.json({ 
      message: "Arrival confirmed successfully",
      session: {
        id: session.id,
        session_type: session.session_type
      }
    });
  } catch (error) {
    console.error("Error confirming arrival:", error);
    res.status(500).json({ message: "Failed to confirm arrival" });
  }
};

// Cancel reservation
export const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const session = await parkingSession.findByPk(id, {
      include: [{
        model: parkingSpace,
        where: { owner_id: req.user.id }
      }]
    });
    
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    
    // Release parking spot
    await session.parkingSpace.releaseSpot();
    
    // End session
    session.end_time = new Date();
    await session.save();
    
    // Create notification for user
    await notification.create({
      user_id: session.user_id,
      type: 'reservation_cancelled',
      title: 'Reservation Cancelled',
      message: `Your reservation at ${session.parkingSpace.name} has been cancelled by the owner.`,
      is_read: false
    });
    
    res.json({ 
      message: "Reservation cancelled successfully"
    });
  } catch (error) {
    console.error("Error cancelling reservation:", error);
    res.status(500).json({ message: "Failed to cancel reservation" });
  }
};

// Get owner earnings
export const getOwnerEarnings = async (req, res) => {
  try {
    // Get payments for owner's parking spaces
    const parkings = await parkingSpace.findAll({
      where: { owner_id: req.user.id },
      attributes: ['id']
    });
    
    const parkingIds = parkings.map(p => p.id);
    
    // Get sessions for these parking spaces
    const sessions = await parkingSession.findAll({
      where: {
        parking_id: { [Op.in]: parkingIds }
      },
            attributes: ['id']
    });
    
    const sessionIds = sessions.map(s => s.id);
    
    // Get payments for these sessions
    const payments = await payment.findAll({
      where: {
        session_id: { [Op.in]: sessionIds },
        payment_status: 'paid'
      },
      attributes: ['amount', 'owner_amount', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    
    // Calculate earnings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const todayEarnings = payments
      .filter(p => new Date(p.createdAt) >= today)
      .reduce((sum, p) => sum + parseFloat(p.owner_amount), 0);
    
    const monthEarnings = payments
      .filter(p => new Date(p.createdAt) >= thisMonth)
      .reduce((sum, p) => sum + parseFloat(p.owner_amount), 0);
    
    const totalEarnings = payments
      .reduce((sum, p) => sum + parseFloat(p.owner_amount), 0);
    
    res.json({
      today_earnings: todayEarnings.toFixed(2),
      month_earnings: monthEarnings.toFixed(2),
      total_earnings: totalEarnings.toFixed(2),
      recent_payments: payments.slice(0, 10).map(p => ({
        amount: p.amount,
        owner_amount: p.owner_amount,
        date: p.createdAt
      }))
    });
  } catch (error) {
    console.error("Error fetching earnings:", error);
    res.status(500).json({ message: "Failed to fetch earnings" });
  }
};

// Get owner notifications
export const getOwnerNotifications = async (req, res) => {
  try {
    const notifications = await notification.findAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};



export const updateParking = async (req, res) => {
  try {
    const parkingId = req.params.id;

    const {
      name,
      description,
      total_spots,
      available_spots,
      price_per_hour,
      is_active,
      latitude,
      longitude,
      address,
      city,
    } = req.body;

    // Find parking
    const parking = await parkingSpace.findByPk(parkingId);

    if (!parking) {
      return res.status(404).json({ message: "Parking not found" });
    }

    // Ownership check
    if (parking.owner_id !== req.user.id) {
      return res.status(403).json({ message: "You are not allowed to edit this parking" });
    }

    // Update parking space
    await parking.update({
      name: name ?? parking.name,
      description: description ?? parking.description,
      total_spots: total_spots ?? parking.total_spots,
      available_spots: available_spots ?? parking.available_spots,
      price_per_hour: price_per_hour ?? parking.price_per_hour,
      is_active: is_active ?? parking.is_active,
    });

    // Update location (assuming one main location)
    const location = await parkingLocation.findOne({
      where: { parking_id: parking.id },
    });

    if (location && (latitude || longitude || address || city)) {
      await location.update({
        latitude: latitude ?? location.latitude,
        longitude: longitude ?? location.longitude,
        address: address ?? location.address,
        city: city ?? location.city,
      });
    }

    res.json({
      message: "Parking updated successfully",
      parking,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update parking" });
  }
};


export const deactivateParking = async (req, res) => {
  try {
    const parkingId = req.params.id;

    const parking = await parkingSpace.findByPk(parkingId);

    if (!parking) {
      return res.status(404).json({ message: "Parking not found" });
    }

    // Ownership check
    if (parking.owner_id !== req.user.id) {
      return res.status(403).json({ message: "You are not allowed to deactivate this parking" });
    }

    // Soft delete
    parking.is_active = false;
    await parking.save();

    res.json({
      message: "Parking deactivated successfully",
      parking_id: parking.id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to deactivate parking" });
  }
};

export const activateParking = async (req, res) => {
  try {
    const parkingId = req.params.id;

    const parking = await parkingSpace.findByPk(parkingId);

    if (!parking) {
      return res.status(404).json({ message: "Parking not found" });
    }

    // Ownership check
    if (parking.owner_id !== req.user.id) {
      return res.status(403).json({ message: "You are not allowed to activate this parking" });
    }

    if (parking.total_spots === 0) {
      return res.status(400).json({ message: "Cannot activate parking with zero total spots" });
    }

    parking.is_active = true;
    await parking.save();

    res.json({
      message: "Parking activated successfully",
      parking_id: parking.id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to activate parking" });
  }
};


export const deleteParking = async (req, res) => {
  try {
    const parkingId = req.params.id;

    const parking = await parkingSpace.findByPk(parkingId);

    if (!parking) {
      return res.status(404).json({ message: "Parking not found" });
    }

    // Ownership check
    if (parking.owner_id !== req.user.id) {
      return res.status(403).json({ message: "You are not allowed to delete this parking" });
    }
     if (parking.available_spots < parking.total_spots) {
  return res.status(400).json({
    message: "Cannot delete parking with active sessions",
  });
}


    await parking.destroy();

    res.json({
      message: "Parking deleted permanently",
      parking_id: parkingId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete parking" });
  }
};

      