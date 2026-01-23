// routes/parkingRoutes.js
import express from "express";
import { createParking } from "../controllers/parkingController.js";
//import { protect } from "../middleware/auth.js";
import { requireOwner } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", protect, requireOwner, createParking);

export default router;
