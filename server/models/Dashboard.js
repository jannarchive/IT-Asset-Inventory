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
        COUNT(*)                                                          AS total_assets,
        COUNT(*) FILTER (WHERE s.status = 'Active')                      AS active_assets,
        COUNT(*) FILTER (WHERE s.status IN ('Defective', 'Under Maintenance')) AS defective_assets
      FROM assets a
      JOIN status s ON a.status_id = s.status_id
    `;

    const incompleteQuery = `
      SELECT COUNT(DISTINCT fw.device_id) AS total
      FROM full_workstation fw
      WHERE NOT EXISTS (
        SELECT 1
        FROM assets       a
        JOIN asset_type   at ON a.asset_type_id = at.asset_type_id
        WHERE a.device_id = fw.device_id
          AND at.asset_type IN ('CPU', 'Monitor', 'Keyboard', 'Headset', 'Camera', 'Mouse')
        GROUP BY a.device_id
        HAVING COUNT(DISTINCT at.asset_type) = 4
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
        at.asset_type,
        COUNT(a.assets_id) AS total
      FROM asset_type at
      LEFT JOIN assets a ON at.asset_type_id = a.asset_type_id
      GROUP BY at.asset_type_id, at.asset_type
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
        aal.activity_logs_id,
        aal.date_of_action,
        aal.device_id,
        aat.action_type,
        aal.description,
        su.full_name AS system_user
      FROM asset_activity_logs      aal
      LEFT JOIN activity_action_type aat ON aal.action_type_id    = aat.action_type_id
      LEFT JOIN system_users         su  ON aal.system_users_id   = su.system_users_id
      ORDER BY aal.date_of_action DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);
    return result.rows;
  }
}

export default Dashboard;