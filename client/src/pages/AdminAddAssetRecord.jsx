import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Alert } from "@mui/material";
import BackIcon from "@mui/icons-material/ArrowBackRounded";

import NavigationBar from "../components/NavigationBar.jsx";
import Sidebar from "../components/Sidebar.jsx";
import api from "../api.js";
import { formatDateTime } from "../utils/DateUtil.jsx";
import "../styles/AdminAddAssetRecord.css";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INITIAL_WORKSTATION = {
  // → full_workstation: employee_id (resolved server-side from these two)
  assigned_user: "",
  employee_number: "",
  // → employees: team_id (resolved server-side)
  team: "",
  // → employees: location_id (resolved server-side)
  location: "",
  // → full_workstation: device_category_id (resolved server-side)
  device_category: "",
  // → full_workstation: device_name
  device_name: "",
  // → full_workstation: model
  model: "",
  // → full_workstation: status_id (resolved server-side)
  device_status: "Active",
  // → full_workstation: supplier
  supplier: "",
  // → full_workstation: date_assigned
  date_assigned: "",
  // → full_workstation: notes
  notes: "",
  // → full_workstation: accountability_form (stored as BYTEA; handled separately)
  accountability_form: "",
  // → full_workstation: memory / motherboard / storage
  memory: "",
  motherboard: "",
  storage: "",
};

// Each peripheral maps to one row in `assets` + one row in `workstation_assets`
const INITIAL_PERIPHERAL = (role) => ({
  // asset_role → workstation_assets.asset_role
  asset_role: role,
  // asset_type_id → assets.asset_type_id  (resolved server-side from asset_type_name)
  asset_type_name: role,
  // asset_code → assets.asset_code  (generated server-side)
  asset_code: "",
  // serial_number → assets.serial_number
  serial_number: "",
  // asset_name → assets.asset_name
  asset_name: "",
  // status_id → assets.status_id  (resolved server-side)
  status: "Active",
  // warranty_status_id → assets.warranty_status_id  (resolved server-side)
  warranty_status: "Valid",
  // warranty_expiry_date → assets.warranty_expiry_date
  warranty_expiry_date: "",
});

// Standard peripheral roles — always present (processor lives in hardware tab)
const STANDARD_PERIPHERAL_ROLES = [
  "Monitor 1",
  "Monitor 2",
  "Keyboard",
  "Mouse",
  "Headset",
  "Webcam",
];

const ROLE_TO_ASSET_TYPE_NAME = {
  "Processor": "Processor (CPU)",
  "Monitor 1": "Monitor",
  "Monitor 2": "Monitor",
  "Keyboard": "Keyboard",
  "Mouse": "Mouse",
  "Headset": "Headset",
  "Webcam": "Webcam",
};


const INITIAL_STANDARD_PERIPHERALS = () =>
  Object.fromEntries(
    STANDARD_PERIPHERAL_ROLES.map((role) => [role, INITIAL_PERIPHERAL(role)])
  );


// PeripheralCard — defined OUTSIDE the component so its identity is stable
// across re-renders. Defining it inside would cause React to treat it as a
// brand-new component type on every state change, unmounting and remounting
// the card (and losing input focus) after each keystroke.
// ---------------------------------------------------------------------------

// ── Reusable peripheral card ───────────────────────────────────────────────

