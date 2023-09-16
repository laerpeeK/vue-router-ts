import { RouteRecord, Route, RawLocation } from '../types'
import { _Vue } from '../install'
import { warn } from './warn'
import { isError } from './errors'

/**
 * 展开一个数组中的每一项，一阶展开
 */
export function flatten(arr: Array<any>) {
  return Array.prototype.concat.apply([], arr)
}

/**
 * 展平并映射路由组件
 */
export function flatMapComponents(matched: Array<RouteRecord>, fn: Function) {
  return flatten(
    matched.map((m) => {
      return Object.keys(m.components).map((key) =>
        fn(m.components[key], m.instances[key], m, key)
      )
    })
  )
}

/**
 * 解析activated的异步路由组件
 */
export function resolveAsyncComponents(matched: Array<RouteRecord>) {
  return (
    to: Route,
    from: Route,
    next: (to?: RawLocation | false | Function | void) => void
  ) => {
    let hasAsync = false
    let pending = 0
    let error: any = null

    flatMapComponents(
      matched,
      (def: any, _: any, match: RouteRecord, key: string) => {
        // if it's a function and doesn't have cid attached,
        // assume it's an async component resolve function.
        // we are not using Vue's default async resolving mechanism because
        // we want to halt the navigation until the incoming component has been
        // resolved.
        // 判断当前路由记录的组件定义 def 是否为一个函数且没有 cid 属性（组件 ID），如果满足条件，则认为它是一个需要异步解析的组件。
        if (typeof def === 'function' && def.cid === undefined) {
          hasAsync = true
          pending++

          const resolve = once((resolvedDef: any) => {
            if (isESModule(resolvedDef)) {
              resolvedDef = resolvedDef.default
            }
            // save resolved on async factory in case it's used elsewhere
            def.resolved =
              typeof resolvedDef === 'function'
                ? resolvedDef
                : _Vue.extend(resolvedDef)
            match.components[key] = resolvedDef
            pending--
            if (pending <= 0) {
              next()
            }
          })

          const reject = once((reason: any) => {
            const msg = `Failed to resolve async component ${key}: ${reason}`
            process.env.NODE_ENV !== 'production' && warn(false, msg)
            if (!error) {
              error = isError(reason) ? reason : new Error(msg)
              next(error)
            }
          })

          let res
          try {
            res = def(resolve, reject)
          } catch (e) {
            reject(e)
          }
          if (res) {
            if (typeof res.then === 'function') {
              res.then(resolve, reject)
            } else {
              // new syntax in Vue 2.3
              const comp = res.component
              if (comp && typeof comp.then === 'function') {
                comp.then(resolve, reject)
              }
            }
          }
        }
      }
    )

    if (!hasAsync) next()
  }
}

const hasSymbol =
  typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol'

function isESModule(obj: any) {
  return obj.__esModule || (hasSymbol && obj[Symbol.toStringTag] === 'Module')
}

// in Webpack 2, require.ensure now also returns a Promise
// so the resolve/reject functions may get called an extra time
// if the user uses an arrow function shorthand that happens to
// return that Promise.
function once(fn: any) {
  let called = false
  return function (...args: any[]) {
    if (called) return
    called = true
    // @ts-expect-error this
    return fn.apply(this, args)
  }
}
