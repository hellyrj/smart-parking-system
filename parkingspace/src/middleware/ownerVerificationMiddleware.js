import { User } from "../models/index.js";

const checkOwnerVerification = async (req, res, next) => {
  if (req.user.role === "admin") return next();
  
  // Check if user is an owner
  if (req.user.role !== "owner") {
    return res.status(403).json({ 
      message: "You must be an owner to access this resource. Create a parking space first." 
    });
  }
  
  // Check if owner is verified
  if (req.user.verification_status !== "verified") {
    return res.status(403).json({ 
      message: "Owner verification pending. Please wait for admin approval." 
    });
  }
  
  // Check subscription (optional)
  if (req.user.subscription_status !== "active") {
    return res.status(403).json({ 
      message: "Subscription inactive. Please renew your subscription." 
    });
  }
  
  next();
};

export default checkOwnerVerification;