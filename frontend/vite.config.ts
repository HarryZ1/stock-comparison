// frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy API requests to backend server during development
      '/api': { // Adjust '/api' if your backend routes start differently
        target: 'http://localhost:8000', // Your backend address
        changeOrigin: true,
      }
    }
  }
})