const PeripheralCard = ({ title, data, onChange }) => (
  <div className="Peripheral-card">
    <div className="Peripheral-card-header">
      <h4 className="Peripheral-card-title">{title}</h4>
    </div>
    <div className="Peripheral-card-body">
      <div className="Peripheral-meta-row">
        <span className="Peripheral-meta-label">Asset Code:</span>
        <span className="Peripheral-meta-value" style={{ fontSize: "13px" }}>
          {data.asset_code || "Will be assigned on submit"}
        </span>
      </div>

      <div className="Peripheral-meta-row">
        <span className="Peripheral-meta-label">Serial Number:</span>
        <input
          type="text"
          value={data.serial_number}
          onChange={(e) => onChange("serial_number", e.target.value)}
          placeholder="Serial Number"
          className="Form-input"
          style={{ fontSize: "13px" }}
        />
      </div>

      <div className="Peripheral-meta-row">
        <span className="Peripheral-meta-label">Name:</span>
        <input
          type="text"
          value={data.asset_name}
          onChange={(e) => onChange("asset_name", e.target.value)}
          placeholder="Name"
          className="Form-input"
          style={{ fontSize: "13px" }}
        />
      </div>

      <div className="Field-group">
        <label className="Form-label" style={{ fontSize: "13px" }}>
          Status
        </label>
        <select
          value={data.status}
          onChange={(e) => onChange("status", e.target.value)}
          className="Form-select"
          style={{ fontSize: "13px" }}
        >
          <option>Active</option>
          <option>In Storage</option>
          <option>Defective</option>
          <option>Out for Repair</option>
          <option>Retired</option>
        </select>
      </div>

      <div className="Field-group">
        <label className="Form-label" style={{ fontSize: "13px" }}>
          Warranty Status
        </label>
        <div className="Form-radio-group">
          <label className="Form-radio-item">
            <input
              type="radio"
              name={`warranty_status_${title}`}
              value="Valid"
              checked={data.warranty_status === "Valid"}
              onChange={(e) => onChange("warranty_status", e.target.value)}
            />
            Valid
          </label>
          <label className="Form-radio-item">
            <input
              type="radio"
              name={`warranty_status_${title}`}
              value="Expired"
              checked={data.warranty_status === "Expired"}
              onChange={(e) => onChange("warranty_status", e.target.value)}
            />
            Expired
          </label>
        </div>
      </div>

      <div className="Field-group">
        <label className="Form-label" style={{ fontSize: "13px" }}>
          Warranty Expiry Date
        </label>
        <input
          type="date"
          value={data.warranty_expiry_date}
          onChange={(e) => onChange("warranty_expiry_date", e.target.value)}
          className="Form-date"
        />
      </div>
    </div>
  </div>
);



// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function AdminAddAssetRecord() {
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────────

  const [activeTab, setActiveTab] = useState("basic");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // full_workstation fields
  const [workstation, setWorkstation] = useState(INITIAL_WORKSTATION);

  // Processor asset — one row in `assets`, one row in `workstation_assets`
  // asset_role = "Processor"
  const [processor, setProcessor] = useState(INITIAL_PERIPHERAL("Processor"));

  // Standard peripherals: { "Monitor 1": {...}, "Monitor 2": {...}, ... }
  const [peripherals, setPeripherals] = useState(INITIAL_STANDARD_PERIPHERALS());

  // Dynamic "other" peripherals — each maps to one `assets` row
  const [otherPeripherals, setOtherPeripherals] = useState([]);

  // Asset types for the "other peripheral" type dropdown
  const [assetTypes, setAssetTypes] = useState([]);

  // ── Fetch asset types on mount ─────────────────────────────────────────────

  useEffect(() => {
    const fetchAssetTypes = async () => {
      try {
        const res = await api.get("/api/assets/asset-types");
        setAssetTypes(res.data.asset_types || []);
      } catch (err) {
        console.error("Failed to load asset types:", err);
      }
    };
    fetchAssetTypes();
  }, []);

  // ── Generic change handlers ────────────────────────────────────────────────

  const handleWorkstationChange = (e) => {
    const { name, value } = e.target;
    setWorkstation((prev) => ({ ...prev, [name]: value }));
  };

  const handleProcessorChange = (e) => {
    const { name, value } = e.target;
    setProcessor((prev) => ({ ...prev, [name]: value }));
  };

  const handlePeripheralChange = (role, field, value) => {
    setPeripherals((prev) => ({
      ...prev,
      [role]: { ...prev[role], [field]: value },
    }));
  };

  // ── Other peripherals ──────────────────────────────────────────────────────

  const handleAddOtherPeripheral = () => {
    setOtherPeripherals((prev) => [
      ...prev,
      {
        id: Date.now(),            
        asset_role: "",
        asset_type_id: "",         
        asset_type_name: "",
        asset_code: "",
        serial_number: "",
        asset_name: "",
        status: "Active",
        warranty_status: "Valid",
        warranty_expiry_date: "",
        generatingCode: false,
      },
    ]);
  };

  const handleOtherPeripheralChange = (id, field, value) => {
    setOtherPeripherals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  // Called on blur/Enter of the type input — resolves asset type only
  const handleOtherPeripheralTypeBlur = async (id, typeName) => {
    if (!typeName?.trim()) {
      setOtherPeripherals((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, asset_type_name: "", asset_type_id: "", asset_code: "", asset_role: "", generatingCode: false }
            : p
        )
      );
      return;
    }

    setOtherPeripherals((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, asset_code: "", generatingCode: true } : p
      )
    );

    try {
      const response = await api.post("/api/assets/get-or-create-type", {
        assetTypeName: typeName.trim(),
      });
      const { asset_type_id, asset_type_name } = response.data;

      setOtherPeripherals((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
              ...p,
              asset_type_id,
              asset_type_name,
              asset_role: asset_type_name,
              asset_code: "",
              generatingCode: false,
            }
            : p
        )
      );
    } catch (err) {
      console.error("Failed to create/get asset type:", err);
      setOtherPeripherals((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, asset_code: "", generatingCode: false } : p
        )
      );
    }
  };

  const handleRemoveOtherPeripheral = (id) => {
    setOtherPeripherals((prev) => prev.filter((p) => p.id !== id));
  };

  const hasPeripheralInput = (peripheral) => {
    return (
      (peripheral.serial_number && peripheral.serial_number.trim() !== "") ||
      (peripheral.asset_name && peripheral.asset_name.trim() !== "") ||
      (peripheral.warranty_expiry_date && peripheral.warranty_expiry_date.trim() !== "")
    );
  };

  // ── Clear form ─────────────────────────────────────────────────────────────

  const handleClearForm = () => {
    if (
      window.confirm("Are you sure you want to clear the form? This action cannot be undone.")
    ) {
      setWorkstation(INITIAL_WORKSTATION);
      setProcessor(INITIAL_PERIPHERAL("Processor"));
      setPeripherals(INITIAL_STANDARD_PERIPHERALS());
      setOtherPeripherals([]);
      setError("");
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmitRecord = async () => {
    setLoading(true);
    setError("");

    try {
      // ── 1. Validate ────────────────────────────────────────────────────────
      const requiredFields = [
        { value: workstation.device_category, label: "Device Category" },
        { value: workstation.device_status, label: "Device Status" },
      ];
      const missing = requiredFields.filter((f) => !f.value).map((f) => f.label);
      if (missing.length > 0) {
        setError(`Please fill in all required field/s: ${missing.join(", ")}`);
        setLoading(false);
        return;
      }

      // ── 2. Build asset list ────────────────────────────────────────────────
      // Only create assets for workstation devices when the user typed data.
      const isWorkstation = workstation.device_category === "Workstation";
      const assetPayload = [];

      if (isWorkstation) {
        if (hasPeripheralInput(processor)) {
          assetPayload.push({
            asset_role: "Processor",
            asset_type_name: ROLE_TO_ASSET_TYPE_NAME["Processor"],
            serial_number: processor.serial_number || null,
            asset_name: processor.asset_name || null,
            status: processor.status,
            warranty_status: processor.warranty_status || null,
            warranty_expiry_date: processor.warranty_expiry_date || null,
          });
        }

        STANDARD_PERIPHERAL_ROLES.forEach((role) => {
          const p = peripherals[role];
          if (hasPeripheralInput(p)) {
            assetPayload.push({
              asset_role: role,
              // Use the canonical type name, not the role string, so
              // "Monitor 1" and "Monitor 2" both resolve to the existing
              // "Monitor" asset type without triggering a duplicate code error.
              asset_type_name: ROLE_TO_ASSET_TYPE_NAME[role] ?? role,
              serial_number: p.serial_number || null,
              asset_name: p.asset_name || null,
              status: p.status,
              warranty_status: p.warranty_status || null,
              warranty_expiry_date: p.warranty_expiry_date || null,
            });
          }
        });

        otherPeripherals.forEach((p) => {
          if (p.asset_type_name && p.asset_type_name.trim() !== "") {
            assetPayload.push({
              asset_role: p.asset_role || p.asset_type_name,
              asset_type_id: p.asset_type_id || null,
              asset_type_name: p.asset_type_name,
              asset_code: p.asset_code || null,
              serial_number: p.serial_number || null,
              asset_name: p.asset_name || null,
              status: p.status,
              warranty_status: p.warranty_status || null,
              warranty_expiry_date: p.warranty_expiry_date || null,
            });
          }
        });
      }

      // ── 3. POST /api/assets ────────────────────────────────────────────────
      // Creates asset rows only if there are any valid inputs and only for workstations.
      let createdAssets = [];
      if (assetPayload.length > 0) {
        try {
          const assetsRes = await api.post("/api/assets", { assets: assetPayload });
          createdAssets = assetsRes.data.assets || [];
        } catch (err) {
          console.error("Error creating assets:", err);
          setError(
            err.response?.data?.error ||
            "Failed to create asset records. Please try again."
          );
          setLoading(false);
          return;
        }
      }

      // ── 4. POST /api/workstations ──────────────────────────────────────────
      const workstationPayload = {
        // Employee / assignment info (server resolves employee_id)
        assigned_user: workstation.assigned_user || null,
        employee_number: workstation.employee_number || null,
        team: workstation.team || null,
        location: workstation.location || null,
        date_assigned: workstation.date_assigned || null,

        // full_workstation columns
        device_category: workstation.device_category,
        device_name: workstation.device_name,
        model: workstation.model || null,
        device_status: workstation.device_status,
        supplier: workstation.supplier || null,
        notes: workstation.notes || null,
        accountability_form: workstation.accountability_form || null,

        // Hardware specs
        memory: workstation.memory || null,
        motherboard: workstation.motherboard || null,
        storage: workstation.storage || null,

        // Asset list — backend inserts workstation_assets rows from this.
        // For non-Workstation categories, this list remains empty.
        assets: createdAssets.map(({ asset_id, asset_role }) => ({
          asset_id,
          asset_role,
        })),
      };

      const workstationRes = await api.post("/api/workstations", workstationPayload);

      if (workstationRes.status === 201 || workstationRes.status === 200) {
        navigate("/admin/assets", { replace: true });
      }
    } catch (err) {
      console.error("Error submitting record:", err);
      setError(
        err.response?.data?.error ||
        "Failed to create workstation record. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (
      window.confirm("Are you sure you want to go back to the Asset Management page? Any unsaved data will be lost.")
    ) {
      navigate("/admin/assets");
    }
  };

  // ── Tab renderers ──────────────────────────────────────────────────────────

  const renderBasicInfoTab = () => (
    <div className="Tab-panel">
      <div className="Basic-info-grid">
        {/* Employee Information */}
        <div className="Employee-info-fields">
          <h3 className="Basic-info-section-title">Employee Information</h3>

          <div className="Field-group">
            <label className="Form-label">Assigned User</label>
            <input
              type="text"
              name="assigned_user"
              value={workstation.assigned_user}
              onChange={handleWorkstationChange}
              placeholder="e.g., Anna Cruz"
              className="Form-input"
            />
          </div>

          <div className="Field-group">
            <label className="Form-label">Employee Number</label>
            <input
              type="text"
              name="employee_number"
              value={workstation.employee_number}
              onChange={handleWorkstationChange}
              placeholder="e.g., LBPO-00000"
              className="Form-input"
            />
          </div>

          <div className="Field-group">
            <label className="Form-label">Team</label>
            <select
              name="team"
              value={workstation.team}
              onChange={handleWorkstationChange}
              className="Form-select"
            >
              <option value="">Select Team</option>
              <option value="Operations and Management">Operations and Management</option>
              <option value="EAS">EAS</option>
              <option value="AWX">AWX</option>
              <option value="TRIBE">TRIBE</option>
              <option value="PEOPLE IN">PEOPLE IN</option>
              <option value="RWM">RWM</option>
              <option value="FFMM">FFMM</option>
              <option value="IRONMERGE">IRONMERGE</option>
              <option value="KMG">KMG</option>
              <option value="MMFS">MMFS</option>
              <option value="EVOLVE">EVOLVE</option>
              <option value="LSA">LSA</option>
            </select>
          </div>

          <div className="Field-group">
            <label className="Form-label">Location</label>
            <select
              name="location"
              value={workstation.location}
              onChange={handleWorkstationChange}
              className="Form-select"
            >
              <option value="">Select Location</option>
              <option value="Admin/OPS">Admin/OPS</option>
              <option value="WFH">WFH</option>
              <option value="Discovery (LINKEDBPO)">Discovery (LINKEDBPO)</option>
              <option value="Discovery (ITBPO)">Discovery (ITBPO)</option>
            </select>
          </div>

          <div className="Field-group">
            <label className="Form-label">Date Assigned</label>
            <input
              type="date"
              name="date_assigned"
              value={workstation.date_assigned}
              onChange={handleWorkstationChange}
              className="Form-date"
            />
          </div>
        </div>

        {/* Device Information */}
        <div className="Device-info-fields">
          <h3 className="Basic-info-section-title">Device Information</h3>

          <div className="Device-top-row">
            <div className="Field-group">
              <label className="Form-label Form-label--required">Device Category</label>
              <select
                name="device_category"
                value={workstation.device_category}
                onChange={handleWorkstationChange}
                className="Form-select"
              >
                <option value="">Select Device Category</option>
                <option value="Workstation">Workstation</option>
                <option value="Laptop">Laptop</option>
                <option value="Mobile Phone">Mobile Phone</option>
                <option value="Printer">Printer</option>
                <option value="Network Equipment">Network Equipment</option>
              </select>
            </div>

            <div className="Field-group">
              <label className="Form-label">Device Name</label>
              <input
                type="text"
                name="device_name"
                value={workstation.device_name}
                onChange={handleWorkstationChange}
                placeholder="e.g., Desktop Workstation"
                className="Form-input"
              />
            </div>

            <div className="Field-group">
              <label className="Form-label Form-label--required">Device Status</label>
              <select
                name="device_status"
                value={workstation.device_status}
                onChange={handleWorkstationChange}
                className="Form-select"
              >
                <option>Active</option>
                <option>In Storage</option>
                <option>Defective</option>
                <option>Out for Repair</option>
                <option>Retired</option>
              </select>
            </div>
          </div>

          <div className="Field-group">
            <label className="Form-label">Model</label>
            <input
              type="text"
              name="model"
              value={workstation.model}
              onChange={handleWorkstationChange}
              placeholder="e.g., Dell XPS 15"
              className="Form-input"
            />
          </div>

          <div className="Device-supplier-row">
            <div className="Field-group">
              <label className="Form-label">Supplier</label>
              <input
                type="text"
                name="supplier"
                value={workstation.supplier}
                onChange={handleWorkstationChange}
                placeholder="e.g., Dell Inc."
                className="Form-input"
              />
            </div>
          </div>

          <div className="Field-group">
            <label className="Form-label">Notes</label>
            <textarea
              name="notes"
              value={workstation.notes}
              onChange={handleWorkstationChange}
              placeholder="Additional notes..."
              className="Form-text-area"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderHardwareTab = () => (
    <div className="Tab-panel">
      <div className="Hardware-meta-row">
        <div className="Hardware-meta-item">
          <div className="Hardware-meta-label">Device ID</div>
          <div className="Hardware-meta-value">Will be assigned on submit</div>
        </div>
      </div>

      <div className="Hardware-fields-grid">
        {/* Processor asset code */}
        <div className="Field-group">
          <div className="Hardware-meta-label">Processor Asset Code</div>
          <div className="Hardware-meta-value">
            {processor.asset_code || "Will be assigned on submit"}
          </div>
        </div>

        <div className="Field-group">
          <label className="Form-label">Processor Serial Number</label>
          <input
            type="text"
            name="serial_number"
            value={processor.serial_number}
            onChange={handleProcessorChange}
            placeholder="Serial number"
            className="Form-input"
          />
        </div>

        <div className="Field-group">
          <label className="Form-label">Processor</label>
          <input
            type="text"
            name="asset_name"
            value={processor.asset_name}
            onChange={handleProcessorChange}
            placeholder="e.g., Intel Core i5 13th Gen"
            className="Form-input"
          />
        </div>

        <div className="Field-group">
          <label className="Form-label">Memory</label>
          <input
            type="text"
            name="memory"
            value={workstation.memory}
            onChange={handleWorkstationChange}
            placeholder="e.g., 16GB DDR4"
            className="Form-input"
          />
        </div>

        <div className="Field-group">
          <label className="Form-label">Motherboard</label>
          <input
            type="text"
            name="motherboard"
            value={workstation.motherboard}
            onChange={handleWorkstationChange}
            placeholder="e.g., Dell Motherboard X"
            className="Form-input"
          />
        </div>

        <div className="Field-group">
          <label className="Form-label">Storage</label>
          <input
            type="text"
            name="storage"
            value={workstation.storage}
            onChange={handleWorkstationChange}
            placeholder="e.g., 512GB SSD"
            className="Form-input"
          />
        </div>

        {/* Processor warranty */}
        <div className="Field-group">
          <label className="Form-label">Processor Warranty Status</label>
          <select
            name="warranty_status"
            value={processor.warranty_status}
            onChange={handleProcessorChange}
            className="Form-select"
          >
            <option>Valid</option>
            <option>Expired</option>
          </select>
        </div>

        <div className="Field-group">
          <label className="Form-label">Processor Warranty Expiry Date</label>
          <input
            type="date"
            name="warranty_expiry_date"
            value={processor.warranty_expiry_date}
            onChange={handleProcessorChange}
            className="Form-date"
          />
        </div>
      </div>
    </div>
  );

  const renderPeripheralTab = () => (
    <div className="Tab-panel">
      {/* Standard Peripherals */}
      <div className="Peripheral-cards-grid">
        {STANDARD_PERIPHERAL_ROLES.map((role) => (
          <PeripheralCard
            key={role}
            title={role}
            data={peripherals[role]}
            onChange={(field, value) => handlePeripheralChange(role, field, value)}
          />
        ))}
      </div>

      {/* Other Peripherals */}
      <div className="Other-peripherals-section">
        <div className="Other-peripherals-header">
          <h1 className="Other-peripherals-title">Other Peripherals</h1>
          <button
            type="button"
            className="Btn-add-peripheral"
            onClick={handleAddOtherPeripheral}
          >
            Add Peripheral
          </button>
        </div>

        <div className="Other-peripheral-cards-grid">
          {otherPeripherals.map((peripheral) => (
            <div key={peripheral.id} className="Peripheral-card">
              <div className="Peripheral-card-body">
                {/* Type input — blurring triggers get-or-create*/}
                <div className="Field-group">
                  <label className="Form-label" style={{ fontSize: "13px" }}>
                    Asset/Peripheral Type
                  </label>
                  <input
                    type="text"
                    value={peripheral.asset_type_name}
                    onChange={(e) =>
                      handleOtherPeripheralChange(
                        peripheral.id,
                        "asset_type_name",
                        e.target.value
                      )
                    }
                    onBlur={() =>
                      handleOtherPeripheralTypeBlur(
                        peripheral.id,
                        peripheral.asset_type_name
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        handleOtherPeripheralTypeBlur(
                          peripheral.id,
                          peripheral.asset_type_name
                        );
                    }}
                    placeholder="Enter asset/peripheral type"
                    className="Form-input"
                    style={{ fontSize: "13px" }}
                    disabled={!!peripheral.asset_code && !peripheral.generatingCode}
                  />
                </div>

                <div className="Peripheral-meta-row">
                  <span className="Peripheral-meta-label">Asset Code:</span>
                  <span
                    className="Peripheral-meta-value"
                    style={{ fontSize: "13px" }}
                  >
                    {peripheral.generatingCode
                      ? "Generating..."
                      : peripheral.asset_code ||
                      "Will be assigned on submit"}
                  </span>
                </div>

                <div className="Peripheral-meta-row">
                  <span className="Peripheral-meta-label">Serial Number:</span>
                  <input
                    type="text"
                    value={peripheral.serial_number}
                    onChange={(e) =>
                      handleOtherPeripheralChange(
                        peripheral.id,
                        "serial_number",
                        e.target.value
                      )
                    }
                    placeholder="Serial Number"
                    className="Form-input"
                    style={{ fontSize: "13px" }}
                  />
                </div>

                <div className="Peripheral-meta-row">
                  <span className="Peripheral-meta-label">Name:</span>
                  <input
                    type="text"
                    value={peripheral.asset_name}
                    onChange={(e) =>
                      handleOtherPeripheralChange(
                        peripheral.id,
                        "asset_name",
                        e.target.value
                      )
                    }
                    placeholder="Name"
                    className="Form-input"
                    style={{ fontSize: "13px" }}
                  />
                </div>

                <div className="Field-group">
                  <label className="Form-label" style={{ fontSize: "13px" }}>
                    Status
                  </label>
                  <select
                    value={peripheral.status}
                    onChange={(e) =>
                      handleOtherPeripheralChange(
                        peripheral.id,
                        "status",
                        e.target.value
                      )
                    }
                    className="Form-select"
                    style={{ fontSize: "13px" }}
                  >
                    <option>Active</option>
                    <option>In Storage</option>
                    <option>Defective</option>
                    <option>Out for Repair</option>
                    <option>Retired</option>
                  </select>
                </div>

                <div className="Field-group">
                  <label className="Form-label" style={{ fontSize: "13px" }}>
                    Warranty Status
                  </label>
                  <div className="Form-radio-group">
                    <label className="Form-radio-item">
                      <input
                        type="radio"
                        name={`other_warranty_${peripheral.id}`}
                        value="Valid"
                        checked={peripheral.warranty_status === "Valid"}
                        onChange={(e) =>
                          handleOtherPeripheralChange(
                            peripheral.id,
                            "warranty_status",
                            e.target.value
                          )
                        }
                      />
                      Valid
                    </label>
                    <label className="Form-radio-item">
                      <input
                        type="radio"
                        name={`other_warranty_${peripheral.id}`}
                        value="Expired"
                        checked={peripheral.warranty_status === "Expired"}
                        onChange={(e) =>
                          handleOtherPeripheralChange(
                            peripheral.id,
                            "warranty_status",
                            e.target.value
                          )
                        }
                      />
                      Expired
                    </label>
                  </div>
                </div>

                <div className="Field-group">
                  <label className="Form-label" style={{ fontSize: "13px" }}>
                    Warranty Expiry Date
                  </label>
                  <input
                    type="date"
                    value={peripheral.warranty_expiry_date}
                    onChange={(e) =>
                      handleOtherPeripheralChange(
                        peripheral.id,
                        "warranty_expiry_date",
                        e.target.value
                      )
                    }
                    className="Form-date"
                  />
                </div>

                <button
                  type="button"
                  className="Btn-remove-peripheral"
                  onClick={() => handleRemoveOtherPeripheral(peripheral.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAccountabilityTab = () => (
    <div className="Tab-panel">
      <div className="Accountability-panel">
        <div className="Field-group">
          <label className="Form-label">Accountability Form</label>
          <input
            type="text"
            name="accountability_form"
            value={workstation.accountability_form}
            onChange={handleWorkstationChange}
            placeholder="Form reference or URL"
            className="Form-input"
          />
        </div>

        <div className="Field-group">
          <label className="Form-label">Notes</label>
          <textarea
            name="notes"
            value={workstation.notes}
            onChange={handleWorkstationChange}
            placeholder="Additional notes..."
            className="Form-text-area"
          />
        </div>

        <div className="Accountability-actions">
          <button
            type="submit"
            className="Btn-submit-record"
            onClick={handleSubmitRecord}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="New-asset-record">
      <NavigationBar />

      <div className="Main-content">
        <div className="Sidebar-placeholder">
          <Sidebar />
        </div>

        <div className="content">
          {/* Header */}
          <div className="New-asset-record-header">
            <div className="New-asset-record-title-group">
              <BackIcon
                className="Btn-back"
                style={{ fontSize: 60 }}
                onClick={handleBack}
              />
              <div className="New-asset-record-title-text">
                <h1>New Asset Record</h1>
                <p className="New-asset-record-timestamp">
                  Created on {formatDateTime(new Date())}
                </p>
              </div>
            </div>

            <div className="New-asset-record-actions">
              <button
                className="Btn-clear-form"
                onClick={handleClearForm}
                disabled={loading}
              >
                Clear Form
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <Alert severity="error" onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {/* Tabs */}
          <div className="New-asset-tabs">
            {[
              { key: "basic", label: "Basic Information" },
              { key: "hardware", label: "Hardware Specifications" },
              { key: "peripheral", label: "Peripheral Information" },
              { key: "accountability", label: "Accountability Form" },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`New-asset-tab${activeTab === key ? " New-asset-tab--active" : ""}`}
                onClick={() => setActiveTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "basic" && renderBasicInfoTab()}
          {activeTab === "hardware" && renderHardwareTab()}
          {activeTab === "peripheral" && renderPeripheralTab()}
          {activeTab === "accountability" && renderAccountabilityTab()}
        </div>
      </div>
    </div>
  );
}

export default AdminAddAssetRecord;