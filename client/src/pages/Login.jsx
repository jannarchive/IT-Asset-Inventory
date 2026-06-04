import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/SupabaseClient";

import "../styles/Login.css";
import backgroundImage from "../assets/login-page-background.png";

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ─── Email / Password ──────────────────────────────────────────────────────
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

      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL || "http://localhost:3000"}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed. Please try again.");
      }

      // The backend already verified the user against system_users via bcrypt.
      // A second Supabase check here is redundant AND breaks — email/password
      // users are not in Supabase Auth, so the Supabase client falls back to the
      // anon key, which is blocked by RLS on system_users. Trust the backend JWT.
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

  // ─── Google OAuth: initiate redirect ──────────────────────────────────────
  // The whitelist check happens in onAuthStateChange after Google redirects back.
  const handleSignUpWithGoogle = async () => {
    setLoading(true);
    setError("");

    try {
      const { error: supabaseError } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }
      // Loading stays true — page redirects to Google.
    } catch (err) {
      setError(err.message || "Google sign-in failed. Please try again.");
      console.error("Google sign-in error:", err);
      setLoading(false);
    }
  };

  // ─── Google OAuth: fires after redirect back from Google ──────────────────
  // At this point the user has a Supabase Auth session (authenticated role),
  // so the RLS policy `USING (email = auth.email())` allows the SELECT.
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          try {
            const { data: systemUser, error: queryError } = await supabase
              .from("system_users")
              .select("system_users_id, email, full_name")
              .eq("email", session.user.email)
              .single();

            if (queryError || !systemUser) {
              await supabase.auth.signOut();
              setError(
                "Your Google account is not authorized to access this system. Contact the system administrator.",
              );
              setLoading(false);
              return;
            }

            // Call backend to issue a JWT token for API access
            // The backend will verify the user is active and return a signed JWT
            const backendResponse = await fetch(
              `${import.meta.env.VITE_SERVER_URL || "http://localhost:3000"}/api/auth/oauth-login`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: systemUser.email }),
              },
            );

            const backendData = await backendResponse.json();

            if (!backendResponse.ok) {
              throw new Error(
                backendData.error ||
                  "Failed to complete OAuth login. Please try again.",
              );
            }

            // Store the backend JWT token for API access
            localStorage.setItem("authToken", backendData.token);
            localStorage.setItem(
              "system_user",
              JSON.stringify({
                system_users_id: systemUser.system_users_id,
                email: systemUser.email,
                full_name: systemUser.full_name,
              }),
            );
            localStorage.setItem('adminName', backendData.user.full_name);
            localStorage.setItem('adminEmail', backendData.user.email);

            navigate("/admin/dashboard");
          } catch (err) {
            console.error("Auth verification error:", err);
            setError(
              "An error occurred during authentication. Please try again.",
            );
            setLoading(false);
          }
        }
      },
    );

    return () => {
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