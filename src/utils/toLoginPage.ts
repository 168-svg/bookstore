import { getLastPage } from '@/utils'
import { debounce } from '@/utils/debounce'

interface ToLoginPageOptions {
  /**
   * 跳转模式, uni.navigateTo | uni.reLaunch
   * @default 'navigateTo'
   */
  mode?: 'navigateTo' | 'reLaunch'
  /**
   * 查询参数
   * @example '?redirect=/pages/home/index'
   */
  queryString?: string
}

const LOGIN_PAGE = '/pages/me/me'

export const toLoginPage = debounce((_options: ToLoginPageOptions = {}) => {
  const currentPage = getLastPage()
  const currentPath = `/${currentPage.route}`
  if (currentPath === LOGIN_PAGE) {
    return
  }
  uni.switchTab({ url: LOGIN_PAGE })
}, 500)