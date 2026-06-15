import type { IAuthLoginRes, IUserInfoRes } from './types/login'
import { http } from '@/http/http'

export interface ILoginForm {
  username: string
  password: string
}

export interface IRegisterForm {
  username: string
  password: string
  nickname?: string
}

// 登录
export function login(data: ILoginForm) {
  return http.post<IAuthLoginRes>('/auth/login', data)
}

// 注册
export function register(data: IRegisterForm) {
  return http.post<IAuthLoginRes>('/auth/register', data)
}

// 获取用户信息
export function getUserInfo() {
  return http.get<IUserInfoRes>('/auth/info')
}

// 更新用户信息
export function updateUserInfo(data: { nickname?: string, sex?: string, avatar?: string }) {
  return http.post('/auth/updateInfo', data)
}

// 修改密码
export function updatePassword(data: { oldPassword: string, newPassword: string }) {
  return http.post('/auth/updatePassword', data)
}

// 登出
export function logout() {
  return http.get('/auth/logout')
}

// 刷新 token
export function refreshToken(token: string) {
  return http.post<IAuthLoginRes>('/auth/refreshToken', { refreshToken: token })
}
