import React from "react";
import "../styles/DashboardStatusCard.css";
import MonitorIcon from "@mui/icons-material/MonitorRounded";

function DashboardStatusCard({ icon, status, count, className, statusColor }) {
  return (
    <div
      className={`Status-card ${className}`}
      style={{ borderBottom: `7px solid ${statusColor}` }}
    >
      <div
        className="Status-card-icon"
        style={{ fontSize: "60px", color: "#6B6B6B" }}
      >
        {icon || <MonitorIcon style={{ fontSize: "60px", color: "#6B6B6B" }} />}
      </div>
      <div className="Status-card-details">
        <h3 className="Status-card-count">{count}</h3>
        <p className="Status-card-status">{status}</p>
      </div>
      <div className="Status-card-divider" />
    </div>
  );
}

export default DashboardStatusCard;