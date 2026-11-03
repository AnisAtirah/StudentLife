import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Spotify only allows http://127.0.0.1 (not "localhost") as a login redirect,
    // so the dev server must answer there. Browsers still reach it via localhost too.
    host: "127.0.0.1",
    port: 5173,
  },
});
