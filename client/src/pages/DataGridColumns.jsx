/**
 * Column Definitions for AdminAssetsOverview DataGrid
 * 
 * This module provides centralized column definitions for both the Full Workstation
 * View and Asset View DataGrids. Column definitions are exported as functions to allow
 * flexibility with theme-dependent rendering (e.g., status colors).
 */

/**
 * Full Workstation View Column Definitions
 * 
 * @param {Function} getStatusColor - Function to get color for status values
 * @returns {Array} Array of column definition objects for DataGrid
 */
export const getFullWorkstationColumns = (getStatusColor) => [
    { field: "device_id", headerName: "Device ID", width: 120, filterable: true },
    { field: "device_category", headerName: "Device Category", width: 180, filterable: true },
    { field: "device_name", headerName: "Device Name", width: 200, filterable: true },
    { field: "model", headerName: "Model", width: 250, filterable: true },
    { field: "assigned_user", headerName: "Assigned User", width: 220, filterable: true },
    { field: "employee_number", headerName: "Employee Number", width: 150, filterable: true },
    { field: "team", headerName: "Team", width: 280, filterable: true },
    { field: "location", headerName: "Location", width: 160, filterable: true },
    { field: "date_assigned", headerName: "Date Assigned", width: 210, filterable: true },
    {
        field: "accountability_form",
        headerName: "Accountability Form",
        width: 200,
        filterable: false,
    },
    {
        field: "device_status",
        headerName: "Device Status",
        width: 140,
        filterable: true,
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
    { field: "processor_code", headerName: "Processor Code", width: 150, filterable: true },
    { field: "processor_serial", headerName: "Processor Serial", width: 150, filterable: true },
    { field: "processor", headerName: "Processor", width: 200, filterable: true },
    { field: "memory", headerName: "Memory", width: 200, filterable: true },
    { field: "motherboard", headerName: "Motherboard", width: 200, filterable: true },
    { field: "storage", headerName: "Storage", width: 200, filterable: true },
    { field: "monitor1_code", headerName: "Monitor 1 Code", width: 150, filterable: true },
    { field: "monitor1_serial", headerName: "Monitor 1 Serial", width: 150, filterable: true },
    { field: "monitor1", headerName: "Monitor 1", width: 200, filterable: true },
    {
        field: "monitor1_status",
        headerName: "Monitor 1 Status",
        width: 150,
        filterable: true,
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
    { field: "monitor2_code", headerName: "Monitor 2 Code", width: 150, filterable: true },
    { field: "monitor2_serial", headerName: "Monitor 2 Serial", width: 150, filterable: true },
    { field: "monitor2", headerName: "Monitor 2", width: 200, filterable: true },
    {
        field: "monitor2_status",
        headerName: "Monitor 2 Status",
        width: 150,
        filterable: true,
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
    { field: "keyboard_code", headerName: "Keyboard Code", width: 150, filterable: true },
    { field: "keyboard_serial", headerName: "Keyboard Serial", width: 150, filterable: true },
    { field: "keyboard", headerName: "Keyboard", width: 200, filterable: true },
    {
        field: "keyboard_status",
        headerName: "Keyboard Status",
        width: 150,
        filterable: true,
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
    { field: "mouse_code", headerName: "Mouse Code", width: 150, filterable: true },
    { field: "mouse_serial", headerName: "Mouse Serial", width: 150, filterable: true },
    { field: "mouse", headerName: "Mouse", width: 200, filterable: true },
    {
        field: "mouse_status",
        headerName: "Mouse Status",
        width: 140,
        filterable: true,
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
    { field: "headset_code", headerName: "Headset Code", width: 150, filterable: true },
    { field: "headset_serial", headerName: "Headset Serial", width: 150, filterable: true },
    { field: "headset", headerName: "Headset", width: 200, filterable: true },
    {
        field: "headset_status",
        headerName: "Headset Status",
        width: 150,
        filterable: true,
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
    { field: "webcam_code", headerName: "Webcam Code", width: 150, filterable: true },
    { field: "webcam_serial", headerName: "Webcam Serial", width: 150, filterable: true },
    { field: "webcam", headerName: "Webcam", width: 200, filterable: true },
    {
        field: "webcam_status",
        headerName: "Webcam Status",
        width: 150,
        filterable: true,
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
    { field: "supplier", headerName: "Supplier", width: 150, filterable: true },
    { field: "notes", headerName: "Notes", width: 300, filterable: true },
    { field: "last_updated", headerName: "Last Updated", width: 210, filterable: true },
];

/**
 * Asset View Column Definitions
 * 
 * Note: The "Actions" column has been removed. Users can now use:
 * - Double-click to open edit dialog
 * - Toolbar Edit button after selecting a row
 * - Toolbar Delete button to remove rows
 * - Toolbar Add button to create new assets
 * 
 * @param {Function} getStatusColor - Function to get color for status values
 * @returns {Array} Array of column definition objects for DataGrid
 */
export const getAssetViewColumns = (getStatusColor) => [
    { field: "asset_code", headerName: "Asset Code", width: 150, filterable: true },
    { field: "serial_number", headerName: "Serial Number", width: 150, filterable: true },
    { field: "asset_type_name", headerName: "Asset Type", width: 200, filterable: true },
    { field: "asset_name", headerName: "Asset Name", width: 200, filterable: true },
    {
        field: "status_name",
        headerName: "Asset Status",
        width: 150,
        filterable: true,
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
    { field: "parent_device_id", headerName: "Parent Device ID", width: 150, filterable: true },
    { field: "assigned_user", headerName: "Assigned User", width: 220, filterable: true },
    { field: "employee_number", headerName: "Employee Number", width: 150, filterable: true },
    { field: "team", headerName: "Team", width: 280, filterable: true },
];