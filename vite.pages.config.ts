import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  base: "/ukk-pages/",
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client/public"),
  envDir: path.resolve(import.meta.dirname),
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client/src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "pages-only",
      transformIndexHtml(html) {
        return html
          .replace('    <script src="/api/platform/config.js"></script>', "")
          .replace(
            '<meta name="theme-color"',
            '<meta name="referrer" content="no-referrer" />\n    <meta name="theme-color"'
          );
      },
    },
  ],
  build: {
    outDir: path.resolve(import.meta.dirname, "dist-pages"),
    emptyOutDir: true,
    sourcemap: false,
  },
});
