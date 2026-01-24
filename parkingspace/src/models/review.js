import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Review = sequelize.define("review", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

  rating: {
    type: DataTypes.INTEGER,
    validate: { min: 1, max: 5 },
  },

  comment: { type: DataTypes.TEXT },
});

export default Review;
