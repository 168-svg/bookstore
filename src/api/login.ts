import type {
  IAuthLoginRes,
  ICaptcha,
  IDoubleTokenRes,
  IUpdateInfo,
  IUpdatePassword,
  IUserInfoRes,
} from './types/login'
import { http } from '@/http/http'

export interface ILoginForm {
  username: string
  password: string
}

export function getCode() {
  return http.get<ICaptcha>('/user/getCode')
}

export function login(loginForm: ILoginForm) {
  return http.post<IAuthLoginRes>('/auth/login', loginForm)
}

export function refreshToken(token: string) {
  return http.post<IDoubleTokenRes>('/auth/refreshToken', { refreshToken: token })
}

export function getUserInfo() {
  return http.get<IUserInfoRes>('/user/info')
}

export function logout() {
  return http.get<void>('/auth/logout')
}

export function updateInfo(data: IUpdateInfo) {
  return http.post('/user/updateInfo', data)
}

export function updateUserPassword(data: IUpdatePassword) {
  return http.post('/user/updatePassword', data)
}

export function getWxCode() {
  return new Promise<UniApp.LoginRes>((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: res => resolve(res),
      fail: err => reject(err),
    })
  })
}

export function wxLogin(data: { code: string }) {
  return http.post<IAuthLoginRes>('/auth/wxLogin', data)
}
