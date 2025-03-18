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
      path: '/todayprices',
      component: () => import('../views/JsonPriceView.vue')
    },
    {
      path: '/futureprices',
      component: () => import('../views/JsonFuturePriceView.vue')
    }
  ]
})

export default router
