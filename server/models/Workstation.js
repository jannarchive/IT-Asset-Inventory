import pool from "../config/Database.js";

class Workstation {
  static async #resolveForeignKeys({ device_category, device_status }) {
    const [categoryResult, statusResult] = await Promise.all([
      pool.query(
        "SELECT device_category_id FROM device_category WHERE device_category_name = $1",
        [device_category || null]
      ),
      pool.query(
        "SELECT status_id FROM status WHERE status_name = $1",
        [device_status || "Active"]
      ),
    ]);

    return {
      categoryId: categoryResult.rows[0]?.device_category_id ?? null,
      statusId:   statusResult.rows[0]?.status_id             ?? null,
    };
  }

  static async #resolveTeamId(teamName) {
    if (!teamName) return null;
    const result = await pool.query(
      "SELECT team_id FROM teams WHERE team_name = $1",
      [teamName]
    );
    return result.rows[0]?.team_id ?? null;
  }

  static async #resolveLocationId(locationName) {
    if (!locationName) return null;
    const result = await pool.query(
      "SELECT location_id FROM locations WHERE location_name = $1",
      [locationName]
    );
    return result.rows[0]?.location_id ?? null;
  }


  static async #resolveEmployeeId({ assigned_user, employee_number, team, location }, client) {
    if (!assigned_user && !employee_number) return null;

    const db = client ?? pool;

    const teamId     = await Workstation.#resolveTeamId(team);
    const locationId = await Workstation.#resolveLocationId(location);

    const findResult = await db.query(
      `SELECT employee_id FROM employees
       WHERE ($1::text IS NOT NULL AND employee_number = $1)
          OR ($2::text IS NOT NULL AND employee_name   = $2)
       LIMIT 1`,
      [employee_number ?? null, assigned_user ?? null]
    );

    if (findResult.rows.length > 0) {
      const employeeId = findResult.rows[0].employee_id;

      if (teamId !== null || locationId !== null) {
        await db.query(
          `UPDATE employees SET
             team_id     = COALESCE($2, team_id),
             location_id = COALESCE($3, location_id)
           WHERE employee_id = $1`,
          [employeeId, teamId, locationId]
        );
      }

      return employeeId;
    }

    const insertResult = await db.query(
      `INSERT INTO employees (employee_name, employee_number, team_id, location_id)
       VALUES ($1, $2, $3, $4)
       RETURNING employee_id`,
      [assigned_user ?? null, employee_number ?? null, teamId, locationId]
    );

    return insertResult.rows[0].employee_id;
  }

  // GET ALL WORKSTATIONS
  static async getAllWorkstations() {
    const query = `
      SELECT
        fw.device_id,
        fw.device_name,
        fw.model,
        fw.supplier,
        fw.date_assigned,
        fw.notes,
        fw.accountability_form,
        fw.created_at,
        fw.updated_at                         AS last_updated,

        -- Resolved lookup columns
        dc.device_category_name               AS device_category,
        s.status_name                         AS device_status,

        -- Employee / team / location
        e.employee_name                       AS assigned_user,
        e.employee_number,
        t.team_name                           AS team,
        l.location_name                       AS location,

        -- Hardware specs stored on the workstation
        fw.memory,
        fw.motherboard,
        fw.storage,

        -- Processor (asset_role = 'Processor')
        MAX(CASE WHEN wa.asset_role = 'Processor' THEN a.asset_code    END) AS processor_code,
        MAX(CASE WHEN wa.asset_role = 'Processor' THEN a.serial_number END) AS processor_serial,
        MAX(CASE WHEN wa.asset_role = 'Processor' THEN a.asset_name    END) AS processor,
        MAX(CASE WHEN wa.asset_role = 'Processor' THEN ps.status_name  END) AS processor_status,

        -- Monitor 1
        MAX(CASE WHEN wa.asset_role = 'Monitor 1' THEN a.asset_code    END) AS monitor1_code,
        MAX(CASE WHEN wa.asset_role = 'Monitor 1' THEN a.serial_number END) AS monitor1_serial,
        MAX(CASE WHEN wa.asset_role = 'Monitor 1' THEN a.asset_name    END) AS monitor1,
        MAX(CASE WHEN wa.asset_role = 'Monitor 1' THEN ps.status_name  END) AS monitor1_status,

        -- Monitor 2
        MAX(CASE WHEN wa.asset_role = 'Monitor 2' THEN a.asset_code    END) AS monitor2_code,
        MAX(CASE WHEN wa.asset_role = 'Monitor 2' THEN a.serial_number END) AS monitor2_serial,
        MAX(CASE WHEN wa.asset_role = 'Monitor 2' THEN a.asset_name    END) AS monitor2,
        MAX(CASE WHEN wa.asset_role = 'Monitor 2' THEN ps.status_name  END) AS monitor2_status,

        -- Keyboard
        MAX(CASE WHEN wa.asset_role = 'Keyboard'  THEN a.asset_code    END) AS keyboard_code,
        MAX(CASE WHEN wa.asset_role = 'Keyboard'  THEN a.serial_number END) AS keyboard_serial,
        MAX(CASE WHEN wa.asset_role = 'Keyboard'  THEN a.asset_name    END) AS keyboard,
        MAX(CASE WHEN wa.asset_role = 'Keyboard'  THEN ps.status_name  END) AS keyboard_status,

        -- Mouse
        MAX(CASE WHEN wa.asset_role = 'Mouse'     THEN a.asset_code    END) AS mouse_code,
        MAX(CASE WHEN wa.asset_role = 'Mouse'     THEN a.serial_number END) AS mouse_serial,
        MAX(CASE WHEN wa.asset_role = 'Mouse'     THEN a.asset_name    END) AS mouse,
        MAX(CASE WHEN wa.asset_role = 'Mouse'     THEN ps.status_name  END) AS mouse_status,

        -- Headset
        MAX(CASE WHEN wa.asset_role = 'Headset'   THEN a.asset_code    END) AS headset_code,
        MAX(CASE WHEN wa.asset_role = 'Headset'   THEN a.serial_number END) AS headset_serial,
        MAX(CASE WHEN wa.asset_role = 'Headset'   THEN a.asset_name    END) AS headset,
        MAX(CASE WHEN wa.asset_role = 'Headset'   THEN ps.status_name  END) AS headset_status,

        -- Webcam
        MAX(CASE WHEN wa.asset_role = 'Webcam'    THEN a.asset_code    END) AS webcam_code,
        MAX(CASE WHEN wa.asset_role = 'Webcam'    THEN a.serial_number END) AS webcam_serial,
        MAX(CASE WHEN wa.asset_role = 'Webcam'    THEN a.asset_name    END) AS webcam,
        MAX(CASE WHEN wa.asset_role = 'Webcam'    THEN ps.status_name  END) AS webcam_status

      FROM full_workstation fw

        -- Workstation-level FK lookups
        LEFT JOIN device_category dc
          ON fw.device_category_id = dc.device_category_id
        LEFT JOIN status s
          ON fw.status_id = s.status_id

        -- Employee / team / location
        LEFT JOIN employees e
          ON fw.employee_id = e.employee_id
        LEFT JOIN teams t
          ON e.team_id = t.team_id
        LEFT JOIN locations l
          ON e.location_id = l.location_id

        -- Active asset assignments only (removed_at IS NULL)
        LEFT JOIN workstation_assets wa
          ON fw.device_id = wa.device_id
          AND wa.removed_at IS NULL
        LEFT JOIN assets a
          ON wa.asset_id = a.asset_id
        -- Per-asset status (aliased ps to avoid collision with workstation status s)
        LEFT JOIN status ps
          ON a.status_id = ps.status_id

      GROUP BY
        fw.device_id,
        fw.device_name,
        fw.model,
        fw.supplier,
        fw.date_assigned,
        fw.notes,
        fw.accountability_form,
        fw.created_at,
        fw.updated_at,
        fw.memory,
        fw.motherboard,
        fw.storage,
        dc.device_category_name,
        s.status_name,
        e.employee_name,
        e.employee_number,
        t.team_name,
        l.location_name

      ORDER BY fw.device_id;
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  // GET WORKSTATION BY ID
  static async getWorkstationById(deviceId) {
    const query = `
      SELECT
        fw.device_id,
        fw.device_name,
        fw.model,
        fw.supplier,
        fw.date_assigned,
        fw.notes,
        fw.accountability_form,
        fw.created_at,
        fw.updated_at                         AS last_updated,
        fw.memory,
        fw.motherboard,
        fw.storage,

        dc.device_category_name               AS device_category,
        s.status_name                         AS device_status,

        e.employee_name                       AS assigned_user,
        e.employee_number,
        t.team_name                           AS team,
        l.location_name                       AS location,

        MAX(CASE WHEN wa.asset_role = 'Processor' THEN a.asset_code    END) AS processor_code,
        MAX(CASE WHEN wa.asset_role = 'Processor' THEN a.serial_number END) AS processor_serial,
        MAX(CASE WHEN wa.asset_role = 'Processor' THEN a.asset_name    END) AS processor,
        MAX(CASE WHEN wa.asset_role = 'Processor' THEN ps.status_name  END) AS processor_status,

        MAX(CASE WHEN wa.asset_role = 'Monitor 1' THEN a.asset_code    END) AS monitor1_code,
        MAX(CASE WHEN wa.asset_role = 'Monitor 1' THEN a.serial_number END) AS monitor1_serial,
        MAX(CASE WHEN wa.asset_role = 'Monitor 1' THEN a.asset_name    END) AS monitor1,
        MAX(CASE WHEN wa.asset_role = 'Monitor 1' THEN ps.status_name  END) AS monitor1_status,

        MAX(CASE WHEN wa.asset_role = 'Monitor 2' THEN a.asset_code    END) AS monitor2_code,
        MAX(CASE WHEN wa.asset_role = 'Monitor 2' THEN a.serial_number END) AS monitor2_serial,
        MAX(CASE WHEN wa.asset_role = 'Monitor 2' THEN a.asset_name    END) AS monitor2,
        MAX(CASE WHEN wa.asset_role = 'Monitor 2' THEN ps.status_name  END) AS monitor2_status,

        MAX(CASE WHEN wa.asset_role = 'Keyboard'  THEN a.asset_code    END) AS keyboard_code,
        MAX(CASE WHEN wa.asset_role = 'Keyboard'  THEN a.serial_number END) AS keyboard_serial,
        MAX(CASE WHEN wa.asset_role = 'Keyboard'  THEN a.asset_name    END) AS keyboard,
        MAX(CASE WHEN wa.asset_role = 'Keyboard'  THEN ps.status_name  END) AS keyboard_status,

        MAX(CASE WHEN wa.asset_role = 'Mouse'     THEN a.asset_code    END) AS mouse_code,
        MAX(CASE WHEN wa.asset_role = 'Mouse'     THEN a.serial_number END) AS mouse_serial,
        MAX(CASE WHEN wa.asset_role = 'Mouse'     THEN a.asset_name    END) AS mouse,
        MAX(CASE WHEN wa.asset_role = 'Mouse'     THEN ps.status_name  END) AS mouse_status,

        MAX(CASE WHEN wa.asset_role = 'Headset'   THEN a.asset_code    END) AS headset_code,
        MAX(CASE WHEN wa.asset_role = 'Headset'   THEN a.serial_number END) AS headset_serial,
        MAX(CASE WHEN wa.asset_role = 'Headset'   THEN a.asset_name    END) AS headset,
        MAX(CASE WHEN wa.asset_role = 'Headset'   THEN ps.status_name  END) AS headset_status,

        MAX(CASE WHEN wa.asset_role = 'Webcam'    THEN a.asset_code    END) AS webcam_code,
        MAX(CASE WHEN wa.asset_role = 'Webcam'    THEN a.serial_number END) AS webcam_serial,
        MAX(CASE WHEN wa.asset_role = 'Webcam'    THEN a.asset_name    END) AS webcam,
        MAX(CASE WHEN wa.asset_role = 'Webcam'    THEN ps.status_name  END) AS webcam_status

      FROM full_workstation fw
        LEFT JOIN device_category dc
          ON fw.device_category_id = dc.device_category_id
        LEFT JOIN status s
          ON fw.status_id = s.status_id
        LEFT JOIN employees e
          ON fw.employee_id = e.employee_id
        LEFT JOIN teams t
          ON e.team_id = t.team_id
        LEFT JOIN locations l
          ON e.location_id = l.location_id
        LEFT JOIN workstation_assets wa
          ON fw.device_id = wa.device_id
          AND wa.removed_at IS NULL
        LEFT JOIN assets a
          ON wa.asset_id = a.asset_id
        LEFT JOIN status ps
          ON a.status_id = ps.status_id

      WHERE fw.device_id = $1

      GROUP BY
        fw.device_id, fw.device_name, fw.model, fw.supplier, fw.date_assigned,
        fw.notes, fw.accountability_form, fw.created_at, fw.updated_at,
        fw.memory, fw.motherboard, fw.storage,
        dc.device_category_name, s.status_name,
        e.employee_name, e.employee_number, t.team_name, l.location_name;
    `;

    const result = await pool.query(query, [deviceId]);
    return result.rows[0] ?? null;
  }

  // CREATE WORKSTATION
  static async createWorkstation(data) {
    const {
      device_category,
      device_name,
      model,
      assigned_user,
      employee_number,
      team,
      location,
      date_assigned,
      device_status,
      supplier,
      notes,
      accountability_form,
      memory,
      motherboard,
      storage,
      assets = [],
    } = data;

    const { categoryId, statusId } =
      await Workstation.#resolveForeignKeys({ device_category, device_status });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const employeeId = await Workstation.#resolveEmployeeId(
        { assigned_user, employee_number, team, location },
        client
      );

      const insertWs = `
        INSERT INTO full_workstation (
          device_category_id,
          device_name,
          model,
          employee_id,
          status_id,
          date_assigned,
          supplier,
          notes,
          accountability_form,
          memory,
          motherboard,
          storage,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, NOW(), NOW()
        )
        RETURNING device_id
      `;

      const wsResult = await client.query(insertWs, [
        categoryId,
        device_name         ?? null,
        model               ?? null,
        employeeId,
        statusId,
        date_assigned       ?? null,
        supplier            ?? null,
        notes               ?? null,
        accountability_form ?? null,
        memory              ?? null,
        motherboard         ?? null,
        storage             ?? null,
      ]);

      const deviceId = wsResult.rows[0].device_id;

      if (assets.length > 0) {
        const insertWa = `
          INSERT INTO workstation_assets (device_id, asset_id, asset_role, assigned_at)
          VALUES ($1, $2, $3, NOW())
        `;
        for (const { asset_id, asset_role } of assets) {
          await client.query(insertWa, [deviceId, asset_id, asset_role]);
        }
      }

      await client.query("COMMIT");

      return await Workstation.getWorkstationById(deviceId);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  // UPDATE WORKSTATION
  static async updateWorkstation(deviceId, data) {
    const {
      device_category,
      device_name,
      model,
      assigned_user,
      employee_number,
      team,
      location,
      date_assigned,
      device_status,
      supplier,
      notes,
      accountability_form,
      memory,
      motherboard,
      storage,
    } = data;

    const { categoryId, statusId } =
      await Workstation.#resolveForeignKeys({ device_category, device_status });

    const employeeId = await Workstation.#resolveEmployeeId(
      { assigned_user, employee_number, team, location }
    );

    const updateQuery = `
      UPDATE full_workstation SET
        device_category_id  = COALESCE($2,  device_category_id),
        device_name         = COALESCE($3,  device_name),
        model               = COALESCE($4,  model),
        employee_id         = COALESCE($5,  employee_id),
        status_id           = COALESCE($6,  status_id),
        date_assigned       = COALESCE($7,  date_assigned),
        supplier            = COALESCE($8,  supplier),
        notes               = COALESCE($9,  notes),
        accountability_form = COALESCE($10, accountability_form),
        memory              = COALESCE($11, memory),
        motherboard         = COALESCE($12, motherboard),
        storage             = COALESCE($13, storage),
        updated_at          = NOW()
      WHERE device_id = $1
    `;

    await pool.query(updateQuery, [
      deviceId,
      categoryId,
      device_name         ?? null,
      model               ?? null,
      employeeId,
      statusId,
      date_assigned       ?? null,
      supplier            ?? null,
      notes               ?? null,
      accountability_form ?? null,
      memory              ?? null,
      motherboard         ?? null,
      storage             ?? null,
    ]);

    return await Workstation.getWorkstationById(deviceId);
  }

  // DELETE WORKSTATION
  static async deleteWorkstation(deviceId) {
    await pool.query(
      "DELETE FROM full_workstation WHERE device_id = $1",
      [deviceId]
    );
  }

  static async getWorkstationAssets(deviceId) {
    const query = `
      SELECT
        wa.workstation_asset_id,
        wa.asset_id,
        wa.asset_role,
        wa.assigned_at,
        a.asset_code,
        a.serial_number,
        a.asset_name,
        a.warranty_expiry_date,
        at.asset_type_name,
        at.asset_type_id,
        s.status_name  AS status,
        ws.warranty_status_name AS warranty_status
      FROM workstation_assets wa
      JOIN assets a           ON wa.asset_id       = a.asset_id
      JOIN asset_type at      ON a.asset_type_id   = at.asset_type_id
      LEFT JOIN status s      ON a.status_id       = s.status_id
      LEFT JOIN warranty_status ws ON a.warranty_status_id = ws.warranty_status_id
      WHERE wa.device_id   = $1
        AND wa.removed_at IS NULL
      ORDER BY wa.workstation_asset_id ASC
    `;
    const result = await pool.query(query, [deviceId]);
    return result.rows;
  }

  // UPDATE WORKSTATION WITH ASSETS  (full edit-dialog save)
  // Updates full_workstation and every updated assets row in one transaction.

  static async updateWorkstationWithAssets(deviceId, data) {
    const {
      device_category,
      device_name,
      model,
      assigned_user,
      employee_number,
      date_assigned,
      device_status,
      supplier,
      notes,
      accountability_form,
      memory,
      motherboard,
      storage,
      assets = [],
    } = data;

    const { categoryId, statusId, warrantyStatusId } =
      await Workstation.#resolveForeignKeys({ device_category, device_status });

    const employeeId = await Workstation.#resolveEmployeeId({ assigned_user, employee_number });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `UPDATE full_workstation SET
          device_category_id   = COALESCE($2,  device_category_id),
          device_name          = COALESCE($3,  device_name),
          model                = COALESCE($4,  model),
          employee_id          = COALESCE($5,  employee_id),
          status_id            = COALESCE($6,  status_id),
          date_assigned        = COALESCE($7,  date_assigned),
          supplier             = COALESCE($8, supplier),
          notes                = COALESCE($9, notes),
          accountability_form  = COALESCE($10, accountability_form),
          memory               = COALESCE($11, memory),
          motherboard          = COALESCE($12, motherboard),
          storage              = COALESCE($13, storage),
          updated_at           = NOW()
        WHERE device_id = $1`,
        [
          deviceId,
          categoryId,
          device_name          ?? null,
          model                ?? null,
          employeeId,
          statusId,
          date_assigned        ?? null,
          supplier             ?? null,
          notes                ?? null,
          accountability_form  ?? null,
          memory               ?? null,
          motherboard          ?? null,
          storage              ?? null,
        ]
      );

      for (const asset of assets) {
        const {
          asset_id,
          asset_name,
          serial_number,
          status,
        } = asset;
        if (!asset_id) continue;

        const assetStatusRes = await client.query(
          "SELECT status_id FROM status WHERE status_name = $1",
          [status || "Active"]
        );
        const assetStatusId = assetStatusRes.rows[0]?.status_id ?? null;

        await client.query(
          `UPDATE assets SET
            asset_name           = COALESCE($2, asset_name),
            serial_number        = COALESCE($3, serial_number),
            status_id            = COALESCE($4, status_id),
            updated_at           = NOW()
          WHERE asset_id = $1`,
          [
            asset_id,
            asset_name          ?? null,
            serial_number       ?? null,
            assetStatusId,
          ]
        );
      }

      await client.query("COMMIT");
      return await Workstation.getWorkstationById(deviceId);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}

export default Workstation;