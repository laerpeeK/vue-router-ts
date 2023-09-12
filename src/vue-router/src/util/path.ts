/**
 * 替换path, 具体替换正则表达式查看下述链接
 * https://jex.im/regulex/#!flags=&re=%5C%2F(%3F%3A%5Cs*%5C%2F)%2B
 * 替换路径中多个连续斜杠（/）为单个斜杠。
 */
export function cleanPath(path: string) {
  return path.replace(/\/(?:\s*\/)+/g, '/')
}

/**
 * 根据传入的path获取到实际上的path, hash, query, 获取完的path为 # 之前的或者?之前的
 */
export function parsePath(path: string): {
  path: string
  query: string
  hash: string
} {
  let hash = ''
  let query = ''

  const hashIndex = path.indexOf('#')
  if (hashIndex >= 0) {
    hash = path.slice(hashIndex)
    path = path.slice(0, hashIndex)
  }

  const queryIndex = path.indexOf('?')
  if (queryIndex >= 0) {
    query = path.slice(queryIndex + 1)
    path = path.slice(0, queryIndex)
  }

  return {
    path,
    query,
    hash
  }
}

export function resolvePath(relative: string, base: string, append?: boolean) {
  const firstChar = relative.charAt(0)
  if (firstChar === '/') {
    return relative
  }

  if (firstChar === '?' || firstChar === '#') {
    return base + relative
  }

  const stack = base.split('/')

  // remove trailing segment if:
  // - not appending
  // - appending to trailing slash (last segment is empty)
  if (!append || !stack[stack.length - 1]) {
    stack.pop()
  }

  // resolve relative path
  const segments = relative.replace(/^\//, '').split('/')
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    if (segment === '..') {
      stack.pop()
    } else if (segment !== '.') {
      stack.push(segment)
    }
  }

  // ensure leading slash
  if (stack[0] !== '') {
    stack.unshift('')
  }

  return stack.join('/')
}
