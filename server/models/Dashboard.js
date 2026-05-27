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

  /**
   * Retrieves all workstations with complete device and assignment information.
   * Joins with device category, employee, team, status, and asset information.
   */
  static async getAllWorkstations() {
    const query = `
      SELECT
        fw.device_id,
        fw.device_name,
        fw.model,
        fw.supplier,
        fw.notes,
        fw.accountability_form,
        fw.date_assigned,
        fw.updated_at AS last_updated,
        dc.device_category_name AS device_category,
        s.status_name AS device_status,
        ws.warranty_status_name AS warranty_status,
        e.employee_name AS assigned_user,
        e.employee_number,
        t.team_name AS team,
        l.location_name AS location,
        -- Processor info
        (SELECT asset_code FROM assets WHERE asset_id IN (
          SELECT asset_id FROM workstation_assets 
          WHERE device_id = fw.device_id AND asset_id IN (
            SELECT asset_id FROM assets WHERE asset_type_id IN (
              SELECT asset_type_id FROM asset_type WHERE asset_type_name = 'CPU'
            )
          ) AND removed_at IS NULL
        ) LIMIT 1) AS processor_code,
        (SELECT serial_number FROM assets WHERE asset_id IN (
          SELECT asset_id FROM workstation_assets 
          WHERE device_id = fw.device_id AND asset_id IN (
            SELECT asset_id FROM assets WHERE asset_type_id IN (
              SELECT asset_type_id FROM asset_type WHERE asset_type_name = 'CPU'
            )
          ) AND removed_at IS NULL
        ) LIMIT 1) AS processor_serial,
        (SELECT asset_name FROM assets WHERE asset_id IN (
          SELECT asset_id FROM workstation_assets 
          WHERE device_id = fw.device_id AND asset_id IN (
            SELECT asset_id FROM assets WHERE asset_type_id IN (
              SELECT asset_type_id FROM asset_type WHERE asset_type_name = 'CPU'
            )
          ) AND removed_at IS NULL
        ) LIMIT 1) AS processor,
        'CPU' AS processor_name,
        -- Memory/Storage placeholder
        '' AS memory,
        '' AS motherboard,
        '' AS storage,
        -- Monitor 1
        (SELECT asset_code FROM assets WHERE asset_id IN (
          SELECT asset_id FROM workstation_assets 
          WHERE device_id = fw.device_id AND asset_id IN (
            SELECT asset_id FROM assets WHERE asset_type_id IN (
              SELECT asset_type_id FROM asset_type WHERE asset_type_name = 'Monitor'
            )
          ) AND removed_at IS NULL LIMIT 1
        ) LIMIT 1) AS monitor1_code,
        (SELECT serial_number FROM assets WHERE asset_id IN (
          SELECT asset_id FROM workstation_assets 
          WHERE device_id = fw.device_id AND asset_id IN (
            SELECT asset_id FROM assets WHERE asset_type_id IN (
              SELECT asset_type_id FROM asset_type WHERE asset_type_name = 'Monitor'
            )
          ) AND removed_at IS NULL LIMIT 1
        ) LIMIT 1) AS monitor1_serial,
        (SELECT asset_name FROM assets WHERE asset_id IN (
          SELECT asset_id FROM workstation_assets 
          WHERE device_id = fw.device_id AND asset_id IN (
            SELECT asset_id FROM assets WHERE asset_type_id IN (
              SELECT asset_type_id FROM asset_type WHERE asset_type_name = 'Monitor'
            )
          ) AND removed_at IS NULL LIMIT 1
        ) LIMIT 1) AS monitor1,
        'Active' AS monitor1_status,
        -- Monitor 2 (2nd monitor if exists)
        (SELECT asset_code FROM assets WHERE asset_id IN (
          SELECT asset_id FROM workstation_assets 
          WHERE device_id = fw.device_id AND asset_id IN (
            SELECT asset_id FROM assets WHERE asset_type_id IN (
              SELECT asset_type_id FROM asset_type WHERE asset_type_name = 'Monitor'
            )
          ) AND removed_at IS NULL OFFSET 1 LIMIT 1
        ) LIMIT 1) AS monitor2_code,
        (SELECT serial_number FROM assets WHERE asset_id IN (
          SELECT asset_id FROM workstation_assets 
          WHERE device_id = fw.device_id AND asset_id IN (
            SELECT asset_id FROM assets WHERE asset_type_id IN (
              SELECT asset_type_id FROM asset_type WHERE asset_type_name = 'Monitor'
            )
          ) AND removed_at IS NULL OFFSET 1 LIMIT 1
        ) LIMIT 1) AS monitor2_serial,
        (SELECT asset_name FROM assets WHERE asset_id IN (
          SELECT asset_id FROM workstation_assets 
          WHERE device_id = fw.device_id AND asset_id IN (
            SELECT asset_id FROM assets WHERE asset_type_id IN (
              SELECT asset_type_id FROM asset_type WHERE asset_type_name = 'Monitor'
            )
          ) AND removed_at IS NULL OFFSET 1 LIMIT 1
        ) LIMIT 1) AS monitor2,
        'Active' AS monitor2_status,
        -- Keyboard
        (SELECT asset_code FROM assets WHERE asset_id IN (
          SELECT asset_id FROM workstation_assets 
          WHERE device_id = fw.device_id AND asset_id IN (
            SELECT asset_id FROM assets WHERE asset_type_id IN (
              SELECT asset_type_id FROM asset_type WHERE asset_type_name = 'Keyboard'
            )
          ) AND removed_at IS NULL
        ) LIMIT 1) AS keyboard_code,
        (SELECT serial_number FROM assets WHERE asset_id IN (
          SELECT asset_id FROM workstation_assets 
          WHERE device_id = fw.device_id AND asset_id IN (
            SELECT asset_id FROM assets WHERE asset_type_id IN (
              SELECT asset_type_id FROM asset_type WHERE asset_type_name = 'Keyboard'
            )
          ) AND removed_at IS NULL
        ) LIMIT 1) AS keyboard_serial,
        (SELECT asset_name FROM assets WHERE asset_id IN (
          SELECT asset_id FROM workstation_assets 
          WHERE device_id = fw.device_id AND asset_id IN (
            SELECT asset_id FROM assets WHERE asset_type_id IN (
              SELECT asset_type_id FROM asset_type WHERE asset_type_name = 'Keyboard'
            )
          ) AND removed_at IS NULL
        ) LIMIT 1) AS keyboard,
        'Active' AS keyboard_status,
        -- Mouse
        (SELECT asset_code FROM assets WHERE asset_id IN (
          SELECT asset_id FROM workstation_assets 
          WHERE device_id = fw.device_id AND asset_id IN (
            SELECT asset_id FROM assets WHERE asset_type_id IN (
              SELECT asset_type_id FROM asset_type WHERE asset_type_name = 'Mouse'
            )
          ) AND removed_at IS NULL
        ) LIMIT 1) AS mouse_code,
        (SELECT serial_number FROM assets WHERE asset_id IN (
          SELECT asset_id FROM workstation_assets 
          WHERE device_id = fw.device_id AND asset_id IN (
            SELECT asset_id FROM assets WHERE asset_type_id IN (
              SELECT asset_type_id FROM asset_type WHERE asset_type_name = 'Mouse'
            )
          ) AND removed_at IS NULL
        ) LIMIT 1) AS mouse_serial,
        (SELECT asset_name FROM assets WHERE asset_id IN (
          SELECT asset_id FROM workstation_assets 
          WHERE device_id = fw.device_id AND asset_id IN (
            SELECT asset_id FROM assets WHERE asset_type_id IN (
              SELECT asset_type_id FROM asset_type WHERE asset_type_name = 'Mouse'
            )
          ) AND removed_at IS NULL
        ) LIMIT 1) AS mouse,
        'Active' AS mouse_status,
        -- Headset
        (SELECT asset_code FROM assets WHERE asset_id IN (
          SELECT asset_id FROM workstation_assets 
          WHERE device_id = fw.device_id AND asset_id IN (
            SELECT asset_id FROM assets WHERE asset_type_id IN (
              SELECT asset_type_id FROM asset_type WHERE asset_type_name = 'Headset'
            )
          ) AND removed_at IS NULL
        ) LIMIT 1) AS headset_code,
        (SELECT serial_number FROM assets WHERE asset_id IN (
          SELECT asset_id FROM workstation_assets 
          WHERE device_id = fw.device_id AND asset_id IN (
            SELECT asset_id FROM assets WHERE asset_type_id IN (
              SELECT asset_type_id FROM asset_type WHERE asset_type_name = 'Headset'
            )
          ) AND removed_at IS NULL
        ) LIMIT 1) AS headset_serial,
        (SELECT asset_name FROM assets WHERE asset_id IN (
          SELECT asset_id FROM workstation_assets 
          WHERE device_id = fw.device_id AND asset_id IN (
            SELECT asset_id FROM assets WHERE asset_type_id IN (
              SELECT asset_type_id FROM asset_type WHERE asset_type_name = 'Headset'
            )
          ) AND removed_at IS NULL
        ) LIMIT 1) AS headset,
        'Active' AS headset_status,
        -- Webcam
        (SELECT asset_code FROM assets WHERE asset_id IN (
          SELECT asset_id FROM workstation_assets 
          WHERE device_id = fw.device_id AND asset_id IN (
            SELECT asset_id FROM assets WHERE asset_type_id IN (
              SELECT asset_type_id FROM asset_type WHERE asset_type_name = 'Webcam'
            )
          ) AND removed_at IS NULL
        ) LIMIT 1) AS webcam_code,
        (SELECT serial_number FROM assets WHERE asset_id IN (
          SELECT asset_id FROM workstation_assets 
          WHERE device_id = fw.device_id AND asset_id IN (
            SELECT asset_id FROM assets WHERE asset_type_id IN (
              SELECT asset_type_id FROM asset_type WHERE asset_type_name = 'Webcam'
            )
          ) AND removed_at IS NULL
        ) LIMIT 1) AS webcam_serial,
        (SELECT asset_name FROM assets WHERE asset_id IN (
          SELECT asset_id FROM workstation_assets 
          WHERE device_id = fw.device_id AND asset_id IN (
            SELECT asset_id FROM assets WHERE asset_type_id IN (
              SELECT asset_type_id FROM asset_type WHERE asset_type_name = 'Webcam'
            )
          ) AND removed_at IS NULL
        ) LIMIT 1) AS webcam,
        'Active' AS webcam_status
      FROM full_workstation fw
      LEFT JOIN device_category dc ON fw.device_category_id = dc.device_category_id
      LEFT JOIN employees e ON fw.employee_id = e.employee_id
      LEFT JOIN teams t ON e.team_id = t.team_id
      LEFT JOIN locations l ON e.location_id = l.location_id
      LEFT JOIN status s ON fw.status_id = s.status_id
      LEFT JOIN warranty_status ws ON fw.warranty_status_id = ws.warranty_status_id
      ORDER BY fw.created_at DESC
    `;

    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error("Database error:", error);
      throw error;
    }
  }
}

export default Dashboard;