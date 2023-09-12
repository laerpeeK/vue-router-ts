import VueRouter from '../router'
import type { RawLocation, Route, Location } from '../types'
import { extend } from './misc'
import { fillParams } from './params'
import { parsePath, resolvePath } from './path'
import { resolveQuery } from './query'
import { warn } from './warn'

/**
 * 返回规范化过的location对象，具体差别在于_normalized: true
 * 以及返回Location对象包含了query, hash, path
 * 1. 处理路径字符串和对象形式的Location
 * 2. 处理相对路径和绝对路径
 * 3. 处理命名路由和路径路由的差异
 */
export function normalizeLocation(
  raw: RawLocation,
  current?: Route,
  append?: boolean,
  router?: VueRouter
): Location {
  let next: Location = typeof raw === 'string' ? { path: raw } : raw
  // named target
  if (next._normalized) {
    // 1) 规范化的直接返回
    return next
  } else if (next.name) {
    // 2) 有name属性，深拷贝复制raw对象，如果params是对象形式，也进行深拷贝
    next = extend({}, raw)
    const params = next.params
    if (params && typeof params === 'object') {
      next.params = extend({}, params)
    }
    return next
  }

  // relative params
  if (!next.path && next.params && current) {
    next = extend({}, next)
    next._normalized = true
    const params = extend(extend({}, current.params), next.params)
    if (current.name) {
      next.name = current.name
      next.params = params
    } else if (current.matched.length) {
      const rawPath = current.matched[current.matched.length - 1].path
      next.path = fillParams(rawPath, params, `path ${current.path}`)
    } else if (process.env.NODE_ENV !== 'production') {
      warn(false, `relative params navigation requires a current route.`)
    }
    return next
  }

  const parsedPath = parsePath(next.path || '')
  const basePath = (current && current.path) || '/'
  const path = parsedPath.path
    ? resolvePath(parsedPath.path, basePath, append || next.append)
    : basePath

  const query = resolveQuery(
    parsedPath.query,
    next.query,
    router && router.options.parseQuery
  )

  let hash = next.hash || parsedPath.hash
  if (hash && hash.charAt(0) !== '#') {
    hash = `#${hash}`
  }

  return {
    _normalized: true,
    path,
    query,
    hash
  }
}
