// models/ParkingLocation.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const ParkingLocation = sequelize.define("ParkingLocation", {
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
  },
  address: {
    type: DataTypes.TEXT,
  },
  parking_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

export default ParkingLocation;
