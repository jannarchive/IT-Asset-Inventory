import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/SupabaseClient";
import "../styles/Login.css";
import backgroundImage from "../assets/login-page-background.png";

const DEFAULT_SERVER_URL = "https://it-asset-inventory-server.onrender.com";
const configuredServerUrl = import.meta.env.VITE_SERVER_URL?.trim();
const SERVER_URL = (() => {
  if (!configuredServerUrl) return DEFAULT_SERVER_URL;

  try {
    const configuredUrl = new URL(configuredServerUrl, window.location.origin);
    if (configuredUrl.origin === window.location.origin) {
      return DEFAULT_SERVER_URL;
    }
  } catch {
    return DEFAULT_SERVER_URL;
  }

  return configuredServerUrl.replace(/\/+$/, "");
})();

async function postAuthRequest(path, body) {
  const response = await fetch(`${SERVER_URL}/api/auth/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const responseText = await response.text();
  let data;

  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    throw new Error(
      `The API returned a non-JSON response (HTTP ${response.status}). Check that VITE_SERVER_URL points to the backend server.`,
    );
  }

  if (!response.ok) {
    throw new Error(
      data.error || data.message || `Request failed (HTTP ${response.status}).`,
    );
  }

  return data;
}

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Email / Password 
  // Sends credentials to the backend, which queries system_users and compares
  // the password with bcrypt. The backend returns a signed JWT on success.
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!email || !password) {
        throw new Error("Please enter both email and password.");
      }

      const data = await postAuthRequest("login", { email, password });

      localStorage.setItem("authToken", data.token);
      localStorage.setItem("system_user", JSON.stringify(data.user));
      localStorage.setItem('adminName', data.user.full_name);
      localStorage.setItem('adminEmail', data.user.email);

      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth: initiate redirect 
  const handleSignUpWithGoogle = async () => {
    setLoading(true);
    setError("");

    try {
      const { error: supabaseError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }
    } catch (err) {
      setError(err.message || "Google sign-in failed. Please try again.");
      console.error("Google sign-in error:", err);
      setLoading(false);
    }
  };


  useEffect(() => {
    let active = true;
    let loginStarted = false;
    let callbackTimeout;

    const completeOAuthLogin = async (session) => {
      setLoading(true);

      try {
        const backendData = await postAuthRequest("oauth-login", {
          accessToken: session.access_token,
        });

        localStorage.setItem("authToken", backendData.token);
        localStorage.setItem("system_user", JSON.stringify(backendData.user));
        localStorage.setItem("adminName", backendData.user.full_name);
        localStorage.setItem("adminEmail", backendData.user.email);

        navigate("/admin/dashboard", { replace: true });
      } catch (err) {
        console.error("Auth verification error:", err);
        setError(
          err.message ||
            "An error occurred during authentication. Please try again.",
        );
        setLoading(false);
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (
          !session ||
          (event !== "INITIAL_SESSION" && event !== "SIGNED_IN") ||
          loginStarted
        ) {
          return;
        }

        loginStarted = true;
        callbackTimeout = window.setTimeout(() => {
          if (active) void completeOAuthLogin(session);
        }, 0);
      },
    );

    return () => {
      active = false;
      window.clearTimeout(callbackTimeout);
      authListener?.subscription?.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="Login">
      <div
        className="Login-background-container"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />

      <div className="Login-form">
        <div className="Login-form-header">
          <h1>Log In to IT Asset Inventory System</h1>
          <h2>Use your work email account to access the system</h2>

          <form onSubmit={handleLogin} className="Login-form-fields">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={loading}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loading}
                autoComplete="current-password"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="Login-button"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <div className="Login-divider">
            <span>or</span>
          </div>

          <div className="Login-oauth-container">
            <button
              onClick={handleSignUpWithGoogle}
              disabled={loading}
              className="Login-google-button"
              type="button"
            >
              {loading ? "Signing in..." : "Sign in with Google"}
            </button>
          </div>

          {error && <p className="Login-error">{error}</p>}

          <footer className="Login-footer">
            <p className="For-inquiries">
              For inquiries, contact the system administrator | it@linkedbpo.com
            </p>
            <p className="Published-date">© 2026</p>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default Login;