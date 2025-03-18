import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import App from './App.vue'
import router from './router'
import { handlePriceApi } from './services/apiService'

// Handle API requests before Vue Router
if (window.location.pathname.startsWith('/priceapi/')) {
  handlePriceApi(window.location.pathname).then(response => {
    document.body.innerHTML = `<pre>${JSON.stringify(response, null, 2)}</pre>`;
  });
} else {
  const app = createApp(App)
  app.use(createPinia())
  app.use(router)
  app.component('VueDatePicker', VueDatePicker)
  app.mount('#app')
}
