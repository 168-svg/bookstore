import { http } from '@/http/http'

export interface IAddress {
  id: number
  user_id: number
  name: string
  phone: string
  address: string
  is_default: number
  created_at: string
  updated_at: string
}

export function getAddresses() {
  return http.get<IAddress[]>('/addresses')
}

export function addAddress(data: { name: string, phone: string, address: string, is_default?: number }) {
  return http.post<{ id: number }>('/addresses', data)
}

export function updateAddress(id: number, data: Partial<{ name: string, phone: string, address: string, is_default: number }>) {
  return http.put(`/addresses/${id}`, data)
}

export function deleteAddress(id: number) {
  return http.delete(`/addresses/${id}`)
}

export function setDefaultAddress(id: number) {
  return http.put(`/addresses/${id}/default`)
}
