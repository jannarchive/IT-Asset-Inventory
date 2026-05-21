import express from "express";
import DashboardController from "../controllers/DashboardController.js";
import { authenticateToken } from "../middleware/AuthMiddleware.js";

const router = express.Router();

// GET /api/dashboard/stats
// Returns totals for the four status cards.
router.get("/stats", authenticateToken, DashboardController.getDashboardStats);

// GET /api/dashboard/asset-types
// Returns each asset type with its asset count (used by the bar graph).
router.get("/asset-types", authenticateToken, DashboardController.getAssetTypesCounts);

// GET /api/dashboard/recent-activities?limit=15
// Returns the most recent activity log entries.
router.get("/recent-activities", authenticateToken, DashboardController.getRecentActivities);

export default router;