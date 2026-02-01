import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const PLATFORM_FEE_PERCENTAGE = 0.15; // 15%

const Payment = sequelize.define("payment", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

  // ADD THIS MISSING FIELD:
  session_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false,  // Should be NOT NULL since it's a required foreign key
    references: {
      model: 'parkingSessions', // Make sure this matches your table name
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },

  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },

  platform_fee: { type: DataTypes.DECIMAL(10, 2), allowNull: false },

  owner_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },

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


//
// 🧠 INSTANCE METHOD: complete payment
//
Payment.prototype.completePayment = async function (transaction) {
  this.platform_fee = Number(this.amount) * PLATFORM_FEE_PERCENTAGE;
  this.owner_amount = Number(this.amount) - Number(this.platform_fee);
  this.payment_status = "paid";
  this.paid_at = new Date();

  await this.save({ transaction });
};

//
// 🧠 STATIC METHOD: create + complete
//
Payment.createCompletedPayment = async function (
  { session_id, amount, payment_method },
  transaction
) {
   // Calculate fees first
  const platformFee = Number(amount) * PLATFORM_FEE_PERCENTAGE;
  const ownerAmount = Number(amount) - platformFee;

  // Create payment record
  const payment = await Payment.create(
    {
      session_id,
      amount,
      payment_method,
      platform_fee: platformFee,
      owner_amount: ownerAmount,
      payment_status: "paid",
      paid_at: new Date(),
    },
    { transaction }
  );

  return payment;
};

export default Payment;
