import { http } from '@/http/http'
import type { IBook } from './books'

export interface IFavoriteItem extends IBook {
  favorite_id: number
}

export function getFavorites() {
  return http.get<{ list: IFavoriteItem[], total: number }>('/favorites')
}

export function addFavorite(book_id: number) {
  return http.post<{ msg?: string }>('/favorites', { book_id })
}

export function removeFavorite(book_id: number) {
  return http.delete(`/favorites/${book_id}`)
}

export function checkFavorite(book_id: number) {
  return http.get<{ is_favorite: boolean }>(`/favorites/${book_id}`)
}
