import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy all /auth, /interactions, /posts, /recommendations, /health
      // requests to the FastAPI backend so the browser never needs a direct
      // cross-origin connection to localhost:8000.
      "/auth": {
        target: "http://localhost:8000",
        timeout: 10000,
        proxyTimeout: 10000,
      },
      "/interactions": {
        target: "http://localhost:8000",
        timeout: 10000,
        proxyTimeout: 10000,
      },
      "/posts": {
        target: "http://localhost:8000",
        timeout: 10000,
        proxyTimeout: 10000,
      },
      "/recommendations": {
        target: "http://localhost:8000",
        timeout: 10000,
        proxyTimeout: 10000,
      },
      "/health": {
        target: "http://localhost:8000",
        timeout: 10000,
        proxyTimeout: 10000,
      },
    },
  },
});
