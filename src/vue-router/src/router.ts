import Vue from 'vue'
import { Install, install } from './install'
import type {
  Location,
  NavigationGuard,
  RawLocation,
  Route,
  RouterOptions
} from './types'
import { supportsPushState } from './util/push-state'
import { assert, warn } from './util/warn'
import { inBrowser } from './util/dom'
import { HTML5History } from './history/html5'
import { HashHistory } from './history/hash'
import { AbstractHistory } from './history/abstract'
import { createMatcher, Matcher } from './create-matcher'
import { START } from './util/route'
import { handleScroll } from './util/scroll'
import { NavigationFailureType, isNavigationFailure } from './util/errors'

export default class VueRouter {
  static version: string // 版本号
  static install: Install // install方法,Vue-router插件安装
  static START_LOCATION: Readonly<Route> // 初始路由对象(规范化的)
  static NavigationFailureType: typeof NavigationFailureType // 不同的路由错误类型
  static isNavigationFailure: typeof isNavigationFailure // 判断错误类型是否为路由错误

  app: Vue | null // 当前使用Vue-router对应的Vue实例
  apps: Array<Vue> // 项目中所有使用Vue-router的Vue实例数组
  options: RouterOptions //  初始化Vue-Router的初始化选项
  fallback: boolean // 在H5history模式下是否支持回退到hash模式
  mode: string //  当前使用的路由模式
  history!: HTML5History | HashHistory | AbstractHistory // 当前的history类
  beforeHooks: Array<NavigationGuard> //  全局前置守卫集合
  resolveHooks: Array<NavigationGuard> // 全局解析守卫集合
  afterHooks: Array<(to: Route, from: Route) => void> // 全局后置钩子集合
  matcher: Matcher // 用于匹配路由的方法集合

  constructor(options: RouterOptions = {}) {
    debugger
    if (process.env.NODE_ENV !== 'production') {
      warn(
        this instanceof VueRouter,
        `Router must be called with the new operator.`
      )
    }
    this.app = null
    this.apps = []
    this.options = options
    this.beforeHooks = []
    this.resolveHooks = []
    this.afterHooks = []
    this.matcher = createMatcher(options.routes || [], this)

    let mode = options.mode || 'hash'
    this.fallback =
      mode === 'history' && !supportsPushState && options.fallback !== false
    if (this.fallback) {
      mode = 'hash'
    }
    if (!inBrowser) {
      mode = 'abstract'
    }
    this.mode = mode

    switch (mode) {
      case 'history':
        this.history = new HTML5History(this, options.base)
        break
      case 'hash':
        this.history = new HashHistory(this, options.base, this.fallback)
        break
      case 'abstract':
        this.history = new AbstractHistory(this, options.base)
        break
      default:
        if (process.env.NODE_ENV !== 'production') {
          assert(false, `invalid mode: ${mode}`)
        }
    }
  }

  init(app: Vue) {
    // router初始化, 在app的beforeCreate钩子中调用
    debugger
    process.env.NODE_ENV !== 'production' &&
      assert(
        install.installed,
        `not installed. Make sure to call \`Vue.use(VueRouter)\` ` +
          `before creating root instance.`
      )

    this.apps.push(app)

    // set up app destroyed handler
    // https://github.com/vuejs/vue-router/issues/2639
    app.$once('hook:destroyed', () => {
      // clean out app from this.apps array once destroyed
      const index = this.apps.indexOf(app)
      if (index > -1) this.apps.splice(index, 1)
      // ensure we still have a main app or null if no apps
      // we do not release the router so it can be reused
      if (this.app === app) this.app = this.apps[0] || null
      if (!this.app) this.history.teardown()
    })

    // main app previously initialized
    // return as we don't need to set up new history listener
    if (this.app) {
      return
    }

    this.app = app

    const history = this.history

    if (history instanceof HTML5History || history instanceof HashHistory) {
      // transition
      const handleInitialScroll = (routeOrError: any) => {
        const from = history.current
        const expectScroll = this.options.scrollBehavior
        const supportsScroll = supportsPushState && expectScroll

        if (supportsScroll && 'fullPath' in routeOrError) {
          handleScroll(this, routeOrError, from, false)
        }
      }

      // 1.处理页面滚动距离，添加路由变化监听器
      const setupListeners = (routeOrError: any) => {
        history.setupListeners()
        handleInitialScroll(routeOrError)
      }

      history.transitionTo(
        history.getCurrentLocation(),
        setupListeners,
        setupListeners
      )
    }

    history.listen((route) => {
      this.apps.forEach((app) => {
        app._route = route
      })
    })
  }

  match(raw: RawLocation, current?: Route, redirectedFrom?: Location) {
    // 路由匹配
    return this.matcher.match(raw, current, redirectedFrom)
  }

  beforeEach(fn: NavigationGuard) {
    // 添加单个全局前置守卫
    return registerHook(this.beforeHooks, fn)
  }

  beforeResolve(fn: NavigationGuard) {
    // 添加单个全局解析守卫
    return registerHook(this.resolveHooks, fn)
  }

  afterEach(fn: (to: Route, from: Route) => void) {
    // 添加单个全局后置钩子
    return registerHook(this.afterHooks, fn)
  }

  onReady(cb: Function, errorCb?: Function) {
    this.history.onReady(cb, errorCb)
  }

  onError(errorCb: Function) {
    this.history.onError(errorCb)
  }

  push(location: RawLocation, onComplete?: Function, onAbort?: Function) {
    if (!onComplete && !onAbort && typeof Promise !== 'undefined') {
      return new Promise((resolve, reject) => {
        // @ts-expect-error hash or html5
        this.history.push(location, resolve, reject)
      })
    } else {
      // @ts-expect-error hash or html5
      this.history.push(location, onComplete, onAbort)
    }
  }
}

/**
 * 注册一个导航守卫，返回一个取消该守卫的可调用函数
 */
function registerHook(list: Array<NavigationGuard>, fn: NavigationGuard) {
  list.push(fn)
  return () => {
    const i = list.indexOf(fn)
    if (i > -1) list.splice(i, 1)
  }
}

// We cannot remove this as it would be a breaking change
VueRouter.install = install
VueRouter.version = '3.6.5'
VueRouter.START_LOCATION = START
VueRouter.NavigationFailureType = NavigationFailureType
VueRouter.isNavigationFailure = isNavigationFailure

if (inBrowser && window.Vue) {
  window.Vue.use(VueRouter)
}
