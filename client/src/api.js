import axios from "axios";

/**
 * Shared axios instance for all API calls.
 *
 * - In development, Vite's proxy forwards /api/* to http://localhost:3000,
 *   so baseURL stays as "/" and relative paths work correctly.
 * - In production, set VITE_API_BASE_URL in your environment to point at
 *   your deployed backend (e.g. https://your-api.com). If not set, it
 *   defaults to the same origin (correct for most deployments).
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL ?? "/",
});

// Attach the stored Bearer token to every outgoing request automatically.
// This removes the need to manually pass `config` headers in every component.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;