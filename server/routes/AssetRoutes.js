import express from 'express';
import * as AssetController from '../controllers/AssetController.js';
import { authenticateToken } from '../middleware/AuthMiddleware.js';

const router = express.Router();

// All asset routes require authentication
router.use(authenticateToken);

// ---------------------------------------------------------------------------
// Static / named routes  — MUST come before /:id to avoid param capture
// ---------------------------------------------------------------------------

// GET /api/assets
router.get("/", AssetController.getAllAssets);

// GET /api/assets/status?statusId=
router.get("/status", AssetController.getAssetsByStatus);

// GET /api/assets/type?typeId=
router.get("/type", AssetController.getAssetsByType);

// GET /api/assets/asset-types
router.get("/asset-types", AssetController.getAllAssetTypes);

// POST /api/assets/get-or-create-type
router.post("/get-or-create-type", AssetController.getOrCreateAssetType);

// POST /api/assets/generate-codes  (called by AdminAddAssetRecord before submit)
router.post("/generate-codes", AssetController.generateAssetCodes);

// ---------------------------------------------------------------------------
// Parameterised routes — after all static routes
// ---------------------------------------------------------------------------

// GET /api/assets/:id
router.get("/:id", AssetController.getAssetById);

// POST /api/assets
router.post("/", AssetController.createAsset);

// PUT /api/assets/:id
router.put("/:id", AssetController.updateAsset);

// DELETE /api/assets/:id
router.delete("/:id", AssetController.deleteAsset);

export default router;