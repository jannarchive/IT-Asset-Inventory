import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "../styles/BarGraph.css";

/**
 * BarGraph — presentational component only.
 *
 * Data is fetched by AdminDashboard and passed down via props so that:
 *  - The auth token is guaranteed to be attached.
 *  - There is a single loading state for the whole dashboard.
 *  - This component stays simple and testable in isolation.
 *
 * Props:
 *  @param {Array}   data    - Array of { asset_type: string, total: number }
 *  @param {boolean} loading - Whether the parent is still fetching
 *  @param {string}  error   - Error message from the parent fetch, if any
 */
function BarGraph({ data = [], loading = false, error = null }) {
  if (loading) {
    return <div className="bar-graph-container">Loading chart…</div>;
  }

  if (error) {
    return <div className="bar-graph-container error">{error}</div>;
  }

  if (data.length === 0) {
    return <div className="bar-graph-container">No asset data available.</div>;
  }

  // Ensure totals are numbers (guards against string values from the API).
  const chartData = data.map((item) => ({
    asset_type: item.asset_type,
    total: parseInt(item.total, 10),
  }));

  return (
    <div className="bar-graph-container">
      <h3>Asset Type Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="asset_type" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="total" fill="#8884d8" name="Total Assets" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default BarGraph;
