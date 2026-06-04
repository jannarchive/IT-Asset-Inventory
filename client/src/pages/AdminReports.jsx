import React, { useEffect, useState, useMemo, useCallback } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
    BarChart,
    Bar,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    MenuItem,
    Paper,
    TextField,
    Typography,
} from "@mui/material";
import PdfIcon from "@mui/icons-material/PictureAsPdf";
import RefreshIcon from "@mui/icons-material/Refresh";
import logo from '../assets/LinkedBPO-logo.png';
import NavigationBar from "../components/NavigationBar.jsx";
import Sidebar from "../components/Sidebar.jsx";
import { formatDate, formatDateTime } from "../utils/DateUtil.jsx";
import api from "../api.js";
import "../styles/AdminReports.css";

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
    "January", "February", "March", "April",
    "May", "June", "July", "August",
    "September", "October", "November", "December",
];

const YEAR_COUNT = 5;
const BAR_COLORS = ["#0063A5", "#0097C2", "#4D7A15", "#FFD703", "#C43C3C", "#8A56A5"];
const PDF_MARGIN = 14;
const PDF_PAGE_WIDTH = 297;

const INITIAL_STATS = {
    totalAssets: 0,
    activeAssets: 0,
    inStorageAssets: 0,
    defectiveAssets: 0,
    incompleteWorkstations: 0,
};

// ─── Component ────────────────────────────────────────────────────────────────

