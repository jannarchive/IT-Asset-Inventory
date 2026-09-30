import Workstation from "../models/Workstation.js";
import { generateMultipleAssetCodes } from "../utils/AssetCodeGenerator.js";

// Validates that a route param is a positive integer
const parseId = (value) => {
  const id = parseInt(value, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// GET /api/workstations
export const getAllWorkstations = async (req, res) => {
  try {
    const workstations = await Workstation.getAllWorkstations();
    res.status(200).json({ workstations });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Database error" });
  }
};

// GET /api/workstations/:id
export const getWorkstationById = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid workstation ID" });

    const workstation = await Workstation.getWorkstationById(id);
    if (!workstation) return res.status(404).json({ error: "Workstation not found" });

    res.status(200).json({ workstation });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Database error" });
  }
};

// POST /api/workstations
export const createWorkstation = async (req, res) => {
  try {
    const {
      device_category,
      device_name,
      model,              
      assigned_user,
      employee_number,
      team,               
      location,           
      date_assigned,
      device_status,
      warranty_status,
      warranty_expiry_date,
      supplier,
      notes,
      accountability_form,
      memory,
      motherboard,
      storage,
      assets,
    } = req.body;

    if (!device_category || !device_status) {
      return res.status(400).json({
        error: "Device category and Device status are required",
      });
    }

    const newWorkstation = await Workstation.createWorkstation({
      device_category,
      device_name:          device_name          ?? null,
      model:                model                ?? null,
      assigned_user:        assigned_user        ?? null,
      employee_number:      employee_number      ?? null,
      team:                 team                 ?? null,
      location:             location             ?? null,
      date_assigned:        date_assigned        ?? null,
      device_status,
      warranty_status:      warranty_status      ?? null,
      warranty_expiry_date: warranty_expiry_date ?? null,
      supplier:             supplier             ?? null,
      notes:                notes                ?? null,
      accountability_form:  accountability_form  ?? null,
      memory:               memory               ?? null,
      motherboard:          motherboard          ?? null,
      storage:              storage              ?? null,
      assets:               Array.isArray(assets) ? assets : [],
    });

    res.status(201).json({
      message: "Workstation created successfully",
      workstation: newWorkstation,
    });
  } catch (error) {
    console.error("Server error in createWorkstation:", error);
    res.status(500).json({ error: error.message ?? "Failed to create workstation" });
  }
};

// PUT /api/workstations/:id
// Updates full_workstation columns only. Peripheral changes go through workstation_assets endpoints
export const updateWorkstation = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid workstation ID" });

    const existing = await Workstation.getWorkstationById(id);
    if (!existing) return res.status(404).json({ error: "Workstation not found" });

    const updatedWorkstation = await Workstation.updateWorkstation(id, req.body);

    res.status(200).json({
      message: "Workstation updated successfully",
      workstation: updatedWorkstation,
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Failed to update workstation" });
  }
};

// DELETE /api/workstations/:id
export const deleteWorkstation = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid workstation ID" });

    const existing = await Workstation.getWorkstationById(id);
    if (!existing) return res.status(404).json({ error: "Workstation not found" });

    await Workstation.deleteWorkstation(id);
    res.status(200).json({ message: "Workstation deleted successfully" });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Failed to delete workstation" });
  }
};

// POST /api/workstations/generate-codes
// Generates asset codes by incrementing sequences in the database
export const generateAssetCodes = async (req, res) => {
  try {
    const { assetTypes } = req.body;

    if (!assetTypes || typeof assetTypes !== "object") {
      return res.status(400).json({ error: "assetTypes object is required" });
    }

    const assetCodes = await generateMultipleAssetCodes(assetTypes);
    res.status(200).json({ asset_codes: assetCodes });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Failed to generate asset codes" });
  }
};

// GET /api/workstations/:id/assets
// Returns all active assets linked to a workstation (including "other"
// peripherals). Used by the Edit dialog to populate the Peripherals and Other Peripherals tabs
export const getWorkstationAssets = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid workstation ID" });

    const assets = await Workstation.getWorkstationAssets(id);
    res.status(200).json({ assets });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Failed to fetch workstation assets" });
  }
};

// PUT /api/workstations/:id/full
// Saves full_workstation and all asset rows in one transaction.
export const updateWorkstationFull = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid workstation ID" });

    const existing = await Workstation.getWorkstationById(id);
    if (!existing) return res.status(404).json({ error: "Workstation not found" });

    const updated = await Workstation.updateWorkstationWithAssets(id, req.body);

    res.status(200).json({
      message: "Workstation updated successfully",
      workstation: updated,
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: error.message ?? "Failed to update workstation" });
  }
};