// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.js";
var __vite_injected_original_dirname = "/home/project";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    {
      name: "copy-public-skip-spaces",
      writeBundle: {
        sequential: true,
        order: "post",
        async handler() {
          const fs = await import("fs");
          const path = await import("path");
          const publicDir = path.default.resolve(__vite_injected_original_dirname, "public");
          const outDir = path.default.resolve(__vite_injected_original_dirname, "dist");
          function copyRecursive(src, dest) {
            const entries = fs.default.readdirSync(src, { withFileTypes: true });
            for (const entry of entries) {
              if (entry.name.includes(" ")) continue;
              const srcPath = path.default.join(src, entry.name);
              const destPath = path.default.join(dest, entry.name);
              if (entry.isDirectory()) {
                fs.default.mkdirSync(destPath, { recursive: true });
                copyRecursive(srcPath, destPath);
              } else {
                fs.default.copyFileSync(srcPath, destPath);
              }
            }
          }
          copyRecursive(publicDir, outDir);
        }
      }
    }
  ],
  build: {
    copyPublicDir: false
  },
  optimizeDeps: {
    exclude: ["lucide-react"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICB7XG4gICAgICBuYW1lOiAnY29weS1wdWJsaWMtc2tpcC1zcGFjZXMnLFxuICAgICAgd3JpdGVCdW5kbGU6IHtcbiAgICAgICAgc2VxdWVudGlhbDogdHJ1ZSxcbiAgICAgICAgb3JkZXI6ICdwb3N0JyxcbiAgICAgICAgYXN5bmMgaGFuZGxlcigpIHtcbiAgICAgICAgICBjb25zdCBmcyA9IGF3YWl0IGltcG9ydCgnZnMnKTtcbiAgICAgICAgICBjb25zdCBwYXRoID0gYXdhaXQgaW1wb3J0KCdwYXRoJyk7XG4gICAgICAgICAgY29uc3QgcHVibGljRGlyID0gcGF0aC5kZWZhdWx0LnJlc29sdmUoX19kaXJuYW1lLCAncHVibGljJyk7XG4gICAgICAgICAgY29uc3Qgb3V0RGlyID0gcGF0aC5kZWZhdWx0LnJlc29sdmUoX19kaXJuYW1lLCAnZGlzdCcpO1xuXG4gICAgICAgICAgZnVuY3Rpb24gY29weVJlY3Vyc2l2ZShzcmM6IHN0cmluZywgZGVzdDogc3RyaW5nKSB7XG4gICAgICAgICAgICBjb25zdCBlbnRyaWVzID0gZnMuZGVmYXVsdC5yZWFkZGlyU3luYyhzcmMsIHsgd2l0aEZpbGVUeXBlczogdHJ1ZSB9KTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xuICAgICAgICAgICAgICBpZiAoZW50cnkubmFtZS5pbmNsdWRlcygnICcpKSBjb250aW51ZTtcbiAgICAgICAgICAgICAgY29uc3Qgc3JjUGF0aCA9IHBhdGguZGVmYXVsdC5qb2luKHNyYywgZW50cnkubmFtZSk7XG4gICAgICAgICAgICAgIGNvbnN0IGRlc3RQYXRoID0gcGF0aC5kZWZhdWx0LmpvaW4oZGVzdCwgZW50cnkubmFtZSk7XG4gICAgICAgICAgICAgIGlmIChlbnRyeS5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICAgICAgZnMuZGVmYXVsdC5ta2RpclN5bmMoZGVzdFBhdGgsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIGNvcHlSZWN1cnNpdmUoc3JjUGF0aCwgZGVzdFBhdGgpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZzLmRlZmF1bHQuY29weUZpbGVTeW5jKHNyY1BhdGgsIGRlc3RQYXRoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvcHlSZWN1cnNpdmUocHVibGljRGlyLCBvdXREaXIpO1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICBdLFxuICBidWlsZDoge1xuICAgIGNvcHlQdWJsaWNEaXI6IGZhbHNlLFxuICB9LFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBleGNsdWRlOiBbJ2x1Y2lkZS1yZWFjdCddLFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsb0JBQW9CO0FBQ3RQLE9BQU8sV0FBVztBQURsQixJQUFNLG1DQUFtQztBQUl6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTjtBQUFBLE1BQ0UsTUFBTTtBQUFBLE1BQ04sYUFBYTtBQUFBLFFBQ1gsWUFBWTtBQUFBLFFBQ1osT0FBTztBQUFBLFFBQ1AsTUFBTSxVQUFVO0FBQ2QsZ0JBQU0sS0FBSyxNQUFNLE9BQU8sSUFBSTtBQUM1QixnQkFBTSxPQUFPLE1BQU0sT0FBTyxNQUFNO0FBQ2hDLGdCQUFNLFlBQVksS0FBSyxRQUFRLFFBQVEsa0NBQVcsUUFBUTtBQUMxRCxnQkFBTSxTQUFTLEtBQUssUUFBUSxRQUFRLGtDQUFXLE1BQU07QUFFckQsbUJBQVMsY0FBYyxLQUFhLE1BQWM7QUFDaEQsa0JBQU0sVUFBVSxHQUFHLFFBQVEsWUFBWSxLQUFLLEVBQUUsZUFBZSxLQUFLLENBQUM7QUFDbkUsdUJBQVcsU0FBUyxTQUFTO0FBQzNCLGtCQUFJLE1BQU0sS0FBSyxTQUFTLEdBQUcsRUFBRztBQUM5QixvQkFBTSxVQUFVLEtBQUssUUFBUSxLQUFLLEtBQUssTUFBTSxJQUFJO0FBQ2pELG9CQUFNLFdBQVcsS0FBSyxRQUFRLEtBQUssTUFBTSxNQUFNLElBQUk7QUFDbkQsa0JBQUksTUFBTSxZQUFZLEdBQUc7QUFDdkIsbUJBQUcsUUFBUSxVQUFVLFVBQVUsRUFBRSxXQUFXLEtBQUssQ0FBQztBQUNsRCw4QkFBYyxTQUFTLFFBQVE7QUFBQSxjQUNqQyxPQUFPO0FBQ0wsbUJBQUcsUUFBUSxhQUFhLFNBQVMsUUFBUTtBQUFBLGNBQzNDO0FBQUEsWUFDRjtBQUFBLFVBQ0Y7QUFFQSx3QkFBYyxXQUFXLE1BQU07QUFBQSxRQUNqQztBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsZUFBZTtBQUFBLEVBQ2pCO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDWixTQUFTLENBQUMsY0FBYztBQUFBLEVBQzFCO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
