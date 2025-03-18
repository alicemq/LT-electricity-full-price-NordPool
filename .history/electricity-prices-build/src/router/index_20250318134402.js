import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { calculatePrice } from '../services/priceCalculationService';

const TodayPricesHandler = {
  template: '<pre></pre>',
  async created() {
    try {
      const { fetchPrices } = await import('../services/priceService');
      const data = await fetchPrices(new Date());
      const prices = data.data?.lt || [];
      
      const processedPrices = prices.map(price => ({
        timestamp: price.timestamp,
        originalPrice: price.price,
        calculatedPrice: calculatePrice(price)
      }));

      const jsonResponse = {
        date: new Date().toISOString().split('T')[0],
        count: processedPrices.length,
        prices: processedPrices
      };

      // Set proper content type header
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Type';
      meta.content = 'application/json';
      document.head.appendChild(meta);

      // Clear document and write JSON
      document.body.innerHTML = '';
      document.body.appendChild(document.createTextNode(JSON.stringify(jsonResponse, null, 2)));
    } catch (error) {
      document.body.textContent = JSON.stringify({ error: 'Failed to fetch prices' });
    }
  }
};

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue')
    },
    {
      path: '/todayprices',
      component: TodayPricesHandler
    }
  ]
})

export default router
