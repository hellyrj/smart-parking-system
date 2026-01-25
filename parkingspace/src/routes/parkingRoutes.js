import express from "express";
import { searchParking , createParking , getMyParkings , updateParking , deactivateParking,
    activateParking,
    deleteParking
} from "../controllers/parkingController.js";
import authMiddleware from "../middleware/authMiddleware.js";


const router = express.Router();

router.get("/search", searchParking);
router.post("/",authMiddleware,  createParking);
router.post("/mine", authMiddleware, getMyParkings);
router.put("/:id", authMiddleware, updateParking);
router.patch("/:id/deactivate", authMiddleware, deactivateParking);
router.patch("/:id/activate", authMiddleware, activateParking);
router.delete("/:id", authMiddleware, deleteParking);
export default router;