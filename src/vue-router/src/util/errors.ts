import type { Route, RouterError } from '../types'

// 所有的导航故障都会有 to 和 from 属性，分别用来表达这次失败的导航的目标位置和当前位置。
export enum NavigationFailureType {
  redirected = 2, // 在导航守卫中调用了 next(newLocation) 重定向到了其他地方
  aborted = 4, // 在导航守卫中调用了 next(false) 中断了本次导航
  cancelled = 8, // 在当前导航还没有完成之前又有了一个新的导航。比如，在等待导航守卫的过程中又调用了 router.push
  duplicated = 16 // 导航被阻止，因为我们已经在目标位置了
}

/**
 * 创建冗余导航错误示例
 */
export function createNavigationDuplicatedError(from: Route, to: Route) {
  const error = createRouterError(
    from,
    to,
    NavigationFailureType.duplicated,
    `Avoided redundant navigation to current location: "${from.fullPath}".`
  )

  // backwards compatible with the first introduction of Errors
  error.name = 'NavigationDuplicated'
  return error
}

/**
 * 创建导航途中，导航至新导航位置的错误示例
 */
export function createNavigationCancelledError(from: Route, to: Route) {
  return createRouterError(
    from,
    to,
    NavigationFailureType.cancelled,
    `Navigation cancelled from "${from.fullPath}" to "${to.fullPath}" with a new navigation.`
  )
}

/**
 * 创建中止导航错误示例
 */
export function createNavigationAbortedError(from: Route, to: Route) {
  return createRouterError(
    from,
    to,
    NavigationFailureType.aborted,
    `Navigation aborted from "${from.fullPath}" to "${to.fullPath}" via a navigation guard.`
  )
}

/**
 * 创建导航途中发生重定向错误示例
 */
export function createNavigationRedirectedError(from: Route, to: Route) {
  return createRouterError(
    from,
    to,
    NavigationFailureType.redirected,
    `Redirected when going from "${from.fullPath}" to "${stringifyRoute(
      to
    )}" via a navigation guard.`
  )
}

/**
 * 创建一个RouterError实例,继承自Error类
 */
function createRouterError(
  from: Route,
  to: Route,
  type: number,
  message: string
) {
  const error = new Error(message) as RouterError
  error._isRouter = true
  error.from = from
  error.to = to
  error.type = type
  return error
}

/**
 * 判断是是否为Error类型
 */
export function isError(err: any) {
  return Object.prototype.toString.call(err).indexOf('Error') > -1
}

/**
 * 判断是否为导航错误
 */
export function isNavigationFailure(err: any, errorType?: number): boolean {
  return (
    isError(err) &&
    err._isRouter &&
    (errorType == null || err.type === errorType)
  )
}

const propertiesToLog = ['params', 'query', 'hash']

/**
 * 字符串化route
 */
function stringifyRoute(to: any) {
  if (typeof to === 'string') return to
  if ('path' in to) return to.path
  const location: Record<string, any> = {}
  propertiesToLog.forEach((key: string) => {
    if (key in to) location[key] = to[key]
  })
  // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
  return JSON.stringify(location, null, 2)
}
