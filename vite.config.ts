import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-public-skip-spaces',
      writeBundle: {
        sequential: true,
        order: 'post',
        async handler() {
          const fs = await import('fs');
          const path = await import('path');
          const publicDir = path.default.resolve(__dirname, 'public');
          const outDir = path.default.resolve(__dirname, 'dist');

          function copyRecursive(src: string, dest: string) {
            const entries = fs.default.readdirSync(src, { withFileTypes: true });
            for (const entry of entries) {
              if (entry.name.includes(' ')) continue;
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
        },
      },
    },
  ],
  build: {
    copyPublicDir: false,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
