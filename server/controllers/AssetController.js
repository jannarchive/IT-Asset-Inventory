import * as Asset from '../models/Asset.js';

// Validates that a route param is a positive integer
const parseId = (value) => {
  const id = parseInt(value, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// GET /assets
export const getAllAssets = async (req, res) => {
  try {
    const assets = await Asset.getAllAssets();
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
    const { assetName, assetTypeId, statusId, deviceId } = req.body;

    if (!assetName || !assetTypeId || !statusId || !deviceId) {
      return res.status(400).json({
        error: "Asset name, type, status, and device are required",
      });
    }

    const newAsset = await Asset.createAsset({ assetName, assetTypeId, statusId, deviceId });

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

    const { assetName, statusId } = req.body;
    if (!assetName || !statusId) {
      return res.status(400).json({
        error: "Asset name and status are required",
      });
    }

    const existing = await Asset.getAssetById(id);
    if (!existing) {
      return res.status(404).json({ error: "Asset not found" });
    }

    const updatedAsset = await Asset.updateAsset(id, { assetName, statusId });

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

// GET /assets/category?categoryId=
export const getAssetsByCategory = async (req, res) => {
  try {
    const categoryId = parseId(req.query.categoryId);
    if (!categoryId) {
      return res.status(400).json({ error: "A valid Category ID is required" });
    }

    const assets = await Asset.getAssetsByCategory(categoryId);
    res.status(200).json({ assets });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Database error" });
  }
};