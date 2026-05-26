import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { DataGrid } from "@mui/x-data-grid";

import NavigationBar from "../components/NavigationBar.jsx";
import Sidebar from "../components/Sidebar.jsx";
import { getStatusColor } from "../utils/StatusUtil.jsx";
import { formatDateTime } from "../utils/DateUtil.jsx";
import api from "../api.js";
import "../styles/AdminAssetsOverview.css";

function AdminAssetsOverview() {
  const navigate = useNavigate();

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [activeTab, setActiveTab] = useState("workstation");
  const [error, setError] = useState("");

  // Shared state
  const [deviceCategories, setDeviceCategories] = useState([]);
  const [assetTypes, setAssetTypes] = useState([]);
  const [teams, setTeams] = useState([]);

  // Full Workstation View state
  const [workstations, setWorkstations] = useState([]);
  const [workstationRows, setWorkstationRows] = useState([]);
  const [workstationSearch, setWorkstationSearch] = useState("");
  const [workstationCategory, setWorkstationCategory] = useState("All Device Categories");
  const [workstationTeam, setWorkstationTeam] = useState("All Teams");
  const [workstationPaginationModel, setWorkstationPaginationModel] = useState({ pageSize: 10,page: 0 });

  // Asset View state
  const [assets, setAssets] = useState([]);
  const [assetRows, setAssetRows] = useState([]);
  const [assetSearch, setAssetSearch] = useState("");
  const [assetType, setAssetType] = useState("All Asset Types");
  const [assetTeam, setAssetTeam] = useState("All Teams");
  const [assetPaginationModel, setAssetPaginationModel] = useState({ pageSize: 10, page: 0 });

  // ---------------------------------------------------------------------------
  // Fetch Full Workstation Data
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const fetchWorkstations = async () => {
      try {
        const response = await api.get("/api/assets", {
          params: {
            search: workstationSearch,
            deviceCategory: workstationCategory,
            team: workstationTeam,
          },
        });

        if (response.data.length > 0) {
          setWorkstations(response.data);
          // Extract unique categories and teams
          const uniqueCategories = [
            "All Device Categories",
            ...new Set(response.data.map((w) => w.device_category)),
          ];
          const uniqueTeams = [
            "All Teams",
            ...new Set(response.data.map((w) => w.team).filter(Boolean)),
          ];
          setDeviceCategories(uniqueCategories);
          setTeams(uniqueTeams);
        } else {
          setError("No workstation records found");
          setWorkstations([]);
        }
      } catch (err) {
        console.error("Error fetching workstations:", err);
        setError("An error occurred while fetching workstations");
        setWorkstations([]);
      }
    };

    fetchWorkstations();
  }, [workstationSearch, workstationCategory, workstationTeam]);

  // ---------------------------------------------------------------------------
  // Fetch Asset Data
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const fetchAssetData = async () => {
      try {
        const response = await api.get("/api/assets", {
          params: {
            search: assetSearch,
            assetType: assetType,
            team: assetTeam,
          },
        });

        if (response.data.length > 0) {
          setAssets(response.data);
          // Extract unique asset types and teams
          const uniqueTypes = [
            "All Asset Types",
            ...new Set(response.data.map((a) => a.asset_type_name)),
          ];
          const uniqueTeams = [
            "All Teams",
            ...new Set(response.data.map((a) => a.team).filter(Boolean)),
          ];
          setAssetTypes(uniqueTypes);
          setTeams(uniqueTeams);
        } else {
          setError("No asset records found");
          setAssets([]);
        }
      } catch (err) {
        console.error("Error fetching assets:", err);
        setError("An error occurred while fetching assets");
        setAssets([]);
      }
    };

    fetchAssetData();
  }, [assetSearch, assetType, assetTeam]);

  // ---------------------------------------------------------------------------
  // Transform data to DataGrid rows
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const workstationDataRows = workstations.map((ws, index) => ({
      id: ws.device_id || index,
      device_id: ws.device_id,
      device_category: ws.device_category,
      device_name: ws.device_name,
      model: ws.model,
      assigned_user: ws.assigned_user,
      employee_number: ws.employee_number,
      team: ws.team,
      location: ws.location,
      date_assigned: ws.date_assigned,
      accountability_form: ws.accountability_form,
      device_status: ws.device_status,
      processor_code: ws.processor_code,
      processor_serial: ws.processor_serial,
      processor: ws.processor,
      memory: ws.memory,
      motherboard: ws.motherboard,
      storage: ws.storage,
      monitor1_code: ws.monitor1_code,
      monitor1_serial: ws.monitor1_serial,
      monitor1: ws.monitor1,
      monitor1_status: ws.monitor1_status,
      monitor2_code: ws.monitor2_code,
      monitor2_serial: ws.monitor2_serial,
      monitor2: ws.monitor2,
      monitor2_status: ws.monitor2_status,
      keyboard_code: ws.keyboard_code,
      keyboard_serial: ws.keyboard_serial,
      keyboard: ws.keyboard,
      keyboard_status: ws.keyboard_status,
      mouse_code: ws.mouse_code,
      mouse_serial: ws.mouse_serial,
      mouse: ws.mouse,
      mouse_status: ws.mouse_status,
      headset_code: ws.headset_code,
      headset_serial: ws.headset_serial,
      headset: ws.headset,
      headset_status: ws.headset_status,
      webcam_code: ws.webcam_code,
      webcam_serial: ws.webcam_serial,
      webcam: ws.webcam,
      webcam_status: ws.webcam_status,
      supplier: ws.supplier,
      notes: ws.notes,
      last_updated: ws.last_updated,
    }));
    setWorkstationRows(workstationDataRows);
  }, [workstations]);

  useEffect(() => {
    const assetDataRows = assets.map((asset, index) => ({
      id: asset.asset_id || index,
      asset_id: asset.asset_id,
      asset_code: asset.asset_code,
      serial_number: asset.serial_number,
      asset_type_name: asset.asset_type_name,
      asset_name: asset.asset_name,
      status_name: asset.status_name,
      parent_device_id: asset.parent_device_id,
      assigned_user: asset.assigned_user,
      employee_number: asset.employee_number,
      team: asset.team,
    }));
    setAssetRows(assetDataRows);
  }, [assets]);

  // ---------------------------------------------------------------------------
  // DataGrid Column Definitions
  // ---------------------------------------------------------------------------

  const fullWorkstationColumns = [
    { field: "device_id", headerName: "Device ID", width: 120 },
    { field: "device_category", headerName: "Device Category", width: 150 },
    { field: "device_name", headerName: "Device Name", width: 150 },
    { field: "model", headerName: "Model", width: 130 },
    { field: "assigned_user", headerName: "Assigned User", width: 140 },
    { field: "employee_number", headerName: "Employee Number", width: 150 },
    { field: "team", headerName: "Team", width: 120 },
    { field: "location", headerName: "Location", width: 130 },
    { field: "date_assigned", headerName: "Date Assigned", width: 140 },
    {
      field: "accountability_form",
      headerName: "Accountability Form",
      width: 160,
    },
    { field: "device_status", headerName: "Device Status", width: 140 },
    { field: "processor_code", headerName: "Processor Code", width: 140 },
    { field: "processor_serial", headerName: "Processor Serial", width: 140 },
    { field: "processor", headerName: "Processor", width: 130 },
    { field: "memory", headerName: "Memory", width: 110 },
    { field: "motherboard", headerName: "Motherboard", width: 130 },
    { field: "storage", headerName: "Storage", width: 110 },
    { field: "monitor1_code", headerName: "Monitor 1 Code", width: 140 },
    { field: "monitor1_serial", headerName: "Monitor 1 Serial", width: 140 },
    { field: "monitor1", headerName: "Monitor 1", width: 130 },
    { field: "monitor1_status", headerName: "Monitor 1 Status", width: 150 },
    { field: "monitor2_code", headerName: "Monitor 2 Code", width: 140 },
    { field: "monitor2_serial", headerName: "Monitor 2 Serial", width: 140 },
    { field: "monitor2", headerName: "Monitor 2", width: 130 },
    { field: "monitor2_status", headerName: "Monitor 2 Status", width: 150 },
    { field: "keyboard_code", headerName: "Keyboard Code", width: 140 },
    { field: "keyboard_serial", headerName: "Keyboard Serial", width: 140 },
    { field: "keyboard", headerName: "Keyboard", width: 120 },
    { field: "keyboard_status", headerName: "Keyboard Status", width: 150 },
    { field: "mouse_code", headerName: "Mouse Code", width: 130 },
    { field: "mouse_serial", headerName: "Mouse Serial", width: 130 },
    { field: "mouse", headerName: "Mouse", width: 110 },
    { field: "mouse_status", headerName: "Mouse Status", width: 140 },
    { field: "headset_code", headerName: "Headset Code", width: 140 },
    { field: "headset_serial", headerName: "Headset Serial", width: 140 },
    { field: "headset", headerName: "Headset", width: 120 },
    { field: "headset_status", headerName: "Headset Status", width: 150 },
    { field: "webcam_code", headerName: "Webcam Code", width: 140 },
    { field: "webcam_serial", headerName: "Webcam Serial", width: 140 },
    { field: "webcam", headerName: "Webcam", width: 120 },
    { field: "webcam_status", headerName: "Webcam Status", width: 150 },
    { field: "supplier", headerName: "Supplier", width: 130 },
    { field: "notes", headerName: "Notes", width: 200 },
    { field: "last_updated", headerName: "Last Updated", width: 150 },
  ];

  const assetViewColumns = [
    { field: "asset_code", headerName: "Asset Code", width: 130 },
    { field: "serial_number", headerName: "Serial Number", width: 150 },
    { field: "asset_type_name", headerName: "Asset Type", width: 150 },
    { field: "asset_name", headerName: "Asset Name", width: 150 },
    {
      field: "status_name",
      headerName: "Asset Status",
      width: 140,
      renderCell: (params) => (
        <div className="status-container">
          <span
            className="status-dot"
            style={{
              backgroundColor: getStatusColor(params.value),
            }}
          />
          {params.value}
        </div>
      ),
    },
    { field: "parent_device_id", headerName: "Parent Device ID", width: 150 },
    { field: "assigned_user", headerName: "Assigned User", width: 150 },
    { field: "employee_number", headerName: "Employee Number", width: 150 },
    { field: "team", headerName: "Team", width: 120 },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <button
          className="action-btn view-btn"
          onClick={() => handleViewAsset(params.row)}
          title="View asset"
        >
          <VisibilityIcon style={{ fontSize: "16px" }} />
        </button>
      ),
    },
  ];

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleViewAsset = (asset) => {
    console.log(`Viewing asset ${asset.asset_id}`);
    navigate(`/view-asset/${asset.asset_id}`, {
      state: { asset },
    });
  };

  const handleWorkstationCategoryChange = (category) => {
    setWorkstationCategory(category);
  };

  const handleWorkstationTeamChange = (team) => {
    setWorkstationTeam(team);
  };

  const handleAssetTypeChange = (type) => {
    setAssetType(type);
  };

  const handleAssetTeamChange = (team) => {
    setAssetTeam(team);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="Assets-overview">
      <NavigationBar />

      <div className="Main-content">
        <div className="Sidebar-placeholder">
          <Sidebar />
        </div>

        <div className="content">
          <div className="Assets-overview-container">
            {/* Page Title/Header */}
            <div className="Assets-overview-header">
              <h1>Asset Management</h1>
            </div>

            {/* Tabs */}
            <div className="Assets-tabs">
              <button
                className={`Assets-tab ${
                  activeTab === "workstation" ? "Assets-tab--active" : ""
                }`}
                onClick={() => setActiveTab("workstation")}
              >
                Full Workstation View
              </button>

              <button
                className={`Assets-tab ${
                  activeTab === "asset" ? "Assets-tab--active" : ""
                }`}
                onClick={() => setActiveTab("asset")}
              >
                Asset View
              </button>
            </div>

            {/* Error Message */}
            {error && <div className="error-message">{error}</div>}

            {/* Full Workstation View */}
            {activeTab === "workstation" && (
              <div className="view-section">
                {/* Search Bar */}
                <div className="Search-bar">
                  <input
                    type="text"
                    placeholder="Search by device ID, category, assigned user, or team"
                    value={workstationSearch}
                    onChange={(e) => setWorkstationSearch(e.target.value)}
                  />
                  <SearchIcon className="Search-icon" />
                </div>

                {/* Filters */}
                <div className="Assets-overview-header">
                  <select
                    className="filters Filter-dropdown"
                    value={workstationCategory}
                    onChange={(e) =>
                      handleWorkstationCategoryChange(e.target.value)
                    }
                  >
                    {deviceCategories.map((category, index) => (
                      <option key={index} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>

                  <select
                    className="filters Filter-dropdown"
                    value={workstationTeam}
                    onChange={(e) =>
                      handleWorkstationTeamChange(e.target.value)
                    }
                  >
                    {teams.map((team, index) => (
                      <option key={index} value={team}>
                        {team}
                      </option>
                    ))}
                  </select>

                  <div className="Header-spacer"></div>
                </div>

                {/* DataGrid */}
                <div className="datagrid-wrapper">
                  <DataGrid
                    rows={workstationRows}
                    columns={fullWorkstationColumns}
                    checkboxSelection
                    disableMultipleRowSelection={false}
                    pageSizeOptions={[10, 25, 50]}
                    paginationModel={workstationPaginationModel}
                    onPaginationModelChange={setWorkstationPaginationModel}
                    showToolbar
                    sx={{
                      border: "1px solid #dde3ea",
                      "& .MuiDataGrid-cell": {
                        overflow: "visible",
                        padding: "8px 16px",
                      },
                    }}
                  />
                </div>
              </div>
            )}

            {/* Asset View */}
            {activeTab === "asset" && (
              <div className="view-section">
                {/* Search Bar */}
                <div className="Search-bar">
                  <input
                    type="text"
                    placeholder="Search by asset code, serial number, type, user, or team"
                    value={assetSearch}
                    onChange={(e) => setAssetSearch(e.target.value)}
                  />
                  <SearchIcon className="Search-icon" />
                </div>

                {/* Filters */}
                <div className="Assets-overview-header">
                  <select
                    className="filters Filter-dropdown"
                    value={assetType}
                    onChange={(e) => handleAssetTypeChange(e.target.value)}
                  >
                    {assetTypes.map((type, index) => (
                      <option key={index} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>

                  <select
                    className="filters Filter-dropdown"
                    value={assetTeam}
                    onChange={(e) => handleAssetTeamChange(e.target.value)}
                  >
                    {teams.map((team, index) => (
                      <option key={index} value={team}>
                        {team}
                      </option>
                    ))}
                  </select>

                  <div className="Header-spacer"></div>
                </div>

                {/* DataGrid */}
                <div className="datagrid-wrapper">
                  <DataGrid
                    rows={assetRows}
                    columns={assetViewColumns}
                    checkboxSelection
                    disableMultipleRowSelection={false}
                    pageSizeOptions={[10, 25, 50]}
                    paginationModel={assetPaginationModel}
                    onPaginationModelChange={setAssetPaginationModel}
                    disableSelectionOnClick
                    showToolbar
                    sx={{
                      border: "1px solid #dde3ea",
                      "& .MuiDataGrid-cell": {
                        overflow: "visible",
                        padding: "8px 16px",
                      },
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminAssetsOverview;
