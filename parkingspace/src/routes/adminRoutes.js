import express from "express";
import {
  getAllUsers,
  updateUserStatus,
  deleteUser,
  getAllOwners,
  verifyOwner,
  rejectOwner,
  getUserDocuments,
  verifyDocument,
  rejectDocument,
  getAllParkingSpaces,
  getParkingSubmissionReview,
  approveParkingSpace,
  rejectParkingSpace,
  verifyPayment,
  getDashboardStats,
  getAllPaymentProofs,
  verifyPaymentProof,
  rejectPaymentProof
} from "../controllers/adminController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// All admin routes require both authentication and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// User Management
router.get("/users", getAllUsers);
router.put("/users/:id/status", updateUserStatus);
router.delete("/users/:id", deleteUser);

// Owner Verification Management
router.get("/owners", getAllOwners);
router.post("/owners/:id/verify", verifyOwner);
router.post("/owners/:id/reject", rejectOwner);

// Document Management
router.get("/users/:id/documents", getUserDocuments);
router.post("/documents/:id/approve", verifyDocument);
router.post("/documents/:id/reject", rejectDocument);

// Parking Space Approval
router.get("/parkings", getAllParkingSpaces);
router.get("/parkings/:id/review", getParkingSubmissionReview);
router.post("/parkings/:id/approve", approveParkingSpace);
router.post("/parkings/:id/reject", rejectParkingSpace);

// Payment Verification
router.post("/payments/:id/verify", verifyPayment);

// Dashboard Stats
router.get("/dashboard", getDashboardStats);

//payment proof
router.get("/payment-proofs", getAllPaymentProofs);
router.post("/payment-proofs/:id/verify", verifyPaymentProof);
router.post("/payment-proofs/:id/reject", rejectPaymentProof);

export default router;