import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const ParkingImage = sequelize.define("parkingImage", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

  image_url: { type: DataTypes.STRING, allowNull: false },
});

export default ParkingImage;
