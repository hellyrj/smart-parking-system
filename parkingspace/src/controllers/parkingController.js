import { Op, literal } from "sequelize";

import sequelize from "../config/db.js";
import { parkingSpace, parkingLocation, parkingImage } from "../models/index.js";


export const createParking = async (req, res) => {
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
    } = req.body;

    if (!name || !total_spots || !price_per_hour || !latitude || !longitude) {
      return res.status(400).json({ message: "Missing required fields" });
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

    const parking = await parkingSpace.create({
      owner_id: req.user.id,
      name,
      description,
      total_spots,
      available_spots: total_spots,
      price_per_hour,
    });

    await parkingLocation.create({
      parking_id: parking.id,
      latitude,
      longitude,
      address,
      city,
    });

    res.status(201).json({
      message: "Parking spot registered successfully",
      parking_id: parking.id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to register parking spot" });
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
