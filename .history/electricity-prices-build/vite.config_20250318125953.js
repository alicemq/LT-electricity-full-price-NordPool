import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://dashboard.elering.ee',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[${new Date().toISOString()}] Proxying: ${req.method} ${req.url} -> ${options.target}${req.url}`);
          });
        }
      },
      '^/priceapi/v1/.*': {
        target: 'http://localhost:5173',
        bypass: async (req, res) => {
          const { handlePriceApi } = await import('./src/services/apiService');
          const data = await handlePriceApi(req.url);
          res.setHeader('Content-Type', 'application/json');
          return JSON.stringify(data, null, 2);
        }
      }
    }
  }
})
