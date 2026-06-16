/**
 * Token access registry - breaks circular dependency between store and http modules
 * The token store registers its accessors here at runtime, so http modules don't need to import from store.
 */

let tokenGetter: () => string = () => ''
let nowTimeUpdater: () => void = () => {}
let logoutFn: () => Promise<void> = async () => {}
let refreshTokenFn: () => Promise<any> = async () => {
  throw new Error('未实现 token 刷新')
}
let doubleTokenModeChecker: () => boolean = () => false
let refreshTokenGetter: () => string = () => ''

export function setTokenGetter(fn: () => string) {
  tokenGetter = fn
}

export function setNowTimeUpdater(fn: () => void) {
  nowTimeUpdater = fn
}

export function setLogoutFn(fn: () => Promise<void>) {
  logoutFn = fn
}

export function setRefreshTokenFn(fn: () => Promise<any>) {
  refreshTokenFn = fn
}

export function setDoubleTokenModeChecker(fn: () => boolean) {
  doubleTokenModeChecker = fn
}

export function setRefreshTokenGetter(fn: () => string) {
  refreshTokenGetter = fn
}

export function getValidToken(): string {
  return tokenGetter()
}

export function updateNowTime() {
  nowTimeUpdater()
}

export function logout(): Promise<void> {
  return logoutFn()
}

export function refreshToken(): Promise<any> {
  return refreshTokenFn()
}

export function isDoubleTokenMode(): boolean {
  return doubleTokenModeChecker()
}

export function getRefreshToken(): string {
  return refreshTokenGetter()
}
