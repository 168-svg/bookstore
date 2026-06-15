// 认证模式类型
export type AuthMode = 'single' | 'double'

// 单Token响应类型
export interface ISingleTokenRes {
  token: string
  expiresIn: number // 有效期(秒)
}

// 双Token响应类型
export interface IDoubleTokenRes {
  accessToken: string
  refreshToken: string
  accessExpiresIn: number // 访问令牌有效期(秒)
  refreshExpiresIn: number // 刷新令牌有效期(秒)
}

/**
 * 登录返回的信息，其实就是 token 信息
 */
export type IAuthLoginRes = ISingleTokenRes | IDoubleTokenRes

/**
 * 用户信息
 */
export type UserRole = string

export interface IUserInfoRes {
  userId: number
  username: string
  nickname: string
  avatar?: string
  /** 同时支持单角色和多角色，你自行选择一种就行 */
  role?: UserRole
  roles?: UserRole[]
  [key: string]: any // 允许其他扩展字段
}

// 认证存储数据结构
export interface AuthStorage {
  mode: AuthMode
  tokens: ISingleTokenRes | IDoubleTokenRes
  userInfo?: IUserInfoRes
  loginTime: number // 登录时间戳
}

/**
 * 获取验证码
 */
export interface ICaptcha {
  captchaEnabled: boolean
  uuid: string
  image: string
}
/**
 * 上传成功的信息
 */
export interface IUploadSuccessInfo {
  fileId: number
  originalName: string
  fileName: string
  storagePath: string
  fileHash: string
  fileType: string
  fileBusinessType: string
  fileSize: number
}
/**
 * 更新用户信息
 */
export interface IUpdateInfo {
  id: number
  name: string
  sex: string
}
/**
 * 更新用户信息
 */
export interface IUpdatePassword {
  id: number
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

const TOKEN_KEYS = ['token', 'accessToken', 'access_token', 'Token']
const REFRESH_TOKEN_KEYS = ['refreshToken', 'refresh_token', 'RefreshToken']
const EXPIRES_KEYS = ['expiresIn', 'expires', 'expires_in', 'expireTime']
const ACCESS_EXPIRES_KEYS = ['accessExpiresIn', 'accessExpires', 'access_expires_in', 'access_expireTime']
const REFRESH_EXPIRES_KEYS = ['refreshExpiresIn', 'refreshExpires', 'refresh_expires_in', 'refresh_expireTime']

function tryGetValue(obj: any, keys: string[]): any {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      return obj[key]
    }
  }
  return undefined
}

export function tryGetToken(tokenRes: any): string {
  if (!tokenRes) return ''
  return String(tryGetValue(tokenRes, TOKEN_KEYS) ?? '')
}

export function tryGetRefreshToken(tokenRes: any): string {
  if (!tokenRes) return ''
  return String(tryGetValue(tokenRes, REFRESH_TOKEN_KEYS) ?? '')
}

export function tryGetExpiresIn(tokenRes: any): number {
  if (!tokenRes) return 0
  const val = tryGetValue(tokenRes, EXPIRES_KEYS)
  return val ? Number(val) : 0
}

export function tryGetAccessExpiresIn(tokenRes: any): number {
  if (!tokenRes) return 0
  const val = tryGetValue(tokenRes, ACCESS_EXPIRES_KEYS) ?? tryGetValue(tokenRes, EXPIRES_KEYS)
  return val ? Number(val) : 0
}

export function tryGetRefreshExpiresIn(tokenRes: any): number {
  if (!tokenRes) return 0
  const val = tryGetValue(tokenRes, REFRESH_EXPIRES_KEYS)
  return val ? Number(val) : 0
}

/**
 * 判断是否为单Token响应
 * @param tokenRes 登录响应数据
 * @returns 是否为单Token响应
 */
export function isSingleTokenRes(tokenRes: IAuthLoginRes): tokenRes is ISingleTokenRes {
  if (!tokenRes) return false
  const hasTokenField = TOKEN_KEYS.some(k => (tokenRes as any)[k])
  const hasRefreshTokenField = REFRESH_TOKEN_KEYS.some(k => (tokenRes as any)[k])
  return hasTokenField && !hasRefreshTokenField
}

/**
 * 判断是否为双Token响应
 * @param tokenRes 登录响应数据
 * @returns 是否为双Token响应
 */
export function isDoubleTokenRes(tokenRes: IAuthLoginRes): tokenRes is IDoubleTokenRes {
  if (!tokenRes) return false
  const hasAccessTokenField = ['accessToken', 'access_token', 'token'].some(k => (tokenRes as any)[k])
  const hasRefreshTokenField = REFRESH_TOKEN_KEYS.some(k => (tokenRes as any)[k])
  return hasAccessTokenField && hasRefreshTokenField
}
