import { NavigationGuard } from '../types'
/**
 * 执行守卫及异步路由组件解析
 * 主要保证守卫按顺序执行，且在钩子执行完成后执行cb回调
 */
export function runQueue(
  queue: Array<NavigationGuard>,
  fn: Function,
  cb: Function
) {
  const step = (index: number) => {
    if (index >= queue.length) {
      cb()
    } else {
      if (queue[index]) {
        fn(queue[index], () => {
          step(index + 1)
        })
      } else {
        step(index + 1)
      }
    }
  }
  step(0)
}
