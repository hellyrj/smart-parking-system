import sequelize from "../config/db.js";
import User from "./User.js";
import parkingSpace from "./parkingSpace.js";
import parkingLocation from "./parkingLocation.js";
import parkingImage from "./parkingImage.js";
import parkingSession from "./parkingSession.js";
import payment from "./payment.js";
import review from "./review.js";
import activityLog from "./activityLog.js";

// User relations
User.hasMany(parkingSpace, { foreignKey: "owner_id" });
parkingSpace.belongsTo(User, { foreignKey: "owner_id" });

// Parking relations
parkingSpace.hasMany(parkingLocation, { foreignKey: "parking_id" });
parkingLocation.belongsTo(parkingSpace, { foreignKey: "parking_id" });

parkingSpace.hasMany(parkingImage, { foreignKey: "parking_id" });
parkingImage.belongsTo(parkingSpace, { foreignKey: "parking_id" });
// Sessions
User.hasMany(parkingSession, { foreignKey: "user_id" });
parkingSession.belongsTo(User, { foreignKey: "user_id" });

parkingSpace.hasMany(parkingSession, { foreignKey: "parking_id" });
parkingSession.belongsTo(parkingSpace, { foreignKey: "parking_id" });

// Payments
parkingSession.hasOne(payment, { foreignKey: "session_id" });
payment.belongsTo(parkingSession, { foreignKey: "session_id" });

// Reviews
User.hasMany(review, { foreignKey: "user_id" });
parkingSpace.hasMany(review, { foreignKey: "parking_id" });

review.belongsTo(User, { foreignKey: "user_id" });
review.belongsTo(parkingSpace, { foreignKey: "parking_id" });

// Logs
User.hasMany(activityLog, { foreignKey: "user_id" });
activityLog.belongsTo(User, { foreignKey: "user_id" });
export {
  sequelize,
  User,
  parkingSpace,
  parkingLocation,
  parkingImage,
  parkingSession,
  payment,
  review,
  activityLog,
};
