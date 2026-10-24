import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  base: './',
  plugins: [react(), tailwindcss()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: true,
    allowedHosts: true,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`, `.vs` (locked by Visual Studio),
      //    `node_modules` and `dist` to avoid EBUSY crashes
      ignored: ["**/src-tauri/**", "**/.vs/**", "**/node_modules/**", "**/dist/**"],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:4000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve('./src'),
    },
  },

  build: {
    // Split heavy third-party libraries into dedicated chunks so they can be
    // cached independently and the main entry stays small.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('socket.io-client') || id.includes('engine.io-client')) return 'vendor-socket';
          if (id.includes('framer-motion') || id.includes('motion')) return 'vendor-motion';
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('react') || id.includes('scheduler') || id.includes('react-dom')) return 'vendor-react';
          if (id.includes('canvas-confetti')) return 'vendor-confetti';
          return 'vendor';
        },
      },
    },
  },
}));
