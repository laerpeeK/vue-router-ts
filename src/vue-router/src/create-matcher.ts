import type Router from '.'
import { createRouteMap } from './create-route-map'
import type {
  Location,
  RawLocation,
  Route,
  RouteConfig,
  RouteRecord,
  RouteRegExp
} from './types'
import { normalizeLocation } from './util/location'
import { fillParams } from './util/params'
import { decode } from './util/query'
import { createRoute } from './util/route'
import { warn } from './util/warn'

export type Matcher = {
  match: Function
  addRoutes: Function
  addRoute: Function
  getRoutes: Function
}

export function createMatcher(
  routes: Array<RouteConfig>,
  router: Router
): Matcher {
  const { pathList, pathMap, nameMap } = createRouteMap(routes)
  function match(
    raw: RawLocation,
    currentRoute?: Route,
    redirectedFrom?: Location
  ) {
    debugger
    const location = normalizeLocation(raw, currentRoute, false, router)
    const { name } = location
    if (name) {
      const record = nameMap[name]
      if (process.env.NODE_ENV !== 'production') {
        warn(record, `Route with name '${name}' does not exist`)
      }
      if (!record) return _createRoute(null, location)
      const paramNames = record.regex.keys
        .filter((key) => !key.optional)
        .map((key) => key.name)

      if (typeof location.params !== 'object') {
        location.params = {}
      }

      if (currentRoute && typeof currentRoute.params === 'object') {
        for (const key in currentRoute.params) {
          if (!(key in location.params) && paramNames.indexOf(key) > -1) {
            location.params[key] = currentRoute.params[key]
          }
        }
      }

      location.path = fillParams(
        record.path,
        location.params,
        `named route "${name}"`
      )
      return _createRoute(record, location, redirectedFrom)
    } else if (location.path) {
      location.params = {}
      for (let i = 0; i < pathList.length; i++) {
        const path = pathList[i]
        const record = pathMap[path]
        if (matchRoute(record.regex, location.path, location.params)) {
          return _createRoute(record, location, redirectedFrom)
        }
      }
    }
    // no match
    return _createRoute(null, location)
  }

  function addRoutes(routes: Array<Route>) {
    debugger
  }

  function addRoute(parentOrRoute: Route, route: Route) {
    debugger
  }

  function getRoutes() {
    debugger
  }

  function redirect(record: RouteRecord, location: Location) {
    const originalRedirect = record.redirect
    let redirect =
      typeof originalRedirect === 'function'
        ? originalRedirect(createRoute(record, location, null, router))
        : originalRedirect
    if (typeof redirect === 'string') {
      redirect = { path: redirect }
    }
    if (!redirect || typeof redirect !== 'object') {
      if (process.env.NODE_ENV !== 'prodution') {
        warn(false, `invalid redirect option: ${JSON.stringify(redirect)}`)
      }
      return _createRoute(null, location)
    }
  }

  function alias(record: RouteRecord, location: Location, matchAs: string) {
    const aliasedPath: string = fillParams(
      matchAs,
      location.params,
      `aliased route with path "${matchAs}"`
    )
    const aliasedMatch = match({ _normalized: true, path: aliasedPath })
    if (aliasedMatch) {
      const matched = aliasedMatch.matched
      const aliasedRecord = matched[matched.length - 1]
      location.params = aliasedMatch.params
      return _createRoute(aliasedRecord, location)
    }
    return _createRoute(null, location)
  }

  function _createRoute(
    record: RouteRecord | null,
    location: Location,
    redirectFrom?: Location
  ): any {
    if (record && record.redirect) {
      return redirect(record, redirectFrom || location)
    }
    if (record && record.matchAs) {
      return alias(record, location, record.matchAs)
    }
    return createRoute(record, location, redirectFrom, router)
  }

  return {
    match,
    addRoute,
    getRoutes,
    addRoutes
  }
}

function matchRoute(
  regex: RouteRegExp,
  path: string,
  params: Record<string, any>
): boolean {
  const m = path.match(regex)
  if (!m) {
    return false
  } else if (!params) {
    return true
  }

  for (let i = 1, len = m.length; i < len; ++i) {
    const key = regex.keys[i - 1]
    if (key) {
      // Fix #1994: using * with props: true generates a param named 0
      params[key.name || 'pathMatch'] =
        typeof m[i] === 'string' ? decode(m[i]) : m[i]
    }
  }
  return true
}
