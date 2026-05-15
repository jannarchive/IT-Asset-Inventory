import pool from '../config/Database.js';

// Get all assets with device and status information
export const getAllAssets = async () => {
  try {
    const query = `
      SELECT a.assets_id, a.asset_name, a.created_at, a.updated_at, 
             fw.device_name, fw.model, s.status, d.device_category
      FROM assets a
      JOIN full_workstation fw ON a.device_id = fw.device_id
      JOIN status s ON a.status_id = s.status_id
      JOIN device_category d ON fw.device_category_id = d.device_category_id
      ORDER BY a.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
};

// Get asset by ID
export const getAssetById = async (assetId) => {
  try {
    const query = `
      SELECT a.assets_id, a.asset_name, a.created_at, a.updated_at,
             fw.device_id, fw.device_name, fw.model, s.status, d.device_category
      FROM assets a
      JOIN full_workstation fw ON a.device_id = fw.device_id
      JOIN status s ON a.status_id = s.status_id
      JOIN device_category d ON fw.device_category_id = d.device_category_id
      WHERE a.assets_id = $1
    `;
    const result = await pool.query(query, [assetId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
};

// Create new asset
export const createAsset = async (assetData) => {
  try {
    const { assetName, assetTypeId, statusId, deviceId } = assetData;
    const query = `
      INSERT INTO assets (asset_type_id, asset_name, status_id, device_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING assets_id, asset_name, created_at
    `;
    const result = await pool.query(query, [
      assetTypeId,
      assetName,
      statusId,
      deviceId,
    ]);
    return result.rows[0];
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
};

// Update asset
export const updateAsset = async (assetId, assetData) => {
  try {
    const { assetName, statusId } = assetData;
    const query = `
      UPDATE assets SET asset_name = $1, status_id = $2, updated_at = NOW()
      WHERE assets_id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [assetName, statusId, assetId]);
    return result.rows[0];
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
};

// Delete asset
export const deleteAsset = async (assetId) => {
  try {
    const query = "DELETE FROM assets WHERE assets_id = $1 RETURNING assets_id";
    const result = await pool.query(query, [assetId]);
    return result.rows[0];
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
};

// Get assets by status
export const getAssetsByStatus = async (statusId) => {
  try {
    const query = `
      SELECT a.assets_id, a.asset_name, a.created_at,
             fw.device_name, fw.model, s.status
      FROM assets a
      JOIN full_workstation fw ON a.device_id = fw.device_id
      JOIN status s ON a.status_id = s.status_id
      WHERE a.status_id = $1
      ORDER BY a.created_at DESC
    `;
    const result = await pool.query(query, [statusId]);
    return result.rows;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
};

// Get assets by category
export const getAssetsByCategory = async (categoryId) => {
  try {
    const query = `
      SELECT a.assets_id, a.asset_name, a.created_at,
             fw.device_name, fw.model, d.device_category
      FROM assets a
      JOIN full_workstation fw ON a.device_id = fw.device_id
      JOIN device_category d ON fw.device_category_id = d.device_category_id
      WHERE fw.device_category_id = $1
      ORDER BY a.created_at DESC
    `;
    const result = await pool.query(query, [categoryId]);
    return result.rows;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
};
