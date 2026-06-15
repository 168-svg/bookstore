import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export interface FavoriteItem {
  id: number
  title: string
  author: string
  price: number
  color: string
  condition: string
  seller_name: string
  added_at: string
}

export const useFavoriteStore = defineStore('favorite', () => {
  const items = ref<FavoriteItem[]>([])

  const count = computed(() => items.value.length)

  function isFavorite(id: number) {
    return items.value.some(item => item.id === id)
  }

  function toggle(book: FavoriteItem) {
    const index = items.value.findIndex(item => item.id === book.id)
    if (index > -1) {
      items.value.splice(index, 1)
      return false
    }
    items.value.unshift({
      ...book,
      added_at: new Date().toLocaleString(),
    })
    return true
  }

  function add(book: FavoriteItem) {
    if (!isFavorite(book.id)) {
      items.value.unshift({
        ...book,
        added_at: new Date().toLocaleString(),
      })
    }
  }

  function remove(id: number) {
    items.value = items.value.filter(item => item.id !== id)
  }

  function clear() {
    items.value = []
  }

  return {
    items,
    count,
    isFavorite,
    toggle,
    add,
    remove,
    clear,
  }
}, {
  persist: {
    key: 'bookstore_favorite',
  },
})
