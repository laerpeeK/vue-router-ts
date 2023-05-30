import type Router from '../index'
import { cleanPath } from '../util/path'
import { History } from './base'
export class HTML5History extends History {
  constructor(router: Router, base?: string) {
    super(router, base)
  }

  setupListeners() {
    debugger
  }
  /**
   * 获取当前的路径
   */
  getCurrentLocation(): string {
    return getLocation(this.base)
  }
}

/**
 * 获取完整的path
 */
export function getLocation(base: string) {
  let path = window.location.pathname
  const pathLowerCase = path.toLowerCase()
  const baseLowerCase = base.toLowerCase()
  // base="/a" shouldn't turn path="/app" into "/a/pp"
  // https://github.com/vuejs/vue-router/issues/3555
  // so we ensure the trailing slash in the base
  if (
    base &&
    (pathLowerCase === baseLowerCase ||
      pathLowerCase.indexOf(cleanPath(baseLowerCase + '/')) === 0)
  ) {
    path = path.slice(base.length)
  }
  return (path || '/') + window.location.search + window.location.hash
}
