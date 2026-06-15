import type { PageMetaDatum, SubPackages } from '@uni-helper/vite-plugin-uni-pages'
import { isMpWeixin } from '@uni-helper/uni-env'
import { pages, subPackages } from '@/pages.json'

export type PageInstance = Page.PageInstance<AnyObject, object> & {
  $page: Page.PageInstance<AnyObject, object> & { fullPath: string }
}

export function getLastPage() {
  const currentPages = getCurrentPages()
  return currentPages[currentPages.length - 1] as PageInstance
}

export function currRoute() {
  const lastPage = getLastPage() as PageInstance
  if (!lastPage) {
    return { path: '', query: {} }
  }
  return parseUrlToObj(lastPage.$page.fullPath)
}

export function ensureDecodeURIComponent(url: string): string {
  if (url.startsWith('%')) {
    return ensureDecodeURIComponent(decodeURIComponent(url))
  }
  return url
}

export function parseUrlToObj(url: string) {
  const [path, queryStr] = url.split('?')

  if (!queryStr) {
    return { path, query: {} }
  }

  const query: Record<string, string> = {}
  queryStr.split('&').forEach((item) => {
    const [key, value] = item.split('=')
    query[key] = ensureDecodeURIComponent(value)
  })
  return { path, query }
}

export function getAllPages(key?: string) {
  const mainPages = (pages as PageMetaDatum[])
    .filter(page => !key || page[key])
    .map(page => ({ ...page, path: `/${page.path}` }))

  const subPages: PageMetaDatum[] = []
  ;(subPackages as SubPackages).forEach((subPageObj) => {
    const { root } = subPageObj
    subPageObj.pages
      .filter(p => !key || p[key])
      .forEach((p) => {
        subPages.push({ ...p, path: `/${root}/${p.path}` })
      })
  })

  return [...mainPages, ...subPages]
}

export function getEnvBaseUrl() {
  let baseUrl = import.meta.env.VITE_SERVER_BASEURL

  if (isMpWeixin) {
    const { miniProgram: { envVersion } } = uni.getAccountInfoSync()
    const weixinBaseUrlMap: Record<string, string | undefined> = {
      develop: import.meta.env.VITE_SERVER_BASEURL__WEIXIN_DEVELOP,
      trial: import.meta.env.VITE_SERVER_BASEURL__WEIXIN_TRIAL,
      release: import.meta.env.VITE_SERVER_BASEURL__WEIXIN_RELEASE,
    }
    baseUrl = weixinBaseUrlMap[envVersion] || baseUrl
  }

  return baseUrl
}

export const isDoubleTokenMode = import.meta.env.VITE_AUTH_MODE === 'double'

export const HOME_PAGE = `/${(pages as PageMetaDatum[]).find(page => page.type === 'home')?.path || (pages as PageMetaDatum[])[0].path}`
