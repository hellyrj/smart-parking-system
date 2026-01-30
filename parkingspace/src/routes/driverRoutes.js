import express from "express";
import {
    reserveParkingSpot,
    startParkingSession,
    endParkingSession,
    getDriverSessions,
    cancelDriverReservation,
    getDriverReservations,
    checkReservationStatus,
    getReservationById
} from "../controllers/driverController.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();

// All routes require authentication and owner role
router.use(authMiddleware);

// Parking session routes
router.post('/reserve', reserveParkingSpot);
router.post('/session/start', startParkingSession);
router.post('/session/end', endParkingSession);
router.get('/sessions', getDriverSessions);

// Reservation management routes - REMOVED DUPLICATE
router.get('/reservations', getDriverReservations);
router.get('/reservations/:id', getReservationById);
router.get('/reservations/:id/status', checkReservationStatus);
// KEEP ONLY ONE cancel route - using the reservations endpoint
router.delete('/reservations/:id/cancel', cancelDriverReservation);

export default router;