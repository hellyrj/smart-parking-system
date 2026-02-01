import express from "express";
import {
  getOwnerActiveSessions,
  getOwnerReservations,
  confirmUserArrival,
  cancelReservation,
  getOwnerEarnings,
  getOwnerNotifications,
  getMyParkings,
  updateParking,
  deactivateParking,
  activateParking,
  deleteParking,
  createParkingWithUpload
} from "../controllers/ownerController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import checkOwnerVerification from "../middleware/ownerVerificationMiddleware.js";

const router = express.Router();

// All routes require authentication and owner role
router.use(authMiddleware);

// Parking management
router.post("/parkings", createParkingWithUpload);  // FIXED: Added this route

// Allow submitters (pending/unverified) to view their own submissions
router.get("/parkings", getMyParkings);

// All remaining owner routes require verified owner (and active subscription)
router.use(checkOwnerVerification);

router.put("/parkings/:id", updateParking);
router.patch("/parkings/:id/deactivate", deactivateParking);
router.patch("/parkings/:id/activate", activateParking);
router.delete("/parkings/:id", deleteParking);

// Session management
router.get("/session/active", getOwnerActiveSessions);
router.get("/session/reservations", getOwnerReservations);
router.post("/session/:id/confirm-arrival", confirmUserArrival);
router.post("/session/:id/cancel", cancelReservation);

// Earnings
router.get("/earnings", getOwnerEarnings);

// Notifications
router.get("/notifications", getOwnerNotifications);

export default router;