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



