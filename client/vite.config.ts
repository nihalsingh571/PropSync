import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Chunk size warning threshold (kB) — suppress for large vendor libs
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Split vendor chunks for better caching
        manualChunks: {
          'react-vendor':    ['react', 'react-dom', 'react-router-dom'],
          'query-vendor':    ['@tanstack/react-query'],
          'recharts-vendor': ['recharts'],
          'axios-vendor':    ['axios']
        }
      }
    }
  },
  server: {
    port: 5173,
    // Dev proxy — avoids CORS issues when running locally
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})
