import * as Asset from "../models/Asset.js";

// Validates that a route param is a positive integer
const parseId = (value) => {
  const id = parseInt(value, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// GET /assets - Fetch all workstation assets (assets assigned to workstations)
// Shows which assets are physically attached to which workstation
export const getAllAssets = async (req, res) => {
  try {
    const assets = await Asset.getAllWorkstationAssets();
    res.status(200).json({ assets });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Failed to fetch workstation assets" });
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

// GET /assets/types - Fetch all asset types for dropdown population and
// asset_type_id resolution used by the generate-codes endpoint
export const getAllAssetTypes = async (req, res) => {
  try {
    const assetTypes = await Asset.getAllAssetTypes();
    res.status(200).json({ asset_types: assetTypes });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Failed to fetch asset types" });
  }
};

// POST /assets/get-or-create-type - Get existing or create new asset type
// Used for "Other Peripherals" feature - auto-creates type if it doesn't exist
export const getOrCreateAssetType = async (req, res) => {
  try {
    const { assetTypeName } = req.body;

    if (!assetTypeName || typeof assetTypeName !== "string" || !assetTypeName.trim()) {
      return res.status(400).json({
        error: "Valid asset type name is required",
      });
    }

    const assetType = await Asset.getOrCreateAssetType(assetTypeName);

    res.status(200).json({
      asset_type_id: assetType.asset_type_id,
      asset_type_name: assetType.asset_type_name,
      asset_type_code: assetType.asset_type_code,
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Failed to get or create asset type" });
  }
};

// POST /assets
// Receives { assets: [...] } — an array of asset objects from the frontend.
// Each object uses snake_case keys: asset_name, serial_number, asset_type_name,
// asset_type_id, asset_code, status,
// asset_role (round-tripped for the workstation_assets link; not stored here).
export const createAsset = async (req, res) => {
  try {
    const assets = req.body.assets;
    if (!Array.isArray(assets)) {
      return res.status(400).json({ error: "An array of assets is required" });
    }

    if (assets.length === 0) {
      return res.status(200).json({ assets: [] });
    }

    // Validate each asset has at least a type identifier so we can resolve
    // asset_type_id and generate an asset code.  asset_name is optional —
    // the user may submit with only a serial number.
    assets.forEach((asset, index) => {
      const hasType = asset.asset_type_id || asset.asset_type_name;
      if (!hasType) {
        throw new Error(
          `Asset at index ${index} must include asset_type_id or asset_type_name`
        );
      }
    });

    const createdAssets = await Asset.createAssetsBatch(assets);

    res.status(201).json({ assets: createdAssets });
  } catch (error) {
    console.error("Server error in createAsset:", error);
    res.status(500).json({ error: error.message || "Failed to create assets" });
  }
};

// PUT /assets/:id
export const updateAsset = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: "Invalid asset ID" });
    }

    const { assetName, statusId, notes } = req.body;
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
// POST /assets/generate-codes
// Generates asset codes by incrementing sequences in the DB.
// Delegates to the same utility used by the workstation controller.
// Body: { assetTypes: { [role]: assetTypeId, ... } }
export const generateAssetCodes = async (req, res) => {
  try {
    const { generateMultipleAssetCodes } = await import("../utils/AssetCodeGenerator.js");
    const { assetTypes } = req.body;

    if (!assetTypes || typeof assetTypes !== "object") {
      return res.status(400).json({ error: "assetTypes object is required" });
    }

    const assetCodes = await generateMultipleAssetCodes(assetTypes);
    res.status(200).json({ asset_codes: assetCodes });
  } catch (error) {
    console.error("Server error in generateAssetCodes:", error);
    res.status(500).json({ error: "Failed to generate asset codes" });
  }
};