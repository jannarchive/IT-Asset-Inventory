import React, { useEffect, useState, useCallback } from "react";
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
  MenuItem,
  Alert,
  Tabs,
  Tab,
  CircularProgress,
  Typography,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";

import NavigationBar from "../components/NavigationBar.jsx";
import Sidebar from "../components/Sidebar.jsx";
import { getStatusColor, getWarrantyStatusColor } from "../utils/StatusUtil.jsx";
import { formatDate, formatDateTime } from "../utils/DateUtil.jsx";
import { getFullWorkstationColumns, getAssetViewColumns } from "./DataGridColumns.jsx";
import api from "../api.js";
import "../styles/AdminAssetsOverview.css";

const DEVICE_CATEGORIES = ["Workstation", "Laptop", "Mobile Phone", "Printer", "Network Equipment"];
const DEVICE_STATUSES = ["Active", "In Storage", "Defective", "Out for Repair", "Retired"];
const ASSET_STATUSES = ["Active", "In Storage", "Defective", "Out for Repair", "Retired"];
const WARRANTY_STATUSES = ["Valid", "Expired"];
const TEAMS = ["Operations and Management", "EAS", "AWX"];
const LOCATIONS = ["Admin/OPS", "WFH"];
const STANDARD_ROLES = ["Processor", "Monitor 1", "Monitor 2", "Keyboard", "Mouse", "Headset", "Webcam"];

const sanitizeTextField = (v) => {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") return ""; 
  return String(v);
};

const displayValue = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") {
    if (value.type === "Buffer" && Array.isArray(v.data)) return "[binary data]";
    try { return JSON.stringify(value); } catch { return "[object]"; }
  }
  return value;
};

const viewRow = ({ label, value }) => (
  <Box sx={{ display: "flex", gap: 1, py: 0.4 }}>
    <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 200, color: "text.secondary" }}>
      {label}
    </Typography>
    <Typography variant="body2">{displayVal(value)}</Typography>
  </Box>
);

function CustomToolbar({ selectedIds = [], rows = [], activeTab, onAdd, onEdit, onView, onDelete }) {
  const isWorkstation = activeTab === "workstation";
  const hasOne = selectedIds.length === 1;
  const hasAny = selectedIds.length > 0;
  const selectedRow = rows.find((r) => r.id === selectedIds[0]);

  return (
    <GridToolbarContainer sx={{ justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.5 }}>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
        <GridToolbarExport />

        {isWorkstation && (
          <>
            <Button size="small" color="primary" startIcon={<AddIcon />} onClick={onAdd}>
              Add
            </Button>
            <Button
              size="small"
              color="primary"
              startIcon={<VisibilityIcon />}
              onClick={() => hasOne && onView(selectedRow)}
              disabled={!hasOne}
            >
              View
            </Button>
            <Button
              size="small"
              color="primary"
              startIcon={<EditIcon />}
              onClick={() => hasOne && onEdit(selectedRow)}
              disabled={!hasOne}
            >
              Edit
            </Button>
            <Button
              size="small"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => onDelete(selectedIds)}
              disabled={!hasAny}
            >
              Delete
            </Button>
          </>
        )}
      </Box>
      <GridToolbarQuickFilter debounceMs={300} />
    </GridToolbarContainer>
  );
}

// ---------------------------------------------------------------------------
// ViewDialog - read-only, all workstation fields neatly sectioned
// ---------------------------------------------------------------------------

