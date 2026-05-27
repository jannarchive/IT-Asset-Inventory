import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarQuickFilter,
} from "@mui/x-data-grid";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import NavigationBar from "../components/NavigationBar.jsx";
import Sidebar from "../components/Sidebar.jsx";
import { getStatusColor } from "../utils/StatusUtil.jsx";
import { getFullWorkstationColumns, getAssetViewColumns } from "./DataGridColumns.jsx";
import api from "../api.js";
import "../styles/AdminAssetsOverview.css";

// ---------------------------------------------------------------------------
// Custom Toolbar — defined OUTSIDE the parent to keep a stable reference.
// MUI DataGrid remounts the toolbar whenever its reference changes, so
// defining it inside AdminAssetsOverview (where it re-creates on every
// render) causes it to never appear. Props are passed via slotProps.toolbar.
// ---------------------------------------------------------------------------

function CustomToolbar({ selectedIds = [], rows = [], activeTab, onAdd, onEdit, onDelete }) {
  const isWorkstation = activeTab === "workstation";

  return (
    <GridToolbarContainer sx={{ justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
      {/* Left: standard MUI toolbar buttons + action buttons */}
      <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.5 }}>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
        <GridToolbarExport />

        {/* Add / Edit / Delete — workstation tab only */}
        {isWorkstation && (
          <>
            <Button
              size="small"
              color="primary"
              startIcon={<AddIcon />}
              onClick={onAdd}
            >
              Add
            </Button>
            <Button
              size="small"
              color="primary"
              startIcon={<EditIcon />}
              onClick={() => {
                const selectedRow = rows.find((r) => r.id === selectedIds[0]);
                if (selectedRow) onEdit(selectedRow);
              }}
              disabled={selectedIds.length !== 1}
            >
              Edit
            </Button>
            <Button
              size="small"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => onDelete(selectedIds)}
              disabled={selectedIds.length === 0}
            >
              Delete
            </Button>
          </>
        )}
      </Box>

      {/* Right: quick search */}
      <GridToolbarQuickFilter debounceMs={300} />
    </GridToolbarContainer>
  );
}

