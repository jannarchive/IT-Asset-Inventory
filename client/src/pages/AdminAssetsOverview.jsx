import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

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

  const [assets, setAssets] = useState([]);
  const [sortedFilteredAssets, setSortedFilteredAssets] = useState([]);

  const [assetTypes, setAssetTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssetType, setSelectedAssetType] = useState("All Types");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  const [activeTab, setActiveTab] = useState("workstation");

  const [selectedAssets, setSelectedAssets] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const [error, setError] = useState("");

  // ---------------------------------------------------------------------------
  // Fetch Assets
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get("/api/assets");

        const fetchedAssets = response.data.assets || [];

        setAssets(fetchedAssets);

        const uniqueTypes = [
          "All Types",
          ...new Set(fetchedAssets.map((asset) => asset.asset_type_name)),
        ];

        const uniqueStatuses = [
          "All Statuses",
          ...new Set(fetchedAssets.map((asset) => asset.status_name)),
        ];

        setAssetTypes(uniqueTypes);
        setStatuses(uniqueStatuses);
      } catch (err) {
        console.error("Error fetching assets:", err);
        setError("An error occurred while fetching assets");
      }
    };

    fetchData();
  }, []);

  // ---------------------------------------------------------------------------
  // Filter & Sort Assets
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const filteredAssets = [...assets]
      .filter((asset) => {
        const matchesType =
          selectedAssetType === "All Types" ||
          asset.asset_type_name === selectedAssetType;

        const matchesStatus =
          selectedStatus === "All Statuses" ||
          asset.status_name === selectedStatus;

        const matchesSearch =
          asset.asset_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          asset.asset_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          asset.serial_number?.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesType && matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        if (!sortConfig.key) return 0;

        const valueA = a[sortConfig.key];
        const valueB = b[sortConfig.key];

        if (valueA === null || valueA === undefined) return 1;
        if (valueB === null || valueB === undefined) return -1;

        const strA = String(valueA).toLowerCase();
        const strB = String(valueB).toLowerCase();

        if (strA < strB) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }

        if (strA > strB) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }

        return 0;
      });

    setSortedFilteredAssets(filteredAssets);
  }, [assets, searchTerm, selectedAssetType, selectedStatus, sortConfig]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleFilterChange = (type, selectedOption) => {
    if (type === "assetType") {
      setSelectedAssetType(selectedOption);
    }

    if (type === "status") {
      setSelectedStatus(selectedOption);
    }
  };

  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const handleSelectAsset = (assetId) => {
    const newSelected = new Set(selectedAssets);

    if (newSelected.has(assetId)) {
      newSelected.delete(assetId);
    } else {
      newSelected.add(assetId);
    }

    setSelectedAssets(newSelected);

    setSelectAll(newSelected.size === sortedFilteredAssets.length);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedAssets(new Set());
      setSelectAll(false);

      return;
    }

    const allIds = new Set(sortedFilteredAssets.map((asset) => asset.asset_id));

    setSelectedAssets(allIds);
    setSelectAll(true);
  };

  const handleDeleteAssets = async () => {
    if (selectedAssets.size === 0) {
      alert("Please select at least one asset to delete");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedAssets.size} asset(s)?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      const deletePromises = Array.from(selectedAssets).map((assetId) =>
        api.delete(`/api/assets/${assetId}`),
      );

      await Promise.all(deletePromises);

      const response = await api.get("/api/assets");

      setAssets(response.data.assets || []);
      setSelectedAssets(new Set());
      setSelectAll(false);
    } catch (err) {
      console.error("Error deleting assets:", err);
      setError("An error occurred while deleting assets");
    }
  };

  const handleEditAsset = (asset) => {
    console.log(`Editing asset ${asset.asset_id}`);

    navigate(`/edit-asset/${asset.asset_id}`, {
      state: { asset },
    });
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

            {/* Search Bar */}
            <div className="Search-bar">
              <input
                type="text"
                placeholder="Search by asset code, name, or serial number"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <SearchIcon className="Search-icon" />
            </div>

            {/* Filters & Actions */}
            <div className="Assets-overview-header">
              <select
                className="filters Filter-dropdown"
                value={selectedAssetType}
                onChange={(e) =>
                  handleFilterChange("assetType", e.target.value)
                }
              >
                {assetTypes.map((type, index) => (
                  <option key={index} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <select
                className="filters Filter-dropdown"
                value={selectedStatus}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                {statuses.map((status, index) => (
                  <option key={index} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <div className="Header-spacer"></div>

              <button className="Btn-edit" disabled={selectedAssets.size !== 1}>
                <EditIcon style={{ fontSize: "16px" }} />
                Edit
              </button>

              <button
                className="Btn-delete"
                onClick={handleDeleteAssets}
                disabled={selectedAssets.size === 0}
              >
                <DeleteIcon style={{ fontSize: "16px" }} />
                Delete
              </button>
            </div>

            {/* Error Message */}
            {error && <div className="error-message">{error}</div>}

            {/* Assets Table */}
            <div className="Assets-table-wrapper">
              <table className="Assets-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                      />
                    </th>

                    <th onClick={() => handleSort("asset_code")}>
                      ASSET CODE
                      <span className="sort-arrow">
                        {sortConfig.key === "asset_code"
                          ? sortConfig.direction === "asc"
                            ? "▲"
                            : "▼"
                          : ""}
                      </span>
                    </th>

                    <th onClick={() => handleSort("asset_name")}>
                      ASSET NAME
                      <span className="sort-arrow">
                        {sortConfig.key === "asset_name"
                          ? sortConfig.direction === "asc"
                            ? "▲"
                            : "▼"
                          : ""}
                      </span>
                    </th>

                    <th onClick={() => handleSort("asset_type_name")}>
                      TYPE
                      <span className="sort-arrow">
                        {sortConfig.key === "asset_type_name"
                          ? sortConfig.direction === "asc"
                            ? "▲"
                            : "▼"
                          : ""}
                      </span>
                    </th>

                    <th onClick={() => handleSort("serial_number")}>
                      SERIAL NUMBER
                      <span className="sort-arrow">
                        {sortConfig.key === "serial_number"
                          ? sortConfig.direction === "asc"
                            ? "▲"
                            : "▼"
                          : ""}
                      </span>
                    </th>

                    <th onClick={() => handleSort("status_name")}>
                      STATUS
                      <span className="sort-arrow">
                        {sortConfig.key === "status_name"
                          ? sortConfig.direction === "asc"
                            ? "▲"
                            : "▼"
                          : ""}
                      </span>
                    </th>

                    <th onClick={() => handleSort("created_at")}>
                      CREATED
                      <span className="sort-arrow">
                        {sortConfig.key === "created_at"
                          ? sortConfig.direction === "asc"
                            ? "▲"
                            : "▼"
                          : ""}
                      </span>
                    </th>

                    <th>ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {sortedFilteredAssets.length > 0 ? (
                    sortedFilteredAssets.map((asset) => (
                      <tr key={asset.asset_id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedAssets.has(asset.asset_id)}
                            onChange={() => handleSelectAsset(asset.asset_id)}
                          />
                        </td>

                        <td className="cell-device-id">{asset.asset_code}</td>

                        <td>{asset.asset_name}</td>

                        <td>{asset.asset_type_name}</td>

                        <td>{asset.serial_number || "—"}</td>

                        <td>
                          <div className="status-container">
                            <span
                              className="status-dot"
                              style={{
                                backgroundColor: getStatusColor(
                                  asset.status_name,
                                ),
                              }}
                            />

                            {asset.status_name}
                          </div>
                        </td>

                        <td>{formatDateTime(asset.created_at)}</td>

                        <td className="actions-cell">
                          <button
                            className="action-btn edit-btn"
                            onClick={() => handleEditAsset(asset)}
                            title="Edit asset"
                          >
                            <EditIcon
                              style={{
                                fontSize: "16px",
                              }}
                            />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="8"
                        style={{
                          textAlign: "center",
                          padding: "20px",
                        }}
                      >
                        No assets found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminAssetsOverview;
