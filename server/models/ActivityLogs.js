import pool from "../config/Database.js";

class ActivityLogs {
  /**
   * Get action type ID by name
   * @param {string} actionTypeName - Name of the action (e.g., 'CREATE', 'UPDATE')
   * @returns {Promise<number>} Action type ID
   */
  static async getActionTypeId(actionTypeName) {
    try {
      const query = `
        SELECT action_type_id FROM activity_action_type 
        WHERE action_type = $1
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
   * Log an activity to asset_activity_logs table
   * @param {Object} logData - Activity data
   * @param {number} logData.deviceId - ID of the workstation/device
   * @param {string} logData.actionType - Type of action (CREATE, UPDATE, DELETE, etc.)
   * @param {string} logData.description - Detailed description of the action
   * @param {number} logData.userId - ID of the user performing the action
   * @returns {Promise<Object>} Created activity log record
   */
  static async logActivity(logData) {
    const { deviceId, actionType, description, userId } = logData;

    // Validate required fields
    if (!deviceId || !actionType || !description || !userId) {
      console.warn("Missing required fields for activity logging:", {
        deviceId,
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
          (date_of_action, device_id, action_type_id, description, system_users_id)
        VALUES (NOW(), $1, $2, $3, $4)
        RETURNING activity_logs_id, date_of_action, device_id, action_type_id, description, system_users_id
      `;

      const result = await pool.query(query, [
        deviceId,
        actionTypeId,
        description,
        userId,
      ]);

      console.log(
        `Activity logged: ${actionType} on device ${deviceId} by user ${userId}`,
      );

      return result.rows[0];
    } catch (error) {
      // Log the error but don't throw - we don't want failed logging to break the main operation
      console.error("Error logging activity:", error.message);
      // In production, you might want to send this to error tracking service
      return null;
    }
  }

  /**
   * Log asset creation
   */
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
   */
  static async logAssetUpdated(assetId, assetName, changes, deviceId, userId) {
    const changeDescription = Object.entries(changes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");

    const description = `Updated asset: ${assetName} (Asset ID: ${assetId}) - Changes: ${changeDescription}`;
    return this.logActivity({
      deviceId,
      actionType: "Updated",
      description,
      userId,
    });
  }

  /**
   * Log asset deletion
   */
  static async logAssetDeleted(assetId, assetName, deviceId, userId) {
    const description = `Deleted asset: ${assetName} (Asset ID: ${assetId})`;
    return this.logActivity({
      deviceId,
      actionType: "Deleted",
      description,
      userId,
    });
  }

  /**
   * Log asset status change
   */
  static async logStatusChange(
    assetId,
    assetName,
    oldStatus,
    newStatus,
    deviceId,
    userId,
  ) {
    const description = `Status change - ${assetName} (Asset ID: ${assetId}): "${oldStatus}" → "${newStatus}"`;
    return this.logActivity({
      deviceId,
      actionType: "Status Changed",
      description,
      userId,
    });
  }
}

export default ActivityLogs;