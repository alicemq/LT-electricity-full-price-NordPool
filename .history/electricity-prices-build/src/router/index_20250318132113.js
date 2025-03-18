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
      component: { template: '<div></div>' },
      beforeEnter: async (to) => {
        const { handlePriceApi } = await import('../services/apiService');
        const data = await handlePriceApi(to.path);
        window.document.documentElement.innerHTML = `
          <pre style="padding: 20px">${JSON.stringify(data, null, 2)}</pre>
        `;
        return false;
      }
    }
  ]
})

export default router
