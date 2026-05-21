import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      // Forward every /api request to the Express backend during development.
      // This means axios.get("/api/dashboard/stats") resolves to
      // http://localhost:3000/api/dashboard/stats — not Vite's own port.
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});