import VueRouter from '@/vue-router'
import type { RouteConfig } from '@/vue-router'
import Vue from 'vue'
//import Home from '../components/Home.vue'
//import About from '../components/About.vue'

const Home = {
  template: '<div>Home</div>'
}

const About = {
  template: '<div>About</div>'
}

const News = {
  template: '<div>News</div>'
}

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/home/',
    component: Home,
    children: [
      {
        path: 'news',
        component: News
      }
    ]
  },
  {
    path: '/about',
    component: About
  }
]

const router = new VueRouter({
  mode: 'hash',
  routes
})

export default router
