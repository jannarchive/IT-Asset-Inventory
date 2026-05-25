import * as Asset from "../models/Asset.js";
// import ActivityLogs from "../models/ActivityLogs.js";

// Validates that a route param is a positive integer
const parseId = (value) => {
  const id = parseInt(value, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// GET /assets - with optional filtering and search
export const getAllAssets = async (req, res) => {
  try {
    const filters = {};

    // Parse optional query parameters
    if (req.query.assetTypeId) {
      filters.assetTypeId = parseInt(req.query.assetTypeId, 10);
    }
    if (req.query.statusId) {
      filters.statusId = parseInt(req.query.statusId, 10);
    }
    if (req.query.search) {
      filters.search = req.query.search;
    }

    const assets = await Asset.getAllAssets(filters);
    res.status(200).json({ assets });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Database error" });
  }
};

// GET /assets/:id
export const getAssetById = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: "Invalid asset ID" });
    }

    const asset = await Asset.getAssetById(id);
    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }

    res.status(200).json({ asset });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Database error" });
  }
};

// POST /assets
export const createAsset = async (req, res) => {
  try {
    const {
      assetCode,
      assetName,
      assetTypeId,
      statusId,
      serialNumber,
      warrantyExpiryDate,
      notes,
    } = req.body;

    if (!assetCode || !assetName || !assetTypeId || !statusId) {
      return res.status(400).json({
        error: "Asset code, name, type, and status are required",
      });
    }

    const newAsset = await Asset.createAsset({
      assetCode,
      assetName,
      assetTypeId,
      statusId,
      serialNumber,
      warrantyExpiryDate,
      notes,
    });

    res.status(201).json({
      message: "Asset created successfully",
      asset: newAsset,
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Failed to create asset" });
  }
};

// PUT /assets/:id
export const updateAsset = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: "Invalid asset ID" });
    }

    const { assetName, statusId, warrantyStatusId, warrantyExpiryDate, notes } =
      req.body;
    if (!assetName || !statusId) {
      return res.status(400).json({
        error: "Asset name and status are required",
      });
    }

    const existing = await Asset.getAssetById(id);
    if (!existing) {
      return res.status(404).json({ error: "Asset not found" });
    }

    const updatedAsset = await Asset.updateAsset(id, {
      assetName,
      statusId,
      warrantyStatusId,
      warrantyExpiryDate,
      notes,
    });

    res.status(200).json({
      message: "Asset updated successfully",
      asset: updatedAsset,
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Failed to update asset" });
  }
};

// DELETE /assets/:id
export const deleteAsset = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: "Invalid asset ID" });
    }

    const existing = await Asset.getAssetById(id);
    if (!existing) {
      return res.status(404).json({ error: "Asset not found" });
    }

    await Asset.deleteAsset(id);

    res.status(200).json({ message: "Asset deleted successfully" });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Failed to delete asset" });
  }
};

// GET /assets/status?statusId=
export const getAssetsByStatus = async (req, res) => {
  try {
    const statusId = parseId(req.query.statusId);
    if (!statusId) {
      return res.status(400).json({ error: "A valid Status ID is required" });
    }

    const assets = await Asset.getAssetsByStatus(statusId);
    res.status(200).json({ assets });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Database error" });
  }
};

// GET /assets/type?typeId=
export const getAssetsByType = async (req, res) => {
  try {
    const typeId = parseId(req.query.typeId);
    if (!typeId) {
      return res.status(400).json({ error: "A valid Type ID is required" });
    }

    const assets = await Asset.getAssetsByType(typeId);
    res.status(200).json({ assets });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Database error" });
  }
};