function AdminReports() {
    const now = new Date();
    const currentYear = now.getFullYear();

    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [stats, setStats] = useState(INITIAL_STATS);
    const [assets, setAssets] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // ── Data fetching ──────────────────────────────────────────────────────────

    const fetchReportData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [statsResponse, assetsResponse, activitiesResponse] = await Promise.all([
                api.get("/api/dashboard/stats"),
                api.get("/api/assets"),
                api.get("/api/dashboard/recent-activities?limit=100"),
            ]);

            setStats(statsResponse.data?.data ?? INITIAL_STATS);
            setAssets(assetsResponse.data?.assets ?? []);
            setActivities(activitiesResponse.data?.data ?? []);
        } catch (err) {
            console.error("Failed to load report data:", err);
            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Failed to load report data."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReportData();
    }, [fetchReportData]);

    // ── Derived labels ─────────────────────────────────────────────────────────

    const reportMonthLabel = `${MONTHS[selectedMonth - 1]} ${selectedYear}`;
    const reportGeneratedOn = formatDateTime(new Date().toISOString());

    // ── Memoised data ──────────────────────────────────────────────────────────

    const periodAssets = useMemo(
        () =>
            assets.filter((asset) => {
                if (!asset.created_at) return false;
                const date = new Date(asset.created_at);
                return (
                    date.getFullYear() === selectedYear &&
                    date.getMonth() + 1 === selectedMonth
                );
            }),
        [assets, selectedMonth, selectedYear]
    );

    const summary = useMemo(() => {
        const warrantyExpired = assets.filter((asset) => {
            if (!asset.warranty_expiry_date) return false;
            return new Date(asset.warranty_expiry_date) < new Date();
        }).length;

        return {
            totalAssets: stats.totalAssets || 0,
            activeAssets: stats.activeAssets || 0,
            // Normalise both possible key names from the API
            inStorageAssets: stats.inStorageAssets ?? stats.instorageAssets ?? 0,
            defectiveAssets: stats.defectiveAssets || 0,
            newlyAddedAssets: periodAssets.length,
            warrantyExpired,
        };
    }, [stats, periodAssets, assets]);

    const summaryItems = [
        { label: "Total Assets", value: summary.totalAssets },
        { label: "Newly Added", value: summary.newlyAddedAssets },
        { label: "Active", value: summary.activeAssets },
        { label: "In Storage", value: summary.inStorageAssets },
        { label: "Defective", value: summary.defectiveAssets },
        { label: "Warranty Expired", value: summary.warrantyExpired },
    ];

    const chartData = summaryItems.map((item) => ({
        category: item.label,
        value: item.value,
    }));

    const warrantyAlerts = useMemo(() => {
        const nowDate = new Date();
        const next30Days = new Date(nowDate.getTime() + 30 * 24 * 60 * 60 * 1000);

        return assets
            .filter((asset) => {
                if (!asset.warranty_expiry_date) return false;
                return new Date(asset.warranty_expiry_date) <= next30Days;
            })
            .sort(
                (a, b) =>
                    new Date(a.warranty_expiry_date) - new Date(b.warranty_expiry_date)
            );
    }, [assets]);

    const activityLog = useMemo(
        () =>
            activities
                .filter((activity) => {
                    const date = new Date(activity.created_at);
                    return (
                        !Number.isNaN(date.getTime()) &&
                        date.getFullYear() === selectedYear &&
                        date.getMonth() + 1 === selectedMonth
                    );
                })
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
        [activities, selectedMonth, selectedYear]
    );

    // ── Handlers ───────────────────────────────────────────────────────────────

    // Aliased so the button's onClick stays semantically clear
    const handleGenerateReport = fetchReportData;

    // ── PDF generation ─────────────────────────────────────────────────────────

    const PDF_PAGE_WIDTH = 210;

    const handleExportPdf = useCallback(() => {
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        let cursorY = PDF_MARGIN;

        const addHeader = () => {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(18);
            doc.setTextColor(0, 99, 165);
            doc.text("MONTHLY REPORT SUMMARY", PDF_MARGIN, cursorY);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(118, 114, 114);
            doc.text("IT Asset Inventory Summary", PDF_MARGIN, cursorY + 7);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text(`Generated On: ${reportGeneratedOn}`, PDF_MARGIN, cursorY + 15);
            doc.text(`Report Period: ${reportMonthLabel}`, PDF_MARGIN, cursorY + 22);

            const logoWidth = 40;
            const logoHeight = 13;
            const logoX = PDF_PAGE_WIDTH - PDF_MARGIN - logoWidth;
            const logoY = cursorY - 4;

            doc.addImage(
                logo,
                "PNG",
                logoX,
                logoY,
                logoWidth,
                logoHeight
            );
         
            cursorY += 30;
        };

        const addSummaryTable = () => {
            autoTable(doc, {
                startY: cursorY,
                head: [["Metric", "Count"]],
                body: summaryItems.map((item) => [item.label, item.value]),
                theme: "grid",
                headStyles: { fillColor: [0, 99, 165], textColor: 255, fontStyle: "bold", font: "helvetica" },
                styles: { fontSize: 9, cellPadding: 3, halign: "left", font: "helvetica" },
                columnStyles: {
                    0: { cellWidth: 120 },
                    1: { cellWidth: 40 },
                },
                margin: { left: PDF_MARGIN, right: PDF_MARGIN },
            });
            cursorY = doc.lastAutoTable.finalY + 10;
        };

        const addSummaryChart = () => {
            const chartX = PDF_MARGIN;
            const chartWidth = PDF_PAGE_WIDTH - PDF_MARGIN * 2;
            const chartHeight = 40;
            const baseY = cursorY + chartHeight - 8;
            const maxValue = Math.max(...chartData.map((item) => item.value), 1);
            const barSpace = 6;
            const barWidth = (chartWidth - barSpace * (chartData.length + 1)) / chartData.length;

            doc.setFont("helvetica", "bold");
            doc.setFontSize(13);
            doc.setTextColor(0, 99, 165);
            doc.text("Inventory Summary Chart", chartX, cursorY);
            cursorY += 6;

            doc.setLineWidth(0.15);
            doc.setDrawColor(200, 200, 200);
            doc.line(chartX, baseY, chartX + chartWidth, baseY);

            chartData.forEach((item, index) => {
                const barHeight = (item.value / maxValue) * (chartHeight - 20);
                const x = chartX + barSpace + index * (barWidth + barSpace);
                const y = baseY - barHeight;
                const hex = BAR_COLORS[index % BAR_COLORS.length];
                const rgb = hex
                    .match(/#(..)(..)(..)/)
                    .slice(1)
                    .map((v) => parseInt(v, 16));

                doc.setFillColor(...rgb);
                doc.rect(x, y, barWidth, barHeight, "F");
                doc.setFont("helvetica", "normal");
                doc.setFontSize(7);
                doc.text(String(item.value), x + barWidth / 2, y - 2, { align: "center" });
                doc.text(item.category, x + barWidth / 2, baseY + 7, {
                    align: "center",
                    maxWidth: barWidth + 4,
                });
            });

            cursorY += chartHeight + 12;
        };

        const addWarrantyAlerts = () => {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(13);
            doc.setTextColor(0, 99, 165);
            doc.text("Warranty Alerts", PDF_MARGIN, cursorY);
            doc.setTextColor(0, 0, 0);
            cursorY += 8;

            if (warrantyAlerts.length === 0) {
                doc.setFont("helvetica", "normal");
                doc.setFontSize(8);
                doc.text(
                    "No assets with recently expired or near-expiry warranties.",
                    PDF_MARGIN,
                    cursorY
                );
                cursorY += 8;
                return;
            }

            autoTable(doc, {
                startY: cursorY,
                head: [[
                    "Asset Code", "Asset Type", "Assigned User",
                    "Team", "Warranty Expiry", "Status",
                ]],
                body: warrantyAlerts.map((asset) => [
                    asset.asset_code || "—",
                    asset.asset_type_name || "—",
                    asset.employee_name || "—",
                    asset.team || "—",
                    formatDate(asset.warranty_expiry_date),
                    asset.warranty_status || "—",
                ]),
                theme: "grid",
                headStyles: { fillColor: [0, 99, 165], textColor: 255, fontStyle: "bold", font: "helvetica" },
                styles: { fontSize: 7, cellPadding: 2, halign: "left", font: "helvetica" },
                columnStyles: {
                    0: { cellWidth: 25 },
                    1: { cellWidth: 28 },
                    2: { cellWidth: 35 },
                    3: { cellWidth: 25 },
                    4: { cellWidth: 30 },
                    5: { cellWidth: 27 },
                },
                margin: { left: PDF_MARGIN, right: PDF_MARGIN },
                showHead: "everyPage",
            });
            cursorY = doc.lastAutoTable.finalY + 10;
        };

        const addActivityLog = () => {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(13);
            doc.setTextColor(0, 99, 165);
            doc.text("Detailed Activity Log", PDF_MARGIN, cursorY);
            doc.setTextColor(0, 0, 0);
            cursorY += 8;

            if (activityLog.length === 0) {
                doc.setFont("helvetica", "normal");
                doc.setFontSize(8);
                doc.text("No activity log entries found for this period.", PDF_MARGIN, cursorY);
                cursorY += 8;
                return;
            }

            autoTable(doc, {
                startY: cursorY,
                head: [["Date & Time", "Activity Type", "Description", "Performed By"]],
                body: activityLog.map((activity) => [
                    formatDateTime(activity.created_at),
                    activity.action_type_name || "—",
                    activity.description || "—",
                    activity.performed_by || "—",
                ]),
                theme: "grid",
                headStyles: { fillColor: [0, 99, 165], textColor: 255, fontStyle: "bold", font: "helvetica" },
                styles: { fontSize: 7, cellPadding: 2, halign: "left", font: "helvetica" },
                columnStyles: {
                    0: { cellWidth: 32 },
                    1: { cellWidth: 28 },
                    2: { cellWidth: 82 },
                    3: { cellWidth: 30 },
                },
                margin: { left: PDF_MARGIN, right: PDF_MARGIN },
                showHead: "everyPage",
            });
        };

        addHeader();
        addSummaryTable();
        addSummaryChart();
        addWarrantyAlerts();
        addActivityLog();

        doc.save(`IT-Asset-Inventory-${reportMonthLabel.replace(/\s+/g, "-")}.pdf`);
    }, [activityLog, chartData, reportGeneratedOn, reportMonthLabel, summaryItems, warrantyAlerts]);

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="Reports">
            <NavigationBar />

            <div className="Main-content">
                <div className="Sidebar-placeholder">
                    <Sidebar />
                </div>

                <div className="content">
                    <div className="Reports-container">
                        <div className="Reports-header">
                            <h1>Reports</h1>
                            <div className="Report-actions">
                                <TextField
                                    select
                                    label="Month"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                    size="small"
                                    sx={{ minWidth: 140, mr: 1 }}
                                >
                                    {MONTHS.map((month, index) => (
                                        <MenuItem key={month} value={index + 1}>
                                            {month}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                    select
                                    label="Year"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    size="small"
                                    sx={{ minWidth: 100, mr: 1 }}
                                >
                                    {Array.from({ length: YEAR_COUNT }, (_, index) => currentYear - index).map(
                                        (year) => (
                                            <MenuItem key={year} value={year}>
                                                {year}
                                            </MenuItem>
                                        )
                                    )}
                                </TextField>
                                <Button
                                    variant="outlined"
                                    startIcon={<RefreshIcon />}
                                    onClick={handleGenerateReport}
                                    sx={{ mr: 1 }}
                                >
                                    Generate Report
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<PdfIcon />}
                                    onClick={handleExportPdf}
                                >
                                    Export PDF
                                </Button>
                            </div>
                        </div>

                        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                        {loading ? (
                            <Box className="Report-loading">
                                <CircularProgress />
                            </Box>
                        ) : (
                            <div className="Report-preview" id="ReportPrintArea">
                                <Paper className="Report-paper" elevation={3}>
                                    <Box className="Report-topbar">
                                        <Box>
                                            <Typography variant="h4" className="Report-doc-title">
                                                MONTHLY REPORT SUMMARY
                                            </Typography>
                                            <Typography className="Report-doc-subtitle">
                                                IT Asset Inventory Summary
                                            </Typography>
                                        </Box>
                                        <img src={logo} alt="Company Logo" className="Report-logo" />
                                    </Box>

                                    <Box className="Report-metadata">
                                        <Box>
                                            <Typography className="Report-metadata-label">Generated On</Typography>
                                            <Typography>{reportGeneratedOn}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography className="Report-metadata-label">Month</Typography>
                                            <Typography>{reportMonthLabel}</Typography>
                                        </Box>
                                    </Box>

                                    <Box className="Report-section Report-summary-section">
                                        <Typography variant="h6">Inventory Summary</Typography>
                                        <Box className="Summary-grid">
                                            <Paper className="Summary-card">
                                                <Typography className="Summary-card-label">Total Assets</Typography>
                                                <Typography className="Summary-card-value">{summary.totalAssets}</Typography>
                                            </Paper>
                                            <Paper className="Summary-card">
                                                <Typography className="Summary-card-label">Newly Added Assets</Typography>
                                                <Typography className="Summary-card-value">{summary.newlyAddedAssets}</Typography>
                                            </Paper>
                                            <Paper className="Summary-card">
                                                <Typography className="Summary-card-label">Active Assets</Typography>
                                                <Typography className="Summary-card-value">{summary.activeAssets}</Typography>
                                            </Paper>
                                            <Paper className="Summary-card">
                                                <Typography className="Summary-card-label">In Storage Assets</Typography>
                                                <Typography className="Summary-card-value">{summary.inStorageAssets}</Typography>
                                            </Paper>
                                            <Paper className="Summary-card">
                                                <Typography className="Summary-card-label">Defective Assets</Typography>
                                                <Typography className="Summary-card-value">{summary.defectiveAssets}</Typography>
                                            </Paper>
                                            <Paper className="Summary-card">
                                                <Typography className="Summary-card-label">Warranty Expired</Typography>
                                                <Typography className="Summary-card-value">{summary.warrantyExpired}</Typography>
                                            </Paper>
                                        </Box>
                                    </Box>

                                    <Box className="Report-section Report-chart-section">
                                        <Typography variant="h6">Inventory Summary Chart</Typography>
                                        <Box className="Chart-wrapper">
                                            <ResponsiveContainer width="100%" height={320}>
                                                <BarChart data={chartData} margin={{ top: 24, right: 20, left: 0, bottom: 20 }}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="category" interval={0} angle={-15} textAnchor="end" height={30} />
                                                    <YAxis allowDecimals={false} />
                                                    <Tooltip />
                                                    <Bar dataKey="value">
                                                        {chartData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </Box>
                                    </Box>

                                    <Box className="Report-section">
                                        <Typography variant="h6">Warranty Alerts</Typography>
                                        {warrantyAlerts.length === 0 ? (
                                            <Typography className="Report-empty">No assets with recently expired or near-expiry warranties.</Typography>
                                        ) : (
                                            <div className="Report-table-wrapper">
                                                <table className="Report-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Asset Code</th>
                                                            <th>Asset Type</th>
                                                            <th>Assigned User</th>
                                                            <th>Team</th>
                                                            <th>Warranty Expiry Date</th>
                                                            <th>Warranty Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {warrantyAlerts.map((asset) => (
                                                            <tr key={`${asset.workstation_asset_id}-${asset.asset_id}`}>
                                                                <td>{asset.asset_code || "—"}</td>
                                                                <td>{asset.asset_type_name || "—"}</td>
                                                                <td>{asset.employee_name || "—"}</td>
                                                                <td>{asset.team || "—"}</td>
                                                                <td>{formatDate(asset.warranty_expiry_date)}</td>
                                                                <td>{asset.warranty_status || "—"}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </Box>

                                    <Box className="Report-section">
                                        <Typography variant="h6">Detailed Activity Log</Typography>
                                        {activityLog.length === 0 ? (
                                            <Typography className="Report-empty">No activity log entries found for this period.</Typography>
                                        ) : (
                                            <div className="Report-table-wrapper">
                                                <table className="Report-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Date &amp; Time</th>
                                                            <th>Activity Type</th>
                                                            <th>Description</th>
                                                            <th>Performed By</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {activityLog.map((activity) => (
                                                            <tr key={activity.activity_log_id}>
                                                                <td>{formatDateTime(activity.created_at)}</td>
                                                                <td>{activity.action_type_name || "—"}</td>
                                                                <td>{activity.description || "—"}</td>
                                                                <td>{activity.performed_by || "—"}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </Box>
                                </Paper>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminReports;