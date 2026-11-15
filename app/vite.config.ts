import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// The public REST API sends no CORS headers, so the browser reaches it through
// dev (and preview) server: /lcd/* is forwarded to QORE_REST_PROXY_TARGET.
// Vercel uses the equivalent rewrite in vercel.json.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const target = env.QORE_REST_PROXY_TARGET || "http://localhost:1317";
  const proxy = {
    "/lcd": { target, changeOrigin: true, rewrite: (p: string) => p.replace(/^\/lcd/, "") },
  };
  return {
    plugins: [react()],
    server: { port: 5173, proxy },
    preview: { proxy },
  };
});
