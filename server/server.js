import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import pool from "./config/Database.js";

import authRoutes from "./routes/AuthRoutes.js";
import assetRoutes from "./routes/AssetRoutes.js";
import dashboardRoutes from "./routes/DashboardRoutes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.VITE_CLIENT_URL || "http://localhost:5173";

// Middleware
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json());

// Health Check
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.status(200).json({
      success: true,
      message: "Server and database are running",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/dashboard", dashboardRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// Start Server
const startServer = async () => {
  try {
    await pool.query("SELECT NOW()");

    console.log("PostgreSQL connected");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:");
    console.error(error.message);

    process.exit(1);
  }
};

startServer();