function ViewDialog({ open, onClose, data }) {

  const [assets, setAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  useEffect(() => {
    if (!open || !data) { setAssets([]); return; }
    const fetchAssets = async () => {
      setLoadingAssets(true);
      try {
        const res = await api.get(`/api/workstations/${data.device_id}/assets`);
        setAssets(res.data.assets || []);
      } catch (err) {
        console.error("ViewDialog: failed to load assets", err);
        setAssets([]);
      } finally {
        setLoadingAssets(false);
      }
    };
    fetchAssets();
  }, [open, data]);

  if (!data) return null;

  const assetByRole = {};
  assets.forEach((a) => { assetByRole[a.asset_role] = a; });

  const Section = ({ title, children }) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: "primary.main" }}>
        {title}
      </Typography>
      <Divider sx={{ mb: 1 }} />
      {children}
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        View Workstation — DEV-{String(data.device_id).padStart(5, "0")}
      </DialogTitle>
      <DialogContent dividers>
        <Section title="Employee Information">
          <ViewRow label="Assigned User" value={data.assigned_user} />
          <ViewRow label="Employee Number" value={data.employee_number} />
          <ViewRow label="Team" value={data.team} />
          <ViewRow label="Location" value={data.location} />
          <ViewRow label="Date Assigned" value={formatDate(data.date_assigned)} />
        </Section>
        <Section title="Device Information">
          <ViewRow label="Device Category" value={data.device_category} />
          <ViewRow label="Device Name" value={data.device_name} />
          <ViewRow label="Model" value={data.model} />
          <ViewRow label="Device Status" value={data.device_status} />
          <ViewRow label="Supplier" value={data.supplier} />
          <ViewRow label="Notes" value={data.notes} />
          <ViewRow label="Accountability Form" value={data.accountability_form} />
        </Section>
        <Section title="Hardware Specifications">
          <ViewRow label="Processor Code" value={data.processor_code} />
          <ViewRow label="Processor Serial" value={data.processor_serial} />
          <ViewRow label="Processor" value={data.processor} />
          <ViewRow label="Memory" value={data.memory} />
          <ViewRow label="Motherboard" value={data.motherboard} />
          <ViewRow label="Storage" value={data.storage} />
        </Section>
        <Section title="Peripherals">
          {[
            ["Monitor 1", "monitor1", "monitor1_code", "monitor1_serial", "monitor1_status"],
            ["Monitor 2", "monitor2", "monitor2_code", "monitor2_serial", "monitor2_status"],
            ["Keyboard", "keyboard", "keyboard_code", "keyboard_serial", "keyboard_status"],
            ["Mouse", "mouse", "mouse_code", "mouse_serial", "mouse_status"],
            ["Headset", "headset", "headset_code", "headset_serial", "headset_status"],
            ["Webcam", "webcam", "webcam_code", "webcam_serial", "webcam_status"],
          ].map(([label, name, code, serial, status]) => {
            const asset = assetByRole[label];

            return (
              <Box key={label} sx={{ mb: 1.5 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    display: "block",
                    mb: 0.5,
                    color: "text.secondary",
                  }}
                >
                  {label}
                </Typography>

                <ViewRow label="Asset Code" value={data[code]} />
                <ViewRow label="Serial Number" value={data[serial]} />
                <ViewRow label="Name" value={data[name]} />
                <ViewRow label="Status" value={data[status]} />

                <ViewRow
                  label="Warranty Status"
                  value={asset?.warranty_status}
                />

                <ViewRow
                  label="Warranty Expiry Date"
                  value={
                    asset?.warranty_expiry_date
                      ? formatDate(asset.warranty_expiry_date)
                      : null
                  }
                />
              </Box>
            );
          })}
        </Section>
        <Section title="Timestamps">
          <ViewRow label="Created At" value={data.created_at} />
          <ViewRow label="Last Updated" value={data.last_updated} />
        </Section>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// EditDialog - tabbed, editable, saves full_workstation and all assets
// ---------------------------------------------------------------------------

const STANDARD_ROLE_SET = new Set(STANDARD_ROLES);

const WsTextField = ({ label, field, type = "text", ws, onWsChange }) => {
  const shrink = type === "date" ? true : undefined;
  return (
    <TextField
      fullWidth size="small" label={label} type={type}
      value={ws[field] ?? ""}
      onChange={(e) => onWsChange(field, e.target.value)}
      slotProps={{ inputLabel: { shrink } }}
      sx={{ mb: 1.5 }}
    />
  );
};

