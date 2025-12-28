import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { getInfo } from '../api/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/login/index.vue'),
    meta: { hidden: true }
  },
  {
    path: '/',
    component: () => import('../layouts/AdminLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/dashboard/index.vue'),
        meta: { title: '仪表盘', roles: ['admin', 'staff'] }
      },
      {
        path: 'cleanrooms',
        name: 'Cleanrooms',
        component: () => import('../views/cleanrooms/index.vue'),
        meta: { title: '洁净室管理', roles: ['admin', 'staff'] }
      },
      {
        path: 'gateways',
        name: 'Gateways',
        component: () => import('../views/gateways/index.vue'),
        meta: { title: '网关管理', roles: ['admin', 'staff'] }
      },
      {
        path: 'devices',
        name: 'Devices',
        component: () => import('../views/devices/index.vue'),
        meta: { title: '设备管理', roles: ['admin', 'staff'] }
      },
      {
        path: 'commands',
        name: 'Commands',
        component: () => import('../views/commands/index.vue'),
        meta: { title: '命令历史', roles: ['admin', 'staff'] }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('../views/users/index.vue'),
        meta: { title: '用户管理', roles: ['admin'] }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

let hasFetchedInfo = false

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const token = authStore.token

  if (token) {
    if (to.path === '/login') {
      next('/')
    } else {
      // Try to fetch user info if not fetched yet (restore session)
      if (!hasFetchedInfo) {
        try {
          const { data } = await getInfo()
          authStore.setAuth({ user: data })
          hasFetchedInfo = true
          // Continue
          if (to.meta.roles && !to.meta.roles.includes(authStore.role)) {
            next('/dashboard')
          } else {
            next({ ...to, replace: true })
          }
        } catch (error) {
          // Token might be invalid
          authStore.clearAuth()
          hasFetchedInfo = false
          next('/login')
        }
      } else {
        // Check roles
        if (to.meta.roles && !to.meta.roles.includes(authStore.role)) {
            next('/dashboard') // Permission denied
        } else {
            next()
        }
      }
    }
  } else {
    if (to.path === '/login') {
      next()
    } else {
      next('/login')
    }
  }
})

export default router
