import pool from "../config/Database.js";

class Workstation {
  /**
   * Get all workstations with complete details
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
        fw.created_at,
        fw.updated_at AS last_updated,
        dc.device_category_name AS device_category,
        s.status_name AS device_status,
        ws.warranty_status_name AS warranty_status,
        fw.warranty_expiry_date,
        e.employee_name AS assigned_user,
        e.employee_number,
        t.team_name AS team,
        l.location_name AS location,
        fw.processor_code,
        fw.processor_serial,
        fw.processor,
        fw.memory,
        fw.motherboard,
        fw.storage,
        fw.monitor1_code,
        fw.monitor1_serial,
        fw.monitor1,
        fw.monitor1_status,
        fw.monitor2_code,
        fw.monitor2_serial,
        fw.monitor2,
        fw.monitor2_status,
        fw.keyboard_code,
        fw.keyboard_serial,
        fw.keyboard,
        fw.keyboard_status,
        fw.mouse_code,
        fw.mouse_serial,
        fw.mouse,
        fw.mouse_status,
        fw.headset_code,
        fw.headset_serial,
        fw.headset,
        fw.headset_status,
        fw.webcam_code,
        fw.webcam_serial,
        fw.webcam,
        fw.webcam_status
      FROM full_workstation fw
      LEFT JOIN device_category dc ON fw.device_category_id = dc.device_category_id
      LEFT JOIN status s ON fw.device_status_id = s.status_id
      LEFT JOIN warranty_status ws ON fw.warranty_status_id = ws.warranty_status_id
      LEFT JOIN employee e ON fw.employee_id = e.employee_id
      LEFT JOIN team t ON fw.team_id = t.team_id
      LEFT JOIN location l ON fw.location_id = l.location_id
      ORDER BY fw.device_id DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Get a single workstation by device_id
   */
  static async getWorkstationById(deviceId) {
    const query = `
      SELECT
        fw.device_id,
        fw.device_name,
        fw.model,
        fw.supplier,
        fw.notes,
        fw.accountability_form,
        fw.date_assigned,
        fw.created_at,
        fw.updated_at AS last_updated,
        dc.device_category_name AS device_category,
        s.status_name AS device_status,
        ws.warranty_status_name AS warranty_status,
        fw.warranty_expiry_date,
        e.employee_name AS assigned_user,
        e.employee_number,
        t.team_name AS team,
        l.location_name AS location,
        fw.processor_code,
        fw.processor_serial,
        fw.processor,
        fw.memory,
        fw.motherboard,
        fw.storage,
        fw.monitor1_code,
        fw.monitor1_serial,
        fw.monitor1,
        fw.monitor1_status,
        fw.monitor2_code,
        fw.monitor2_serial,
        fw.monitor2,
        fw.monitor2_status,
        fw.keyboard_code,
        fw.keyboard_serial,
        fw.keyboard,
        fw.keyboard_status,
        fw.mouse_code,
        fw.mouse_serial,
        fw.mouse,
        fw.mouse_status,
        fw.headset_code,
        fw.headset_serial,
        fw.headset,
        fw.headset_status,
        fw.webcam_code,
        fw.webcam_serial,
        fw.webcam,
        fw.webcam_status
      FROM full_workstation fw
      LEFT JOIN device_category dc ON fw.device_category_id = dc.device_category_id
      LEFT JOIN status s ON fw.device_status_id = s.status_id
      LEFT JOIN warranty_status ws ON fw.warranty_status_id = ws.warranty_status_id
      LEFT JOIN employee e ON fw.employee_id = e.employee_id
      LEFT JOIN team t ON fw.team_id = t.team_id
      LEFT JOIN location l ON fw.location_id = l.location_id
      WHERE fw.device_id = $1
    `;

    const result = await pool.query(query, [deviceId]);
    return result.rows[0] || null;
  }

