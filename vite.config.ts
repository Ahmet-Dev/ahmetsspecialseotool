import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: 'localhost',
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  build: {
    sourcemap: false, // Production'da sourcemap kapatılır
    minify: 'terser'
  },
  define: {
    // CSP uyumluluğu için eval kullanımını engelle
    __EVAL_DISABLE__: true
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'axios', 'cheerio']
  }
})
