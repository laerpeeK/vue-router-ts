import type Router from '../index'
import { Route } from '../types'
import { extend } from './misc'
import { getStateKey, setStateKey } from './state-key'
import { assert } from './warn'

/**
 * 存储滚动距离的对象
 */
const positionStore = Object.create(null)

function getScrollPosition() {
  const key = getStateKey()
  if (key) {
    return positionStore[key]
  }
}

export function setupScroll() {
  // Prevent browser scroll behavior on History popstate
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual'
  }
  // Fix for #1585 for Firefox
  // Fix for #2195 Add optional third attribute to workaround a bug in safari https://bugs.webkit.org/show_bug.cgi?id=182678
  // Fix for #2774 Support for apps loaded from Windows file shares not mapped to network drives: replaced location.origin with
  // window.location.protocol + '//' + window.location.host
  // location.host contains the port and location.hostname doesn't
  const protocolAndPath = window.location.protocol + '//' + window.location.host
  const absolutePath = window.location.href.replace(protocolAndPath, '')
  // preserve existing history state as it could be overriden by the user
  const stateCopy = extend({}, window.history.state)
  stateCopy.key = getStateKey()
  window.history.replaceState(stateCopy, '', absolutePath)
  window.addEventListener('popstate', handlePopState)
  return () => {
    window.removeEventListener('popstate', handlePopState)
  }
}

/**
 * 处理页面的滚动距离
 */
export function handleScroll(
  router: Router,
  to: Route,
  from: Route,
  isPop: boolean
) {
  if (!router.app) {
    return
  }

  const behavior = router.options.scrollBehavior
  if (!behavior) {
    return
  }

  if (process.env.NODE_ENV !== 'production') {
    assert(typeof behavior === 'function', `scrollBehavior must be a function`)
  }

  // wait until re-render finishes before scrolling
  router.app.$nextTick(() => {
    const position = getScrollPosition()
    const shouldScroll: any = behavior.call(
      router,
      to,
      from,
      isPop ? position : null
    )

    if (!shouldScroll) {
      return
    }

    if (typeof shouldScroll.then === 'function') {
      shouldScroll.then((shouldScroll: any) => {
        scrollToPosition(shouldScroll, position)
      })
    }

    debugger
  })
}

export function saveScrollPosition() {
  const key = getStateKey()
  if (key) {
    positionStore[key] = {
      x: window.pageXOffset,
      y: window.pageYOffset
    }
  }
}

function handlePopState(e: any) {
  saveScrollPosition()
  if (e.state && e.state.key) {
    setStateKey(e.state.key)
  }
}

const hashStartsWithNumberRE = /^#\d/

function scrollToPosition(shouldScroll: any, position: any) {
  const isObject = typeof shouldScroll === 'object'
  if (isObject && typeof shouldScroll.selector === 'string') {
    // getElementById would still fail if the selector contains a more complicated query like #main[data-attr]
    // but at the same time, it doesn't make much sense to select an element with an id and an extra selector
    const el = hashStartsWithNumberRE
  }
}
