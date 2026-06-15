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
  const orders = ref<OrderItem[]>([
    {
      id: '1',
      orderNo: '20240518112233',
      books: [
        { title: '百年孤独', author: '马尔克斯', color: '#4f2929', price: 15.00, quantity: 1, condition: '8成新' },
      ],
      totalCount: 1,
      totalPrice: 18.00,
      shippingFee: 3.00,
      status: '待收货',
      address: { name: '张同学', phone: '138****1234', detail: '浙江省杭州市西湖区文三路123号' },
      createTime: '2024-05-18',
    },
  ])

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
    const order = orders.value.find((item) => item.id === id)
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