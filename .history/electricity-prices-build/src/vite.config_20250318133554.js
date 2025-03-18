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
    middlewares: [
      async (req, res, next) => {
        if (req.url === '/todayprices') {
          console.log('[API] Fetching today prices...');
          try {
            const { fetchPrices } = await import('./src/services/priceService');
            const data = await fetchPrices(new Date());
            console.log(`[API] Found ${data.data?.lt?.length || 0} price entries`);
            
            res.setHeader('Content-Type', 'application/json');
            const response = data.data?.lt || [];
            res.end(JSON.stringify({
              date: new Date().toISOString().split('T')[0],
              count: response.length,
              prices: response
            }, null, 2));
          } catch (error) {
            console.error('[API] Error:', error.message);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to fetch prices' }));
          }
          return;
        }
        next();
      }
    ]
  }
})