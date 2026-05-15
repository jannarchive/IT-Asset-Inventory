import express from 'express';
import * as assetController from '../controllers/AssetController.js';
import { authenticateToken } from '../middleware/AuthMiddleware.js';

const router = express.Router();

// All asset routes require authentication
router.use(authenticateToken);

// GET routes
router.get("/", assetController.getAllAssets);
router.get("/status", assetController.getAssetsByStatus);
router.get("/category", assetController.getAssetsByCategory);
router.get("/:id", assetController.getAssetById);

// POST route (admin only)
router.post("/", assetController.createAsset);

// PUT route (admin only)
router.put("/:id", assetController.updateAsset);

// DELETE route (admin only)
router.delete("/:id", assetController.deleteAsset);

export default router;
