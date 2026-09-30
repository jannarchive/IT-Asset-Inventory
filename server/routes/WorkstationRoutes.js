import express from "express";
import * as WorkstationController from "../controllers/WorkstationController.js";
import { authenticateToken } from "../middleware/AuthMiddleware.js";

const router = express.Router();

// All workstation routes require authentication
router.use(authenticateToken);

router.post("/generate-codes", WorkstationController.generateAssetCodes);
router.get("/",  WorkstationController.getAllWorkstations);
router.post("/", WorkstationController.createWorkstation);

router.get("/:id/assets", WorkstationController.getWorkstationAssets);
router.put("/:id/full",   WorkstationController.updateWorkstationFull);
router.get("/:id",    WorkstationController.getWorkstationById);
router.delete("/:id", WorkstationController.deleteWorkstation);

export default router;