const WsSelectField = ({ label, field, options, ws, onWsChange }) => (
  <TextField
    select fullWidth size="small" label={label}
    value={ws[field] ?? ""}
    onChange={(e) => onWsChange(field, e.target.value)}
    sx={{ mb: 1.5 }}
  >
    {options.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
  </TextField>
);

const AssetTextField = ({ label, field, type = "text", asset, onAssetChange }) => {
  const shrink = type === "date" ? true : undefined;
  return (
    <TextField
      fullWidth size="small" label={label} type={type}
      value={asset?.[field] ?? ""}
      onChange={(e) => onAssetChange(asset.asset_id, field, e.target.value)}
      slotProps={{ inputLabel: { shrink } }}
      sx={{ mb: 1.5 }}
    />
  );
};

const AssetSelectField = ({ label, field, options, asset, onAssetChange }) => (
  <TextField
    select fullWidth size="small" label={label}
    value={asset?.[field] ?? ""}
    onChange={(e) => onAssetChange(asset.asset_id, field, e.target.value)}
    sx={{ mb: 1.5 }}
  >
    {options.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
  </TextField>
);

const AssetCard = ({ asset, onAssetChange }) => (
  <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 1, p: 1.5, mb: 1.5 }}>
    <Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 1, color: "text.secondary" }}>
      {asset.asset_role}
      {asset.asset_code ? ` — ${asset.asset_code}` : ""}
      {asset.asset_type_name && !STANDARD_ROLE_SET.has(asset.asset_role)
        ? ` (${asset.asset_type_name})`
        : ""}
    </Typography>
    <AssetTextField label="Name" field="asset_name" asset={asset} onAssetChange={onAssetChange} />
    <AssetTextField label="Serial Number" field="serial_number" asset={asset} onAssetChange={onAssetChange} />
    <AssetSelectField label="Status" field="status" asset={asset} onAssetChange={onAssetChange} options={ASSET_STATUSES} />
    <AssetSelectField label="Warranty Status" field="warranty_status" asset={asset} onAssetChange={onAssetChange} options={WARRANTY_STATUSES} />
    <AssetTextField label="Warranty Expiry Date" field="warranty_expiry_date" asset={asset} onAssetChange={onAssetChange} type="date" />
  </Box>
);

