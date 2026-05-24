/*import pool from "../config/Database.js";

class ActivityLogs {
  /**
   * Get action type ID by name
   * @param {string} actionTypeName - Name of the action (e.g., 'Created', 'Updated')
   * @returns {Promise<number>} Action type ID
   
  static async getActionTypeId(actionTypeName) {
    try {
      const query = `
        SELECT action_type_id FROM activity_action_type 
        WHERE action_type_name = $1
      `;
      const result = await pool.query(query, [actionTypeName]);

      if (!result.rows.length) {
        throw new Error(
          `Action type "${actionTypeName}" not found in database`,
        );
      }

      return result.rows[0].action_type_id;
    } catch (error) {
      console.error("Error fetching action type:", error);
      throw error;
    }
  }

  /**
   * Log an activity to asset_activity_logs table.
   * Note: With the new database schema, most logging is handled automatically by triggers.
   * This method can be used for manual logging if needed.
   * 
   * @param {Object} logData - Activity data
   * @param {string} logData.entityType - Type of entity (workstation, asset, workstation_asset)
   * @param {number} logData.entityId - ID of the entity
   * @param {string} logData.actionType - Type of action (Created, Updated, Deleted, Assigned, Unassigned)
   * @param {string} logData.description - Detailed description of the action
   * @param {number} logData.userId - ID of the user performing the action
   * @returns {Promise<Object>} Created activity log record

  static async logActivity(logData) {
    const { entityType, entityId, actionType, description, userId } = logData;

    // Validate required fields
    if (!entityType || entityId === undefined || !actionType || !description || !userId) {
      console.warn("Missing required fields for activity logging:", {
        entityType,
        entityId,
        actionType,
        description,
        userId,
      });
      return null;
    }

    try {
      // Get the action type ID
      const actionTypeId = await this.getActionTypeId(actionType);

      // Insert into activity logs
      const query = `
        INSERT INTO asset_activity_logs 
          (entity_type, entity_id, action_type_id, description, performed_by, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING activity_log_id, entity_type, entity_id, action_type_id, description, performed_by, created_at
      `;

      const result = await pool.query(query, [
        entityType,
        entityId,
        actionTypeId,
        description,
        userId,
      ]);

      console.log(
        `Activity logged: ${actionType} on ${entityType} ${entityId} by user ${userId}`,
      );

      return result.rows[0];
    } catch (error) {
      // Log the error but don't throw - we don't want failed logging to break the main operation
      console.error("Error logging activity:", error.message);
      // In production, you might want to send this to error tracking service
     Note: This is typically handled by database triggers now.

  static async logAssetCreated(assetId, assetCode, userId) {
    const description = `Created asset "${assetCode}" (Asset ID: ${assetId})`;
    return this.logActivity({
      entityType: "asset",
      entityId: asset
   * Log asset creation
      
  static async logAssetCreated(assetId, assetName, deviceId, userId) {
    const description = `Created asset: ${assetName} (Asset ID: ${assetId})`;
    return this.logActivity({
      deviceId,
      actionType: "Created",
      description,
      userId,
    });
  }

  /**
   * Log asset update with change details
   * Note: This is typically handled by database triggers now.
  
  static async logAssetUpdated(assetId, assetCode, changes, userId) {
    const changeDescription = Object.entries(changes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");

    const description = `Updated asset "${assetCode}" (Asset ID: ${assetId}) - Changes: ${changeDescription}`;
    return this.logActivity({
      entityType: "asset",
      entityId: assetId,
      actionType: "Updated",
      description,
      userId,
    });
  }

  /**
   * Log asset deletion
   * Note: This is typically handled by database triggers now.
  
  static async logAssetDeleted(assetId, assetCode, userId) {
    const description = `Deleted asset "${assetCode}" (Asset ID: ${assetId})`;
    return this.logActivity({
      entityType: "asset",
      entityId: assetId,
      actionType: "Deleted",
      description,
      userId,
    });
  }

  /* Note: This is typically handled by database triggers now.

  static async logStatusChange(
    assetId,
    assetCode,
    oldStatus,
    newStatus,
    userId,
  ) {
    const description = `Status change - "${assetCode}" (Asset ID: ${assetId}): "${oldStatus}" → "${newStatus}"`;
    return this.logActivity({
      entityType: "asset",
      entityId: assetId,
      actionType: "Updat
      deviceId,
      actionType: "Status Changed",
      description,
      userId,
    });
  }
}

export default ActivityLogs;*/