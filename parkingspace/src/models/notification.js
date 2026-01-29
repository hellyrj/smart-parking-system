import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const notification = sequelize.define("Notification", {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM(
      'new_session',
      'session_ended',
      'payment_success',
      'reservation_expired',
      'arrival_confirmed',
      'reservation_cancelled',
      'document_approved',
      'payment_verified'
    ),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  data: {
    type: DataTypes.TEXT, // JSON string for additional data
    allowNull: true
  }
}, {
  timestamps: true,
});

export default notification;