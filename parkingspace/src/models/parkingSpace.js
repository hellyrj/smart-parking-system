import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const ParkingSpace = sequelize.define("parkingSpace", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

  name: { type: DataTypes.STRING, allowNull: false },

  description: { type: DataTypes.TEXT },

  total_spots: { type: DataTypes.INTEGER, allowNull: false },

  available_spots: { type: DataTypes.INTEGER, allowNull: false },

  price_per_hour: { type: DataTypes.DECIMAL(8, 2), allowNull: false },

  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
});

ParkingSpace.prototype.occupySpot = async function (transaction) {
  if (!this.is_active) {
    throw new Error("Parking is not active");
  }

  if (this.available_spots <= 0) {
    throw new Error("No available spots");
  }

  this.available_spots -= 1;
  await this.save({ transaction });
};

ParkingSpace.prototype.releaseSpot = async function (transaction) {
  if (this.available_spots < this.total_spots) {
    this.available_spots += 1;
    await this.save({ transaction });
  }
};

export default ParkingSpace;
