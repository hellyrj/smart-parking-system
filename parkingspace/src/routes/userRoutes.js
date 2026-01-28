import express from "express";
import {
  requestOwnerStatus,
  uploadDocument,
  getMyDocuments,
  getMyProfile,
  updateProfile
} from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Owner registration
router.post("/become-owner", requestOwnerStatus);
router.post("/documents", uploadDocument);
router.get("/documents", getMyDocuments);

// Profile management
router.get("/profile", getMyProfile);
router.put("/profile", updateProfile);

export default router;