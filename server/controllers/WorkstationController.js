import Workstation from "../models/Workstation.js";

// Validates that a route param is a positive integer
const parseId = (value) => {
  const id = parseInt(value, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// GET /workstations - Get all workstations
export const getAllWorkstations = async (req, res) => {
  try {
    const workstations = await Workstation.getAllWorkstations();
    res.status(200).json({ workstations });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Database error" });
  }
};

// GET /workstations/:id - Get a single workstation
export const getWorkstationById = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: "Invalid workstation ID" });
    }

    const workstation = await Workstation.getWorkstationById(id);
    if (!workstation) {
      return res.status(404).json({ error: "Workstation not found" });
    }

    res.status(200).json({ workstation });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Database error" });
  }
};

// POST /workstations - Create a new workstation
export const createWorkstation = async (req, res) => {
  try {
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
    } = req.body;

    // Validate required fields
    if (!device_name) {
      return res.status(400).json({
        error: "Device name is required",
      });
    }

    const newWorkstation = await Workstation.createWorkstation({
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
    });

    res.status(201).json({
      message: "Workstation created successfully",
      workstation: newWorkstation,
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Failed to create workstation" });
  }
};

// PUT /workstations/:id - Update a workstation
export const updateWorkstation = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: "Invalid workstation ID" });
    }

    // Check if workstation exists
    const existing = await Workstation.getWorkstationById(id);
    if (!existing) {
      return res.status(404).json({ error: "Workstation not found" });
    }

    const updatedWorkstation = await Workstation.updateWorkstation(
      id,
      req.body,
    );

    res.status(200).json({
      message: "Workstation updated successfully",
      workstation: updatedWorkstation,
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Failed to update workstation" });
  }
};

// DELETE /workstations/:id - Delete a workstation
export const deleteWorkstation = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: "Invalid workstation ID" });
    }

    // Check if workstation exists
    const existing = await Workstation.getWorkstationById(id);
    if (!existing) {
      return res.status(404).json({ error: "Workstation not found" });
    }

    await Workstation.deleteWorkstation(id);

    res.status(200).json({ message: "Workstation deleted successfully" });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Failed to delete workstation" });
  }
};
