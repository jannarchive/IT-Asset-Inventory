import React from "react";
import DashboardIcon from "@mui/icons-material/DashboardRounded";
import AssetsIcon from "@mui/icons-material/DevicesRounded";
import ReportsIcon from "@mui/icons-material/DescriptionRounded";

export const SidebarData = ({ system_users_id, device_id }) => {
  return [
    {
      title: "Dashboard",
      path: "/admin/dashboard",
      icon: <DashboardIcon style={{ fontSize: 30 }} />,
      cName: "nav-text",
    },
    {
      title: "Assets",
      path: "/admin/assets",
      icon: <AssetsIcon style={{ fontSize: 30 }} />,
      cName: "nav-text",
    },
    {
      title: "Reports",
      path: `/admin/reports/${system_users_id}`,
      icon: <ReportsIcon style={{ fontSize: 30 }} />,
      cName: "nav-text",
    },
  ];
};
