import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Alert } from "@mui/material";
import NavigationBar from "../components/NavigationBar.jsx";
import Sidebar from "../components/Sidebar.jsx";
import api from "../api.js";
import { formatDateTime } from "../utils/DateUtil.jsx";

import "../styles/AdminAddAssetRecord.css";

function AdminAddAssetRecord() {
  const navigate = useNavigate();

  // ---------------------------------------------------------------------------
  // State Management
  // ---------------------------------------------------------------------------

  const [activeTab, setActiveTab] = useState("basic");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otherPeripherals, setOtherPeripherals] = useState([]);

  // Form data state
  const [formData, setFormData] = useState({
    // Basic Information
    assigned_user: "",
    employee_number: "",
    team: "",
    device_category: "",
    device_name: "",
    model: "",
    device_status: "Active",
    supplier: "",

    // Hardware Specifications
    processor_code: "",
    processor_serial: "",
    processor: "",
    memory: "",
    motherboard: "",
    storage: "",

    // Peripheral Information
    monitor1_code: "",
    monitor1_serial: "",
    monitor1: "",
    monitor1_status: "Active",
    monitor2_code: "",
    monitor2_serial: "",
    monitor2: "",
    monitor2_status: "Active",
    keyboard_code: "",
    keyboard_serial: "",
    keyboard: "",
    keyboard_status: "Active",
    mouse_code: "",
    mouse_serial: "",
    mouse: "",
    mouse_status: "Active",
    headset_code: "",
    headset_serial: "",
    headset: "",
    headset_status: "Active",
    webcam_code: "",
    webcam_serial: "",
    webcam: "",
    webcam_status: "Active",

    // Accountability & Notes
    accountability_form: "",
    notes: "",
    warranty_status: "Active",
    warranty_expiry_date: "",
    date_assigned: "",
    location: "",
  });

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddOtherPeripheral = () => {
    setOtherPeripherals((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: "",
        code: "",
        serial: "",
        name: "",
        status: "Active",
      },
    ]);
  };

  const handleUpdateOtherPeripheral = (id, field, value) => {
    setOtherPeripherals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  };

  const handleRemoveOtherPeripheral = (id) => {
    setOtherPeripherals((prev) => prev.filter((p) => p.id !== id));
  };

  const handleClearForm = () => {
    if (
      window.confirm(
        "Are you sure you want to clear the form? This action cannot be undone.",
      )
    ) {
      setFormData({
        assigned_user: "",
        employee_number: "",
        team: "",
        device_category: "",
        device_name: "",
        model: "",
        device_status: "Active",
        supplier: "",
        processor_code: "",
        processor_serial: "",
        processor: "",
        memory: "",
        motherboard: "",
        storage: "",
        monitor1_code: "",
        monitor1_serial: "",
        monitor1: "",
        monitor1_status: "Active",
        monitor2_code: "",
        monitor2_serial: "",
        monitor2: "",
        monitor2_status: "Active",
        keyboard_code: "",
        keyboard_serial: "",
        keyboard: "",
        keyboard_status: "Active",
        mouse_code: "",
        mouse_serial: "",
        mouse: "",
        mouse_status: "Active",
        headset_code: "",
        headset_serial: "",
        headset: "",
        headset_status: "Active",
        webcam_code: "",
        webcam_serial: "",
        webcam: "",
        webcam_status: "Active",
        accountability_form: "",
        notes: "",
        warranty_status: "Active",
        warranty_expiry_date: "",
        date_assigned: "",
        location: "",
      });
      setOtherPeripherals([]);
      setError("");
    }
  };

  const handleSubmitRecord = async () => {
    setLoading(true);
    setError("");

    try {
      // Validate required fields
      if (!formData.device_name || !formData.assigned_user) {
        setError("Device Name and Assigned User are required fields");
        setLoading(false);
        return;
      }

      // Prepare payload
      const payload = {
        ...formData,
        otherPeripherals,
      };

      // Submit to API
      const response = await api.post("/api/workstations", payload);

      if (response.status === 201 || response.status === 200) {
        // Navigate back to assets overview
        navigate("/admin/assets", { replace: true });
      }
    } catch (err) {
      console.error("Error creating workstation:", err);
      setError(
        err.response?.data?.error ||
          "Failed to create workstation. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (
      window.confirm(
        "Are you sure you want to go back? Any unsaved data will be lost.",
      )
    ) {
      navigate("/admin/assets");
    }
  };

  // ---------------------------------------------------------------------------
  // Render Tab Content
  // ---------------------------------------------------------------------------

  const renderBasicInfoTab = () => (
    <div className="Tab-panel">
      <div className="Basic-info-grid">
        {/* Employee Information Column */}
        <div className="Employee-info-fields">
          <h3 className="Basic-info-section-title">Employee Information</h3>

          <div className="Field-group">
            <label className="Form-label Form-label--required">
              Assigned User
            </label>
            <input
              type="text"
              name="assigned_user"
              value={formData.assigned_user}
              onChange={handleInputChange}
              placeholder="e.g., John Doe"
              className="Form-input"
            />
          </div>

          <div className="Field-group">
            <label className="Form-label">Employee Number</label>
            <input
              type="text"
              name="employee_number"
              value={formData.employee_number}
              onChange={handleInputChange}
              placeholder="e.g., EMP001"
              className="Form-input"
            />
          </div>

          <div className="Field-group">
            <label className="Form-label">Team</label>
            <input
              type="text"
              name="team"
              value={formData.team}
              onChange={handleInputChange}
              placeholder="e.g., IT Department"
              className="Form-input"
            />
          </div>

          <div className="Field-group">
            <label className="Form-label">Date Assigned</label>
            <input
              type="date"
              name="date_assigned"
              value={formData.date_assigned}
              onChange={handleInputChange}
              className="Form-date"
            />
          </div>
        </div>

        {/* Device Information Column */}
        <div className="Device-info-fields">
          <h3 className="Basic-info-section-title">Device Information</h3>

          <div className="Device-top-row">
            <div className="Field-group">
              <label className="Form-label Form-label--required">
                Device Category
              </label>
              <input
                type="text"
                name="device_category"
                value={formData.device_category}
                onChange={handleInputChange}
                placeholder="e.g., Laptop"
                className="Form-input"
              />
            </div>

            <div className="Field-group">
              <label className="Form-label Form-label--required">
                Device Name
              </label>
              <input
                type="text"
                name="device_name"
                value={formData.device_name}
                onChange={handleInputChange}
                placeholder="e.g., Workstation-01"
                className="Form-input"
              />
            </div>

            <div className="Field-group">
              <label className="Form-label">Device Status</label>
              <select
                name="device_status"
                value={formData.device_status}
                onChange={handleInputChange}
                className="Form-select"
              >
                <option>Active</option>
                <option>Inactive</option>
                <option>Maintenance</option>
                <option>Retired</option>
              </select>
            </div>
          </div>

          <div className="Field-group">
            <label className="Form-label">Model</label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleInputChange}
              placeholder="e.g., Dell XPS 15"
              className="Form-input"
            />
          </div>

          <div className="Field-group">
            <label className="Form-label">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="e.g., Office - Building A"
              className="Form-input"
            />
          </div>

          <div className="Device-supplier-row">
            <div className="Field-group">
              <label className="Form-label">Supplier</label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleInputChange}
                placeholder="e.g., Dell Inc."
                className="Form-input"
              />
            </div>
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
          <div className="Hardware-meta-value">Auto-generated on save</div>
        </div>
      </div>

      <div className="Hardware-fields-grid">
        <div className="Hardware-model-field">
          <div className="Field-group">
            <label className="Form-label">Model</label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleInputChange}
              placeholder="e.g., Dell XPS 15"
              className="Form-input"
            />
          </div>
        </div>

        <div className="Field-group">
          <label className="Form-label">Processor Code</label>
          <input
            type="text"
            name="processor_code"
            value={formData.processor_code}
            onChange={handleInputChange}
            placeholder="e.g., PROC-001"
            className="Form-input"
          />
        </div>

        <div className="Field-group">
          <label className="Form-label">Processor Serial</label>
          <input
            type="text"
            name="processor_serial"
            value={formData.processor_serial}
            onChange={handleInputChange}
            placeholder="Serial number"
            className="Form-input"
          />
        </div>

        <div className="Field-group">
          <label className="Form-label">Processor</label>
          <input
            type="text"
            name="processor"
            value={formData.processor}
            onChange={handleInputChange}
            placeholder="e.g., Intel Core i7"
            className="Form-input"
          />
        </div>

        <div className="Field-group">
          <label className="Form-label">Memory</label>
          <input
            type="text"
            name="memory"
            value={formData.memory}
            onChange={handleInputChange}
            placeholder="e.g., 16GB DDR4"
            className="Form-input"
          />
        </div>

        <div className="Field-group">
          <label className="Form-label">Motherboard</label>
          <input
            type="text"
            name="motherboard"
            value={formData.motherboard}
            onChange={handleInputChange}
            placeholder="e.g., Dell Motherboard X"
            className="Form-input"
          />
        </div>

        <div className="Field-group">
          <label className="Form-label">Storage</label>
          <input
            type="text"
            name="storage"
            value={formData.storage}
            onChange={handleInputChange}
            placeholder="e.g., 512GB SSD"
            className="Form-input"
          />
        </div>

        <div className="Field-group">
          <label className="Form-label">Warranty Status</label>
          <select
            name="warranty_status"
            value={formData.warranty_status}
            onChange={handleInputChange}
            className="Form-select"
          >
            <option>Active</option>
            <option>Expired</option>
            <option>N/A</option>
          </select>
        </div>

        <div className="Field-group">
          <label className="Form-label">Warranty Expiry Date</label>
          <input
            type="date"
            name="warranty_expiry_date"
            value={formData.warranty_expiry_date}
            onChange={handleInputChange}
            className="Form-date"
          />
        </div>
      </div>
    </div>
  );

  const renderPeripheralTab = () => (
    <div className="Tab-panel">
      {/* Standard Peripherals Grid */}
      <div className="Peripheral-cards-grid">
        {/* Monitor 1 */}
        <div className="Peripheral-card">
          <div className="Peripheral-card-header">
            <h4 className="Peripheral-card-title">Monitor 1</h4>
          </div>
          <div className="Peripheral-card-body">
            <div className="Peripheral-meta-row">
              <span className="Peripheral-meta-label">Code:</span>
              <input
                type="text"
                name="monitor1_code"
                value={formData.monitor1_code}
                onChange={handleInputChange}
                placeholder="Code"
                className="Form-input"
                style={{ fontSize: "12px" }}
              />
            </div>
            <div className="Peripheral-meta-row">
              <span className="Peripheral-meta-label">Serial:</span>
              <input
                type="text"
                name="monitor1_serial"
                value={formData.monitor1_serial}
                onChange={handleInputChange}
                placeholder="Serial"
                className="Form-input"
                style={{ fontSize: "12px" }}
              />
            </div>
            <div className="Peripheral-meta-row">
              <span className="Peripheral-meta-label">Model:</span>
              <input
                type="text"
                name="monitor1"
                value={formData.monitor1}
                onChange={handleInputChange}
                placeholder="Model"
                className="Form-input"
                style={{ fontSize: "12px" }}
              />
            </div>
            <div className="Field-group">
              <label className="Form-label" style={{ fontSize: "12px" }}>
                Status
              </label>
              <select
                name="monitor1_status"
                value={formData.monitor1_status}
                onChange={handleInputChange}
                className="Form-select"
                style={{ fontSize: "12px" }}
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Monitor 2 */}
        <div className="Peripheral-card">
          <div className="Peripheral-card-header">
            <h4 className="Peripheral-card-title">Monitor 2</h4>
          </div>
          <div className="Peripheral-card-body">
            <div className="Peripheral-meta-row">
              <span className="Peripheral-meta-label">Code:</span>
              <input
                type="text"
                name="monitor2_code"
                value={formData.monitor2_code}
                onChange={handleInputChange}
                placeholder="Code"
                className="Form-input"
                style={{ fontSize: "12px" }}
              />
            </div>
            <div className="Peripheral-meta-row">
              <span className="Peripheral-meta-label">Serial:</span>
              <input
                type="text"
                name="monitor2_serial"
                value={formData.monitor2_serial}
                onChange={handleInputChange}
                placeholder="Serial"
                className="Form-input"
                style={{ fontSize: "12px" }}
              />
            </div>
            <div className="Peripheral-meta-row">
              <span className="Peripheral-meta-label">Model:</span>
              <input
                type="text"
                name="monitor2"
                value={formData.monitor2}
                onChange={handleInputChange}
                placeholder="Model"
                className="Form-input"
                style={{ fontSize: "12px" }}
              />
            </div>
            <div className="Field-group">
              <label className="Form-label" style={{ fontSize: "12px" }}>
                Status
              </label>
              <select
                name="monitor2_status"
                value={formData.monitor2_status}
                onChange={handleInputChange}
                className="Form-select"
                style={{ fontSize: "12px" }}
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Keyboard */}
        <div className="Peripheral-card">
          <div className="Peripheral-card-header">
            <h4 className="Peripheral-card-title">Keyboard</h4>
          </div>
          <div className="Peripheral-card-body">
            <div className="Peripheral-meta-row">
              <span className="Peripheral-meta-label">Code:</span>
              <input
                type="text"
                name="keyboard_code"
                value={formData.keyboard_code}
                onChange={handleInputChange}
                placeholder="Code"
                className="Form-input"
                style={{ fontSize: "12px" }}
              />
            </div>
            <div className="Peripheral-meta-row">
              <span className="Peripheral-meta-label">Serial:</span>
              <input
                type="text"
                name="keyboard_serial"
                value={formData.keyboard_serial}
                onChange={handleInputChange}
                placeholder="Serial"
                className="Form-input"
                style={{ fontSize: "12px" }}
              />
            </div>
            <div className="Peripheral-meta-row">
              <span className="Peripheral-meta-label">Model:</span>
              <input
                type="text"
                name="keyboard"
                value={formData.keyboard}
                onChange={handleInputChange}
                placeholder="Model"
                className="Form-input"
                style={{ fontSize: "12px" }}
              />
            </div>
            <div className="Field-group">
              <label className="Form-label" style={{ fontSize: "12px" }}>
                Status
              </label>
              <select
                name="keyboard_status"
                value={formData.keyboard_status}
                onChange={handleInputChange}
                className="Form-select"
                style={{ fontSize: "12px" }}
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mouse */}
        <div className="Peripheral-card">
          <div className="Peripheral-card-header">
            <h4 className="Peripheral-card-title">Mouse</h4>
          </div>
          <div className="Peripheral-card-body">
            <div className="Peripheral-meta-row">
              <span className="Peripheral-meta-label">Code:</span>
              <input
                type="text"
                name="mouse_code"
                value={formData.mouse_code}
                onChange={handleInputChange}
                placeholder="Code"
                className="Form-input"
                style={{ fontSize: "12px" }}
              />
            </div>
            <div className="Peripheral-meta-row">
              <span className="Peripheral-meta-label">Serial:</span>
              <input
                type="text"
                name="mouse_serial"
                value={formData.mouse_serial}
                onChange={handleInputChange}
                placeholder="Serial"
                className="Form-input"
                style={{ fontSize: "12px" }}
              />
            </div>
            <div className="Peripheral-meta-row">
              <span className="Peripheral-meta-label">Model:</span>
              <input
                type="text"
                name="mouse"
                value={formData.mouse}
                onChange={handleInputChange}
                placeholder="Model"
                className="Form-input"
                style={{ fontSize: "12px" }}
              />
            </div>
            <div className="Field-group">
              <label className="Form-label" style={{ fontSize: "12px" }}>
                Status
              </label>
              <select
                name="mouse_status"
                value={formData.mouse_status}
                onChange={handleInputChange}
                className="Form-select"
                style={{ fontSize: "12px" }}
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Headset */}
        <div className="Peripheral-card">
          <div className="Peripheral-card-header">
            <h4 className="Peripheral-card-title">Headset</h4>
          </div>
          <div className="Peripheral-card-body">
            <div className="Peripheral-meta-row">
              <span className="Peripheral-meta-label">Code:</span>
              <input
                type="text"
                name="headset_code"
                value={formData.headset_code}
                onChange={handleInputChange}
                placeholder="Code"
                className="Form-input"
                style={{ fontSize: "12px" }}
              />
            </div>
            <div className="Peripheral-meta-row">
              <span className="Peripheral-meta-label">Serial:</span>
              <input
                type="text"
                name="headset_serial"
                value={formData.headset_serial}
                onChange={handleInputChange}
                placeholder="Serial"
                className="Form-input"
                style={{ fontSize: "12px" }}
              />
            </div>
            <div className="Peripheral-meta-row">
              <span className="Peripheral-meta-label">Model:</span>
              <input
                type="text"
                name="headset"
                value={formData.headset}
                onChange={handleInputChange}
                placeholder="Model"
                className="Form-input"
                style={{ fontSize: "12px" }}
              />
            </div>
            <div className="Field-group">
              <label className="Form-label" style={{ fontSize: "12px" }}>
                Status
              </label>
              <select
                name="headset_status"
                value={formData.headset_status}
                onChange={handleInputChange}
                className="Form-select"
                style={{ fontSize: "12px" }}
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Webcam */}
        <div className="Peripheral-card">
          <div className="Peripheral-card-header">
            <h4 className="Peripheral-card-title">Webcam</h4>
          </div>
          <div className="Peripheral-card-body">
            <div className="Peripheral-meta-row">
              <span className="Peripheral-meta-label">Code:</span>
              <input
                type="text"
                name="webcam_code"
                value={formData.webcam_code}
                onChange={handleInputChange}
                placeholder="Code"
                className="Form-input"
                style={{ fontSize: "12px" }}
              />
            </div>
            <div className="Peripheral-meta-row">
              <span className="Peripheral-meta-label">Serial:</span>
              <input
                type="text"
                name="webcam_serial"
                value={formData.webcam_serial}
                onChange={handleInputChange}
                placeholder="Serial"
                className="Form-input"
                style={{ fontSize: "12px" }}
              />
            </div>
            <div className="Peripheral-meta-row">
              <span className="Peripheral-meta-label">Model:</span>
              <input
                type="text"
                name="webcam"
                value={formData.webcam}
                onChange={handleInputChange}
                placeholder="Model"
                className="Form-input"
                style={{ fontSize: "12px" }}
              />
            </div>
            <div className="Field-group">
              <label className="Form-label" style={{ fontSize: "12px" }}>
                Status
              </label>
              <select
                name="webcam_status"
                value={formData.webcam_status}
                onChange={handleInputChange}
                className="Form-select"
                style={{ fontSize: "12px" }}
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Other Peripherals Section */}
      <div className="Other-peripherals-section">
        <div className="Other-peripherals-header">
          <h3 className="Other-peripherals-title">Other Peripherals</h3>
          <button
            type="button"
            className="Btn-add-peripheral"
            onClick={handleAddOtherPeripheral}
          >
            + Add Peripheral
          </button>
        </div>

        <div className="Other-peripheral-cards-grid">
          {otherPeripherals.map((peripheral) => (
            <div key={peripheral.id} className="Peripheral-card">
              <div className="Peripheral-card-body">
                <div className="Field-group">
                  <label className="Form-label" style={{ fontSize: "12px" }}>
                    Peripheral Type
                  </label>
                  <input
                    type="text"
                    value={peripheral.type}
                    onChange={(e) =>
                      handleUpdateOtherPeripheral(
                        peripheral.id,
                        "type",
                        e.target.value,
                      )
                    }
                    placeholder="e.g., Speaker"
                    className="Form-input"
                    style={{ fontSize: "12px" }}
                  />
                </div>

                <div className="Peripheral-meta-row">
                  <span className="Peripheral-meta-label">Code:</span>
                  <input
                    type="text"
                    value={peripheral.code}
                    onChange={(e) =>
                      handleUpdateOtherPeripheral(
                        peripheral.id,
                        "code",
                        e.target.value,
                      )
                    }
                    placeholder="Code"
                    className="Form-input"
                    style={{ fontSize: "12px" }}
                  />
                </div>

                <div className="Peripheral-meta-row">
                  <span className="Peripheral-meta-label">Serial:</span>
                  <input
                    type="text"
                    value={peripheral.serial}
                    onChange={(e) =>
                      handleUpdateOtherPeripheral(
                        peripheral.id,
                        "serial",
                        e.target.value,
                      )
                    }
                    placeholder="Serial"
                    className="Form-input"
                    style={{ fontSize: "12px" }}
                  />
                </div>

                <div className="Peripheral-meta-row">
                  <span className="Peripheral-meta-label">Model:</span>
                  <input
                    type="text"
                    value={peripheral.name}
                    onChange={(e) =>
                      handleUpdateOtherPeripheral(
                        peripheral.id,
                        "name",
                        e.target.value,
                      )
                    }
                    placeholder="Model"
                    className="Form-input"
                    style={{ fontSize: "12px" }}
                  />
                </div>

                <div className="Field-group">
                  <label className="Form-label" style={{ fontSize: "12px" }}>
                    Status
                  </label>
                  <select
                    value={peripheral.status}
                    onChange={(e) =>
                      handleUpdateOtherPeripheral(
                        peripheral.id,
                        "status",
                        e.target.value,
                      )
                    }
                    className="Form-select"
                    style={{ fontSize: "12px" }}
                  >
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
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
            value={formData.accountability_form}
            onChange={handleInputChange}
            placeholder="Form reference or URL"
            className="Form-input"
          />
        </div>

        <div className="Field-group">
          <label className="Form-label">Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Additional notes..."
            className="Form-textarea"
          />
        </div>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

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
              <button
                className="Btn-back"
                onClick={handleBack}
                title="Go back to Asset Management"
              >
                ←
              </button>

              <div className="New-asset-record-title-text">
                <h1>
                  New <span>Workstation Record</span>
                </h1>
                <p className="New-asset-record-timestamp">
                  Created on {formatDateTime(new Date())}
                </p>
              </div>
            </div>

            <div className="New-asset-record-actions">
              <button
                className="Btn-submit-record"
                onClick={handleSubmitRecord}
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
              <button
                className="Btn-clear-form"
                onClick={handleClearForm}
                disabled={loading}
              >
                Clear Form
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Alert severity="error" onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {/* Tabs */}
          <div className="New-asset-tabs">
            <button
              className={`New-asset-tab ${
                activeTab === "basic" ? "New-asset-tab--active" : ""
              }`}
              onClick={() => setActiveTab("basic")}
            >
              Basic Info
            </button>
            <button
              className={`New-asset-tab ${
                activeTab === "hardware" ? "New-asset-tab--active" : ""
              }`}
              onClick={() => setActiveTab("hardware")}
            >
              Hardware Specs
            </button>
            <button
              className={`New-asset-tab ${
                activeTab === "peripheral" ? "New-asset-tab--active" : ""
              }`}
              onClick={() => setActiveTab("peripheral")}
            >
              Peripheral Info
            </button>
            <button
              className={`New-asset-tab ${
                activeTab === "accountability" ? "New-asset-tab--active" : ""
              }`}
              onClick={() => setActiveTab("accountability")}
            >
              Accountability
            </button>
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
