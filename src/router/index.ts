import VueRouter, { Route } from '@/vue-router'
import type { RouteConfig } from '@/vue-router'
import Vue from 'vue'
//import Home from '../components/Home.vue'
//import About from '../components/About.vue'

const Home = {
  template: '<div>Home</div>'
}

const About = {
  template: '<div>About</div>',
  beforeRouteEnter(to: Route, from: Route, next: Function) {
    console.log('beforeRouteEnter this', this)
    console.log('beforeRouteEnter to: ', to)
    console.log('beforeRouteEnter from: ', from)
    next()
  },
  beforeRouteUpdate(to: Route, from: Route, next: Function) {
    console.log('beforeRouteUpdate this', this)
    console.log('beforeRouteUpdate to: ', to)
    console.log('beforeRouteUpdate from: ', from)
    next()
  },
  beforeRouteLeave(to: Route, from: Route, next: Function) {
    console.log('beforeRouteLeave this', this)
    console.log('beforeRouteLeave to: ', to)
    console.log('beforeRouteLeave from: ', from)
    next()
  }
}

const News = {
  template: '<div>News</div>'
}

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/home',
    name: 'Home',
    component: Home,
    children: [
      {
        path: 'news',
        name: 'News',
        component: News
      }
    ]
  },
  {
    path: '/about',
    name: 'About',
    component: About,
    beforeEnter: (to, from, next) => {
      console.log('beforeEnter this', this)
      console.log('beforeEnter to: ', to)
      console.log('beforeEnter from: ', from)
      next()
    }
  }
]

const router = new VueRouter({
  mode: 'hash',
  routes
})

router.beforeEach((to, from, next) => {
  console.log('beforeEach this', this)
  console.log('beforeEach to: ', to)
  console.log('beforeEach from: ', from)
  next()
})

router.beforeResolve((to, from, next) => {
  console.log('beforeResolve this', this)
  console.log('beforeResolve to: ', to)
  console.log('beforeResolve from: ', from)
  next()
})

router.afterEach((to, from) => {
  console.log('afterEach this', this)
  console.log('afterEach to: ', to)
  console.log('afterEach from: ', from)
})

export default router
