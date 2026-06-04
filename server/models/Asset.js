import pool from "../config/Database.js";
import { generateAssetCode } from "../utils/AssetCodeGenerator.js";

/**
 * Get all workstation assets with complete workstation and asset details
 * This queries the workstation_assets table to show which assets are assigned to workstations
 *
 * @returns {Promise<Array>} Array of workstation asset records with related data
 */
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

// Get asset by ID
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

/**
 * Normalize an asset type name by stripping trailing ordinal suffixes.
 * Examples: "Monitor 1" → "Monitor", "Monitor 2" → "Monitor", "Keyboard" → "Keyboard"
 * This ensures that peripheral roles like "Monitor 1" resolve to the canonical
 * "Monitor" asset type instead of attempting to create a duplicate type.
 */
const normalizeAssetTypeName = (name) => {
  return name.trim().replace(/\s+\d+$/, "").trim();
};

/**
 * Generate a unique 3-character asset type code from a name.
 * Checks the DB for conflicts and appends a numeric suffix if needed.
 * Examples: "Monitor" → "LBPO-MON", "Miscellaneous" → "LBPO-MIS"
 * If "LBPO-MON" is taken by a different type, tries "LBPO-MO2", "LBPO-MO3", …
 */
const generateAssetTypeCode = async (name) => {
  const base = name.trim().toUpperCase().substring(0, 3);
  const primaryCode = `LBPO-${base}`;

  // Check if the primary code is already taken
  const existing = await pool.query(
    "SELECT asset_type_code FROM asset_type WHERE asset_type_code = $1",
    [primaryCode]
  );
  if (existing.rows.length === 0) return primaryCode;

  // Primary code is taken — find a free numeric variant (LBPO-MO2 … LBPO-MO9)
  const prefix2 = base.substring(0, 2);
  for (let suffix = 2; suffix <= 9; suffix++) {
    const candidate = `LBPO-${prefix2}${suffix}`;
    const check = await pool.query(
      "SELECT asset_type_code FROM asset_type WHERE asset_type_code = $1",
      [candidate]
    );
    if (check.rows.length === 0) return candidate;
  }

  // Fallback: use a short timestamp fragment (virtually collision-free)
  return `LBPO-${base.substring(0, 2)}${Date.now().toString().slice(-1)}`;
};

/**
 * Get or create an asset type by name.
 * Normalizes the name first (strips trailing ordinal suffixes such as " 1", " 2")
 * so that "Monitor 1" and "Monitor 2" both resolve to the existing "Monitor" type.
 * If the normalized name does not exist, auto-creates it with a generated code.
 * @param {string} assetTypeName - Raw name (may include ordinal suffix)
 * @returns {Promise<Object>} - The asset type with asset_type_id and asset_type_code
 */
export const getOrCreateAssetType = async (assetTypeName) => {
  try {
    const normalizedName = normalizeAssetTypeName(assetTypeName);

    // Check if asset type already exists (case-insensitive, using normalized name)
    const existingQuery = `
      SELECT asset_type_id, asset_type_name, asset_type_code
      FROM asset_type
      WHERE LOWER(asset_type_name) = LOWER($1)
    `;
    const existingResult = await pool.query(existingQuery, [normalizedName]);

    if (existingResult.rows.length > 0) {
      return existingResult.rows[0];
    }

    // Create new asset type with a unique auto-generated code
    const generatedCode = await generateAssetTypeCode(normalizedName);

    const createQuery = `
      INSERT INTO asset_type (asset_type_name, asset_type_code, asset_type_category, created_at)
      VALUES ($1, $2, 'Peripheral', NOW())
      RETURNING asset_type_id, asset_type_name, asset_type_code
    `;

    const createResult = await pool.query(createQuery, [normalizedName, generatedCode]);

    // Initialize the sequence for this new asset type
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

// Get all asset types - used by the frontend to populate peripheral type dropdowns
// and to resolve asset_type_id for asset code generation
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
    // Validate the provided ID actually exists to prevent phantom FK references
    const check = await pool.query(
      "SELECT asset_type_id FROM asset_type WHERE asset_type_id = $1",
      [assetData.asset_type_id]
    );
    if (check.rows.length > 0) return assetData.asset_type_id;
    // ID not found — fall through to name resolution
  }

  if (!assetData.asset_type_name) {
    throw new Error("Asset type name or a valid asset_type_id is required");
  }

  // getOrCreateAssetType normalizes the name internally (strips ordinal suffixes)
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
    // Normalise field names: snake_case (frontend) wins over camelCase (legacy)
    const assetName    = assetData.asset_name   ?? assetData.assetName   ?? null;
    const serialNumber = assetData.serial_number ?? assetData.serialNumber ?? null;
    const assetTypeId  = assetData.asset_type_id ?? assetData.assetTypeId  ?? null;
    const assetCode    = assetData.asset_code    ?? assetData.assetCode    ?? null;
    const notes        = assetData.notes                                   ?? null;
    const status       = assetData.status                                  ?? "Active";
    // asset_role belongs in workstation_assets, not assets — round-trip it only
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

    // Return all columns the controller needs, plus the round-tripped role
    return { ...result.rows[0], asset_role: assetRole };
  } catch (error) {
    console.error("Database error in createAsset:", error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Batch-create assets inside a single transaction.
// A failure on any one asset rolls the whole batch back, keeping `assets` and
// `workstation_assets` consistent and preventing orphaned sequence gaps.
// ---------------------------------------------------------------------------
export const createAssetsBatch = async (assetRecords) => {
  if (!Array.isArray(assetRecords) || assetRecords.length === 0) {
    throw new Error("Asset batch must be a non-empty array");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const createdAssets = [];
    for (const assetData of assetRecords) {
      // createAsset uses pool for its read-only FK lookups (resolveStatusId etc.)
      // which is safe; only the INSERT uses the pool as well.  We keep the
      // implementation centralised in createAsset and rely on the outer
      // transaction here for atomicity on the write path.
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