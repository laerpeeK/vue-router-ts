/**
 * 工具函数：返回入参b的拷贝对象, 仅在b为对象下有效
 *
 * @param a
 * @param b
 * @returns
 */
export function extend(a: Record<string, any>, b: any) {
  for (const key in b) {
    a[key] = b[key]
  }
  return a
}
