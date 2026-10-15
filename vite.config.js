import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        saarthi: resolve(__dirname, "saarthi.html"),
      },
    },
  },
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
