import pool from '../config/Database.js';

// Get all assets with type and status information
export const getAllAssets = async () => {
  try {
    const query = `
      SELECT a.asset_id, a.asset_code, a.asset_name, a.serial_number, a.created_at, a.updated_at, 
             at.asset_type_name, s.status_name
      FROM assets a
      JOIN asset_type at ON a.asset_type_id = at.asset_type_id
      JOIN status s ON a.status_id = s.status_id
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
      SELECT a.asset_id, a.asset_code, a.asset_name, a.serial_number, a.created_at, a.updated_at,
             at.asset_type_name, s.status_name, a.warranty_expiry_date, a.notes
      FROM assets a
      JOIN asset_type at ON a.asset_type_id = at.asset_type_id
      JOIN status s ON a.status_id = s.status_id
      WHERE a.asset_id = $1
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
    const { assetCode, assetName, assetTypeId, statusId, serialNumber, warrantyExpiryDate, notes } = assetData;
    const query = `
      INSERT INTO assets (asset_type_id, asset_code, asset_name, status_id, serial_number, warranty_expiry_date, notes, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING asset_id, asset_code, asset_name, created_at
    `;
    const result = await pool.query(query, [
      assetTypeId,
      assetCode,
      assetName,
      statusId,
      serialNumber,
      warrantyExpiryDate,
      notes,
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
    const { assetName, statusId, warrantyStatusId, warrantyExpiryDate, notes } = assetData;
    const query = `
      UPDATE assets 
      SET asset_name = $1, status_id = $2, warranty_status_id = $3, warranty_expiry_date = $4, notes = $5, updated_at = NOW()
      WHERE asset_id = $6
      RETURNING *
    `;
    const result = await pool.query(query, [assetName, statusId, warrantyStatusId, warrantyExpiryDate, notes, assetId]);
    return result.rows[0];
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
};

// Delete asset
export const deleteAsset = async (assetId) => {
  try {
    const query = "DELETE FROM assets WHERE asset_id = $1 RETURNING asset_id";
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
      SELECT a.asset_id, a.asset_code, a.asset_name, a.created_at,
             at.asset_type_name, s.status_name
      FROM assets a
      JOIN asset_type at ON a.asset_type_id = at.asset_type_id
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

// Get assets by type
export const getAssetsByType = async (assetTypeId) => {
  try {
    const query = `
      SELECT a.asset_id, a.asset_code, a.asset_name, a.created_at,
             at.asset_type_name, s.status_name
      FROM assets a
      JOIN asset_type at ON a.asset_type_id = at.asset_type_id
      JOIN status s ON a.status_id = s.status_id
      WHERE a.asset_type_id = $1
      ORDER BY a.created_at DESC
    `;
    const result = await pool.query(query, [assetTypeId]);
    return result.rows;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
};
