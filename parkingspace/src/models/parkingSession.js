import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const ParkingSession = sequelize.define("parkingSession", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

  start_time: { type: DataTypes.DATE, allowNull: false },

  end_time: { type: DataTypes.DATE },

  total_amount: { type: DataTypes.DECIMAL(10, 2) },

  status: {
    type: DataTypes.ENUM("active", "completed", "cancelled"),
    defaultValue: "active",
  },
});

export default ParkingSession;
