import { http } from '@/http/http'

export interface IAdminUser {
  id: number
  username: string
  nickname: string
  avatar: string
  role: string
  sex: string
  created_at: string
  updated_at: string
}

export interface IAdminStats {
  userCount: number
  bookCount: number
  orderCount: number
  totalSales: number
  onSaleCount: number
  pendingOrderCount: number
}

// 获取用户列表
export function getUsers(params?: { keyword?: string, role?: string, page?: number, pageSize?: number }) {
  return http.get<{ list: IAdminUser[], total: number, page: number, pageSize: number }>('/users', params)
}

// 更新用户角色
export function updateUserRole(id: number, role: string) {
  return http.put(`/users/${id}/role`, { role })
}

// 删除用户
export function deleteUser(id: number) {
  return http.delete(`/users/${id}`)
}

// 重置用户密码
export function resetUserPassword(id: number, password: string) {
  return http.put(`/users/${id}/password`, { password })
}

// 获取管理统计
export function getAdminStats() {
  return http.get<IAdminStats>('/users/admin/stats')
}
