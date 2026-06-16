import { http } from '@/http/http'

export interface IOrder {
  id: number
  order_no: string
  buyer_id: number
  buyer_name?: string
  total_price: number
  shipping_fee: number
  status: string
  address: string
  items: IOrderItem[]
  created_at: string
  updated_at: string
}

export interface IOrderItem {
  id: number
  order_id: number
  book_id: number
  title: string
  price: number
  quantity: number
  color: string
}

// 获取我的订单
export function getOrders(params?: { status?: string, role?: 'buyer' | 'seller', page?: number, pageSize?: number }) {
  return http.get<{ list: IOrder[], total: number, page: number, pageSize: number }>('/orders', params)
}

// 创建订单
export function createOrder(data?: { address?: string }) {
  return http.post<{ orderId: number, orderNo: string }>('/orders', data)
}

// 更新订单状态
export function updateOrderStatus(id: number, status: string) {
  return http.put(`/orders/${id}/status`, { status })
}

// 管理员：获取所有订单
export function getAdminOrders(params?: { status?: string, keyword?: string, page?: number, pageSize?: number }) {
  return http.get<{ list: IOrder[], total: number, page: number, pageSize: number }>('/orders/admin/all', params)
}
