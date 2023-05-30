import Vue, { VueConstructor } from 'vue'

export let _Vue: VueConstructor

export interface Install {
  (Vue: VueConstructor): void
  installed?: boolean
}

export const install: Install = function (Vue: VueConstructor) {
  if (install.installed && _Vue === Vue) return
  install.installed = true

  _Vue = Vue

  const isDef = (v: any) => v !== undefined
  const registerInstance = (vm: Vue, callVal?: any) => {
    let i: any = vm.$options._parentVnode
    if (
      isDef(i) &&
      isDef((i = i.data)) &&
      isDef((i = i.registerRouteInstance))
    ) {
      i(vm, callVal)
    }
  }

  Vue.mixin({
    beforeCreate(this: Vue) {
      // 1. 实现$router, $route的获取
      // 2. 调用$router.init方法
      if (isDef(this.$options.router)) {
        this._routerRoot = this
        this._router = this.$options.router
        this._router?.init(this)

        // @ts-expect-error type ignore
        Vue.util.defineReactive(this, '_route', this._router.history.current)
      } else {
        this._routerRoot = (this.$parent && this.$parent._routerRoot) || this
      }
      registerInstance(this, this)
    },
    destroyed(this: Vue) {
      registerInstance(this)
    }
  })

  Object.defineProperty(Vue.prototype, '$router', {
    get() {
      return this._routerRoot._router
    }
  })

  Object.defineProperty(Vue.prototype, '$route', {
    get() {
      return this._routerRoot._route
    }
  })

  const strats = Vue.config.optionMergeStrategies
  // use the same hook merging strategy for route hooks
  // 合并策略跟Vue生命周期钩子created一样，即合并成一个数组形式
  strats.beforeRouterEnter =
    strats.beforeRouteLeave =
    strats.beforeRouteUpdate =
      strats.created
}
