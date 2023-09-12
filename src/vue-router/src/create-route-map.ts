import Regexp from 'path-to-regexp'
import type {
  PathToRegexpOptions,
  RouteConfig,
  RouteRecord,
  RouteRegExp
} from './types'
import { cleanPath } from './util/path'
import { assert, warn } from './util/warn'

/**
 * 根据routes记录，创建pathList, pathMap, nameMap
 */
export function createRouteMap(
  routes: Array<RouteConfig>,
  oldPathList?: Array<string>,
  oldPathMap?: Record<string, RouteRecord>,
  oldNameMap?: Record<string, RouteRecord>,
  parentRoute?: RouteRecord
) {
  // the path list is used to control path matching priority
  const pathList: Array<string> = oldPathList || []
  const pathMap: Record<string, RouteRecord> = oldPathMap || Object.create(null)
  const nameMap: Record<string, RouteRecord> = oldNameMap || Object.create(null)

  routes.forEach((route) => {
    addRouteRecord(pathList, pathMap, nameMap, route, parentRoute)
  })

  // ensure wildcard routes are always at the end
  // 确保通配符路由 * 总在列表的末尾
  for (let i = 0, l = pathList.length; i < l; i++) {
    if (pathList[i] === '*') {
      pathList.push(pathList.splice(i, 1)[0])
      l--
      i--
    }
  }

  // 开发环境下，检查路由配置项是否包含 /, 不包含则发出警告（只对非嵌套路由有效）
  if (process.env.NODE_ENV === 'development') {
    // warn if routes do not include leading slashes
    const found = pathList
      // check for missing leading slash
      .filter(
        (path) => path && path.charAt(0) !== '*' && path.charAt(0) !== '/'
      )

    if (found.length > 0) {
      const pathNames = found.map((path) => `- ${path}`).join('\n')
      warn(
        false,
        `Non-nested routes must include a leading slash character. Fix the following routes: \n${pathNames}`
      )
    }
  }

  return {
    pathList,
    pathMap,
    nameMap
  }
}

/**
 * 填充完成具体的pathList, pathMap, nameMap
 */
function addRouteRecord(
  pathList: Array<string>,
  pathMap: Record<string, RouteRecord>,
  nameMap: Record<string, RouteRecord>,
  route: RouteConfig,
  parent?: RouteRecord,
  matchAs?: string
) {
  const { path, name } = route
  if (process.env.NODE_ENV !== 'production') {
    // 1) path不能为空
    assert(path != null, `"path" is required in a route configuration.`)

    // 2) component不能为字符串类型
    assert(
      typeof route.component !== 'string',
      `route config "component" for path: ${String(path || name)} cannot be a` +
        `string id. Use an actual component instead.`
    )

    // 这个警告的目的是确保路径中不包含无法处理的非编码字符，以避免潜在的问题和错误。
    warn(
      // 判断路径 path 中是否存在非 ASCII 字符。
      // eslint-disable-next-line no-control-regex
      !/[^\u0000-\u007F]+/.test(path),
      `Route with path "${path}" contains unencoded characters, make sure ` +
        `your path is correctly encoded before passing it to the router. Use ` +
        `encodeURI to encode static segments of your path.`
    )
  }

  const pathToRegexpOptions: PathToRegexpOptions =
    route.pathToRegexpOptions || {}
  const normalizedPath = normalizePath(path, parent, pathToRegexpOptions.strict)

  if (typeof route.caseSensitive === 'boolean') {
    pathToRegexpOptions.sensitive = route.caseSensitive
  }

  const record: RouteRecord = {
    path: normalizedPath,
    regex: compileRouteRegex(normalizedPath, pathToRegexpOptions),
    components: route.components || { default: route.component },
    alias: route.alias
      ? typeof route.alias === 'string'
        ? [route.alias]
        : route.alias
      : [],
    instances: {},
    enteredCbs: {},
    name,
    parent,
    matchAs,
    redirect: route.redirect,
    beforeEnter: route.beforeEnter,
    meta: route.meta || {},
    props:
      route.props == null
        ? {}
        : route.components
        ? route.props
        : { default: route.props }
  }

  if (route.children) {
    // Warn if route is named, does not redirect and has a default child route.
    // If users navigate to this route by name, the default child will
    // not be rendered (GH Issue #629)
    if (process.env.NODE_ENV !== 'production') {
      if (
        route.name &&
        !route.redirect &&
        route.children.some((child) => /^\/?$/.test(child.path))
      ) {
        warn(
          false,
          `Named Route '${route.name}' has a default child route. ` +
            `When navigating to this named route (:to="{name: '${route.name}'}"), ` +
            `the default child route will not be rendered. Remove the name from ` +
            `this route and use the name of the default child route for named ` +
            `links instead.`
        )
      }
    }
    route.children.forEach((child) => {
      const childMatchAs = matchAs
        ? cleanPath(`${matchAs}/${child.path}`)
        : undefined
      addRouteRecord(pathList, pathMap, nameMap, child, record, childMatchAs)
    })
  }

  if (!pathMap[record.path]) {
    pathList.push(record.path)
    pathMap[record.path] = record
  }

  if (route.alias !== undefined) {
    const aliases = Array.isArray(route.alias) ? route.alias : [route.alias]
    for (let i = 0; i < aliases.length; ++i) {
      const alias = aliases[i]
      if (process.env.NODE_ENV !== 'production' && alias === path) {
        warn(
          false,
          `Found an alias with the same value as the path: "${path}". You have to remove that alias. It will be ignored in development.`
        )
        // skip in dev to make it work
        continue
      }

      const aliasRoute = {
        path: alias,
        children: route.children
      }

      addRouteRecord(
        pathList,
        pathMap,
        nameMap,
        aliasRoute,
        parent,
        record.path || '/'
      ) // matchAs
    }
  }

  if (name) {
    if (!nameMap[name]) {
      nameMap[name] = record
    } else if (process.env.NODE_ENV !== 'production' && !matchAs) {
      warn(
        false,
        `Duplicate named routes definition: ` +
          `{ name: "${name}", path: "${record.path}" }`
      )
    }
  }
}

/**
 * 返回与其父级path拼接完成的path
 */
function normalizePath(
  path: string,
  parent?: RouteRecord,
  strict?: boolean
): string {
  if (!strict) path = path.replace(/\/$/, '') // 非严格模式下 删除path最后的 /
  if (path[0] === '/') return path
  if (parent == null) return path
  return cleanPath(`${parent.path}/${path}`)
}

/**
 * 将路径字符串编译为一个可用于匹配和解析路径的正则表达式对象
 */
function compileRouteRegex(
  path: string,
  pathToRegexpOptions: PathToRegexpOptions
): RouteRegExp {
  const regex = Regexp(path, [], pathToRegexpOptions) as RouteRegExp
  if (process.env.NODE_ENV !== 'production') {
    const keys: any = Object.create(null)
    regex.keys.forEach((key) => {
      warn(
        !keys[key.name],
        `Duplicate param keys in route with path: "${path}"`
      )
      keys[key.name] = true
    })
  }
  return regex
}
