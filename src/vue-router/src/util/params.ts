import Regexp from 'path-to-regexp'
import { warn } from './warn'

const regexpCompileCache: {
  [key: string]: Function
} = Object.create(null)

/**
 * fillParams 函数用于将路径字符串中的参数占位符替换为实际的参数值，并返回填充后的路径字符串。
 */
export function fillParams(
  path: string,
  params?: Record<string, any>,
  routeMsg?: string
): string {
  params = params || {}
  try {
    const filler =
      regexpCompileCache[path] ||
      (regexpCompileCache[path] = Regexp.compile(path))

    // Fix #2505 resolving asterisk routes { name: 'not-found', params: { pathMatch: '/not-found' }}
    // and fix #3106 so that you can work with location descriptor object having params.pathMatch equal to empty string
    if (typeof params.pathMatch === 'string') params[0] = params.pathMatch

    return filler(params, { pretty: true })
  } catch (e: any) {
    if (process.env.NODE_ENV !== 'production') {
      // Fix #3072 no warn if `pathMatch` is string
      warn(
        typeof params.pathMatch === 'string',
        `missing param for ${routeMsg}: ${e.message}`
      )
    }
    return ''
  } finally {
    // delete the 0 if it was added
    delete params[0]
  }
}
