import type Router from '../index'
import { History } from './base'
import { getLocation } from './html5'
import { cleanPath } from '../util/path'
import { pushState, replaceState, supportsPushState } from '../util/push-state'
import type { RawLocation, Route } from '../types'
import { handleScroll, setupScroll } from '../util/scroll'
export class HashHistory extends History {
  constructor(router: Router, base?: string, fallback?: boolean) {
    super(router, base)
    // check history fallback deeplinking
    if (fallback && checkFallback(this.base)) {
      return
    }
    ensureSlash()
  }

  // this is delayed until the app mounts
  // to avoid the hashchange listener being fired too early
  setupListeners() {
    if (this.listeners.length > 0) {
      return
    }

    const router = this.router
    const expectScroll = router.options.scrollBehavior
    const supportScroll = supportsPushState && expectScroll

    if (supportScroll) {
      this.listeners.push(setupScroll())
    }

    const handleRoutingEvent = () => {
      const current = this.current
      if (!ensureSlash()) {
        return
      }
      this.transitionTo(getHash(), (route: Route) => {
        if (supportScroll) {
          handleScroll(this.router, route, current, true)
        }
        if (!supportsPushState) {
          replaceHash(route.fullPath)
        }
      })
    }

    const eventType = supportsPushState ? 'popstate' : 'hashchange'
    window.addEventListener(eventType, handleRoutingEvent)
    this.listeners.push(() => {
      window.removeEventListener(eventType, handleRoutingEvent)
    })
  }

  /**
   * 获取#后的path: 例如：#/a/b -> /a/b
   */
  getCurrentLocation(): string {
    return getHash()
  }

  push(location: RawLocation, onComplete?: Function, onAbort?: Function) {
    const { current: fromRoute } = this
    this.transitionTo(
      location,
      (route: Route) => {
        pushHash(route.fullPath)
        handleScroll(this.router, route, fromRoute, false)
        onComplete && onComplete(route)
      },
      onAbort
    )
  }

  replace(location: RawLocation, onComplete?: Function, onAbort?: Function) {
    const { current: fromRoute } = this
    this.transitionTo(
      location,
      (route: Route) => {
        replaceHash(route.fullPath)
        handleScroll(this.router, route, fromRoute, false)
        onComplete && onComplete(route)
      },
      onAbort
    )
  }

  go(n: number) {
    window.history.go(n)
  }

  ensureURL(push?: boolean) {
    const current = this.current.fullPath
    if (getHash() !== current) {
      push ? pushHash(current) : replaceHash(current)
    }
  }
}

function ensureSlash(): boolean {
  const path = getHash()
  if (path.charAt(0) === '/') {
    return true
  }
  replaceHash('/' + path)
  return false
}

/**
 * 获取#后的path: 例如：#/a/b -> /a/b
 */
export function getHash(): string {
  // We can't use window.location.hash here because it's not
  // consistent across browsers - Firefox will pre-decode it!
  let href = window.location.href
  const index = href.indexOf('#')
  // empty path
  if (index < 0) return ''

  href = href.slice(index + 1)

  return href
}

/**
 * 通过调用该函数并传入指定的路径 path，可以获取包含指定路径的完整 URL，其中路径会作为哈希部分添加到 URL 的末尾
 */
function getUrl(path: string): string {
  const href = window.location.href
  const i = href.indexOf('#')
  const base = i >= 0 ? href.slice(0, i) : href
  return `${base}#${path}`
}

function pushHash(path: string) {
  if (supportsPushState) {
    pushState(getUrl(path))
  } else {
    window.location.hash = path
  }
}

/**
 * 将原路径替换成新路径
 */
function replaceHash(path: string) {
  if (supportsPushState) {
    replaceState(getUrl(path))
  } else {
    window.location.replace(getUrl(path))
  }
}

function checkFallback(base: string): true | undefined {
  const location = getLocation(base)
  if (!/^\/#/.test(location)) {
    window.location.replace(cleanPath(base + '/#' + location))
    return true
  }
}
