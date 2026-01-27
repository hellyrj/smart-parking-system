import express from "express";
import { startParkingSession , endParkingSession , getMyActiveSession } from "../controllers/parkingSessionController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/start", authMiddleware, startParkingSession);
router.post("/end", authMiddleware, endParkingSession);
router.get("/active", authMiddleware, getMyActiveSession);


export default router;
