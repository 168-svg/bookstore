import { http } from '@/http/http'

export interface ICartAdd {
  book_id: number
  quantity?: number
}

// 获取购物车
export function getCart() {
  return http.get('/cart')
}

// 添加到购物车
export function addToCart(data: ICartAdd) {
  return http.post('/cart', data)
}

// 更新购物车项
export function updateCartItem(id: number, data: { quantity?: number, checked?: boolean }) {
  return http.put(`/cart/${id}`, data)
}

// 删除购物车项
export function deleteCartItem(id: number) {
  return http.delete(`/cart/${id}`)
}

// 全选/取消全选
export function toggleAllCart(checked: boolean) {
  return http.post('/cart/toggleAll', { checked })
}

// 清空已选
export function clearCheckedCart() {
  return http.post('/cart/clearChecked')
}
