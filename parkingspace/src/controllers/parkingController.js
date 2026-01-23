// controllers/parkingController.js
import ParkingSpace from "../models/parkingSpace.js";
//import ParkingLocation from "../models/ParkingLocation.js";

export const createParking = async (req, res) => {
  const { name, total_spots, price_per_hour, latitude, longitude, address } = req.body;

  const parking = await ParkingSpace.create({
    name,
    total_spots,
    available_spots: total_spots,
    price_per_hour,
    owner_id: req.user.id,
  });
/*
  await ParkingLocation.create({
    parking_id: parking.id,
    latitude,
    longitude,
    address,
  }); */

  res.status(201).json({ message: "Parking space created" });
};
