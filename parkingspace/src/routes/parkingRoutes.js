import express from "express";
import { searchParking , getParkingDetails
} from "../controllers/parkingController.js";

const router = express.Router();

router.get("/search", searchParking);
router.get("/:id", getParkingDetails); 
export default router;