import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export interface CartItem {
  id: string
  title: string
  author: string
  price: number
  quantity: number
  checked: boolean
  color: string
  condition?: string
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])

  const totalPrice = computed(() => {
    return items.value
      .filter(item => item.checked)
      .reduce((sum, item) => sum + item.price * item.quantity, 0)
  })

  const totalCount = computed(() => {
    return items.value.reduce((sum, item) => sum + item.quantity, 0)
  })

  const checkedItems = computed(() => {
    return items.value.filter(item => item.checked)
  })

  const checkedCount = computed(() => {
    return checkedItems.value.reduce((sum, item) => sum + item.quantity, 0)
  })

  const isAllChecked = computed(() => {
    return items.value.length > 0 && items.value.every(item => item.checked)
  })

  function addItem(book: Omit<CartItem, 'id' | 'quantity' | 'checked'>) {
    const exist = items.value.find(item => item.title === book.title)
    if (exist) {
      exist.quantity++
    } else {
      items.value.push({
        id: Date.now().toString(),
        ...book,
        quantity: 1,
        checked: true,
      })
    }
  }

  function removeItem(id: string) {
    const index = items.value.findIndex(item => item.id === id)
    if (index > -1) {
      items.value.splice(index, 1)
    }
  }

  function updateQuantity(id: string, change: number) {
    const item = items.value.find(item => item.id === id)
    if (item) {
      item.quantity += change
      if (item.quantity <= 0) {
        removeItem(id)
      }
    }
  }

  function toggleChecked(id: string) {
    const item = items.value.find(item => item.id === id)
    if (item) {
      item.checked = !item.checked
    }
  }

  function toggleAllChecked() {
    const newState = !isAllChecked.value
    items.value.forEach((item) => {
      item.checked = newState
    })
  }

  function uncheckAll() {
    items.value.forEach((item) => {
      item.checked = false
    })
  }

  function clearCheckedItems() {
    items.value = items.value.filter(item => !item.checked)
  }

  function clearAll() {
    items.value = []
  }

  return {
    items,
    totalPrice,
    totalCount,
    checkedItems,
    checkedCount,
    isAllChecked,
    addItem,
    removeItem,
    updateQuantity,
    toggleChecked,
    toggleAllChecked,
    uncheckAll,
    clearCheckedItems,
    clearAll,
  }
}, {
  persist: {
    key: 'bookstore_cart',
  },
})