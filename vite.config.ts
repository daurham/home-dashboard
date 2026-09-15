import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

function cameraProxyTarget(host: string): string {
  return host.startsWith("http://") || host.startsWith("https://") ? host : `http://${host}`;
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const cameraHost = cameraProxyTarget(env.CAMERA_HOST || "http://192.168.1.72");
  const cameraUser = env.CAMERA_USER || "admin";
  const cameraPass = env.CAMERA_PASS || "123456";

  return {
    base: "/dashboard/",
    server: {
      host: "0.0.0.0",
      port: 8080,
      proxy: {
        // Browser talks to this same-origin path; Vite adds camera credentials.
        "/camera-proxy": {
          target: cameraHost,
          changeOrigin: true,
          rewrite: (proxyPath) => {
            const stripped = proxyPath.replace(/^\/camera-proxy/, "") || "/";
            const [pathname, search = ""] = stripped.split("?");
            const params = new URLSearchParams(search);
            params.set("username", cameraUser);
            params.set("password", cameraPass);
            return `${pathname}?${params.toString()}`;
          },
        },
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    test: {
      environment: "node",
      include: ["src/**/*.test.ts"],
    },
  };
});
