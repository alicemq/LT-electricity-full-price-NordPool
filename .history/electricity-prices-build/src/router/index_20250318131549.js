import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

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
      path: '/priceapi/:pathMatch(.*)*',
      name: 'api',
      component: {
        async beforeRouteEnter(to, from, next) {
          const { handlePriceApi } = await import('../services/apiService');
          const data = await handlePriceApi(to.path);
          document.body.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
          next(false);
        }
      }
    }
  ]
})

export default router
