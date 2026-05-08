import React from 'react';
import { useNavigate } from 'react-router-dom';

import NavigationBar from '../components/NavigationBar.jsx';
import '../styles/AdminDashboard.css';

function AdminDashboard() {
    const navigate = useNavigate();

    return (
        <div className="Admin-dashboard">
            <NavigationBar />
            <div className="Main-content">
                <h1>Welcome to the Admin Dashboard</h1>
            </div>
        </div>
    );
}

export default AdminDashboard;