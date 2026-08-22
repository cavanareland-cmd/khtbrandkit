import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Public (publishable) backend config — used as fallback when the host
// (e.g. Vercel) does not provide the VITE_SUPABASE_* environment variables.
const FALLBACK_SUPABASE_URL = "https://qfyvslzhspjzvwhjlggr.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmeXZzbHpoc3BqenZ3aGpsZ2dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3OTA3NjgsImV4cCI6MjA5MjM2Njc2OH0.swGpxiTM5ZEUE-Y4hBbs1iwTng7FmTUDd1Y2WADgE84";
const FALLBACK_SUPABASE_PROJECT_ID = "qfyvslzhspjzvwhjlggr";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const missing = [
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    "VITE_SUPABASE_PROJECT_ID",
  ].filter((k) => !env[k]);
  if (missing.length) {
    console.warn(
      `[env] Missing ${missing.join(", ")} — using built-in publishable fallback. ` +
        `Set them in Vercel → Settings → Environment Variables to remove the fallback.`,
    );
  }



  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL,
      ),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
        env.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_SUPABASE_PUBLISHABLE_KEY,
      ),
      "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(
        env.VITE_SUPABASE_PROJECT_ID || FALLBACK_SUPABASE_PROJECT_ID,
      ),
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
    },
  };
});
