import { runQueue } from '@/vue-router/src/util/async'

describe('Async utils', () => {
  describe('runQueue', () => {
    it('should work', (done) => {
      const calls: any = []
      const queue = [1, 2, 3, 4, 5].map((i) => (next: any) => {
        calls.push(i)
        setTimeout(next, 0)
      }) // [(next) => {call.push(1), setTimeout(next, 0)}, (next) => {call.push(2), setTimeout(next, 0)}, (next) => {call.push(3), setTimeout(next, 0)}, (next) => {call.push(4), setTimeout(next, 0)}, (next) => {call.push(5), setTimeout(next, 0)}]

      runQueue(
        queue,
        (fn: any, next: any) => fn(next),
        () => {
          expect(calls).toEqual([1, 2, 3, 4, 5])
          // 异步操作，测试结束标志
          done()
        }
      )
    })
  })
})