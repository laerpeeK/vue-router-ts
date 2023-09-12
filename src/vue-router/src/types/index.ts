export declare class RouteRegExp extends RegExp {
  keys: Array<{ name: string; optional: boolean }>
}

export declare class RouterError extends Error {
  _isRouter: true
  from: Route
  to: Route
  type: number
}

export type RedirectOption = RawLocation | ((to: Route) => RawLocation)

export type NavigationGuard = (
  to: Route,
  from: Route,
  next: (to?: RawLocation | false | Function | void | Error) => void
) => any

/**
 * 使用时对单个路由配置对象，具体选项的类型定义
 */
export type RouteConfig = {
  path: string
  name?: string
  component?: any
  components?: Record<string, any>
  pathToRegexpOptions?: PathToRegexpOptions
  caseSensitive?: boolean
  alias?: string | Array<string>
  meta?: any
  redirect?: RedirectOption
  beforeEnter?: NavigationGuard
  props?: boolean | Function | Object
  children?: Array<RouteConfig>
}

export interface RouteRecord {
  name?: string
  meta: any
  parent?: RouteRecord
  matchAs?: string
  redirect?: RedirectOption
  beforeEnter?: NavigationGuard
  path: string
  regex: RouteRegExp
  components: Record<string, any>
  instances: Record<string, any>
  enteredCbs: Record<string, Array<Function>>
  alias: Array<string>
  props:
    | boolean
    | Object
    | Function
    | Record<string, boolean | Object | Function>
}

type Position = { x: number; y: number }
type PositionResult = Position | { selector: string; offset?: Position } | void

/**
 * new VueRouter(option) option的类型定义
 */
export interface RouterOptions {
  mode?: string // 路由模式
  fallback?: boolean // html5模式不支持情况下，是否支持回退到hash模式
  base?: string // 项目基础路径
  routes?: Array<RouteConfig> // routes
  stringifyQuery?: (query: Record<string, any>) => string // 提供自定义查询字符串的反解析函数。覆盖默认行为。 string -> regexp
  scrollBehavior?: (
    to: Route,
    from: Route,
    savedPosition?: Position // 当且仅当 popstate 导航 (通过浏览器的 前进/后退 按钮触发) 时才可用
  ) => PositionResult | Promise<PositionResult> // 自定义路由切换时页面如何滚动, 仅在支持history.pushState的浏览器下可用
  parseQuery?: (query: string) => Record<string, any> // 提供自定义查询字符串的解析函数。覆盖默认行为。
}

/**
 * 路由对象，Vue-Router内部对route的定义，区别于传入时route的定义：RouteConfig
 */
export interface Route {
  path: string
  hash: string
  query: Record<string, string>
  params: Record<string, string>
  name?: string | null
  meta?: any
  fullPath: string
  matched: Array<RouteRecord>
  redirectedFrom?: string
}

export interface Location {
  name?: string
  path?: string
  query?: Record<string, string>
  params?: Record<string, string>
  hash?: string
  _normalized?: boolean
  append?: boolean
}

export type RawLocation = string | Location

/**
 * path-to-regExp 调用时传入选项类型
 */
export type PathToRegexpOptions = {
  sensitive?: boolean // 指定是否对路径大小写敏感。设置为 true 表示区分大小写，false 表示不区分大小写。
  strict?: boolean // 指定是否对尾部斜杠进行严格匹配。设置为 true 表示需要匹配末尾斜杠，false 表示末尾斜杠是可选的。
  end?: boolean // 指定生成的正则表达式是否包含结束锚点 $。设置为 false 表示生成的正则表达式匹配路径的开始部分。
}
