import Vue, { VNode } from 'vue'
import type Router from '../index'
import type { Route } from '../types'

declare namespace Function {
  boolean
}

declare module 'vue/types/vue' {
  interface Vue {
    $router?: Router
    $route?: Route
    _routerRoot?: Vue
    _router?: Router
    _route?: Route
  }
}

declare module 'vue/types/options' {
  interface ComponentOptions {
    router?: Router
    beforeRouteEnter?: any
    beforeRouteLeave?: any
    beforeRouteUpdate?: any
    _parentVnode?: VNode
  }
}
