import { http } from '@/http/http'

export interface ICategory {
  id: number
  name: string
  sort_order: number
  subs: ISubCategory[]
}

export interface ISubCategory {
  id: number
  category_id: number
  name: string
  color: string
  sort_order: number
}

// 获取所有分类
export function getCategories() {
  return http.get<ICategory[]>('/categories')
}

// 添加分类
export function addCategory(data: { name: string, sort_order?: number }) {
  return http.post<{ id: number }>('/categories', data)
}

// 更新分类
export function updateCategory(id: number, data: { name?: string, sort_order?: number }) {
  return http.put(`/categories/${id}`, data)
}

// 删除分类
export function deleteCategory(id: number) {
  return http.delete(`/categories/${id}`)
}

// 添加子分类
export function addSubCategory(data: { category_id: number, name: string, color?: string, sort_order?: number }) {
  return http.post<{ id: number }>('/categories/sub', data)
}

// 更新子分类
export function updateSubCategory(id: number, data: { name?: string, color?: string, sort_order?: number }) {
  return http.put(`/categories/sub/${id}`, data)
}

// 删除子分类
export function deleteSubCategory(id: number) {
  return http.delete(`/categories/sub/${id}`)
}
