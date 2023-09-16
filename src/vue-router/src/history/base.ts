import {
  createNavigationAbortedError,
  createNavigationCancelledError,
  createNavigationDuplicatedError,
  createNavigationRedirectedError,
  isError,
  isNavigationFailure,
  NavigationFailureType
} from '../util/errors'
import type Router from '../index'
import type { NavigationGuard, RawLocation, Route, RouteRecord } from '../types'
import { inBrowser } from '../util/dom'
import { handleRouteEntered, isSameRoute, START } from '../util/route'
import { handleScroll } from '../util/scroll'
import { warn } from '../util/warn'
import { _Vue } from '../install'
import {
  flatMapComponents,
  flatten,
  resolveAsyncComponents
} from '../util/resolve-component'
import { runQueue } from '../util/async'

export class History {
  router: Router // Vue Router实例
  base: string //  基础路径，默认为 ""
  current: Route // 当前route
  cb!: (r: Route) => void
  pending: Route | null // 等待导航的目标route
  ready: boolean
  readyCbs: Array<Function>
  readyErrorCbs: Array<Function>
  errorCbs: Array<Function> // 错误回调，触发错误时调用该数组中的每项函数
  listeners: Array<Function>

  constructor(router: Router, base?: string) {
    this.router = router
    this.base = normalizeBase(base)
    // start with a route object that stands for "nowhere"
    this.current = START
    this.pending = null
    this.ready = false
    this.readyCbs = []
    this.readyErrorCbs = []
    this.errorCbs = []
    this.listeners = []
  }

  listen(cb: (r: Route) => void) {
    this.cb = cb
  }

  teardown() {
    // clean up event listeners
    // https://github.com/vuejs/vue-router/issues/2341
    this.listeners.forEach((cleanupListener) => {
      cleanupListener()
    })
    this.listeners = []

    // reset current history route
    // https://github.com/vuejs/vue-router/issues/3294
    this.current = START
    this.pending = null
  }

  setupListeners() {
    // Default implementation is empty
  }

  transitionTo(
    location: RawLocation,
    onComplete?: Function,
    onAbort?: Function
  ) {
    debugger
    let route: Route
    // catch redirect option https://github.com/vuejs/vue-router/issues/3201
    try {
      route = this.router.match(location, this.current)
    } catch (e) {
      // 匹配过程中出现错误异常，则进行错误回调
      this.errorCbs.forEach((cb) => {
        cb(e)
      })
      // Exception should still be thrown
      throw e
    }
    const prev = this.current
    this.confirmTransition(
      route,
      () => {
        debugger
        this.updateRoute(route)
        onComplete && onComplete(route)
        // @ts-expect-error routerHistory
        this.ensureURL()
        // 全局后置钩子
        this.router.afterHooks.forEach((hook) => {
          hook && hook(route, prev)
        })

        // fire ready cbs once
        if (!this.ready) {
          this.ready = true
          this.readyCbs.forEach((cb) => {
            cb(route)
          })
        }
      },
      (err: any) => {
        if (onAbort) {
          onAbort(err)
        }
        if (err && !this.ready) {
          // Initial redirection should not mark the history as ready yet
          // because it's triggered by the redirection instead
          // https://github.com/vuejs/vue-router/issues/3225
          // https://github.com/vuejs/vue-router/issues/3331
          if (
            !isNavigationFailure(err, NavigationFailureType.redirected) ||
            prev !== START
          ) {
            this.ready = true
            this.readyCbs.forEach((cb) => {
              cb(err)
            })
          }
        }
      }
    )
  }

