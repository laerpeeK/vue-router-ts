import { warn } from './warn'

const encodeReserveRE = /[!'()*]/g
const encodeReserveReplacer = (c: string) => '%' + c.charCodeAt(0).toString(16)
const commaRE = /%2C/g

// fixed encodeURIComponent which is more conformant to RFC3986:
// - escapes [!'()*]
// - preserve commas
const encode = (str: string): string =>
  encodeURIComponent(str)
    .replace(encodeReserveRE, encodeReserveReplacer)
    .replace(commaRE, ',')

export function decode(str: string): string {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      warn(false, `Error decoding "${str}". Leaving it intact.`)
    }
  }
  return str
}

/**
 * 将查询参数的值进行转换
 */
const castQueryParamValue = (value: any) =>
  value == null || typeof value === 'object' ? value : String(value)

/**
 *  将对象形式的query转化成符合URL规范的查询字符串
 *  undefined -> ''
 * null -> encode(key)
 */
export function stringifyQuery(obj: Record<string, any>): string {
  const res = obj
    ? Object.keys(obj)
        .map((key) => {
          const val = obj[key]

          if (val === undefined) {
            return ''
          }

          if (val === null) {
            return encode(key)
          }

          if (Array.isArray(val)) {
            const result: Array<string> = []
            val.forEach((val2) => {
              if (val2 === undefined) {
                return
              }
              if (val2 === null) {
                result.push(encode(key))
              } else {
                result.push(encode(key) + '=' + encode(val2))
              }
            })
            return result.join('&')
          }

          return encode(key) + '=' + encode(val)
        })
        .filter((x) => x.length > 0)
        .join('&')
    : null
  return res ? `?${res}` : ''
}

/**
 * 解析query参数
 * 优先级：extraQuery > query
 * null, undefined, typeof object保持原值，其他转化为字符串形式
 */
export function resolveQuery(
  query?: string,
  extraQuery: Record<string, any> = {},
  _parseQuery?: Function
): Record<string, any> {
  const parse: Function = _parseQuery || parseQuery
  let parsedQuery: Record<string, any>
  try {
    parsedQuery = parse(query || '')
  } catch (e: any) {
    process.env.NODE_ENV !== 'production' && warn(false, e.message)
    parsedQuery = {}
  }
  for (const key in extraQuery) {
    const value = extraQuery[key]
    parsedQuery[key] = Array.isArray(value)
      ? value.map(castQueryParamValue)
      : castQueryParamValue(value)
  }
  return parsedQuery
}

/**
 * 将字符串化的query转化成对象形式,包括对键值进行decode解码操作
 */
function parseQuery(query: string): Record<string, any> {
  const res: Record<string, any> = {}
  query = query.trim().replace(/^(\?|#|&)/, '')
  if (!query) {
    return res
  }

  query.split('&').forEach((param) => {
    const parts = param.replace(/\+/g, ' ').split('=')
    const key = decode(parts.shift()!)
    const val = parts.length > 0 ? decode(parts.join('=')) : null

    if (res[key] === undefined) {
      res[key] = val
    } else if (Array.isArray(res[key])) {
      res[key].push(val)
    } else {
      res[key] = [res[key], val]
    }
  })

  return res
}
