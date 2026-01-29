import express from "express";
import {
    reserveParkingSpot,
    startParkingSession,
    endParkingSession,
    getDriverSessions,
    cancelDriverReservation
} from "../controllers/driverController.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();

// All routes require authentication and owner role
router.use(authMiddleware);

router.post('/reserve', reserveParkingSpot);
router.post('/session/start', startParkingSession);
router.post('/session/end', endParkingSession);
router.get('/sessions', getDriverSessions);
router.delete('/reservation/:id', cancelDriverReservation);

export default router;