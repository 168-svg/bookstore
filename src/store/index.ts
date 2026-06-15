import { createPinia, setActivePinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'

const store = createPinia()
store.use(
  createPersistedState({
    storage: {
      getItem: uni.getStorageSync,
      setItem: uni.setStorageSync,
    },
  }),
)
setActivePinia(store)

export default store

export * from './token'
export * from './user'
export * from './cart'
export * from './order'
export * from './favorite'
