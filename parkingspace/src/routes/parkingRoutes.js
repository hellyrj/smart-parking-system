import express from "express";
import { searchParking } from "../controllers/parkingController.js";

const router = express.Router();

router.get("/search", searchParking);

export default router;
