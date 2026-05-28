export const getUserStatusColor = (userStatus) => {
    switch (userStatus) {
        case "Active": return "#00C875";
        case "Disabled": return "#DF2F4A";
    }
}

export const getStatusColor = (status) => {
    switch (status) {
        case "Active": return "#00C875";
        case "In Storage": return "#1F6AE4";
        case "Defective": return "#DF2F4A";
        case "Out for Repair": return "#FDAB3D";
        case "Retired": return "#6B6B6B";
    }
}

export const getWarrantyStatusColor = (warrantyStatus) => {
    switch (warrantyStatus) {
        case "Valid": return "#00C875";
        case "Expired": return "#FDAB3D";
    }
}