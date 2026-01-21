import express from "express";
import { register, login } from "../controllers/authController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// Protected route (profile)
router.get(
  "/profile",
  authMiddleware,
  // removed verifiedMiddleware since no verification needed
  (req, res) => {
    res.json({
      id: req.user.id,
      email: req.user.email,
    });
  }
);

// Auth routes (only register and login needed)
router.post("/register", register);
router.post("/login", login);

// Removed verify-email route

export default router;