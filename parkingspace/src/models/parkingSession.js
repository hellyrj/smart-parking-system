import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const ParkingSession = sequelize.define("parkingSession", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

  // Add session type
  session_type: {
    type: DataTypes.ENUM("active", "reserved"),
    defaultValue: "active",
  },

  // Add reservation expiry time
  reserved_until: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  // Add vehicle information
  vehicle_plate: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  vehicle_model: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  // Add arrival confirmation
  arrival_confirmed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },

  arrival_confirmed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  // Add reservation status
  reservation_status: {
    type: DataTypes.ENUM("waiting", "confirmed", "cancelled", "expired"),
    defaultValue: "waiting",
  },

  // Add notification flags
  owner_notified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },

  user_notified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },

  // Session details
  start_time: { 
    type: DataTypes.DATE, 
    allowNull: false, 
    defaultValue: DataTypes.NOW 
  },

  actual_start_time: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  end_time: { 
    type: DataTypes.DATE 
  },

  total_amount: { 
    type: DataTypes.DECIMAL(10, 2) 
  },

  // FIX: Change 'status' to 'session_status' to avoid conflicts
  session_status: {
    type: DataTypes.ENUM("active", "completed", "cancelled"),
    defaultValue: "active",
  },

  user_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },

  parking_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },

  // Add payment tracking
  payment_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

}, {
  tableName: 'parkingSessions',
  timestamps: true
});

// Instance method to check if reservation is expired
ParkingSession.prototype.isReservationExpired = function () {
  if (this.session_type !== 'reserved' || !this.reserved_until) {
    return false;
  }
  
  return new Date() > new Date(this.reserved_until);
};

// Instance method to auto-cancel expired reservation
ParkingSession.prototype.autoCancelExpiredReservation = async function (transaction) {
  if (this.isReservationExpired()) {
    this.end_time = new Date();
    this.session_status = "cancelled";
    this.reservation_status = "expired";
    await this.save({ transaction });
    
    // Release parking spot
    const parkingSpace = await this.getParkingSpace();
    await parkingSpace.releaseSpot({ transaction });
    
    return true;
  }
  
  return false;
};

// Instance method to confirm arrival
ParkingSession.prototype.confirmArrival = async function (transaction) {
  if (this.session_type === 'reserved' && !this.arrival_confirmed) {
    this.arrival_confirmed = true;
    this.arrival_confirmed_at = new Date();
    this.actual_start_time = new Date();
    this.reservation_status = "confirmed";
    await this.save({ transaction });
    
    return true;
  }
  
  return false;
};

// Instance method to calculate current cost
ParkingSession.prototype.calculateCurrentCost = function () {
  if (!this.actual_start_time) return 0;
  
  const endTime = this.end_time || new Date();
  const durationMs = endTime - this.actual_start_time;
  const hours = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60)));
  
  return this.parkingSpace ? hours * this.parkingSpace.price_per_hour : 0;
};

export default ParkingSession;