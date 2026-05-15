import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

import '../styles/Sidebar.css';
import { SidebarData } from './SidebarData';

function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const systemUsersID = localStorage.getItem("system_users_id");
    const { deviceID: paramDeviceID} = useParams();

    const [deviceID, setDeviceID] = useState(paramDeviceID || "1");

    useEffect(() => {
        if (paramDeviceID) {
            setDeviceID(paramDeviceID);
        }
    }, [paramDeviceID]);

    const handleNavigation = (path) => {
        navigate(path);
    };

    const sidebarItems = SidebarData({ system_users_id: systemUsersID, device_id: deviceID });

    return (
        <div className="Sidebar">
            <h2>MAIN MENU</h2>
            <ul className='SidebarList'>
                {sidebarItems.map((val, key) => {
                    const isActive = location.pathname === val.path;
                    return (
                        <li 
                            key={key} 
                            className={isActive ? "row active" : "row"} 
                            onClick={() => handleNavigation(val.path)}
                        >
                            <div id="icon">{val.icon}</div>
                            <div id="title">{val.title}</div>
                        </li>
                    );
                })}
            </ul>

        </div>
    );
}

export default Sidebar;