  /**
   * Create a new workstation
   */
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
      warranty_status,
      warranty_expiry_date,
      supplier,
      processor_code,
      processor_serial,
      processor,
      memory,
      motherboard,
      storage,
      monitor1_code,
      monitor1_serial,
      monitor1,
      monitor1_status,
      monitor2_code,
      monitor2_serial,
      monitor2,
      monitor2_status,
      keyboard_code,
      keyboard_serial,
      keyboard,
      keyboard_status,
      mouse_code,
      mouse_serial,
      mouse,
      mouse_status,
      headset_code,
      headset_serial,
      headset,
      headset_status,
      webcam_code,
      webcam_serial,
      webcam,
      webcam_status,
      accountability_form,
      notes,
    } = data;

    // Get IDs for foreign keys (with fallback to NULL if not found)
    const [
      categoryResult,
      statusResult,
      warrantyStatusResult,
      employeeResult,
      teamResult,
      locationResult,
    ] = await Promise.all([
      pool.query(
        "SELECT device_category_id FROM device_category WHERE device_category_name = $1",
        [device_category || "Laptop"],
      ),
      pool.query("SELECT status_id FROM status WHERE status_name = $1", [
        device_status || "Active",
      ]),
      pool.query(
        "SELECT warranty_status_id FROM warranty_status WHERE warranty_status_name = $1",
        [warranty_status || "Active"],
      ),
      pool.query(
        "SELECT employee_id FROM employee WHERE employee_name = $1 OR employee_number = $2",
        [assigned_user || null, employee_number || null],
      ),
      pool.query("SELECT team_id FROM team WHERE team_name = $1", [
        team || null,
      ]),
      pool.query("SELECT location_id FROM location WHERE location_name = $1", [
        location || null,
      ]),
    ]);

    const categoryId = categoryResult.rows[0]?.device_category_id || null;
    const statusId = statusResult.rows[0]?.status_id || null;
    const warrantyStatusId =
      warrantyStatusResult.rows[0]?.warranty_status_id || null;
    const employeeId = employeeResult.rows[0]?.employee_id || null;
    const teamId = teamResult.rows[0]?.team_id || null;
    const locationId = locationResult.rows[0]?.location_id || null;

    const insertQuery = `
      INSERT INTO full_workstation (
        device_name,
        device_category_id,
        device_status_id,
        warranty_status_id,
        warranty_expiry_date,
        employee_id,
        team_id,
        location_id,
        date_assigned,
        model,
        supplier,
        processor_code,
        processor_serial,
        processor,
        memory,
        motherboard,
        storage,
        monitor1_code,
        monitor1_serial,
        monitor1,
        monitor1_status,
        monitor2_code,
        monitor2_serial,
        monitor2,
        monitor2_status,
        keyboard_code,
        keyboard_serial,
        keyboard,
        keyboard_status,
        mouse_code,
        mouse_serial,
        mouse,
        mouse_status,
        headset_code,
        headset_serial,
        headset,
        headset_status,
        webcam_code,
        webcam_serial,
        webcam,
        webcam_status,
        accountability_form,
        notes,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
        $41, $42, $43, $44, NOW(), NOW()
      )
      RETURNING device_id
    `;

    const result = await pool.query(insertQuery, [
      device_name,
      categoryId,
      statusId,
      warrantyStatusId,
      warranty_expiry_date || null,
      employeeId,
      teamId,
      locationId,
      date_assigned || null,
      model || null,
      supplier || null,
      processor_code || null,
      processor_serial || null,
      processor || null,
      memory || null,
      motherboard || null,
      storage || null,
      monitor1_code || null,
      monitor1_serial || null,
      monitor1 || null,
      monitor1_status || "Active",
      monitor2_code || null,
      monitor2_serial || null,
      monitor2 || null,
      monitor2_status || "Active",
      keyboard_code || null,
      keyboard_serial || null,
      keyboard || null,
      keyboard_status || "Active",
      mouse_code || null,
      mouse_serial || null,
      mouse || null,
      mouse_status || "Active",
      headset_code || null,
      headset_serial || null,
      headset || null,
      headset_status || "Active",
      webcam_code || null,
      webcam_serial || null,
      webcam || null,
      webcam_status || "Active",
      accountability_form || null,
      notes || null,
    ]);

    const deviceId = result.rows[0].device_id;
    return await this.getWorkstationById(deviceId);
  }

  /**
   * Update a workstation
   */
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
      warranty_status,
      warranty_expiry_date,
      supplier,
      processor_code,
      processor_serial,
      processor,
      memory,
      motherboard,
      storage,
      monitor1_code,
      monitor1_serial,
      monitor1,
      monitor1_status,
      monitor2_code,
      monitor2_serial,
      monitor2,
      monitor2_status,
      keyboard_code,
      keyboard_serial,
      keyboard,
      keyboard_status,
      mouse_code,
      mouse_serial,
      mouse,
      mouse_status,
      headset_code,
      headset_serial,
      headset,
      headset_status,
      webcam_code,
      webcam_serial,
      webcam,
      webcam_status,
      accountability_form,
      notes,
    } = data;

    // Get IDs for foreign keys
    const [
      categoryResult,
      statusResult,
      warrantyStatusResult,
      employeeResult,
      teamResult,
      locationResult,
    ] = await Promise.all([
      pool.query(
        "SELECT device_category_id FROM device_category WHERE device_category_name = $1",
        [device_category],
      ),
      pool.query("SELECT status_id FROM status WHERE status_name = $1", [
        device_status,
      ]),
      pool.query(
        "SELECT warranty_status_id FROM warranty_status WHERE warranty_status_name = $1",
        [warranty_status],
      ),
      pool.query(
        "SELECT employee_id FROM employee WHERE employee_name = $1 OR employee_number = $2",
        [assigned_user, employee_number],
      ),
      pool.query("SELECT team_id FROM team WHERE team_name = $1", [team]),
      pool.query("SELECT location_id FROM location WHERE location_name = $1", [
        location,
      ]),
    ]);

    const categoryId = categoryResult.rows[0]?.device_category_id;
    const statusId = statusResult.rows[0]?.status_id;
    const warrantyStatusId = warrantyStatusResult.rows[0]?.warranty_status_id;
    const employeeId = employeeResult.rows[0]?.employee_id;
    const teamId = teamResult.rows[0]?.team_id;
    const locationId = locationResult.rows[0]?.location_id;

    const updateQuery = `
      UPDATE full_workstation
      SET
        device_name = COALESCE($2, device_name),
        device_category_id = COALESCE($3, device_category_id),
        device_status_id = COALESCE($4, device_status_id),
        warranty_status_id = COALESCE($5, warranty_status_id),
        warranty_expiry_date = COALESCE($6, warranty_expiry_date),
        employee_id = COALESCE($7, employee_id),
        team_id = COALESCE($8, team_id),
        location_id = COALESCE($9, location_id),
        date_assigned = COALESCE($10, date_assigned),
        model = COALESCE($11, model),
        supplier = COALESCE($12, supplier),
        processor_code = COALESCE($13, processor_code),
        processor_serial = COALESCE($14, processor_serial),
        processor = COALESCE($15, processor),
        memory = COALESCE($16, memory),
        motherboard = COALESCE($17, motherboard),
        storage = COALESCE($18, storage),
        monitor1_code = COALESCE($19, monitor1_code),
        monitor1_serial = COALESCE($20, monitor1_serial),
        monitor1 = COALESCE($21, monitor1),
        monitor1_status = COALESCE($22, monitor1_status),
        monitor2_code = COALESCE($23, monitor2_code),
        monitor2_serial = COALESCE($24, monitor2_serial),
        monitor2 = COALESCE($25, monitor2),
        monitor2_status = COALESCE($26, monitor2_status),
        keyboard_code = COALESCE($27, keyboard_code),
        keyboard_serial = COALESCE($28, keyboard_serial),
        keyboard = COALESCE($29, keyboard),
        keyboard_status = COALESCE($30, keyboard_status),
        mouse_code = COALESCE($31, mouse_code),
        mouse_serial = COALESCE($32, mouse_serial),
        mouse = COALESCE($33, mouse),
        mouse_status = COALESCE($34, mouse_status),
        headset_code = COALESCE($35, headset_code),
        headset_serial = COALESCE($36, headset_serial),
        headset = COALESCE($37, headset),
        headset_status = COALESCE($38, headset_status),
        webcam_code = COALESCE($39, webcam_code),
        webcam_serial = COALESCE($40, webcam_serial),
        webcam = COALESCE($41, webcam),
        webcam_status = COALESCE($42, webcam_status),
        accountability_form = COALESCE($43, accountability_form),
        notes = COALESCE($44, notes),
        updated_at = NOW()
      WHERE device_id = $1
    `;

    await pool.query(updateQuery, [
      deviceId,
      device_name,
      categoryId,
      statusId,
      warrantyStatusId,
      warranty_expiry_date,
      employeeId,
      teamId,
      locationId,
      date_assigned,
      model,
      supplier,
      processor_code,
      processor_serial,
      processor,
      memory,
      motherboard,
      storage,
      monitor1_code,
      monitor1_serial,
      monitor1,
      monitor1_status,
      monitor2_code,
      monitor2_serial,
      monitor2,
      monitor2_status,
      keyboard_code,
      keyboard_serial,
      keyboard,
      keyboard_status,
      mouse_code,
      mouse_serial,
      mouse,
      mouse_status,
      headset_code,
      headset_serial,
      headset,
      headset_status,
      webcam_code,
      webcam_serial,
      webcam,
      webcam_status,
      accountability_form,
      notes,
    ]);

    return await this.getWorkstationById(deviceId);
  }

  /**
   * Delete a workstation
   */
  static async deleteWorkstation(deviceId) {
    const deleteQuery = "DELETE FROM full_workstation WHERE device_id = $1";
    await pool.query(deleteQuery, [deviceId]);
  }
}

export default Workstation;
