import axios from "axios";

const DEFAULT_SERVER_URL = "https://it-asset-inventory-server.onrender.com";
const configuredServerUrl = import.meta.env.VITE_SERVER_URL?.trim();

const api = axios.create({
  baseURL: (configuredServerUrl || DEFAULT_SERVER_URL).replace(/\/+$/, ""),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;