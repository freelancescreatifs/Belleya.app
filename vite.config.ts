import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-public-files',
      closeBundle() {
        const publicFiles = [
          'logo-1.png',
          'logo-belleya1.png',
          'maquilleuse.jpeg',
          'massage.jpg',
          'nail_artist.jpg',
          'prestataire.jpeg',
          'tech_cils.jpg'
        ];

        const distDir = join(__dirname, 'dist');
        if (!existsSync(distDir)) {
          mkdirSync(distDir, { recursive: true });
        }

        publicFiles.forEach(file => {
          const src = join(__dirname, 'public', file);
          const dest = join(distDir, file);
          try {
            if (existsSync(src)) {
              copyFileSync(src, dest);
            }
          } catch (err) {
            console.warn(`Warning: Could not copy ${file}`);
          }
        });
      }
    }
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  publicDir: false,
});
