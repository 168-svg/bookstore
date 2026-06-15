import type { CustomRequestOptions } from '@/http/types'
import { getValidToken, updateNowTime } from '@/http/token-access'
import { getEnvBaseUrl } from '@/utils'
import { stringifyQuery } from './tools/queryString'

let _baseUrl: string | null = null

function getBaseUrl() {
  if (_baseUrl === null) {
    _baseUrl = getEnvBaseUrl()
  }
  return _baseUrl
}

const httpInterceptor = {
  invoke(options: CustomRequestOptions) {
    if (options.query) {
      const queryStr = stringifyQuery(options.query)
      options.url += options.url.includes('?') ? `&${queryStr}` : `?${queryStr}`
    }

    if (!options.url.startsWith('http')) {
      const baseUrl = getBaseUrl()
      // #ifdef H5
      if (JSON.parse(import.meta.env.VITE_APP_PROXY_ENABLE)) {
        options.url = import.meta.env.VITE_APP_PROXY_PREFIX + options.url
      }
      else {
        options.url = baseUrl + options.url
      }
      // #endif
      // #ifndef H5
      options.url = baseUrl + options.url
      // #endif
    }

    options.timeout = 60000
    options.header = { ...options.header }

    updateNowTime()
    const token = getValidToken()
    if (token) {
      options.header.Authorization = `Bearer ${token}`
    }

    return options
  },
}

export const requestInterceptor = {
  install() {
    uni.addInterceptor('request', httpInterceptor)
    uni.addInterceptor('uploadFile', httpInterceptor)
  },
}
