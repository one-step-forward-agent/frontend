import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backend = env.BACKEND_URL || "http://127.0.0.1:8000";
  const proxy = { target: backend, changeOrigin: false };
  return {
    plugins: [react(), {
      name: "analytics-worker-policy",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.split("?")[0] === "/analytics-worker.js") {
            const origin = `http://${req.headers.host}`;
            res.setHeader("Content-Security-Policy", `default-src 'none'; script-src 'wasm-unsafe-eval' ${origin}/analytics-runtime/; connect-src ${origin}/analytics-runtime/; worker-src 'none'`);
          }
          next();
        });
      },
    }],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    server: {
      port: 5173,
      proxy: {
        "/api": proxy,
        "/auth": proxy,
        "/health": proxy,
      },
    },
  };
});
