import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { calculatePrice } from '../services/priceCalculationService';

const TodayPricesHandler = {
  template: '<div></div>',
  async created() {
    try {
      const { fetchPrices } = await import('../services/priceService');
      const data = await fetchPrices(new Date());
      const prices = data.data?.lt || [];
      
      // Calculate our prices with all modifiers
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

      document.open();
      document.write(JSON.stringify(jsonResponse, null, 2));
      document.close();
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
