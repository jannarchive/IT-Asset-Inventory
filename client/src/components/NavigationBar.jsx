import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/LogoutOutlined';

import logo from '../assets/LinkedBPO-logo.png';
import { Logout } from '../lib/Logout';
import '../styles/NavigationBar.css';


function NavigationBar() {
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    
    const accountIconRef = useRef(null);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        setAdminName(localStorage.getItem('adminName') || 'Admin');
        setAdminEmail(localStorage.getItem('adminEmail') || '');
    }, []);

    const handleDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out your account?")) {
        await Logout(navigate);
    }
    };

    return (
        <header className="Header">
            <img src={logo} alt="Company Logo" className="LinkedBPO-logo" />
            <div className="Navigation-bar">
                <p>Hi, {adminName}!</p>
                <AccountCircleIcon
                    className="Account-icon"
                    onClick={handleDropdown}
                    ref={accountIconRef}
                />
            </div>

            {showDropdown && (
                <div className="Dropdown-tooltip" ref={dropdownRef}>
                    <div className="Dropdown-arrow"></div>
                    <div className="Dropdown-content">
                        <AccountCircleIcon className="User-icon" style={{ fontSize: 80 }} />
                        <p className="Dropdown-name">{adminName}</p>
                        <p className="Dropdown-email">{adminEmail}</p>
                        <button className="Logout-button" onClick={handleLogout}>
                            <LogoutIcon />
                            <p>Logout</p>
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
}

export default NavigationBar;