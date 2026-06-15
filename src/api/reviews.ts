import { http } from '@/http/http'

export interface IReview {
  id: number
  book_id: number
  user_id: number
  nickname: string
  rating: number
  content: string
  created_at: string
}

// 获取某本书的评论列表
export function getBookReviews(bookId: number) {
  return http.get<{ list: IReview[]; total: number; avgRating: number }>(`/reviews/${bookId}`)
}

// 发表评论
export function createReview(data: { book_id: number; rating: number; content: string }) {
  return http.post<{ id: number }>('/reviews', data)
}
