import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const User = sequelize.define("User", {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM("admin", "user", "owner"),
    defaultValue: "user",
  },
  verification_status: {
    type: DataTypes.ENUM("pending", "verified", "suspended"),
    defaultValue: "pending",
  },
  
  // Owner-specific fields (optional)
  phone_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  
  subscription_status: {
    type: DataTypes.ENUM("inactive", "active", "expired"),
    defaultValue: "inactive",
  },
  
  subscription_expiry: {
    type: DataTypes.DATE,
    allowNull: true,
  }

}, {
  timestamps: true,
});

export default User;