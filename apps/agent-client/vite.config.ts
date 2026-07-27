import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Same verify service as the supervisor dashboard; different port, different
// keyhole. Run: pnpm --dir apps/agent-client dev  (port 5174)
const target = "http://127.0.0.1:8000";

export default defineConfig({
  plugins: [react()],
  base: "/agent/",
  server: {
    port: 5174,
    proxy: Object.fromEntries(
      ["/a", "/demo", "/probes", "/healthz"].map((p) => [p, { target, changeOrigin: true }]),
    ),
  },
});
