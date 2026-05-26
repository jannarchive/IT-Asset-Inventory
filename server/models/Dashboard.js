import pool from "../config/Database.js";

class Dashboard {
  /**
   * Fetches all four status card counts in two DB round-trips:
   *  1. A single aggregated query for total / active / defective assets.
   *  2. A separate query for incomplete workstations (requires a NOT EXISTS subquery).
   */
  static async getDashboardStats() {
    const statsQuery = `
      SELECT
        COUNT(*)                                                                  AS total_assets,
        COUNT(*) FILTER (WHERE s.status_name = 'Active')                         AS active_assets,
        COUNT(*) FILTER (WHERE s.status_name IN ('Defective', 'Under Maintenance')) AS defective_assets
      FROM assets a
      JOIN status s ON a.status_id = s.status_id
    `;

    const incompleteQuery = `
      SELECT COUNT(DISTINCT fw.device_id) AS total
      FROM full_workstation fw
      WHERE NOT EXISTS (
        SELECT 1
        FROM workstation_assets wa
        JOIN assets a ON wa.asset_id = a.asset_id
        JOIN asset_type at ON a.asset_type_id = at.asset_type_id
        WHERE wa.device_id = fw.device_id
          AND wa.removed_at IS NULL
          AND at.asset_type_name IN ('CPU', 'Monitor', 'Keyboard', 'Headset', 'Webcam', 'Mouse')
        GROUP BY wa.device_id
        HAVING COUNT(DISTINCT at.asset_type_name) = 6
      )
    `;

    const [statsResult, incompleteResult] = await Promise.all([
      pool.query(statsQuery),
      pool.query(incompleteQuery),
    ]);

    const row = statsResult.rows[0];

    return {
      totalAssets:            parseInt(row.total_assets,          10),
      activeAssets:           parseInt(row.active_assets,         10),
      defectiveAssets:        parseInt(row.defective_assets,      10),
      incompleteWorkstations: parseInt(incompleteResult.rows[0].total, 10),
    };
  }

  /**
   * Returns each asset type with its current asset count.
   * Used by the bar graph on the dashboard.
   */
  static async getAssetTypesCounts() {
    const query = `
      SELECT
        at.asset_type_name,
        COUNT(a.asset_id) AS total
      FROM asset_type at
      LEFT JOIN assets a ON at.asset_type_id = a.asset_type_id
      GROUP BY at.asset_type_id, at.asset_type_name
      ORDER BY total DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Returns the most recent activity log entries, newest first.
   * @param {number} limit - Maximum rows to return (default 15, max 100).
   */
  static async getRecentActivities(limit = 15) {
    const query = `
      SELECT
        aal.activity_log_id,
        aal.entity_id,
        aat.action_type_name,
        aal.description,
        su.full_name AS performed_by,
        aal.created_at
      FROM asset_activity_logs aal
      LEFT JOIN activity_action_type aat ON aal.action_type_id = aat.action_type_id
      LEFT JOIN system_users su ON aal.performed_by = su.system_users_id
      ORDER BY aal.created_at DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);
    return result.rows;
  }
}

export default Dashboard;