function AdminAssetsOverview() {
  const navigate = useNavigate();

  // ---------------------------------------------------------------------------
  // State Management
  // ---------------------------------------------------------------------------

  const [activeTab, setActiveTab] = useState("workstation");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Full Workstation View state
  const [workstationRows, setWorkstationRows] = useState([]);
  const [workstationPaginationModel, setWorkstationPaginationModel] = useState({ pageSize: 10, page: 0 });
  const [workstationSelectionModel, setWorkstationSelectionModel] = useState({ type: "include", ids: new Set() });

  // Asset View state
  const [assetRows, setAssetRows] = useState([]);
  const [assetPaginationModel, setAssetPaginationModel] = useState({ pageSize: 10, page: 0 });
  const [assetSelectionModel, setAssetSelectionModel] = useState({ type: "include", ids: new Set() });

  // Dialog state
  const [dialogState, setDialogState] = useState({
    open: false,
    mode: "add", // "add" or "edit"
    type: "asset", // "workstation" or "asset"
    data: null,
  });

  // ---------------------------------------------------------------------------
  // Fetch Full Workstation Data
  // ---------------------------------------------------------------------------

  const fetchWorkstations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/dashboard/workstations");

      // Handle response structure: { workstations: [...] } or direct array
      const data = response.data.workstations || response.data;

      if (Array.isArray(data) && data.length > 0) {
        const transformedRows = data.map((ws, index) => ({
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
        setWorkstationRows(transformedRows);
        setError("");
      } else {
        setWorkstationRows([]);
        setError("No workstation records found");
      }
    } catch (err) {
      console.error("Error fetching workstations:", err);
      setError("Failed to fetch workstation data");
      setWorkstationRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Fetch Asset Data
  // ---------------------------------------------------------------------------

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/assets");

      // Handle response structure: { assets: [...] } or direct array
      const data = response.data.assets || response.data;

      if (Array.isArray(data) && data.length > 0) {
        const transformedRows = data.map((asset, index) => ({
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
        setAssetRows(transformedRows);
        setError("");
      } else {
        setAssetRows([]);
        setError("No asset records found");
      }
    } catch (err) {
      console.error("Error fetching assets:", err);
      setError("Failed to fetch asset data");
      setAssetRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Initialize Data on Mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (activeTab === "workstation") {
      fetchWorkstations();
    } else {
      fetchAssets();
    }
  }, [activeTab, fetchWorkstations, fetchAssets]);

  /*
  // ---------------------------------------------------------------------------
  // Dialog Handlers
  // ---------------------------------------------------------------------------

  const handleOpenDialog = (mode, type, rowData = null) => {
    setDialogState({
      open: true,
      mode,
      type,
      data: rowData || {},
    });
  };

  const handleCloseDialog = () => {
    setDialogState({
      open: false,
      mode: "add",
      type: "asset",
      data: null,
    });
  };

  const handleSaveRecord = async () => {
    try {
      if (dialogState.mode === "add") {
        // Handle add record
        if (dialogState.type === "asset") {
          await api.post("/api/assets", dialogState.data);
        } else {
          // Workstation add - implement as needed
          console.log("Add workstation:", dialogState.data);
        }
      } else {
        // Handle edit record
        if (dialogState.type === "asset") {
          await api.put(
            `/api/assets/${dialogState.data.asset_id}`,
            dialogState.data
          );
        } else {
          // Workstation edit - implement as needed
          console.log("Edit workstation:", dialogState.data);
        }
      }
      handleCloseDialog();
      if (dialogState.type === "asset") {
        fetchAssets();
      } else {
        fetchWorkstations();
      }
    } catch (err) {
      console.error("Error saving record:", err);
      setError("Failed to save record");
    }
  };

  const handleDeleteRecords = async (ids) => {
    if (
      window.confirm(
        `Are you sure you want to delete ${ids.length} record(s)?`
      )
    ) {
      try {
        for (const id of ids) {
          if (activeTab === "asset") {
            await api.delete(`/api/assets/${id}`);
          } else {
            // Workstation delete - implement as needed
            console.log("Delete workstation:", id);
          }
        }
        if (activeTab === "asset") {
          fetchAssets();
        } else {
          fetchWorkstations();
        }
        setError("");
      } catch (err) {
        console.error("Error deleting records:", err);
        setError("Failed to delete record(s)");
      }
    }
  };*/

  // ---------------------------------------------------------------------------
  // Toolbar prop callbacks (stable references so slotProps don't thrash)
  // ---------------------------------------------------------------------------

  // Add → navigate to New Asset Record page
  const handleToolbarAdd = useCallback(() => {
    navigate("/admin/assets/new");
  }, [navigate]);

  // Edit → navigate to Edit page, passing the selected row as route state
  const handleToolbarEdit = useCallback((row) => {
    navigate(`/admin/assets/edit/${row.device_id}`, { state: { record: row } });
  }, [navigate]);

  const handleRowDoubleClick = (params) => {
    if (activeTab === "workstation") {
      navigate(`/admin/assets/edit/${params.row.device_id}`, { state: { record: params.row } });
    } else {
      handleOpenDialog("edit", activeTab, params.row);
    }
  };

  const handleToolbarDelete = useCallback((ids) => {
    handleDeleteRecords(ids);
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Column Definitions
  // ---------------------------------------------------------------------------

  const fullWorkstationColumns = getFullWorkstationColumns(getStatusColor);
  const assetViewColumns = getAssetViewColumns(getStatusColor);

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
                className={`Assets-tab ${activeTab === "workstation" ? "Assets-tab--active" : ""}`}
                onClick={() => setActiveTab("workstation")}
              > Full Workstation View </button>

              <button
                className={`Assets-tab ${activeTab === "asset" ? "Assets-tab--active" : ""
                  }`}
                onClick={() => setActiveTab("asset")}
              > Asset View </button>
            </div>

            {/* Error Message */}
            {error && (
              <Alert severity="error" onClose={() => setError("")}>
                {error}
              </Alert>
            )}

            {/* Full Workstation View */}
            {activeTab === "workstation" && (
              <div className="view-section">
                <Box sx={{ height: 600, width: "100%" }}>
                  <DataGrid
                    rows={workstationRows}
                    columns={fullWorkstationColumns}
                    checkboxSelection
                    disableMultipleRowSelection={false}
                    pageSizeOptions={[10, 25, 50]}
                    paginationModel={workstationPaginationModel}
                    onPaginationModelChange={setWorkstationPaginationModel}
                    rowSelectionModel={workstationSelectionModel}
                    onRowSelectionModelChange={setWorkstationSelectionModel}
                    onRowDoubleClick={handleRowDoubleClick}
                    showToolbar
                    slots={{ toolbar: CustomToolbar }}
                    slotProps={{
                      toolbar: {
                        selectedIds: [...workstationSelectionModel.ids],
                        rows: workstationRows,
                        activeTab,
                        onAdd: handleToolbarAdd,
                        onEdit: handleToolbarEdit,
                        onDelete: handleToolbarDelete,
                      },
                    }}
                    sx={{
                      border: "1px solid #aeacac",
                      "& .MuiDataGrid-cell": {
                        overflow: "visible",
                        padding: "0px 12px",
                      },
                    }}
                    loading={loading}
                  />
                </Box>
              </div>
            )}

            {/* Asset View */}
            {activeTab === "asset" && (
              <div className="view-section">
                <Box sx={{ height: 600, width: "100%" }}>
                  <DataGrid
                    rows={assetRows}
                    columns={assetViewColumns}
                    checkboxSelection
                    disableMultipleRowSelection={false}
                    pageSizeOptions={[10, 25, 50]}
                    paginationModel={assetPaginationModel}
                    onPaginationModelChange={setAssetPaginationModel}
                    rowSelectionModel={assetSelectionModel}
                    onRowSelectionModelChange={setAssetSelectionModel}
                    onRowDoubleClick={handleRowDoubleClick}
                    showToolbar
                    slots={{
                      toolbar: CustomToolbar,
                    }}
                    slotProps={{
                      toolbar: {
                        selectedIds: [...assetSelectionModel.ids],
                        rows: assetRows,
                        activeTab,
                      },
                    }}
                    sx={{
                      border: "1px solid #aeacac",
                      "& .MuiDataGrid-cell": {
                        overflow: "visible",
                        padding: "0px 12px",
                      },
                    }}
                    loading={loading}
                  />
                </Box>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminAssetsOverview;