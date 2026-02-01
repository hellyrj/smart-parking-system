import { User } from "../models/index.js";

const checkOwnerVerification = async (req, res, next) => {
  if (req.user.role === "admin") return next();
  
  // Check if user is an owner
  if (req.user.role !== "owner") {
    return res.status(403).json({ 
      message: "You must be an owner to access this resource. Create a parking space first." 
    });
  }
  
  next();
};

export default checkOwnerVerification;