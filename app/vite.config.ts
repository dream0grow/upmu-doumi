import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// 렌더러(React)는 Vite 로 빌드합니다. Electron 이 이 결과를 로드합니다.
export default defineConfig({
  root: path.resolve(__dirname, "renderer"),
  base: "./",
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "renderer/src") },
  },
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
  server: { port: 5173, strictPort: true },
});
