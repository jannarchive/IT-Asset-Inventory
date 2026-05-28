import express from "express";
import * as WorkstationController from "../controllers/WorkstationController.js";
import { authenticateToken } from "../middleware/AuthMiddleware.js";

const router = express.Router();

// All workstation routes require authentication
router.use(authenticateToken);

// GET routes
router.get("/", WorkstationController.getAllWorkstations);
router.get("/:id", WorkstationController.getWorkstationById);

// POST route (admin only)
router.post("/", WorkstationController.createWorkstation);

// PUT route (admin only)
router.put("/:id", WorkstationController.updateWorkstation);

// DELETE route (admin only)
router.delete("/:id", WorkstationController.deleteWorkstation);

export default router;
