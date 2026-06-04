import React from "react";
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
 *  @param {Array}   data    - Array of { asset_type_name: string, total: number }
 *  @param {boolean} loading - Whether the parent is still fetching
 *  @param {string}  error   - Error message from the parent fetch, if any
 */
function BarGraph({ data = [], loading = false, error = null }) {
  if (loading) {
    return <div className="Bar-graph-container">Loading chart…</div>;
  }

  if (error) {
    return <div className="Bar-graph-container error">{error}</div>;
  }

  if (data.length === 0) {
    return <div className="Bar-graph-container">No asset data available.</div>;
  }

  const ASSET_TYPE_COLORS = {
    "Processor (CPU)": "#0063A5",
    Monitor: "#FFD703",
    Keyboard: "#C43C3C",
    Mouse: "#4D7A15", 
    Headset: "#E9A237", 
    Webcam: "#2B2E79", 
  };

  const chartData = data.map((item) => ({
    asset_type: item.asset_type_name,
    total: Number(item.total),
  }));

  return (
    <div className="Bar-graph-container">
      <h3>Asset Type Distribution</h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 20,
            left: 0,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="asset_type"
            interval={0}
            angle={-15}
            textAnchor="end"
            height={70}
          />

          <YAxis allowDecimals={false} />

          <Tooltip />

          <Bar dataKey="total">
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={ASSET_TYPE_COLORS[entry.asset_type] || "#8884d8"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="Custom-legend">
        {chartData.map((item) => (
          <div key={item.asset_type} className="Legend-item">
            <span
              className="Legend-color"
              style={{backgroundColor: ASSET_TYPE_COLORS[item.asset_type] || "#8884d8"}}
            />
            <span>{item.asset_type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BarGraph;