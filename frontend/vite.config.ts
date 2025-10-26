import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Disabilita fast refresh completamente
      devTarget: 'esnext',
    })
  ],
  esbuild: {
    // Disabilita inject per React
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    hmr: {
      overlay: false, // Disabilita overlay errori per ora
    },
    proxy: {
      '/api/directus': {
        target: 'https://omnilypro-directus.onrender.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/directus/, ''),
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  optimizeDeps: {
    exclude: ['@react-refresh'], // Escludi react-refresh da pre-bundling
  },
})
