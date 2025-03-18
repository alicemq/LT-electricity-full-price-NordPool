import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { calculatePrice } from '../services/priceCalculationService';

const JsonResponse = {
  template: '<div>Loading...</div>',
  async beforeRouteEnter(to, from, next) {
    if (to.path === '/todayprices') {
      const { fetchPrices } = await import('../services/priceService');
      const data = await fetchPrices(new Date());
      const prices = data.data?.lt || [];
      
      const processedPrices = prices.map(price => ({
        timestamp: price.timestamp,
        originalPrice: price.price,
        calculatedPrice: calculatePrice(price)
      }));

      const response = {
        date: new Date().toISOString().split('T')[0],
        count: processedPrices.length,
        prices: processedPrices
      };

      next(false);
      location.href = 'data:application/json,' + encodeURIComponent(JSON.stringify(response, null, 2));
    } else {
      next();
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
      component: JsonResponse
    }
  ]
})

export default router
