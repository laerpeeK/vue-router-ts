import { isSameRoute } from '@/vue-router/src/util/route'
import type { Route } from '@/vue-router/src/types'

describe('Route utils', () => {
  describe('isSameRoute', () => {
    it('path', () => {
      const a = {
        path: '/a',
        hash: '#hi',
        query: { foo: 'bar', arr: [1, 2] }
      } as unknown as Route
      const b = {
        path: '/a/',
        hash: '#hi',
        query: { arr: ['1', '2'], foo: 'bar' }
      } as unknown as Route
      expect(isSameRoute(a, b)).toBe(true)
    })

    it('name', () => {
      const a = {
        path: '/abc',
        name: 'a',
        hash: '#hi',
        query: { foo: 'bar', arr: [1, 2] }
      }

      const b = {
        name: 'a',
        hash: '#hi',
        query: { arr: ['1', '2'], foo: 'bar' }
      }

      expect(isSameRoute(a as unknown as Route, b as unknown as Route)).toBe(
        true
      )
    })

    it('nested query', () => {
      const a = {
        path: '/abc',
        query: { foo: { bar: 'bar' }, arr: [1, 2] }
      }

      const b = {
        path: '/abc',
        query: { arr: [1, 2], foo: { bar: 'bar' } }
      }

      const c = {
        path: '/abc',
        query: { arr: [1, 2], foo: { bar: 'not bar' } }
      }
      //@ts-expect-error typeError a b
      expect(isSameRoute(a, b)).toBe(true)
      //@ts-expect-error typeError a b
      expect(isSameRoute(a, c)).toBe(false)
    })

    it('queries with null values', () => {
      const a = {
        path: '/abc',
        query: { foo: null }
      }

      const b = {
        path: '/abc',
        query: { foo: null }
      }

      const c = {
        path: '/abc',
        query: { foo: 5 }
      }

      //@ts-expect-error typeError a b
      expect(() => isSameRoute(a, b)).not.toThrow()
      //@ts-expect-error typeError a b
      expect(() => isSameRoute(a, c)).not.toThrow()
       //@ts-expect-error typeError a b
      expect(isSameRoute(a, b)).toBe(true)
       //@ts-expect-error typeError a c
      expect(isSameRoute(a, c)).toBe(false)
    })

    it('queries with undefined values', () => {
      const a = {
        path: '/abc',
        query: { a: 'x' }
      } as unknown as Route

      const b = {
        path: '/abc',
        query: { id: undefined }
      } as unknown as Route

      const c = {
        path: '/abc',
        query: {}
      } as unknown as Route

      expect(() => isSameRoute(a, b)).not.toThrow()
      expect(() => isSameRoute(a, c)).not.toThrow()
      expect(() => isSameRoute(b, c)).not.toThrow()
      expect(isSameRoute(a, b)).toBe(false)
      expect(isSameRoute(a, c)).toBe(false)
      // NOTE: in reality this should be true but because we check queries as
      // objects, they are different objects. We should check queries as their
      // string representation instead
      expect(isSameRoute(b, c)).toBe(false)
      expect(isSameRoute(c, b)).toBe(false)
    })
  })
})
