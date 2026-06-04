import express from "express";
import DashboardController from "../controllers/DashboardController.js";
import { authenticateToken } from "../middleware/AuthMiddleware.js";

const router = express.Router();

// Returns totals for the four status cards.
router.get("/stats", authenticateToken, DashboardController.getDashboardStats);

// Returns each asset type with its asset count (used by the bar graph).
router.get("/asset-types", authenticateToken, DashboardController.getAssetTypesCounts);

// Returns the most recent activity log entries.
router.get("/recent-activities", authenticateToken, DashboardController.getRecentActivities);

// Returns all workstations with complete device and assignment information.
router.get("/workstations", authenticateToken, DashboardController.getAllWorkstations);

export default router;