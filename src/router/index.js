import { createRouter, createWebHistory } from 'vue-router'
import store from '../store'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue')
  },
  {
    path: '/music/:id',
    name: 'MusicDetail',
    component: () => import('../views/MusicDetail.vue')
  },

  {
    path: '/discover',
    name: 'Discover',
    component: () => import('../views/Discover.vue')
  },
  {
    path: '/dynamic',
    name: 'Dynamic',
    component: () => import('../views/Dynamic.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/recommendations',
    name: 'Recommendations',
    component: () => import('../views/Recommendations.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/musician',
    name: 'MusicianCenter',
    component: () => import('../views/MusicianCenter.vue'),
    meta: { requiresAuth: true, requiresMusician: true }
  },
  {
    path: '/admin',
    name: 'AdminCenter',
    component: () => import('../views/AdminCenter.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/user/profile',
    name: 'UserProfile',
    component: () => import('../views/UserProfile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/following',
    name: 'Following',
    component: () => import('../views/Following.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/followers',
    name: 'Followers',
    component: () => import('../views/Followers.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/user/:id',
    name: 'UserHome',
    component: () => import('../views/UserHome.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('../views/Search.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const roles = store.state.user.roles

  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!token) {
      next({ name: 'Login' })
    } else {
      if (to.matched.some(record => record.meta.requiresMusician)) {
        if (roles.includes('ROLE_MUSICIAN')) {
          next()
        } else {
          next({ name: 'Home' })
        }
      } else if (to.matched.some(record => record.meta.requiresAdmin)) {
        if (roles.includes('ROLE_ADMIN')) {
          next()
        } else {
          next({ name: 'Home' })
        }
      } else {
        next()
      }
    }
  } else {
    next()
  }
})

export default router
