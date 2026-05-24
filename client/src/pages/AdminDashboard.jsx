import React, { useState, useEffect } from "react";

import MonitorRoundedIcon from "@mui/icons-material/MonitorRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import RemoveFromQueueRoundedIcon from "@mui/icons-material/RemoveFromQueueRounded";

import NavigationBar from "../components/NavigationBar.jsx";
import Sidebar from "../components/Sidebar.jsx";
import DashboardStatusCard from "../components/DashboardStatusCard.jsx";
import BarGraph from "../components/BarGraph.jsx";
import api from "../api.js"; // shared axios instance — auth token attached automatically
import "../styles/AdminDashboard.css";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_CONFIG = [
  {
    key: "totalAssets",
    label: "Total Assets",
    icon: <MonitorRoundedIcon />,
    color: "#3498db",
  },
  {
    key: "activeAssets",
    label: "Active Assets",
    icon: <CheckRoundedIcon />,
    color: "#2ecc71",
  },
  {
    key: "defectiveAssets",
    label: "Defective Assets",
    icon: <CloseRoundedIcon />,
    color: "#e74c3c",
  },
  {
    key: "incompleteWorkstations",
    label: "Incomplete Workstations",
    icon: <RemoveFromQueueRoundedIcon />,
    color: "#f39c12",
  },
];

const ACTIVITY_LIMIT = 10;

/** Formats a timestamp string for display. */
function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString("en-PH");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function AdminDashboard() {
  // -- State -----------------------------------------------------------------
  const [stats, setStats] = useState({
    totalAssets: 0,
    activeAssets: 0,
    defectiveAssets: 0,
    incompleteWorkstations: 0,
  });
  const [assetTypes, setAssetTypes] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  // Independent loading/error state per section so one failure never hides another.
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingAssetTypes, setLoadingAssetTypes] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [errorStats, setErrorStats] = useState(null);
  const [errorAssetTypes, setErrorAssetTypes] = useState(null);
  const [errorActivities, setErrorActivities] = useState(null);

  // -- Live clock ------------------------------------------------------------
  const date = new Date().toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString("en-PH"),
  );

  useEffect(() => {
    const timer = setInterval(
      () => setCurrentTime(new Date().toLocaleTimeString("en-PH")),
      1000,
    );
    return () => clearInterval(timer);
  }, []);

  // -- Data fetching ---------------------------------------------------------
  /**
   * Each endpoint has its own try/catch so a failure in one section never
   * prevents the other two from rendering. All three requests fire in parallel.
   *
   * Auth token is attached automatically by the api.js interceptor —
   * no manual header config needed here.
   */
  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      setErrorStats(null);
      try {
        const res = await api.get("/api/dashboard/stats");
        if (res.data.success) setStats(res.data.data);
      } catch (err) {
        console.error("[AdminDashboard] fetchStats:", err);
        setErrorStats(
          err.response?.data?.message ?? "Failed to load status cards.",
        );
      } finally {
        setLoadingStats(false);
      }
    };

    const fetchAssetTypes = async () => {
      setLoadingAssetTypes(true);
      setErrorAssetTypes(null);
      try {
        const res = await api.get("/api/dashboard/asset-types");
        if (res.data.success) setAssetTypes(res.data.data);
      } catch (err) {
        console.error("[AdminDashboard] fetchAssetTypes:", err);
        setErrorAssetTypes(
          err.response?.data?.message ?? "Failed to load chart data.",
        );
      } finally {
        setLoadingAssetTypes(false);
      }
    };

    const fetchActivities = async () => {
      setLoadingActivities(true);
      setErrorActivities(null);
      try {
        const res = await api.get(
          `/api/dashboard/recent-activities?limit=${ACTIVITY_LIMIT}`,
        );
        if (res.data.success) setRecentActivities(res.data.data);
      } catch (err) {
        console.error("[AdminDashboard] fetchActivities:", err);
        setErrorActivities(
          err.response?.data?.message ?? "Failed to load recent activities.",
        );
      } finally {
        setLoadingActivities(false);
      }
    };

    // Fire all three in parallel; each handles its own error independently.
    Promise.allSettled([fetchStats(), fetchAssetTypes(), fetchActivities()]);
  }, []);

  // -- Render ----------------------------------------------------------------
  return (
    <div className="Admin-dashboard">
      <NavigationBar />

      <div className="Main-content">
        <div className="Sidebar-placeholder">
          <Sidebar />
        </div>

        <div className="content">
          <div className="Dashboard-container">
            {/* Header */}
            <div className="Dashboard-header">
              <div className="Date-container">
                <h1>Dashboard</h1>
                <h4>
                  {date} — {currentTime}
                </h4>
              </div>
            </div>

            {/* Status cards */}
            <div className="Data-panels">
              <div className="Status-panel-container">
                <div className="Status-card-container">
                  {loadingStats ? (
                    <div className="loading-placeholder">
                      Loading status cards…
                    </div>
                  ) : errorStats ? (
                    <div className="error-banner">
                      <strong>Error:</strong> {errorStats}
                    </div>
                  ) : (
                    STATUS_CONFIG.map(({ key, label, icon, color }) => (
                      <DashboardStatusCard
                        key={key}
                        status={label}
                        count={stats[key]}
                        icon={icon}
                        statusColor={color}
                        className={`card-${key}`}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Bar graph — receives data as a prop, no internal fetch */}
            <div className="chart-section">
              <BarGraph
                data={assetTypes}
                loading={loadingAssetTypes}
                error={errorAssetTypes}
              />
            </div>

            {/* Recent activity table */}
            <div className="recent-activity-section">
              <h3>Recent Activity</h3>

              {loadingActivities ? (
                <div className="loading-placeholder">
                  Loading recent activities…
                </div>
              ) : errorActivities ? (
                <div className="error-banner">
                  <strong>Error:</strong> {errorActivities}
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="empty-state">No recent activities found.</div>
              ) : (
                <table className="activity-table">
                  <thead>
                    <tr>
                      <th>Log ID</th>
                      <th>Date of Action</th>
                      <th>Device ID</th>
                      <th>Action Type</th>
                      <th>Description</th>
                      <th>Performed By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivities.map((activity) => (
                      <tr key={activity.activity_log_id}>
                        <td>{activity.activity_log_id}</td>
                        <td>{formatDate(activity.created_at)}</td>
                        <td>{activity.entity_id}</td>
                        <td>{activity.action_type_name}</td>
                        <td>{activity.description}</td>
                        <td>{activity.performed_by ?? "System"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;