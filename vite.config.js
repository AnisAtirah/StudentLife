import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Spotify only allows http://127.0.0.1 (not "localhost") as a login redirect,
    // so the dev server must answer there. Browsers still reach it via localhost too,
    // and the app itself moves you to localhost (see main.jsx) for Firebase sign-in.
    host: "127.0.0.1",
    port: 5173,
    // Always use 5173. If it's busy, stop with an error instead of jumping to 5174,
    // because Spotify's redirect address must match the port exactly.
    strictPort: true,
  },
});
