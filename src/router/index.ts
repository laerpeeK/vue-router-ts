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

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    name: 'HomeView',
    path: '/home',
    components: Home
  },
  {
    name: 'AboutView',
    path: '/about',
    components: About
  }
]

const router = new VueRouter({
  mode: 'hash',
  routes
})

export default router
