import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface OrderBookItem {
  title: string
  author: string
  color: string
  price: number
  quantity: number
  condition?: string
}

export interface OrderItem {
  id: string
  orderNo: string
  books: OrderBookItem[]
  totalCount: number
  totalPrice: number
  shippingFee: number
  status: '待付款' | '待发货' | '待收货' | '已完成'
  address: {
    name: string
    phone: string
    detail: string
  }
  createTime: string
}

export const useOrderStore = defineStore('order', () => {
  const orders = ref<OrderItem[]>([])

  function addOrder(books: OrderBookItem[], totalPrice: number, shippingFee: number, address: OrderItem['address']) {
    const newOrder: OrderItem = {
      id: Date.now().toString(),
      orderNo: Date.now().toString(),
      books,
      totalCount: books.reduce((sum, b) => sum + b.quantity, 0),
      totalPrice,
      shippingFee,
      status: '待发货',
      address,
      createTime: new Date().toLocaleDateString(),
    }
    orders.value.unshift(newOrder)
    return newOrder
  }

  function updateOrderStatus(id: string, status: OrderItem['status']) {
    const order = orders.value.find(item => item.id === id)
    if (order) {
      order.status = status
    }
  }

  function getOrder(id: string) {
    return orders.value.find(o => o.id === id)
  }

  function removeOrder(id: string) {
    orders.value = orders.value.filter(o => o.id !== id)
  }

  return {
    orders,
    addOrder,
    updateOrderStatus,
    getOrder,
    removeOrder,
  }
}, {
  persist: {
    key: 'bookstore_order',
  },
})
