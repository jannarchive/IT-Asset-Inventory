import express from 'express';
import * as AssetController from '../controllers/AssetController.js';
import { authenticateToken } from '../middleware/AuthMiddleware.js';

const router = express.Router();

// All asset routes require authentication
router.use(authenticateToken);

// GET routes
router.get("/", AssetController.getAllAssets);
router.get("/status", AssetController.getAssetsByStatus);
router.get("/type", AssetController.getAssetsByType);
router.get("/:id", AssetController.getAssetById);

// POST route (admin only)
router.post("/", AssetController.createAsset);

// PUT route (admin only)
router.put("/:id", AssetController.updateAsset);

// DELETE route (admin only)
router.delete("/:id", AssetController.deleteAsset);

export default router;