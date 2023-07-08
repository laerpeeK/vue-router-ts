import type { RouteConfig, RouteRecord } from '@/vue-router/src/types'
import { createRouteMap } from '@/vue-router/src/create-route-map'

const Home = { template: '<div>This is Home</div>' }
const Foo = { template: '<div>This is Foo</div>' }
const FooBar = { template: '<div>This is FooBar</div>' }
const Foobar = { template: '<div>This is foobar</div>' }
const Bar = { template: '<div>This is Bar <router-view></router-view></div>' }
const Baz = { template: '<div>This is Baz</div>' }

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'home',
    component: Home
  },
  {
    path: '/foo',
    name: 'foo',
    component: Foo
  },
  {
    path: '*',
    name: 'wildcard',
    component: Baz
  },
  {
    path: '/bar',
    component: Bar,
    name: 'bar',
    children: [
      {
        path: '',
        component: Baz,
        name: 'bar.baz'
      }
    ]
  },
  {
    path: '/bar-redirect',
    name: 'bar-redirect',
    redirect: { name: 'bar-redirect.baz' },
    component: Bar,
    children: [
      {
        path: '',
        component: Baz,
        name: 'bar-redirect.baz'
      }
    ]
  }
]

describe('Creating Route map', () => {
  interface RouteMapResult {
    pathList: Array<string>
    pathMap: Record<string, RouteRecord>
    nameMap: Record<string, RouteRecord>
  }
  let maps: RouteMapResult
  let spy: any

  beforeAll(() => {
    spy = jest.spyOn(console, 'warn')
    maps = createRouteMap(routes) // 此时会有一次console.warn 说明beforeAll 在beforeEach前执行
  })

  beforeEach(() => {
    spy.mockClear()
    process.env.NODE_ENV = 'production'
  })

  it('has a pathMap object for default subroute at /bar/', () => {
    expect(maps.pathMap['/bar/']).not.toBeUndefined()
  })

  it('has a pathList which places wildcards at the end', () => {
    expect(maps.pathList).toEqual([
      '',
      '/foo',
      '/bar/',
      '/bar',
      '/bar-redirect/',
      '/bar-redirect',
      '*'
    ])
  })

  it('has a nameMap object for default subroute at `bar.baz`', () => {
    expect(maps.nameMap['bar.baz']).not.toBeUndefined()
  })

  it('in development, has logged a warning concerning named route of parent and default subroute', () => {
    process.env.NODE_ENV = 'development'
    maps = createRouteMap(routes)
    const arg =
      `[vue-router] Named Route 'bar' has a default child route. ` +
      `When navigating to this named route (:to="{name: 'bar'}"), ` +
      `the default child route will not be rendered. Remove the name from ` +
      `this route and use the name of the default child route for named ` +
      `links instead.`
    expect(console.warn).toHaveBeenCalledTimes(1)
    expect(console.warn).toHaveBeenCalledWith(arg)
  })

  it('warns about unencoded entitles', () => {
    process.env.NODE_ENV = 'development'
    maps = createRouteMap([{ path: '/é', component: Home }])
    const arg =
      `[vue-router] Route with path "/é" contains unencoded characters, make sure ` +
      `your path is correctly encoded before passing it to the router. Use ` +
      `encodeURI to encode static segments of your path.`
    expect(console.warn).toHaveBeenCalledTimes(1)
    expect(console.warn).toHaveBeenCalledWith(arg)
  })

  it('in development, throws if path is missing', () => {
    process.env.NODE_ENV = 'development'
    expect(() => {
      // @ts-expect-error without path
      maps = createRouteMap([{ component: Bar }])
    }).toThrowError(/"path" is required/)
  })

  it('in production, it has not logged this warning', () => {
    maps = createRouteMap(routes)
    expect(console.warn).not.toHaveBeenCalled()
  })

  it('in development, warn duplicate param keys', () => {
    process.env.NODE_ENV = 'development'
    maps = createRouteMap([
      {
        path: '/foo/:id',
        component: Foo,
        children: [
          {
            path: 'bar/:id',
            component: Bar
          }
        ]
      }
    ])
    expect(console.warn).toHaveBeenCalled()
    expect(console.warn).toHaveBeenCalledWith(
      `[vue-router] Duplicate param keys in route with path: "/foo/:id/bar/:id"`
    )
  })

  it('in development, warns about alias and path having the same value', () => {
    process.env.NODE_ENV = 'development'
    maps = createRouteMap([
      {
        path: '/foo-alias',
        component: Foo,
        alias: '/foo-alias'
      }
    ])
    const arg = `[vue-router] Found an alias with the same value as the path: "/foo-alias". You have to remove that alias. It will be ignored in development.`
    expect(console.warn).toHaveBeenCalled()
    expect(console.warn).toHaveBeenCalledWith(arg)
  })

  it('in development, warns about one alias (in an array) having the same value as the path', () => {
    process.env.NODE_ENV = 'development'
    maps = createRouteMap([
      {
        path: '/foo-alias',
        component: Foo,
        alias: ['/bar', '/foo-alias']
      }
    ])
    const arg = `[vue-router] Found an alias with the same value as the path: "/foo-alias". You have to remove that alias. It will be ignored in development.`
    expect(console.warn).toHaveBeenCalled()
    expect(console.warn).toHaveBeenCalledWith(arg)
  })

  it('in development, warn if a path is missing a leading slash', () => {
    process.env.NODE_ENV = 'development'
    maps = createRouteMap([
      {
        path: 'bar',
        name: 'bar',
        component: Bar
      }
    ])
    const arg = `[vue-router] Non-nested routes must include a leading slash character. Fix the following routes: \n- bar`
    expect(console.warn).toHaveBeenCalledTimes(1)
    expect(console.warn).toHaveBeenCalledWith(arg)
  })

  it('in development, it does not log the missing leading slash when route are valid', () => {
    process.env.NODE_ENV = 'development'
    maps = createRouteMap([{ path: '/bar', name: 'bar', component: Bar }])
    expect(console.warn).not.toHaveBeenCalled()
  })

  it('in production, it does not log the missing leading slash warning', () => {
    process.env.NODE_ENV = 'production'
    maps = createRouteMap([{ path: 'bar', name: 'bar', component: Bar }])
    expect(console.warn).not.toHaveBeenCalled()
  })

  describe('path-to-regexp options', () => {
    const routes: Array<RouteConfig> = [
      {
        path: '/foo',
        name: 'foo',
        component: Foo
      },
      { path: '/bar', name: 'bar', component: Bar, caseSensitive: false },
      {
        path: '/FooBar',
        name: 'FooBar',
        component: FooBar,
        caseSensitive: true
      },
      {
        path: '/foobar',
        name: 'foobar',
        component: FooBar,
        caseSensitive: true
      }
    ]

    it('caseSensitive option in route', () => {
      const { nameMap } = createRouteMap(routes)
      expect(nameMap.FooBar.regex.ignoreCase).toBe(false)
      expect(nameMap.foobar.regex.ignoreCase).toBe(false)
      expect(nameMap.bar.regex.ignoreCase).toBe(true)
      expect(nameMap.foo.regex.ignoreCase).toBe(true)
    })

    it('pathToRegexpOptions option in route', () => {
      const { nameMap } = createRouteMap([
        {
          name: 'foo',
          path: '/foo',
          component: Foo,
          pathToRegexpOptions: {
            sensitive: true
          }
        },
        {
          name: 'bar',
          path: '/bar',
          component: Bar,
          pathToRegexpOptions: {
            sensitive: false
          }
        }
      ])

      expect(nameMap.foo.regex.ignoreCase).toBe(false)
      expect(nameMap.bar.regex.ignoreCase).toBe(true)
    })

    it('caseSensitive over pathToRegexpOtions in route', () => {
      const { nameMap } = createRouteMap([
        {
          path: '/foo',
          name: 'foo',
          component: Foo,
          caseSensitive: true,
          pathToRegexpOptions: {
            sensitive: false
          }
        }
      ])

      expect(nameMap.foo.regex.ignoreCase).toBe(false)
    })

    it('keeps trailing slashes with strict mode', () => {
      const { pathList } = createRouteMap([
        {
          path: '/foo/',
          component: Foo,
          pathToRegexpOptions: {
            strict: true
          }
        },
        {
          path: '/bar/',
          component: Foo
        }
      ])

      expect(pathList).toEqual(['/foo/', '/bar'])
    })
  })
})
