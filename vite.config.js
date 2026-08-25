import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // In production, Netlify serves these natively. In dev, this proxies
      // to scripts/functions-server.mjs (see npm run dev) since netlify-cli
      // currently has a Node-version compatibility issue on this machine.
      "/.netlify/functions": "http://localhost:9999",
    },
  },
});
