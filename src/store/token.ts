import type { ILoginForm } from '@/api/auth'
import type { IAuthLoginRes } from '@/api/types/login'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  login as _login,
  logout as _logout,
  refreshToken as _refreshToken,
} from '@/api/auth'
import {
  isSingleTokenRes,
  isDoubleTokenRes,
  tryGetToken,
  tryGetRefreshToken,
  tryGetExpiresIn,
  tryGetAccessExpiresIn,
  tryGetRefreshExpiresIn,
} from '@/api/types/login'
import { isDoubleTokenMode } from '@/utils'
import {
  setTokenGetter,
  setNowTimeUpdater,
  setLogoutFn,
  setRefreshTokenFn,
  setDoubleTokenModeChecker,
  setRefreshTokenGetter,
} from '@/http/token-access'

const STORAGE_KEY_ACCESS_EXPIRE = 'accessTokenExpireTime'
const STORAGE_KEY_REFRESH_EXPIRE = 'refreshTokenExpireTime'

const SINGLE_TOKEN_STATE = {
  token: '',
  expiresIn: 0,
}

const DOUBLE_TOKEN_STATE = {
  accessToken: '',
  accessExpiresIn: 0,
  refreshToken: '',
  refreshExpiresIn: 0,
}

const TOKEN_DEFAULT_EXPIRE_SECONDS = 24 * 60 * 60

const tokenInfoState: IAuthLoginRes = isDoubleTokenMode
  ? { ...DOUBLE_TOKEN_STATE }
  : { ...SINGLE_TOKEN_STATE }

function getTokenValue(info: IAuthLoginRes): string {
  if (!info) return ''
  if (isDoubleTokenMode) {
    return (info as any).accessToken || (info as any).token || tryGetToken(info)
  }
  return (info as any).token || (info as any).accessToken || tryGetToken(info)
}

function getRefreshTokenValue(info: IAuthLoginRes): string {
  if (!info) return ''
  if (isDoubleTokenMode) {
    return (info as any).refreshToken || tryGetRefreshToken(info)
  }
  return tryGetRefreshToken(info)
}

function getSafeExpireTime(rawExpiresIn: number): number {
  const expiresIn = rawExpiresIn && rawExpiresIn > 0 ? rawExpiresIn : TOKEN_DEFAULT_EXPIRE_SECONDS
  return Date.now() + expiresIn * 1000
}

export const useTokenStore = defineStore(
  'token',
  () => {
    const tokenInfo = ref<IAuthLoginRes>({ ...tokenInfoState })
    const nowTime = ref(Date.now())

    const updateNowTime = () => {
      nowTime.value = Date.now()
    }

    const setTokenInfo = (val: IAuthLoginRes) => {
      updateNowTime()
      tokenInfo.value = val

      if (isSingleTokenRes(val)) {
        const expiresIn = (val as any).expiresIn || tryGetExpiresIn(val) || TOKEN_DEFAULT_EXPIRE_SECONDS
        uni.setStorageSync(STORAGE_KEY_ACCESS_EXPIRE, getSafeExpireTime(expiresIn))
      }
      else if (isDoubleTokenRes(val)) {
        const accessExpiresIn = (val as any).accessExpiresIn || tryGetAccessExpiresIn(val) || TOKEN_DEFAULT_EXPIRE_SECONDS
        const refreshExpiresIn = (val as any).refreshExpiresIn || tryGetRefreshExpiresIn(val) || TOKEN_DEFAULT_EXPIRE_SECONDS * 7
        uni.setStorageSync(STORAGE_KEY_ACCESS_EXPIRE, getSafeExpireTime(accessExpiresIn))
        uni.setStorageSync(STORAGE_KEY_REFRESH_EXPIRE, getSafeExpireTime(refreshExpiresIn))
      }
      else {
        const expiresIn = tryGetExpiresIn(val) || tryGetAccessExpiresIn(val) || TOKEN_DEFAULT_EXPIRE_SECONDS
        uni.setStorageSync(STORAGE_KEY_ACCESS_EXPIRE, getSafeExpireTime(expiresIn))
      }
    }

    const isTokenExpired = computed(() => {
      const expireTime = uni.getStorageSync(STORAGE_KEY_ACCESS_EXPIRE) as number | undefined
      if (!expireTime || expireTime <= 0) return false
      return nowTime.value >= expireTime
    })

    const isRefreshTokenExpired = computed(() => {
      if (!isDoubleTokenMode)
        return true
      const refreshExpireTime = uni.getStorageSync(STORAGE_KEY_REFRESH_EXPIRE) as number | undefined
      if (!refreshExpireTime || refreshExpireTime <= 0) return false
      return nowTime.value >= refreshExpireTime
    })

    const validToken = computed(() => {
      if (isTokenExpired.value)
        return ''
      return getTokenValue(tokenInfo.value)
    })

    const hasLoginInfo = computed(() => {
      return !!getTokenValue(tokenInfo.value)
    })

    const hasLogin = computed(() => {
      return hasLoginInfo.value && !isTokenExpired.value
    })

    async function _postLogin(info: IAuthLoginRes) {
      setTokenInfo(info)
      const userStore = await import('./user').then(m => m.useUserStore())
      try {
        await userStore.fetchUserInfo()
      }
      catch (e) {
        // 获取用户信息失败不影响登录成功
      }
    }

    const login = async (loginForm: ILoginForm) => {
      const res = await _login(loginForm)
      await _postLogin(res)
      uni.showToast({ title: '登录成功', icon: 'success' })
      return res
    }

    const logout = async () => {
      try {
        await _logout()
      }
      catch (e) {
        // ignore
      }
      finally {
        updateNowTime()
        uni.removeStorageSync(STORAGE_KEY_ACCESS_EXPIRE)
        uni.removeStorageSync(STORAGE_KEY_REFRESH_EXPIRE)
        tokenInfo.value = { ...tokenInfoState }
        const userStore = await import('./user').then(m => m.useUserStore())
        userStore.clearUserInfo()
      }
    }

    const doRefresh = async () => {
      if (!isDoubleTokenMode) {
        throw new Error('单token模式不支持刷新token')
      }
      if (!isDoubleTokenRes(tokenInfo.value) || !tokenInfo.value.refreshToken) {
        throw new Error('无效的refreshToken')
      }
      try {
        const res = await _refreshToken(tokenInfo.value.refreshToken)
        setTokenInfo(res)
        return res
      }
      finally {
        updateNowTime()
      }
    }

    const tryGetValidToken = async (): Promise<string> => {
      updateNowTime()
      if (!validToken.value && isDoubleTokenMode && !isRefreshTokenExpired.value) {
        try {
          await doRefresh()
          return validToken.value
        }
        catch {
          return ''
        }
      }
      return validToken.value
    }

    // Register with token-access registry so http modules can access token without circular import
    setTokenGetter(() => validToken.value)
    setNowTimeUpdater(() => updateNowTime())
    setLogoutFn(() => logout())
    setRefreshTokenFn(() => doRefresh())
    setDoubleTokenModeChecker(() => isDoubleTokenMode)
    setRefreshTokenGetter(() => getRefreshTokenValue(tokenInfo.value))

    return {
      login,
      logout,
      hasLogin,
      validToken,
      tokenInfo,
      setTokenInfo,
      updateNowTime,
    }
  },
  {
    persist: true,
  },
)
