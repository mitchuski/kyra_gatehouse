import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The dev server proxies straight to the verify service:
//   uvicorn gatehouse_verify.app:app --port 8000
const target = "http://127.0.0.1:8000";

export default defineConfig({
  plugins: [react()],
  base: "/supervisor/",
  server: {
    proxy: Object.fromEntries(
      ["/a", "/authorities", "/demo", "/reset", "/policy", "/probes", "/contracts", "/healthz"].map(
        (p) => [p, { target, changeOrigin: true }],
      ),
    ),
  },
});
