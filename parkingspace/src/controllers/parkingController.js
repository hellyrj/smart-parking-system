import { Op, literal } from "sequelize";
import sequelize from "../config/db.js";
import { 
  parkingSpace, 
  parkingLocation, 
  parkingImage,
  User,
  UserDocument,
  PaymentProof 
} from "../models/index.js";




export const searchParking = async (req, res) => {
  try {
    const { latNum, lngNum, radiusNUM } = req.query;

    if (latNum === undefined || lngNum === undefined) {
      return res.status(400).json({
        message: "Latitude and longitude required",
      });
    }

    const lat = Number(latNum);
    const lng = Number(lngNum);
    const radius = Number(radiusNUM) || 3;

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({
        message: "Invalid latitude or longitude",
      });
    }

    const distanceFormula = literal(`
      (6371 * ACOS(
        COS(RADIANS(${lat})) *
        COS(RADIANS(latitude)) *
        COS(RADIANS(longitude) - RADIANS(${lng})) +
        SIN(RADIANS(${lat})) *
        SIN(RADIANS(latitude))
      ))
    `);

    const parkings = await parkingSpace.findAll({
      where: {
        approval_status: "approved",
        is_active: true,
        available_spots: { [Op.gt]: 0 },
      },
      include: [
        {
          model: parkingLocation,
          attributes: ["latitude", "longitude", "address", "city"],
          where: sequelize.where(distanceFormula, "<=", radius),
        },
      ],
    });

    res.json(parkings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Search failed" });
  }
};

export const getParkingDetails = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching parking details for ID: ${id}`);

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid parking ID"
      });
    }

    // Get parking space
    const parking = await parkingSpace.findOne({
      where: { 
        id: parseInt(id),
        approval_status: "approved",
        is_active: true 
      }
    });

    if (!parking) {
      return res.status(404).json({
        success: false,
        message: "Parking space not found or not active"
      });
    }

    // Get location and images separately
    const [location, images] = await Promise.all([
      parkingLocation.findOne({ where: { parking_id: parking.id } }),
      parkingImage.findAll({ where: { parking_id: parking.id } })
    ]);

    // Convert to plain object
    const parkingData = parking.get({ plain: true });
    
    // Manually add location and images
    parkingData.parkingLocations = location ? [location.get({ plain: true })] : [];
    parkingData.parkingImages = images.map(img => img.get({ plain: true }));

    res.json({
      success: true,
      data: parkingData
    });

  } catch (err) {
    console.error("❌ Error in getParkingDetails:", err);
    console.error("Full error:", err.stack);
    
    res.status(500).json({
      success: false,
      message: "Failed to get parking details",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};