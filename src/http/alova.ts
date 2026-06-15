import type { uniappRequestAdapter } from '@alova/adapter-uniapp'
import type { IResponse } from './types'
import AdapterUniapp from '@alova/adapter-uniapp'
import { createAlova } from 'alova'
import { createServerTokenAuthentication } from 'alova/client'
import VueHook from 'alova/vue'
import { ContentTypeEnum, ResultEnum, ShowMessage } from './tools/enum'

export const API_DOMAINS = {
  DEFAULT: import.meta.env.VITE_SERVER_BASEURL,
  SECONDARY: import.meta.env.VITE_SERVER_BASEURL_SECONDARY,
}

function extractAlovaData(rawData: any): { code: number; message: string; data: any } {
  if (!rawData || typeof rawData !== 'object') {
    return { code: ResultEnum.Success0, message: '', data: rawData }
  }

  const code = rawData.code !== undefined ? rawData.code : ResultEnum.Success0
  const message = rawData.msg || rawData.message || ''
  const data = 'data' in rawData ? rawData.data : rawData

  return { code, message, data }
}

const { onAuthRequired, onResponseRefreshToken } = createServerTokenAuthentication<
  typeof VueHook,
  typeof uniappRequestAdapter
>({
  refreshTokenOnError: {
    isExpired: error => error.response?.status === ResultEnum.Unauthorized,
    handler: async () => {
      throw new Error('Token expired')
    },
  },
})

const alovaInstance = createAlova({
  baseURL: API_DOMAINS.DEFAULT,
  ...AdapterUniapp(),
  timeout: 5000,
  statesHook: VueHook,

  beforeRequest: onAuthRequired((method) => {
    method.config.headers = {
      ContentType: ContentTypeEnum.JSON,
      Accept: 'application/json, text/plain, */*',
      ...method.config.headers,
    }

    const { config } = method
    const requireAuth = !config.meta?.ignoreAuth

    if (requireAuth) {
      // TODO: 接入真实 token 逻辑
      // const token = useTokenStore().validToken
      // if (!token) throw new Error('[请求错误]：未登录')
      // method.config.headers.Authorization = `Bearer ${token}`
    }

    if (config.meta?.domain) {
      method.baseURL = config.meta.domain
    }
  }),

  responded: onResponseRefreshToken((response, method) => {
    const { config } = method
    const { requestType } = config
    const { statusCode, data: rawData, errMsg } = response as UniNamespace.RequestSuccessCallbackResult

    if (requestType === 'upload' || requestType === 'download') {
      return response
    }

    if (statusCode === 401) {
      throw new Error('未授权')
    }

    if (statusCode < 200 || statusCode >= 300) {
      const errorMessage = ShowMessage(statusCode) || `HTTP请求错误[${statusCode}]`
      uni.showToast({ title: errorMessage, icon: 'error' })
      throw new Error(`${errorMessage}：${errMsg}`)
    }

    const { code, message, data } = extractAlovaData(rawData)
    if (code !== ResultEnum.Success0 && code !== ResultEnum.Success200) {
      if (config.meta?.toast !== false) {
        uni.showToast({ title: message || '请求错误', icon: 'none' })
      }
      throw new Error(`请求错误[${code}]：${message}`)
    }

    return data
  }),
})

export const http = alovaInstance
