import { createSSRApp } from 'vue'
import App from './App.vue'
import { requestInterceptor } from './http/interceptor'
import { routeInterceptor } from './router/interceptor'

import store from './store'
import { useTokenStore } from './store/token'
import '@/style/index.scss'
import 'virtual:uno.css'

export function createApp() {
  const app = createSSRApp(App)
  app.use(store)
  // Initialize token store early so the token-access registry is populated
  // before any HTTP requests are made
  useTokenStore()
  app.use(routeInterceptor)
  app.use(requestInterceptor)

  return {
    app,
  }
}
