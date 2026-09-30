import pool from "../config/Database.js";
import { generateAssetCode } from "../utils/AssetCodeGenerator.js";

export const getAllWorkstationAssets = async () => {
  try {
    const query = `
      SELECT 
        wa.workstation_asset_id,
        wa.device_id,
        wa.asset_id,
        wa.asset_role,
        wa.assigned_at,
        -- Workstation details
        fw.device_name,
        fw.model AS workstation_model,
        fw.status_id,
        s.status_name AS device_status,
        e.employee_id,
        e.employee_name,
        e.employee_number,
        t.team_id,
        t.team_name AS team,
        l.location_name AS location,
        -- Asset details
        a.asset_code,
        a.serial_number,
        a.asset_name,
        a.asset_type_id,
        at.asset_type_name,
        a.warranty_expiry_date,
        ws.warranty_status_name AS warranty_status,
        ast.status_name AS asset_status,
        a.created_at
      FROM workstation_assets wa
      LEFT JOIN full_workstation fw ON wa.device_id = fw.device_id
      LEFT JOIN assets a ON wa.asset_id = a.asset_id
      LEFT JOIN asset_type at ON a.asset_type_id = at.asset_type_id
      LEFT JOIN status s ON fw.status_id = s.status_id
      LEFT JOIN status ast ON a.status_id = ast.status_id
      LEFT JOIN warranty_status ws ON a.warranty_status_id = ws.warranty_status_id
      LEFT JOIN employees e ON fw.employee_id = e.employee_id
      LEFT JOIN teams t ON e.team_id = t.team_id
      LEFT JOIN locations l ON e.location_id = l.location_id
      ORDER BY wa.assigned_at DESC NULLS LAST, wa.workstation_asset_id DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
};

export const getAssetById = async (assetId) => {
  try {
    const query = `
      SELECT a.asset_id, a.asset_code, a.asset_name, a.serial_number, a.created_at, a.updated_at,
             at.asset_type_name, s.status_name, a.notes
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

const normalizeAssetTypeName = (name) => {
  return name.trim().replace(/\s+\d+$/, "").trim();
};

const generateAssetTypeCode = async (name) => {
  const base = name.trim().toUpperCase().substring(0, 3);
  const primaryCode = `LBPO-${base}`;

  const existing = await pool.query(
    "SELECT asset_type_code FROM asset_type WHERE asset_type_code = $1",
    [primaryCode]
  );
  if (existing.rows.length === 0) return primaryCode;

  const prefix2 = base.substring(0, 2);
  for (let suffix = 2; suffix <= 9; suffix++) {
    const candidate = `LBPO-${prefix2}${suffix}`;
    const check = await pool.query(
      "SELECT asset_type_code FROM asset_type WHERE asset_type_code = $1",
      [candidate]
    );
    if (check.rows.length === 0) return candidate;
  }

  return `LBPO-${base.substring(0, 2)}${Date.now().toString().slice(-1)}`;
};

export const getOrCreateAssetType = async (assetTypeName) => {
  try {
    const normalizedName = normalizeAssetTypeName(assetTypeName);

    const existingQuery = `
      SELECT asset_type_id, asset_type_name, asset_type_code
      FROM asset_type
      WHERE LOWER(asset_type_name) = LOWER($1)
    `;
    const existingResult = await pool.query(existingQuery, [normalizedName]);

    if (existingResult.rows.length > 0) {
      return existingResult.rows[0];
    }

    const generatedCode = await generateAssetTypeCode(normalizedName);

    const createQuery = `
      INSERT INTO asset_type (asset_type_name, asset_type_code, asset_type_category, created_at)
      VALUES ($1, $2, 'Peripheral', NOW())
      RETURNING asset_type_id, asset_type_name, asset_type_code
    `;

    const createResult = await pool.query(createQuery, [normalizedName, generatedCode]);

    const initSequenceQuery = `
      INSERT INTO asset_code_sequences (asset_type_id, last_number)
      VALUES ($1, 0)
      ON CONFLICT (asset_type_id) DO NOTHING
    `;
    await pool.query(initSequenceQuery, [createResult.rows[0].asset_type_id]);

    return createResult.rows[0];
  } catch (error) {
    console.error("Database error in getOrCreateAssetType:", error);
    throw error;
  }
};

/**
 * Get all assets from the assets table (legacy)
 * Used when displaying assets independent of workstation assignment
 *
 * @returns {Promise<Array>} Array of asset records with type and status
 */
export const getAllAssetsLegacy = async () => {
  try {
    const query = `
      SELECT a.asset_id, a.asset_code, a.asset_name, a.serial_number, a.created_at, a.updated_at, 
             at.asset_type_name, s.status_name, a.asset_type_id, a.status_id
      FROM assets a
      LEFT JOIN asset_type at ON a.asset_type_id = at.asset_type_id
      LEFT JOIN status s ON a.status_id = s.status_id
      ORDER BY a.created_at DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
};

export const getAllAssetTypes = async () => {
  try {
    const query = `
      SELECT asset_type_id, asset_type_name, asset_type_code
      FROM asset_type
      ORDER BY asset_type_name ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
};

const resolveStatusId = async (statusName) => {
  const result = await pool.query(
    "SELECT status_id FROM status WHERE status_name = $1",
    [statusName || "Active"]
  );
  return result.rows[0]?.status_id ?? null;
};

const normalizeAssetType = async (assetData) => {
  if (assetData.asset_type_id) {
    const check = await pool.query(
      "SELECT asset_type_id FROM asset_type WHERE asset_type_id = $1",
      [assetData.asset_type_id]
    );
    if (check.rows.length > 0) return assetData.asset_type_id;
  }

  if (!assetData.asset_type_name) {
    throw new Error("Asset type name or a valid asset_type_id is required");
  }

  const assetType = await getOrCreateAssetType(assetData.asset_type_name);
  return assetType.asset_type_id;
};

const normalizeAssetCode = async ({ assetCode, assetTypeId }) => {
  if (assetCode && assetCode.trim() !== "") {
    return assetCode;
  }
  if (!assetTypeId) {
    throw new Error("Asset type ID is required to generate an asset code");
  }
  return await generateAssetCode(assetTypeId);
};

// Create new asset
export const createAsset = async (assetData) => {
  try {
    const assetName    = assetData.asset_name   ?? assetData.assetName   ?? null;
    const serialNumber = assetData.serial_number ?? assetData.serialNumber ?? null;
    const assetTypeId  = assetData.asset_type_id ?? assetData.assetTypeId  ?? null;
    const assetCode    = assetData.asset_code    ?? assetData.assetCode    ?? null;
    const notes        = assetData.notes                                   ?? null;
    const status       = assetData.status                                  ?? "Active";
    const assetRole    = assetData.asset_role ?? null;

    const resolvedTypeId   = await normalizeAssetType({
      asset_type_id:   assetTypeId,
      asset_type_name: assetData.asset_type_name ?? null,
    });
    const resolvedStatusId = await resolveStatusId(status);
    const finalAssetCode   = await normalizeAssetCode({ assetCode, assetTypeId: resolvedTypeId });

    const query = `
      INSERT INTO assets (
        asset_type_id, asset_code, asset_name, status_id,
        serial_number, notes,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING asset_id, asset_code, asset_name, serial_number, created_at
    `;

    const result = await pool.query(query, [
      resolvedTypeId,
      finalAssetCode,
      assetName,
      resolvedStatusId,
      serialNumber,
      notes,
    ]);

    return { ...result.rows[0], asset_role: assetRole };
  } catch (error) {
    console.error("Database error in createAsset:", error);
    throw error;
  }
};

export const createAssetsBatch = async (assetRecords) => {
  if (!Array.isArray(assetRecords) || assetRecords.length === 0) {
    throw new Error("Asset batch must be a non-empty array");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const createdAssets = [];
    for (const assetData of assetRecords) {

      const created = await createAsset(assetData);
      createdAssets.push(created);
    }

    await client.query("COMMIT");
    return createdAssets;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("createAssetsBatch rolled back:", error);
    throw error;
  } finally {
    client.release();
  }
};

// Update asset
export const updateAsset = async (assetId, assetData) => {
  try {
    const { assetName, statusId, notes } = assetData;
    const query = `
      UPDATE assets 
      SET asset_name = $1, status_id = $2, notes = $3, updated_at = NOW()
      WHERE asset_id = $4
      RETURNING *
    `;
    const result = await pool.query(query, [
      assetName,
      statusId,
      notes,
      assetId,
    ]);
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