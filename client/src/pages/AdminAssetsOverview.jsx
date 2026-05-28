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
import {
  getStatusColor,
  getWarrantyStatusColor,
} from "../utils/StatusUtil.jsx";
import { formatDate, formatDateTime } from "../utils/DateUtil.jsx";
import {
  getFullWorkstationColumns,
  getAssetViewColumns,
} from "./DataGridColumns.jsx";
import api from "../api.js";
import "../styles/AdminAssetsOverview.css";

// ---------------------------------------------------------------------------
// Custom Toolbar — defined OUTSIDE the parent to keep a stable reference.
// MUI DataGrid remounts the toolbar whenever its reference changes, so
// defining it inside AdminAssetsOverview (where it re-creates on every
// render) causes it to never appear. Props are passed via slotProps.toolbar.
// ---------------------------------------------------------------------------

function CustomToolbar({
  selectedIds = [],
  rows = [],
  activeTab,
  onAdd,
  onEdit,
  onDelete,
}) {
  const isWorkstation = activeTab === "workstation";

  return (
    <GridToolbarContainer
      sx={{ justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}
    >
      {/* Left: standard MUI toolbar buttons + action buttons */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 0.5,
        }}
      >
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
  const [workstationPaginationModel, setWorkstationPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });
  const [workstationSelectionModel, setWorkstationSelectionModel] = useState({
    type: "include",
    ids: new Set(),
  });

  // Asset View state
  const [assetRows, setAssetRows] = useState([]);
  const [assetPaginationModel, setAssetPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });
  const [assetSelectionModel, setAssetSelectionModel] = useState({
    type: "include",
    ids: new Set(),
  });

  // Dialog state for editing workstations and assets
  const [workstationDialogState, setWorkstationDialogState] = useState({
    open: false,
    mode: "edit", // "edit" or "view"
    data: null,
  });

  const [assetDialogState, setAssetDialogState] = useState({
    open: false,
    mode: "edit", // "edit" or "view"
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

          date_assigned: ws.date_assigned ? formatDate(ws.date_assigned) : "",

          accountability_form: ws.accountability_form,
          device_status: ws.device_status,
          warranty_status: ws.warranty_status,

          warranty_expiry_date: ws.warranty_expiry_date
            ? formatDate(ws.warranty_expiry_date)
            : "",

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

          created_at: ws.created_at ? formatDateTime(ws.created_at) : "",

          last_updated: ws.last_updated ? formatDateTime(ws.last_updated) : "",
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

  // ---------------------------------------------------------------------------
  // Dialog Handlers for Workstations
  // ---------------------------------------------------------------------------

  const handleOpenWorkstationDialog = (mode, rowData = null) => {
    setWorkstationDialogState({
      open: true,
      mode,
      data: rowData || {},
    });
  };

  const handleCloseWorkstationDialog = () => {
    setWorkstationDialogState({
      open: false,
      mode: "edit",
      data: null,
    });
  };

  const handleSaveWorkstation = async (updatedData) => {
    try {
      if (
        workstationDialogState.data &&
        workstationDialogState.data.device_id
      ) {
        // Update workstation
        await api.put(
          `/api/workstations/${workstationDialogState.data.device_id}`,
          updatedData,
        );
      }
      handleCloseWorkstationDialog();
      fetchWorkstations();
    } catch (err) {
      console.error("Error saving workstation:", err);
      setError("Failed to save workstation");
    }
  };

  const handleDeleteWorkstations = async (ids) => {
    if (
      window.confirm(
        `Are you sure you want to delete ${ids.length} workstation(s)?`,
      )
    ) {
      try {
        for (const id of ids) {
          await api.delete(`/api/workstations/${id}`);
        }
        fetchWorkstations();
        setError("");
      } catch (err) {
        console.error("Error deleting workstations:", err);
        setError("Failed to delete workstation(s)");
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Dialog Handlers for Assets
  // ---------------------------------------------------------------------------

  const handleOpenAssetDialog = (mode, rowData = null) => {
    setAssetDialogState({
      open: true,
      mode,
      data: rowData || {},
    });
  };

  const handleCloseAssetDialog = () => {
    setAssetDialogState({
      open: false,
      mode: "edit",
      data: null,
    });
  };

  const handleSaveAsset = async (updatedData) => {
    try {
      if (assetDialogState.data && assetDialogState.data.asset_id) {
        await api.put(
          `/api/assets/${assetDialogState.data.asset_id}`,
          updatedData,
        );
      }
      handleCloseAssetDialog();
      fetchAssets();
    } catch (err) {
      console.error("Error saving asset:", err);
      setError("Failed to save asset");
    }
  };

  const handleDeleteAssets = async (ids) => {
    if (
      window.confirm(`Are you sure you want to delete ${ids.length} asset(s)?`)
    ) {
      try {
        for (const id of ids) {
          await api.delete(`/api/assets/${id}`);
        }
        fetchAssets();
        setError("");
      } catch (err) {
        console.error("Error deleting assets:", err);
        setError("Failed to delete asset(s)");
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Toolbar prop callbacks (stable references so slotProps don't thrash)
  // ---------------------------------------------------------------------------

  // Add → navigate to New Asset Record page
  const handleToolbarAdd = useCallback(() => {
    navigate("/admin/assets/new");
  }, [navigate]);

  // Edit → open dialog for editing
  const handleToolbarEdit = useCallback(
    (row) => {
      if (activeTab === "workstation") {
        handleOpenWorkstationDialog("edit", row);
      } else {
        handleOpenAssetDialog("edit", row);
      }
    },
    [activeTab],
  );

  const handleRowDoubleClick = (params) => {
    if (activeTab === "workstation") {
      handleOpenWorkstationDialog("edit", params.row);
    } else {
      handleOpenAssetDialog("edit", params.row);
    }
  };

  const handleToolbarDelete = useCallback(
    (ids) => {
      if (activeTab === "workstation") {
        handleDeleteWorkstations(ids);
      } else {
        handleDeleteAssets(ids);
      }
    },
    [activeTab],
  );

  // ---------------------------------------------------------------------------
  // Column Definitions
  // ---------------------------------------------------------------------------

  const fullWorkstationColumns = getFullWorkstationColumns(
    getStatusColor,
    getWarrantyStatusColor,
  );
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
              >
                {" "}
                Full Workstation View{" "}
              </button>

              <button
                className={`Assets-tab ${
                  activeTab === "asset" ? "Assets-tab--active" : ""
                }`}
                onClick={() => setActiveTab("asset")}
              >
                {" "}
                Asset View{" "}
              </button>
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

      {/* Workstation Edit Dialog */}
      {workstationDialogState.open && (
        <Dialog
          open={workstationDialogState.open}
          onClose={handleCloseWorkstationDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {workstationDialogState.mode === "edit"
              ? "Edit Workstation"
              : "View Workstation"}
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Device ID"
                value={workstationDialogState.data?.device_id || ""}
                disabled
                fullWidth
              />
              <TextField
                label="Device Name"
                value={workstationDialogState.data?.device_name || ""}
                onChange={(e) =>
                  setWorkstationDialogState((prev) => ({
                    ...prev,
                    data: {
                      ...prev.data,
                      device_name: e.target.value,
                    },
                  }))
                }
                fullWidth
              />
              <TextField
                label="Device Status"
                value={workstationDialogState.data?.device_status || ""}
                onChange={(e) =>
                  setWorkstationDialogState((prev) => ({
                    ...prev,
                    data: {
                      ...prev.data,
                      device_status: e.target.value,
                    },
                  }))
                }
                fullWidth
              />
              <TextField
                label="Assigned User"
                value={workstationDialogState.data?.assigned_user || ""}
                onChange={(e) =>
                  setWorkstationDialogState((prev) => ({
                    ...prev,
                    data: {
                      ...prev.data,
                      assigned_user: e.target.value,
                    },
                  }))
                }
                fullWidth
              />
              <TextField
                label="Team"
                value={workstationDialogState.data?.team || ""}
                onChange={(e) =>
                  setWorkstationDialogState((prev) => ({
                    ...prev,
                    data: {
                      ...prev.data,
                      team: e.target.value,
                    },
                  }))
                }
                fullWidth
              />
              <TextField
                label="Location"
                value={workstationDialogState.data?.location || ""}
                onChange={(e) =>
                  setWorkstationDialogState((prev) => ({
                    ...prev,
                    data: {
                      ...prev.data,
                      location: e.target.value,
                    },
                  }))
                }
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseWorkstationDialog}>Cancel</Button>
            <Button
              onClick={() => handleSaveWorkstation(workstationDialogState.data)}
              variant="contained"
              color="primary"
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Asset Edit Dialog */}
      {assetDialogState.open && (
        <Dialog
          open={assetDialogState.open}
          onClose={handleCloseAssetDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {assetDialogState.mode === "edit" ? "Edit Asset" : "View Asset"}
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Asset ID"
                value={assetDialogState.data?.asset_id || ""}
                disabled
                fullWidth
              />
              <TextField
                label="Asset Name"
                value={assetDialogState.data?.asset_name || ""}
                onChange={(e) =>
                  setAssetDialogState((prev) => ({
                    ...prev,
                    data: {
                      ...prev.data,
                      asset_name: e.target.value,
                    },
                  }))
                }
                fullWidth
              />
              <TextField
                label="Asset Code"
                value={assetDialogState.data?.asset_code || ""}
                disabled
                fullWidth
              />
              <TextField
                label="Serial Number"
                value={assetDialogState.data?.serial_number || ""}
                disabled
                fullWidth
              />
              <TextField
                label="Status"
                value={assetDialogState.data?.status_name || ""}
                disabled
                fullWidth
              />
              <TextField
                label="Asset Type"
                value={assetDialogState.data?.asset_type_name || ""}
                disabled
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAssetDialog}>Cancel</Button>
            <Button
              onClick={() => handleSaveAsset(assetDialogState.data)}
              variant="contained"
              color="primary"
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
}

export default AdminAssetsOverview;
