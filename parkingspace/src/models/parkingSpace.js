import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const ParkingSpace = sequelize.define("parkingSpace", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

  name: { type: DataTypes.STRING, allowNull: false },

  description: { type: DataTypes.TEXT },

  total_spots: { type: DataTypes.INTEGER, allowNull: false },

  available_spots: { type: DataTypes.INTEGER, allowNull: false },

  // ADD THIS: Reserved spots column
  reserved_spots: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },

  price_per_hour: { type: DataTypes.DECIMAL(8, 2), allowNull: false },

  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  
  approval_status: {
    type: DataTypes.ENUM("pending", "approved", "rejected"),
    defaultValue: "pending"
  }

});

// Occupy a spot (for reservations) - UPDATED WITH DEFAULT VALUE
ParkingSpace.prototype.occupySpot = async function(transaction = null) {
  if (this.available_spots <= 0) {
    throw new Error('No available spots');
  }
  
  this.available_spots -= 1;
  this.reserved_spots = (this.reserved_spots || 0) + 1;
  
  const saveOptions = transaction ? { transaction } : {};
  await this.save(saveOptions);
  
  return this;
};

// Release a spot - UPDATED WITH DEFAULT VALUE
ParkingSpace.prototype.releaseSpot = async function(transaction = null) {
  if (this.available_spots < this.total_spots) {
    this.available_spots += 1;
    this.reserved_spots = Math.max(0, (this.reserved_spots || 1) - 1);
    
    const saveOptions = transaction ? { transaction } : {};
    await this.save(saveOptions);
  }
  
  return this;
};

// Convert reservation to active (release reserved spot, occupy actual spot)
ParkingSpace.prototype.convertReservationToActive = async function(transaction = null) {
  if (this.reserved_spots > 0) {
    this.reserved_spots -= 1;
  }
  
  // Note: available_spots remains the same since spot was already counted
  
  const saveOptions = transaction ? { transaction } : {};
  await this.save(saveOptions);
  
  return this;
};

export default ParkingSpace;