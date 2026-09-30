import * as User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    "FATAL: JWT_SECRET environment variable is not set. Set it in your .env file.",
  );
}

// Generate JWT Token
const generateToken = (userId, email) => {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "24h" });
};

// Email/Password Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (user.user_status !== "Active") {
      return res
        .status(403)
        .json({
          error: "Your account is inactive. Contact the system administrator.",
        });
    }

    // bcrypt hashes are always exactly 60 characters.
    // If the hash is shorter, it was truncated by the old VARCHAR(50) column
    // and can no longer be verified. The admin must reset the password directly in the database.
    if (!user.password.startsWith("$2") || user.password.length < 60) {
      console.error(
        `Corrupted password hash for user ${user.email} (length: ${user.password.length}). ` +
          `Run the ALTER TABLE fix and reset the password manually.`,
      );
      return res.status(500).json({
        error:
          "Account credentials are corrupted. Contact the system administrator.",
      });
    }

    // Compare password against bcrypt hash
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(user.system_users_id, user.email);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        system_users_id: user.system_users_id,
        email: user.email,
        full_name: user.full_name,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get current user (protected)
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.getUserById(req.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      user: {
        system_users_id: user.system_users_id,
        email: user.email,
        full_name: user.full_name,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Logout
export const logout = (req, res) => {
  res.status(200).json({ message: "Logged out successfully" });
};

// OAuth Login - verify the Supabase access token before issuing a backend JWT.
export const oauthLogin = async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: "Supabase access token is required" });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey =
      process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("OAuth login requires SUPABASE_URL and SUPABASE_ANON_KEY");
      return res.status(500).json({ error: "OAuth login is not configured" });
    }

    const supabaseResponse = await fetch(
      `${supabaseUrl.replace(/\/$/, "")}/auth/v1/user`,
      {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!supabaseResponse.ok) {
      return res.status(401).json({ error: "Invalid or expired Google session" });
    }

    const supabaseUser = await supabaseResponse.json();
    if (!supabaseUser.email) {
      return res.status(401).json({ error: "Google account has no email address" });
    }

    // Verify the authenticated Supabase account is an active system user.
    const user = await User.getUserByEmail(supabaseUser.email);

    if (!user) {
      return res.status(401).json({ error: "User not found in system" });
    }

    if (user.user_status !== "Active") {
      return res
        .status(403)
        .json({
          error: "Your account is inactive. Contact the system administrator.",
        });
    }

    const token = generateToken(user.system_users_id, user.email);

    return res.status(200).json({
      message: "OAuth login successful",
      token,
      user: {
        system_users_id: user.system_users_id,
        email: user.email,
        full_name: user.full_name,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error("OAuth login error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all users (protected — admin use only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.getAllUsers();
    res.status(200).json({ users });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