  confirmTransition(route: Route, onComplete: Function, onAbort?: Function) {
    const current = this.current
    this.pending = route
    const abort = (err: any) => {
      // changed after adding errors with
      // https://github.com/vuejs/vue-router/pull/3047 before that change,
      // redirect and aborted navigation would produce an err == null
      if (!isNavigationFailure(err) && isError(err)) {
        if (this.errorCbs.length) {
          this.errorCbs.forEach((cb) => {
            cb(err)
          })
        } else {
          if (process.env.NODE_ENV !== 'production') {
            warn(false, 'uncaught error during route navigation:')
          }
          console.error(err)
        }
      }
      onAbort && onAbort(err)
    }
    const lastRouteIndex = route.matched.length - 1
    const lastCurrentIndex = route.matched.length - 1
    if (
      isSameRoute(route, current) &&
      lastRouteIndex === lastCurrentIndex &&
      route.matched[lastRouteIndex] === current.matched[lastCurrentIndex]
    ) {
      // @ts-expect-error routerhistory
      this.ensureURL()
      if (route.hash) {
        handleScroll(this.router, current, route, false)
      }
      return abort(createNavigationDuplicatedError(current, route))
    }

    debugger
    // 三个都是Array<RouteRecord>类型
    const { updated, deactivated, activated } = resolveQueue(
      this.current.matched,
      route.matched
    )

    // beforeRouteLeave, beforeHooks(全局前置守卫), beforeRouteUpdate, beforeEnter(路由独享守卫), resolveAsyncComponents
    /**
     * extractLeaveGuards: 组件内离开守卫，在组件离开时执行，用于处理一些清理操作或取消异步任务等。
     * this.router.beforeHooks: 全局前置守卫，在每次路由跳转之前执行，通常用于进行权限验证、登录状态检查等全局性的操作。
     * extractUpdateHooks: 组件内更新守卫，在组件更新时执行，用于处理一些与组件状态相关的逻辑。
     * activated.beforeEnter: 路由独享守卫，仅对特定路由生效，用于实现特定路由的权限控制，条件判断等操作。
     * resolveAsyncComponents: 异步组件解析守卫，用于确保异步加载的组件已经加载完毕并准备就绪，以防止页面渲染出错。
     */
    const queue = ([] as Array<NavigationGuard>).concat(
      // in-component-leave guards
      extractLeaveGuards(deactivated),
      // global before hooks
      this.router.beforeHooks,
      // in-component update hooks
      extractUpdateHooks(updated),
      // in-config enter guards
      activated.map((m: RouteRecord) => m.beforeEnter!),
      // async components
      resolveAsyncComponents(activated)
    )

    // 守卫执行的进一层封装，处理next及特殊情况
    const iterator = (hook: NavigationGuard, next: Function) => {
      if (this.pending !== route) {
        // 守卫执行中途，改变了导航目标，执行中止取消
        return abort(createNavigationCancelledError(current, route))
      }
      try {
        hook(route, current, (to: any) => {
          if (to === false) {
            // 中断当前导航
            // next(false) -> abort navigation, ensure current URL
            // @ts-expect-error routerhistory
            this.ensureURL(true)
            abort(createNavigationAbortedError(current, route))
          } else if (isError(to)) {
            // 导航会被终止，且错误会被传递给router.onError()注册过的回调
            // @ts-expect-error routerhistory
            this.ensureURL(true)
            abort(to)
          } else if (
            // 当传递的参数为一个新地址时，当前导航会被中断，进行一个新的导航。具体允许的选项查看官方文档
            // https://v3.router.vuejs.org/zh/guide/advanced/navigation-guards.html#%E5%85%A8%E5%B1%80%E5%89%8D%E7%BD%AE%E5%AE%88%E5%8D%AB
            typeof to === 'string' ||
            (typeof to === 'object' &&
              (typeof to.path === 'string' || typeof to.name === 'string'))
          ) {
            // next('/') or next({path: '/'}) -> redirect
            abort(createNavigationRedirectedError(current, route))
            if (typeof to === 'object' && to.replace) {
              // @ts-expect-error routerhistory
              this.replace(to)
            } else {
              // @ts-expect-error routerhistory
              this.push(to)
            }
          } else {
            // 进行管道中的下一个钩子
            // confirm transition and pass on the value
            next(to)
          }
        })
      } catch (e) {
        abort(e)
      }
    }

    runQueue(queue, iterator, () => {
      // wait until async components are resolved before
      // extracting in-component enter guards
      // beforeRouteEnter
      const enterGuards = extractEnterGuard(activated)
      // beforeResolve
      const queue = enterGuards.concat(this.router.resolveHooks)
      runQueue(queue, iterator, () => {
        if (this.pending !== route) {
          return abort(createNavigationCancelledError(current, route))
        }
        this.pending = null
        onComplete(route)
        if (this.router.app) {
          this.router.app.$nextTick(() => {
            handleRouteEntered(route)
          })
        }
      })
    })
  }

