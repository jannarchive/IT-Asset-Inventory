import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Logout from '@mui/icons-material/LogoutOutlined';
import logo from '../assets/LinkedBPO-logo.png';

import '../styles/NavigationBar.css';


function NavigationBar() {
    const [showDropdown, setShowDropdown] = useState(false);
    
    const accountIconRef = useRef(null);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const handleDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    return (

        <header className="Header">
            <img src={logo} alt="Company Logo" className="LinkedBPO-logo" />
            <div className="Navigation-bar">
                <p>Hi!</p>
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
                        <p className="Dropdown-email">useradmin@example.com</p>
                        <p className="Dropdown-user-status">Active</p>
                        <button className="Logout-button" onClick={handleLogout}>
                            <Logout />
                            <p>Logout</p>
                        </button>
                    </div>
                </div>
            )}

        </header>
    );
}

export default NavigationBar;