import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { copyFileSync } from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Disabilita fast refresh completamente
      devTarget: 'esnext',
    }),
    // Plugin per copiare loading.html nella build
    {
      name: 'copy-loading-html',
      closeBundle() {
        copyFileSync(
          path.resolve(__dirname, 'public/loading.html'),
          path.resolve(__dirname, 'dist/loading.html')
        )
      }
    }
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
    sourcemap: false, // Disabilita sourcemap in produzione per sicurezza
    minify: 'terser',
    terserOptions: {
      compress: {
        pure_funcs: [
          'console.log',
          'console.info',
          'console.debug',
          'console.trace'
        ], // Rimuove questi in produzione, MANTIENE error/warn
        drop_debugger: true,
      },
    },
  },
  optimizeDeps: {
    exclude: ['@react-refresh'], // Escludi react-refresh da pre-bundling
  },
})
