import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const ParkingLocation = sequelize.define("parkingLocation", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

  latitude: { type: DataTypes.DECIMAL(10, 8), allowNull: false },

  longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: false },

  address: { type: DataTypes.STRING },

  city: { type: DataTypes.STRING },
});

export default ParkingLocation;