  updateRoute(route: Route) {
    this.current = route
    this.cb && this.cb(route)
  }

  onReady(cb: Function, errorCb?: Function) {
    if (this.ready) {
      cb()
    } else {
      this.readyCbs.push(cb)
      if (errorCb) {
        this.readyErrorCbs.push(errorCb)
      }
    }
  }

  onError(errorCb: Function) {
    this.errorCbs.push(errorCb)
  }
}

/**
 * 规范化base路径
 */
function normalizeBase(base?: string) {
  if (!base) {
    if (inBrowser) {
      // respect <base> tag
      const baseEl = document.querySelector('base')
      base = (baseEl && baseEl.getAttribute('href')) || '/'
      // strip full URL origin
      // http://example.com/app -> /app
      // eslint-disable-next-line
      base = base.replace(/^https?:\/\/[^\/]+/, '')
    } else {
      base = '/'
    }
  }

  // make sure there's the starting slash
  if (base.charAt(0) !== '/') {
    base = '/' + base
  }

  // remove trailing slash
  return base.replace(/\/$/, '')
}

/**
 * updated: 在current/next中都生效的
 * activated: current中无，next有的
 * deactivated: current中有，next无的
 */
function resolveQueue(current: Array<RouteRecord>, next: Array<RouteRecord>) {
  let i
  const max = Math.max(current.length, next.length)
  for (i = 0; i < max; i++) {
    if (current[i] !== next[i]) {
      break
    }
  }
  return {
    updated: next.slice(0, i),
    activated: next.slice(i),
    deactivated: current.slice(i)
  }
}

/**
 * 提取导航守卫
 */
function extractGuards(
  records: Array<RouteRecord>,
  name: string,
  bind: Function,
  reverse?: boolean
) {
  // def：records[i].components[key]，instance: records[i].instances[key], match: records[i], key: key of records[i].components
  const guards = flatMapComponents(
    records,
    (def: any, instance: any, match: RouteRecord, key: string) => {
      const guard = extractGuard(def, name)
      if (guard) {
        return Array.isArray(guard)
          ? guard.map((guard) => bind(guard, instance, match, key))
          : bind(guard, instance, match, key)
      }
    }
  )
  return flatten(reverse ? guards.reverse() : guards)
}

function extractGuard(
  def: Object | Function,
  key: string
): NavigationGuard | undefined | NavigationGuard[] {
  if (typeof def !== 'function') {
    // extend now so that global mixins are applied.
    def = _Vue.extend(def)
  }
  // beforeRouteEnter, beforeRouteUpdate, beforeRouteLeave
  // @ts-expect-error VueConstructor
  return def.options[key]
}

function bindEnterGuard(
  guard: NavigationGuard,
  match: RouteRecord,
  key: string
) {
  return function routeEnterGuard(to: Route, from: Route, next: any) {
    return guard(to, from, (cb) => {
      if (typeof cb === 'function') {
        if (!match.enteredCbs[key]) {
          match.enteredCbs[key] = []
        }
        match.enteredCbs[key].push(cb)
      }
      next(cb)
    })
  }
}

// 绑定导航守卫
function bindGuard(guard: NavigationGuard, instance?: typeof _Vue) {
  if (instance) {
    return function boundRouteGuard() {
      // @ts-expect-error arguments
      return guard.apply(instance, arguments)
    }
  }
}

/**
 * beforeRouteEnter 守卫
 */
function extractEnterGuard(activated: Array<RouteRecord>) {
  return extractGuards(
    activated,
    'beforeRouteEnter',
    (guard: NavigationGuard, _: any, match: RouteRecord, key: string) => {
      return bindEnterGuard(guard, match, key)
    }
  )
}

/**
 * beforeRouteLeave 守卫
 */
function extractLeaveGuards(
  deactivated: Array<RouteRecord>
): Array<NavigationGuard> {
  return extractGuards(deactivated, 'beforeRouteLeave', bindGuard, true)
}

/**
 * beforeRouteUpdate 守卫
 */
function extractUpdateHooks(updated: Array<RouteRecord>) {
  return extractGuards(updated, 'beforeRouteUpdate', bindGuard)
}
