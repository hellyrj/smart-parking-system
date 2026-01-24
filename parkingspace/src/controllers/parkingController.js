import { Op, literal } from "sequelize";
import ParkingSpace from "../models/parkingSpace.js";
import ParkingLocation from "../models/parkingLocation.js";

export const searchParking = async (req, res) => {
  try {
    const { lat, lng, radius = 3 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: "Latitude and longitude required" });
    }

    // Haversine formula (distance in KM)
    const distanceFormula = `
      (6371 * acos(
        cos(radians(${lat})) *
        cos(radians(latitude)) *
        cos(radians(longitude) - radians(${lng})) +
        sin(radians(${lat})) *
        sin(radians(latitude))
      ))
    `;

    const parkings = await ParkingSpace.findAll({
      where: {
        is_active: true,
        available_spots: { [Op.gt]: 0 },
      },
      include: [
        {
          model: ParkingLocation,
          attributes: ["latitude", "longitude", "address"],
          where: literal(`${distanceFormula} <= ${radius}`),
        },
      ],
    });

    res.json(parkings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Search failed" });
  }
};
