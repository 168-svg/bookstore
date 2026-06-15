import type { CustomRequestOptions, IResponse } from '@/http/types'
import { ResultEnum } from './tools/enum'

function extractDataAndCode(rawData: any): { code: number; msg: string; data: any } {
  if (!rawData) {
    return { code: ResultEnum.Success0, msg: '', data: null as any }
  }

  if (typeof rawData !== 'object') {
    return { code: ResultEnum.Success0, msg: '', data: rawData }
  }

  const hasCode = 'code' in rawData
  const hasData = 'data' in rawData
  const hasMsg = 'msg' in rawData || 'message' in rawData

  if (hasCode && hasData) {
    return {
      code: rawData.code,
      msg: rawData.msg || rawData.message || '',
      data: rawData.data,
    }
  }

  if (hasCode && !hasData) {
    return {
      code: rawData.code,
      msg: rawData.msg || rawData.message || '',
      data: rawData,
    }
  }

  if (!hasCode && hasData) {
    return {
      code: ResultEnum.Success0,
      msg: rawData.msg || rawData.message || '',
      data: rawData.data,
    }
  }

  return { code: ResultEnum.Success0, msg: '', data: rawData }
}

export function http<T>(options: CustomRequestOptions) {
  return new Promise<T>((resolve, reject) => {
    uni.request({
      ...options,
      dataType: 'json',
      // #ifndef MP-WEIXIN
      responseType: 'json',
      // #endif
      success: (res) => {
        const rawData = res.data
        const { code, msg, data } = extractDataAndCode(rawData)

        if (res.statusCode === 401 || code === 401) {
          reject(new Error('未授权'))
          return
        }

        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (code !== ResultEnum.Success0 && code !== ResultEnum.Success200) {
            uni.showToast({ icon: 'none', title: msg || '请求错误' })
            reject(data)
            return
          }
          resolve(data as T)
          return
        }

        if (!options.hideErrorToast) {
          uni.showToast({ icon: 'none', title: msg || '请求错误' })
        }
        reject(res)
      },
      fail(err) {
        uni.showToast({ icon: 'none', title: '网络错误，换个网络试试' })
        reject(err)
      },
    })
  })
}

export function httpGet<T>(
  url: string,
  query?: Record<string, any>,
  header?: Record<string, any>,
  options?: Partial<CustomRequestOptions>,
) {
  return http<T>({ url, query, method: 'GET', header, ...options })
}

export function httpPost<T>(
  url: string,
  data?: Record<string, any>,
  query?: Record<string, any>,
  header?: Record<string, any>,
  options?: Partial<CustomRequestOptions>,
) {
  return http<T>({ url, query, data, method: 'POST', header, ...options })
}

export function httpPut<T>(
  url: string,
  data?: Record<string, any>,
  query?: Record<string, any>,
  header?: Record<string, any>,
  options?: Partial<CustomRequestOptions>,
) {
  return http<T>({ url, data, query, method: 'PUT', header, ...options })
}

export function httpDelete<T>(
  url: string,
  query?: Record<string, any>,
  header?: Record<string, any>,
  options?: Partial<CustomRequestOptions>,
) {
  return http<T>({ url, query, method: 'DELETE', header, ...options })
}

http.get = httpGet
http.post = httpPost
http.put = httpPut
http.delete = httpDelete

http.Get = httpGet
http.Post = httpPost
http.Put = httpPut
http.Delete = httpDelete
