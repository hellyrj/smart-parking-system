import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const ActivityLog = sequelize.define("activityLog", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

  action: { type: DataTypes.STRING },

  details: { type: DataTypes.TEXT },
});

export default ActivityLog;
