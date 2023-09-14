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
 * 返回的均为string形式
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

/**
 * 路径拼接
 * 将相对路径转换为绝对路径，使用基准路径作为参考。如果指定了追加参数，则将相对路径追加到基准路径后面。
 */
export function resolvePath(relative: string, base: string, append?: boolean) {
  const firstChar = relative.charAt(0)
  if (firstChar === '/') {
    // 1) 绝对路径直接返回该路径
    return relative
  }

  if (firstChar === '?' || firstChar === '#') {
    // 2）query或hash，追加到基准路径后返回
    return base + relative
  }

  const stack = base.split('/') // /a/b -> ['', a, b]

  // remove trailing segment if:
  // - not appending
  // - appending to trailing slash (last segment is empty)
  // 不需要追加或者最后一个部分为空（trailing slash），则将最后一个部分弹出栈。
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
  // 确保路径以 '/'开头
  if (stack[0] !== '') {
    stack.unshift('')
  }

  return stack.join('/')
}
