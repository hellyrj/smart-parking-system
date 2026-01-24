import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Payment = sequelize.define("payment", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },

  platform_fee: { type: DataTypes.DECIMAL(10, 2), allowNull: false },

  payment_method: {
    type: DataTypes.ENUM("card", "wallet", "cash"),
    allowNull: false,
  },

  payment_status: {
    type: DataTypes.ENUM("pending", "paid", "failed"),
    defaultValue: "pending",
  },

  paid_at: { type: DataTypes.DATE },
});

export default Payment;