function EditDialog({ open, onClose, data, onSaved }) {
  const [tab, setTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [error, setError] = useState("");
  const [ws, setWs] = useState({});
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    if (!open || !data) return;
    setTab(0);
    setError("");

    const toDateInput = (v) => {
      if (!v) return "";

      if (typeof v === "string") {
        // Parse ISO string as Date (handles timezone conversion automatically)
        const date = new Date(v);
        if (isNaN(date.getTime())) {
          // Fallback: extract date portion if parsing fails
          const match = v.match(/(\d{4}-\d{2}-\d{2})/);
          return match ? match[1] : "";
        }
        // Format as YYYY-MM-DD in local timezone to avoid browser interpretation issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
      return "";
    };

    setWs({
      assigned_user: data.assigned_user ?? "",
      employee_number: data.employee_number ?? "",
      team: data.team ?? "",
      location: data.location ?? "",
      date_assigned: toDateInput(data.date_assigned),
      device_category: data.device_category ?? "",
      device_name: data.device_name ?? "",
      model: data.model ?? "",
      device_status: data.device_status ?? "Active",
      supplier: data.supplier ?? "",
      notes: data.notes ?? "",
      accountability_form: data.accountability_form ?? "",
      memory: data.memory ?? "",
      motherboard: data.motherboard ?? "",
      storage: data.storage ?? "",
    });

    const fetchAssets = async () => {
      setLoadingAssets(true);
      try {
        const res = await api.get(`/api/workstations/${data.device_id}/assets`);
        setAssets(res.data.assets || []);
      } catch (err) {
        console.error("Failed to load workstation assets:", err);
        setError("Failed to load asset details. You can still edit workstation fields.");
        setAssets([]);
      } finally {
        setLoadingAssets(false);
      }
    };
    fetchAssets();
  }, [open, data]);

  const handleWsChange = useCallback((field, value) =>
    setWs((prev) => ({ ...prev, [field]: value })), []);

  const handleAssetChange = useCallback((assetId, field, value) =>
    setAssets((prev) =>
      prev.map((a) => (a.asset_id === assetId ? { ...a, [field]: value } : a))
    ), []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await api.put(`/api/workstations/${data.device_id}/full`, {
        ...ws,
        assets: assets.map(({ asset_id, asset_name, serial_number, status, warranty_status, warranty_expiry_date }) => ({
          asset_id,
          asset_name: asset_name || null,
          serial_number: serial_number || null,
          status: status || "Active",
          warranty_status: warranty_status || "Valid",
          warranty_expiry_date: warranty_expiry_date || null,
        })),
      });
      onSaved();
      onClose();
    } catch (err) {
      console.error("Save error:", err);
      setError(err.response?.data?.error || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!data) return null;

  // Partitioned assets
  const standardAssets = assets.filter((a) => STANDARD_ROLE_SET.has(a.asset_role));
  const otherAssets = assets.filter((a) => !STANDARD_ROLE_SET.has(a.asset_role));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Edit Workstation — DEV-{String(data.device_id).padStart(5, "0")}
      </DialogTitle>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3, borderBottom: "1px solid #e0e0e0" }}>
        <Tab label="Basic Info" />
        <Tab label="Hardware" />
        <Tab label="Peripherals" />
        <Tab label="Other Peripherals" />
      </Tabs>

      <DialogContent dividers sx={{ minHeight: 420 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

        {/* Tab 0: Basic Info */}
        {tab === 0 && (
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Typography variant="subtitle2" sx={{ gridColumn: "1/-1", fontWeight: 700, mb: 0.5 }}>Employee Information</Typography>
            <WsTextField label="Assigned User" field="assigned_user" ws={ws} onWsChange={handleWsChange} />
            <WsTextField label="Employee Number" field="employee_number" ws={ws} onWsChange={handleWsChange} />
            <WsSelectField label="Team" field="team" ws={ws} onWsChange={handleWsChange} options={TEAMS} />
            <WsSelectField label="Location" field="location" ws={ws} onWsChange={handleWsChange} options={LOCATIONS} />
            <WsTextField label="Date Assigned" field="date_assigned" ws={ws} onWsChange={handleWsChange} type="date" />
            <Box /> 

            <Typography variant="subtitle2" sx={{ gridColumn: "1/-1", fontWeight: 700, mt: 1, mb: 0.5 }}>Device Information</Typography>
            <WsSelectField label="Device Category" field="device_category" ws={ws} onWsChange={handleWsChange} options={DEVICE_CATEGORIES} />
            <WsTextField label="Device Name" field="device_name" ws={ws} onWsChange={handleWsChange} />
            <WsTextField label="Model" field="model" ws={ws} onWsChange={handleWsChange} />
            <WsSelectField label="Device Status" field="device_status" ws={ws} onWsChange={handleWsChange} options={DEVICE_STATUSES} />
            <WsTextField label="Supplier" field="supplier" ws={ws} onWsChange={handleWsChange} />
            <WsTextField label="Accountability Form" field="accountability_form" ws={ws} onWsChange={handleWsChange} />
            <TextField
              fullWidth multiline rows={3} size="small" label="Notes"
              value={ws.notes ?? ""}
              onChange={(e) => handleWsChange("notes", e.target.value)}
              sx={{ mb: 1.5, gridColumn: "1/-1" }}
            />
          </Box>
        )}

        {/* Tab 1: Hardware */}
        {tab === 1 && (
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <WsTextField label="Memory" field="memory" ws={ws} onWsChange={handleWsChange} />
            <WsTextField label="Motherboard" field="motherboard" ws={ws} onWsChange={handleWsChange} />
            <WsTextField label="Storage" field="storage" ws={ws} onWsChange={handleWsChange} />
          </Box>
        )}

        {/* Tab 2: Peripherals (standard roles) */}
        {tab === 2 && (
          <Box>
            {loadingAssets ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={32} />
              </Box>
            ) : standardAssets.length === 0 ? (
              <Alert severity="info">No standard peripheral assets linked to this workstation.</Alert>
            ) : (
              standardAssets.map((asset) => (
                <AssetCard key={asset.asset_id} asset={asset} onAssetChange={handleAssetChange} />
              ))
            )}
          </Box>
        )}

        {/* Tab 3: Other Peripherals */}
        {tab === 3 && (
          <Box>
            {loadingAssets ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={32} />
              </Box>
            ) : otherAssets.length === 0 ? (
              <Alert severity="info">
                No other peripherals linked to this workstation.
                <br />
                <Typography variant="caption" color="text.secondary">
                  Other peripherals can be added when creating a new record.
                </Typography>
              </Alert>
            ) : (
              otherAssets.map((asset) => (
                <AssetCard key={asset.asset_id} asset={asset} onAssetChange={handleAssetChange} />
              ))
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? <><CircularProgress size={16} sx={{ mr: 1 }} />Saving…</> : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

function AdminAssetsOverview() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("workstation");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [workstationRows, setWorkstationRows] = useState([]);
  const [workstationPaginationModel, setWorkstationPaginationModel] = useState({ pageSize: 10, page: 0 });
  const [workstationSelectionModel, setWorkstationSelectionModel] = useState({ type: "include", ids: new Set() });

  const [assetRows, setAssetRows] = useState([]);
  const [assetPaginationModel, setAssetPaginationModel] = useState({ pageSize: 10, page: 0 });
  const [assetSelectionModel, setAssetSelectionModel] = useState({ type: "include", ids: new Set() });

  const [viewDialog, setViewDialog] = useState({ open: false, data: null });
  const [editDialog, setEditDialog] = useState({ open: false, data: null });


  const fetchWorkstations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/workstations");
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
          date_assigned_display: ws.date_assigned ? formatDate(ws.date_assigned) : "",
          accountability_form: sanitizeTextField(ws.accountability_form),
          device_status: ws.device_status,
          processor_code: ws.processor_code,
          processor_serial: ws.processor_serial,
          processor: ws.processor,
          processor_status: ws.processor_status,
          memory: ws.memory,
          motherboard: ws.motherboard,
          storage: ws.storage,
          monitor1_code: ws.monitor1_code,
          monitor1_serial: ws.monitor1_serial,
          monitor1: ws.monitor1,
          monitor1_asset_type: ws.monitor1_asset_type,
          monitor1_status: ws.monitor1_status,
          monitor1_warranty_status: ws.monitor1_warranty_status,
          monitor1_warranty_expiry: ws.monitor1_warranty_expiry ? formatDate(ws.monitor1_warranty_expiry) : "",
          monitor2_code: ws.monitor2_code,
          monitor2_serial: ws.monitor2_serial,
          monitor2: ws.monitor2,
          monitor2_asset_type: ws.monitor2_asset_type,
          monitor2_status: ws.monitor2_status,
          monitor2_warranty_status: ws.monitor2_warranty_status,
          monitor2_warranty_expiry: ws.monitor2_warranty_expiry ? formatDate(ws.monitor2_warranty_expiry) : "",
          keyboard_code: ws.keyboard_code,
          keyboard_serial: ws.keyboard_serial,
          keyboard: ws.keyboard,
          keyboard_asset_type: ws.keyboard_asset_type,
          keyboard_status: ws.keyboard_status,
          keyboard_warranty_status: ws.keyboard_warranty_status,
          keyboard_warranty_expiry: ws.keyboard_warranty_expiry ? formatDate(ws.keyboard_warranty_expiry) : "",
          mouse_code: ws.mouse_code,
          mouse_serial: ws.mouse_serial,
          mouse: ws.mouse,
          mouse_asset_type: ws.mouse_asset_type,
          mouse_status: ws.mouse_status,
          mouse_warranty_status: ws.mouse_warranty_status,
          mouse_warranty_expiry: ws.mouse_warranty_expiry ? formatDate(ws.mouse_warranty_expiry) : "",
          headset_code: ws.headset_code,
          headset_serial: ws.headset_serial,
          headset: ws.headset,
          headset_asset_type: ws.headset_asset_type,
          headset_status: ws.headset_status,
          headset_warranty_status: ws.headset_warranty_status,
          headset_warranty_expiry: ws.headset_warranty_expiry ? formatDate(ws.headset_warranty_expiry) : "",
          webcam_code: ws.webcam_code,
          webcam_serial: ws.webcam_serial,
          webcam: ws.webcam,
          webcam_asset_type: ws.webcam_asset_type,
          webcam_status: ws.webcam_status,
          webcam_warranty_status: ws.webcam_warranty_status,
          webcam_warranty_expiry: ws.webcam_warranty_expiry ? formatDate(ws.webcam_warranty_expiry) : "",
          supplier: sanitizeTextField(ws.supplier),
          notes: sanitizeTextField(ws.notes),
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

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/assets");
      const data = response.data.assets || response.data;

      if (Array.isArray(data) && data.length > 0) {
        const transformedRows = data.map((a, index) => ({
          id: a.workstation_asset_id || index,
          workstation_asset_id: a.workstation_asset_id,
          device_id: a.device_id,
          device_name: a.device_name,
          employee_id: a.employee_id,
          employee_name: a.employee_name,
          employee_number: a.employee_number,
          team: a.team,
          asset_role: a.asset_role,
          asset_id: a.asset_id,
          asset_code: a.asset_code,
          serial_number: a.serial_number,
          asset_name: a.asset_name,
          asset_type_name: a.asset_type_name,
          warranty_status: a.warranty_status,
          warranty_expiry_date: a.warranty_expiry_date,
          assigned_at: a.assigned_at ? formatDateTime(a.assigned_at) : "",
          removed_at: a.removed_at ? formatDateTime(a.removed_at) : "",
        }));
        setAssetRows(transformedRows);
        setError("");
      } else {
        setAssetRows([]);
        setError("No workstation asset records found");
      }
    } catch (err) {
      console.error("Error fetching workstation assets:", err);
      setError("Failed to fetch workstation asset data");
      setAssetRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "workstation") fetchWorkstations();
    else fetchAssets();
  }, [activeTab, fetchWorkstations, fetchAssets]);

  // Toolbar callbacks 
  const handleToolbarAdd = useCallback(() => navigate("/admin/assets/new"), [navigate]);
  const handleToolbarView = useCallback((row) => setViewDialog({ open: true, data: row }), []);
  const handleToolbarEdit = useCallback((row) => setEditDialog({ open: true, data: row }), []);

  // Double-click → View (read-only)
  const handleRowDoubleClick = useCallback((params) => {
    if (activeTab === "workstation") setViewDialog({ open: true, data: params.row });
  }, [activeTab]);

  const handleDeleteWorkstations = useCallback(async (ids) => {
    if (!window.confirm(`Delete ${ids.length} workstation(s)?`)) return;
    try {
      for (const id of ids) await api.delete(`/api/workstations/${id}`);
      fetchWorkstations();
      setError("");
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete workstation(s)");
    }
  }, [fetchWorkstations]);

  const handleToolbarDelete = useCallback((ids) => {
    handleDeleteWorkstations(ids);
  }, [handleDeleteWorkstations]);

  // Column definitions
  const fullWorkstationColumns = getFullWorkstationColumns(getStatusColor);
  const assetViewColumns = getAssetViewColumns(getWarrantyStatusColor);

  return (
    <div className="Assets-overview">
      <NavigationBar />

      <div className="Main-content">
        <div className="Sidebar-placeholder">
          <Sidebar />
        </div>

        <div className="content">
          <div className="Assets-overview-container">

            <div className="Assets-overview-header">
              <h1>Asset Management</h1>
            </div>

            <div className="Assets-tabs">
              <button
                className={`Assets-tab ${activeTab === "workstation" ? "Assets-tab--active" : ""}`}
                onClick={() => setActiveTab("workstation")}
              >
                Full Workstation View
              </button>
              <button
                className={`Assets-tab ${activeTab === "asset" ? "Assets-tab--active" : ""}`}
                onClick={() => setActiveTab("asset")}
              >
                Workstation's Assets View
              </button>
            </div>

            {error && (
              <Alert severity="error" onClose={() => setError("")}>{error}</Alert>
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
                        onView: handleToolbarView,
                        onEdit: handleToolbarEdit,
                        onDelete: handleToolbarDelete,
                      },
                    }}
                    sx={{
                      border: "1px solid #aeacac",
                      "& .MuiDataGrid-cell": { overflow: "visible", padding: "0px 12px" },
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
                    slots={{ toolbar: CustomToolbar }}
                    slotProps={{
                      toolbar: {
                        selectedIds: [...assetSelectionModel.ids],
                        rows: assetRows,
                        activeTab,
                      },
                    }}
                    sx={{
                      border: "1px solid #aeacac",
                      "& .MuiDataGrid-cell": { overflow: "visible", padding: "0px 12px" },
                    }}
                    loading={loading}
                  />
                </Box>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* View Dialog (read-only, double-click or View button) */}
      <ViewDialog
        open={viewDialog.open}
        data={viewDialog.data}
        onClose={() => setViewDialog({ open: false, data: null })}
      />

      {/* Edit Dialog (multi-tab, full save) */}
      <EditDialog
        open={editDialog.open}
        data={editDialog.data}
        onClose={() => setEditDialog({ open: false, data: null })}
        onSaved={fetchWorkstations}
      />
    </div>
  );
}

export default AdminAssetsOverview;