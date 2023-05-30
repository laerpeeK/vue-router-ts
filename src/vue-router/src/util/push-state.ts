import { inBrowser } from './dom'
import { extend } from './misc'
import { genStateKey, getStateKey, setStateKey } from './state-key'

/**
 * 判断当前环境是否支持history.pushstate
 */
export const supportsPushState: boolean =
  inBrowser &&
  (function () {
    const ua = window.navigator.userAgent

    if (
      (ua.indexOf('Android 2.') !== -1 || ua.indexOf('Android 4.0') !== -1) &&
      ua.indexOf('Mobile Safari') !== -1 &&
      ua.indexOf('Chrome') === -1 &&
      ua.indexOf('Windows Phone') === -1
    ) {
      return false
    }

    return window.history && typeof window.history.pushState === 'function'
  })()

/**
 * 向浏览器添加一条访问记录
 *
 * @param url
 * @param replace
 */
export function pushState(url: string, replace?: boolean) {
  // saveScrollPosition()

  // try...catch the pushState call to get around Safari
  // DOM Exception 18 where it limits to 100 pushState calls

  const history = window.history
  try {
    if (replace) {
      // preserve existing history state as it could be overriden by the user
      const stateCopy: Record<string, string> = extend({}, history.state)
      stateCopy.key = getStateKey()
      // https://developer.mozilla.org/zh-CN/docs/Web/API/History/replaceState
      history.replaceState(stateCopy, '', url)
    } else {
      // https://developer.mozilla.org/zh-CN/docs/Web/API/History/pushState
      history.pushState({ key: setStateKey(genStateKey()) }, '', url)
    }
  } catch (e) {
    // https://developer.mozilla.org/zh-CN/docs/Web/API/Location/replace
    // https://developer.mozilla.org/zh-CN/docs/Web/API/Location/assign
    window.location[replace ? 'replace' : 'assign'](url)
  }
}

/**
 * 替换一条浏览器访问记录
 *
 * @param url
 */
export function replaceState(url: string) {
  pushState(url, true)
}
