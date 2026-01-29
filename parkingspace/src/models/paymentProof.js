// models/paymentProof.js - FIXED
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const PaymentProof = sequelize.define("PaymentProof", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
    // REMOVE references from here
  },
  payment_type: {
    type: DataTypes.ENUM('subscription', 'parking_fee', 'other'),
    defaultValue: 'subscription'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  file_url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'verified', 'rejected'),
    defaultValue: 'pending'
  },
  verified_by: {
    type: DataTypes.INTEGER,
    allowNull: true
    // REMOVE references from here
  },
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'payment_proofs',
  timestamps: true,
  underscored: true
});

export default PaymentProof;