import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

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
        secure: false
      }
    },
    fs: {
      strict: false
    },
    middleware: [
      async (req, res, next) => {
        if (req.url.startsWith('/priceapi/v1')) {
          const { handleStaticApi } = await import('./src/services/mockApiService');
          res.end(await handleStaticApi(req, res));
          return;
        }
        next();
      }
    ]
  }
})