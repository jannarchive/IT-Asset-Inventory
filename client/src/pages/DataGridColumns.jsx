export const getFullWorkstationColumns = (getStatusColor) => [
    {
        field: "device_id",
        headerName: "Device ID",
        width: 120,
        filterable: true,
        renderCell: (params) => (
            <span>{`DEV-${String(params.value).padStart(5, '0')}`}</span>
        ),
    },
    { field: "device_category", headerName: "Device Category", width: 180, filterable: true },
    { field: "device_name", headerName: "Device Name", width: 200, filterable: true },
    { field: "model", headerName: "Model", width: 250, filterable: true },
    { field: "assigned_user", headerName: "Assigned User", width: 220, filterable: true },
    { field: "employee_number", headerName: "Employee Number", width: 150, filterable: true },
    { field: "team", headerName: "Team", width: 280, filterable: true },
    { field: "location", headerName: "Location", width: 160, filterable: true },
    { field: "date_assigned_display", headerName: "Date Assigned", width: 210, filterable: true },
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
    { field: "processor_serial", headerName: "Processor Serial Number", width: 200, filterable: true },
    { field: "processor", headerName: "Processor", width: 300, filterable: true },
    { field: "memory", headerName: "Memory", width: 300, filterable: true },
    { field: "motherboard", headerName: "Motherboard", width: 300, filterable: true },
    { field: "storage", headerName: "Storage", width: 300, filterable: true },
    {
        field: "monitor1_code",
        headerName: "Monitor 1 Asset Code",
        width: 200,
        filterable: true,
        renderCell: (params) => <span>{params.value || "N/A"}</span>,
    },
    { field: "monitor1_serial", headerName: "Monitor 1 Serial Number", width: 200, filterable: true },
    { field: "monitor1", headerName: "Monitor 1", width: 300, filterable: true },
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
    {
        field: "monitor2_code",
        headerName: "Monitor 2 Asset Code",
        width: 200,
        filterable: true,
        renderCell: (params) => <span>{params.value || "N/A"}</span>,
    },
    { field: "monitor2_serial", headerName: "Monitor 2 Serial Number", width: 200, filterable: true },
    { field: "monitor2", headerName: "Monitor 2", width: 300, filterable: true },
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
    {
        field: "keyboard_code",
        headerName: "Keyboard Asset Code",
        width: 200,
        filterable: true,
        renderCell: (params) => <span>{params.value || "N/A"}</span>,
    },
    { field: "keyboard_serial", headerName: "Keyboard Serial Number", width: 200, filterable: true },
    { field: "keyboard", headerName: "Keyboard", width: 300, filterable: true },
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
    {
        field: "mouse_code",
        headerName: "Mouse Asset Code",
        width: 200,
        filterable: true,
        renderCell: (params) => <span>{params.value || "N/A"}</span>,
    },
    { field: "mouse_serial", headerName: "Mouse Serial Number", width: 200, filterable: true },
    { field: "mouse", headerName: "Mouse", width: 300, filterable: true },
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
    {
        field: "headset_code",
        headerName: "Headset Asset Code",
        width: 200,
        filterable: true,
        renderCell: (params) => <span>{params.value || "N/A"}</span>,
    },
    { field: "headset_serial", headerName: "Headset Serial Number", width: 200, filterable: true },
    { field: "headset", headerName: "Headset", width: 300, filterable: true },
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
    {
        field: "webcam_code",
        headerName: "Webcam Asset Code",
        width: 150,
        filterable: true,
        renderCell: (params) => <span>{params.value || "N/A"}</span>,
    },
    { field: "webcam_serial", headerName: "Webcam Serial", width: 200, filterable: true },
    { field: "webcam", headerName: "Webcam", width: 300, filterable: true },
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
    { field: "supplier", headerName: "Supplier", width: 180, filterable: true },
    { field: "notes", headerName: "Notes", width: 300, filterable: true },
    { field: "created_at", headerName: "Created at", width: 210, filterable: true },
    { field: "last_updated", headerName: "Last Updated", width: 210, filterable: true },
];

/**
 * Asset View Column Definitions
 * 
 * Displays assets assigned to workstations from the workstation_assets table.
 * Shows the workstation that each asset is assigned to and the assignment details.
 * 
 * @param {Function} getWarrantyStatusColor - Function to get color for status values
 * @returns {Array} Array of column definition objects for DataGrid
 */
export const getAssetViewColumns = (getWarrantyStatusColor) => [
    {
        field: "device_id",
        headerName: "Device ID",
        width: 120,
        filterable: true,
        renderCell: (params) => (
            <span>{`DEV-${String(params.value).padStart(5, '0')}`}</span>
        ),
    },
    { field: "device_name", headerName: "Device Name", width: 200, filterable: true },
    { field: "employee_name", headerName: "Assigned To", width: 200, filterable: true },
    { field: "employee_number", headerName: "Employee Number", width: 150, filterable: true },
    { field: "team", headerName: "Team", width: 250, filterable: true },
    { field: "asset_role", headerName: "Asset Role", width: 200, filterable: true },
    {
        field: "asset_code",
        headerName: "Asset Code",
        width: 200,
        filterable: true,
        renderCell: (params) => <span>{params.value || "N/A"}</span>,
    },
    { field: "asset_type_name", headerName: "Asset Type", width: 180, filterable: true },
    { field: "serial_number", headerName: "Serial Number", width: 200, filterable: true },
    { field: "asset_name", headerName: "Asset Name", width: 300, filterable: true },
     {
        field: "warranty_status",
        headerName: "Warranty Status",
        width: 150,
        filterable: true,
        renderCell: (params) => (
            <div className="status-container">
                <span
                    className="status-dot"
                    style={{
                        backgroundColor: getWarrantyStatusColor(params.value),
                    }}
                />
                {params.value}
            </div>
        ),
    },
    { field: "warranty_expiry_date", headerName: "Warranty Expiry Date", width: 200, filterable: true },
    { field: "assigned_at", headerName: "Assigned At", width: 200, filterable: true },
];