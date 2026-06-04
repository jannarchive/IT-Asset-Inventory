import pool from "../config/Database.js";

/**
 * Generate the next asset code for a given asset type
 * @param {number} assetTypeId - The asset type ID
 * @returns {Promise<string>} - The generated asset code (e.g., "PROC-00001")
 */
export const generateAssetCode = async (assetTypeId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get the asset type code
    const assetTypeResult = await client.query(
      "SELECT asset_type_code FROM asset_type WHERE asset_type_id = $1",
      [assetTypeId]
    );

    if (assetTypeResult.rows.length === 0) {
      throw new Error("Invalid asset type ID");
    }

    const assetTypeCode = assetTypeResult.rows[0].asset_type_code;

    // Get and increment the sequence
    const sequenceResult = await client.query(
      `UPDATE asset_code_sequences 
       SET last_number = last_number + 1 
       WHERE asset_type_id = $1 
       RETURNING last_number`,
      [assetTypeId]
    );

    if (sequenceResult.rows.length === 0) {
      // Initialize sequence if it doesn't exist
      await client.query(
        `INSERT INTO asset_code_sequences (asset_type_id, last_number) 
         VALUES ($1, 1)
         ON CONFLICT (asset_type_id) DO UPDATE
         SET last_number = asset_code_sequences.last_number + 1
         RETURNING last_number`,
        [assetTypeId]
      );

      const initResult = await client.query(
        "SELECT last_number FROM asset_code_sequences WHERE asset_type_id = $1",
        [assetTypeId]
      );
      
      const number = initResult.rows[0].last_number;
      const assetCode = `${assetTypeCode}-${String(number).padStart(5, "0")}`;

      await client.query("COMMIT");
      return assetCode;
    }

    const number = sequenceResult.rows[0].last_number;
    const assetCode = `${assetTypeCode}-${String(number).padStart(5, "0")}`;

    await client.query("COMMIT");
    return assetCode;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Generate multiple asset codes at once
 * @param {Object} assetTypes - Object with asset type names as keys (e.g., { processor: 1, monitor: 2 })
 * @returns {Promise<Object>} - Object with generated codes (e.g., { processor_code: "PROC-00001" })
 */
export const generateMultipleAssetCodes = async (assetTypes) => {
  const codes = {};

  for (const [key, assetTypeId] of Object.entries(assetTypes)) {
    try {
      codes[key] = await generateAssetCode(assetTypeId);
    } catch (error) {
      console.error(`Failed to generate code for ${key}:`, error);
      codes[key] = null;
    }
  }

  return codes;
};