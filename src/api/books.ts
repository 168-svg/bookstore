import { http } from '@/http/http'

export interface IBook {
  id: number
  title: string
  author: string
  price: number
  original_price: number
  color: string
  condition: string
  publisher: string
  publish_date: string
  isbn: string
  description: string
  cover_url: string
  seller_id: number
  seller_name: string
  sub_category_id: number | null
  sub_category_name: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface IBookListParams {
  keyword?: string
  category_id?: number
  sub_category_id?: number
  status?: string
  page?: number
  pageSize?: number
}

// 获取书籍列表
export function getBooks(params?: IBookListParams) {
  return http.get<{ list: IBook[], total: number, page: number, pageSize: number }>('/books', params)
}

// 获取书籍详情
export function getBookDetail(id: number) {
  return http.get<IBook>(`/books/${id}`)
}

// 发布书籍
export function publishBook(data: Partial<IBook>) {
  return http.post<{ id: number }>('/books', data)
}

// 更新书籍
export function updateBook(id: number, data: Partial<IBook>) {
  return http.put(`/books/${id}`, data)
}

// 删除书籍
export function deleteBook(id: number) {
  return http.delete(`/books/${id}`)
}

// 管理员：获取所有书籍
export function getAdminBooks(params?: IBookListParams) {
  return http.get<{ list: IBook[], total: number, page: number, pageSize: number }>('/books/admin/all', params)
}
