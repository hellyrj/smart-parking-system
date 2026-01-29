import sequelize from "../config/db.js";
import User from "./User.js";
import parkingSpace from "./parkingSpace.js";
import parkingLocation from "./parkingLocation.js";
import parkingImage from "./parkingImage.js";
import parkingSession from "./parkingSession.js";
import payment from "./payment.js";
import review from "./review.js";
import activityLog from "./activityLog.js";
import UserDocument from "./userDocument.js";
import PaymentProof from "./paymentProof.js";
import notification from "./notification.js";

// User relations
User.hasMany(parkingSpace, { 
  foreignKey: "owner_id",
  as: "ownedParkings"
});
parkingSpace.belongsTo(User, { 
  foreignKey: "owner_id",
  as: "owner"
});

User.hasMany(PaymentProof, { 
  foreignKey: "user_id",
  as: "paymentProofs"
});
PaymentProof.belongsTo(User, { 
  foreignKey: "user_id",
  as: "user"
});

User.hasMany(notification, { foreignKey: "user_id" });
notification.belongsTo(User, { foreignKey: "user_id" });

// User documents
User.hasMany(UserDocument, { 
  foreignKey: "user_id",
  as: "documents"
});
UserDocument.belongsTo(User, { 
  foreignKey: "user_id",
  as: "user"
});



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
  UserDocument,
  parkingSpace,
  parkingLocation,
  parkingImage,
  parkingSession,
  payment,
  review,
  activityLog,
  PaymentProof,
  notification
};