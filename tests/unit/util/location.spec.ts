import { normalizeLocation } from '@/vue-router/src/util/location'
import { Route } from '../../../src/vue-router/src/types'

describe('Location utils', () => {
  describe('normalizeLocation', () => {
    it('string', () => {
      const loc = normalizeLocation('/abc?foo=bar&baz=qux#hello')
      expect(loc._normalized).toBe(true)
      expect(loc.path).toBe('/abc')
      expect(loc.hash).toBe('#hello')
      expect(JSON.stringify(loc.query)).toBe(
        JSON.stringify({ foo: 'bar', baz: 'qux' })
      )
    })

    it('empty string', function () {
      const loc = normalizeLocation('', { path: '/abc' } as Route)
      expect(loc._normalized).toBe(true)
      expect(loc.path).toBe('/abc')
      expect(loc.hash).toBe('')
      expect(JSON.stringify(loc.query)).toBe(JSON.stringify({}))
    })
  })
})
