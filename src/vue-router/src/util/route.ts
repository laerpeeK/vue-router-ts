import type Router from '../router'
import type { Location, Route, RouteRecord } from '../types'
import { stringifyQuery } from './query'

const trailingSlashRE = /\/?$/

/**
 * 创建规范化路由对象
 */
export function createRoute(
  record: RouteRecord | null,
  location: Location,
  redirectedFrom?: Location | null,
  router?: Router
): Readonly<Route> {
  const stringifyQuery = router && router.options.stringifyQuery

  let query: any = location.query || {}

  try {
    query = clone(query)
  } catch (e: any) {
    // do nothing
  }

  const route: Route = {
    name: location.name || (record && record.name),
    meta: (record && record.meta) || {},
    path: location.path || '/',
    hash: location.hash || '',
    query,
    params: location.params || {},
    fullPath: getFullPath(location, stringifyQuery),
    matched: record ? formatMatch(record) : []
  }
  if (redirectedFrom) {
    route.redirectedFrom = getFullPath(redirectedFrom, stringifyQuery)
  }
  return Object.freeze(route)
}

/**
 * the starting route that represents the initial state
 */
export const START = createRoute(null, { path: '/' })

/**
 * 简单的深拷贝
 */
function clone(value: any): any {
  if (Array.isArray(value)) {
    return value.map(clone)
  } else if (value && typeof value === 'object') {
    const res: Record<string, any> = {}
    for (const key in value) {
      res[key] = clone(value[key])
    }
    return res
  } else {
    return value
  }
}

/**
 * 获取完整的路径
 */
function getFullPath(
  { path, query = {}, hash = '' }: Location,
  _stringifyQuery?: (query: Record<string, any>) => string
) {
  const stringify = _stringifyQuery || stringifyQuery
  return (path || '/') + stringify(query) + hash
}

/***
 * 将父子关系的RouteRecord放置到一个数组中，父在子前
 * 在router-view组件中，depth组件映射层级，数组key值是升序的 对应depth++
 */
function formatMatch(record?: RouteRecord): Array<RouteRecord> {
  const res: Array<RouteRecord> = []
  while (record) {
    res.unshift(record)
    record = record.parent
  }
  return res
}

/**
 * 判断两个Route对象是否相同
 */
export function isSameRoute(a: Route, b?: Route, onlyPath?: boolean) {
  if (b === START) {
    return a === b
  } else if (!b) {
    return false
  } else if (a.path && b.path) {
    return (
      a.path.replace(trailingSlashRE, '') ===
        b.path.replace(trailingSlashRE, '') &&
      (onlyPath || (a.hash === b.hash && isObjectEqual(a.query, b.query)))
    )
  } else if (a.name && b.name) {
    return (
      a.name === b.name &&
      (onlyPath ||
        (a.hash === b.hash &&
          isObjectEqual(a.query, b.query) &&
          isObjectEqual(a.params, b.params)))
    )
  } else {
    return false
  }
}

/**
 * 判断两个对象是否相同，该对象对应的每一项的值为string或object类型
 */
function isObjectEqual(
  a: Record<string, any>,
  b: Record<string, any>
): boolean {
  // handle null value #1566
  if (!a || !b) return a === b
  const aKeys = Object.keys(a).sort()
  const bKeys = Object.keys(b).sort()
  if (aKeys.length !== bKeys.length) {
    return false
  }
  return aKeys.every((key: string, i: number) => {
    const aVal = a[key]
    const bKey = bKeys[i]
    if (bKey !== key) return false
    const bVal = b[key]
    // query values can be null and undefined
    if (aVal == null || bVal == null) return aVal === bVal
    // check nested equality
    if (typeof aVal === 'object' && typeof bVal === 'object') {
      return isObjectEqual(aVal, bVal)
    }
    return String(aVal) === String(bVal)
  })
}

export function handleRouteEntered(route: Route) {
  for (let i = 0; i < route.matched.length; i++) {
    const record = route.matched[i]
    for (const name in record.instances) {
      const instance = record.instances[name]
      const cbs = record.enteredCbs[name]
      if (!instance || !cbs) continue
      delete record.enteredCbs[name]
      for (let i = 0; i < cbs.length; i++) {
        if (!instance._isBeingDestoryed) cbs[i](instance)
      }
    }
  }
}
