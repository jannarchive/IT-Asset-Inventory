import React from "react";
import { useNavigate } from "react-router-dom";

import "../styles/Login.css";
import backgroundImage from "../assets/login-page-background.png";


const Login = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();

  const handleLogin = () => {
    setIsLoggedIn(true);
    navigate("/admin-dashboard");
  };

  return (
    <div className="Login">
      <div
        className="Login-background-container"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />

      <div className="Login-form">
        <h1>Log In to IT Asset Inventory System</h1>
        <h2>Use your work email account to access the system</h2>
        <button className="Login-button" onClick={handleLogin}>Log In with Google</button>

        <footer className="Login-footer">
          <p className="For-inquiries">
            For inquiries, contact the system administrator | it@linkedbpo.com
          </p>
          <p className="Published-date">© 2026</p>
        </footer>
      </div>

    </div>
  );
};

export default Login;