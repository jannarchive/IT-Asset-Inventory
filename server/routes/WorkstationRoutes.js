import express from "express";
import * as WorkstationController from "../controllers/WorkstationController.js";
import { authenticateToken } from "../middleware/AuthMiddleware.js";

const router = express.Router();

// All workstation routes require authentication
router.use(authenticateToken);

// ── Literal paths first (must come before /:id to avoid being swallowed) ────
router.post("/generate-codes", WorkstationController.generateAssetCodes);

// ── Collection routes ────────────────────────────────────────────────────────
router.get("/",  WorkstationController.getAllWorkstations);
router.post("/", WorkstationController.createWorkstation);

// ── Single-resource routes (parameterized — always after literals) ───────────
router.get("/:id/assets", WorkstationController.getWorkstationAssets);
router.put("/:id/full",   WorkstationController.updateWorkstationFull);
router.get("/:id",    WorkstationController.getWorkstationById);
router.delete("/:id", WorkstationController.deleteWorkstation);

export default router;