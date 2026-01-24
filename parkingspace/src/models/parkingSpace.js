import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const ParkingSpace = sequelize.define("parkingSpace", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

  name: { type: DataTypes.STRING, allowNull: false },

  description: { type: DataTypes.TEXT },

  total_spots: { type: DataTypes.INTEGER, allowNull: false },

  available_spots: { type: DataTypes.INTEGER, allowNull: false },

  price_per_hour: { type: DataTypes.DECIMAL(8, 2), allowNull: false },

  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
});

export default ParkingSpace;
