import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

const devApiProxyTarget = process.env.VITE_DEV_API_PROXY_TARGET ?? "http://localhost:8000";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: devApiProxyTarget,
        changeOrigin: true,
      },
    },
  },
  plugins: [tsconfigPaths(), tailwindcss(), tanstackStart(), react()],
});
