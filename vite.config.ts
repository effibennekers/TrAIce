import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  server: { host: "::", port: 8080 },
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart({ target: "cloudflare-module" }),
    react(),
    cloudflare({ viteEnvironment: { name: "ssr" } }),
  ],
});
