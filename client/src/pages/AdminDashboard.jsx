import React from 'react';
import { useNavigate } from 'react-router-dom';
import TotalAssetsIcon from '@mui/icons-material/MonitorRounded';
import ActiveAssetsIcon from '@mui/icons-material/CheckRounded';
import DefectiveAssetsIcon from '@mui/icons-material/CloseRounded';
import IncompleteWorkstationIcon from '@mui/icons-material/RemoveFromQueueRounded';

import NavigationBar from '../components/NavigationBar.jsx';
import Sidebar from '../components/Sidebar.jsx';
import DashboardStatusCard from '../components/DashboardStatusCard.jsx';
import '../styles/AdminDashboard.css';

function AdminDashboard() {
    const navigate = useNavigate();

    const getStatusIcon = (status) => {
        switch (status) {
            case "Total assets": return <TotalAssetsIcon />;
            case "Active assets": return <ActiveAssetsIcon />;
            case "Defective assets": return <DefectiveAssetsIcon />;
            case "Incomplete workstation": return <IncompleteWorkstationIcon />;
            default: return null;
        }
    };

    const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const currentTime = new Date().toLocaleTimeString('en-US');

    return (
        <div className="Admin-dashboard">
            <NavigationBar />
            <div className="Main-content">
                <div className="Sidebar-placeholder">
                    <Sidebar />
                </div>
                <div className="content">
                    <div className="Dashboard-container">
                        <div className="Dashboard-header">
                            <div className="Date-container">
                                <h1>Dashboard</h1>
                                <h4>{date} — {currentTime}</h4>
                                
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;