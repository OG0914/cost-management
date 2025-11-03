import { createRouter, createWebHistory } from 'vue-router'
import { getToken, isTokenExpired, clearAuth } from '../utils/auth'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/regulations',
    name: 'RegulationManage',
    component: () => import('../views/regulation/RegulationManage.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/models',
    name: 'ModelManage',
    component: () => import('../views/model/ModelManage.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/materials',
    name: 'MaterialManage',
    component: () => import('../views/material/MaterialManage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/processes',
    name: 'ProcessManagement',
    component: () => import('../views/ProcessManagement.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/packaging',
    name: 'PackagingManage',
    component: () => import('../views/packaging/PackagingManage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/users',
    name: 'UserManage',
    component: () => import('../views/user/UserManage.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/config',
    name: 'SystemConfig',
    component: () => import('../views/SystemConfig.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cost/add',
    name: 'CostAdd',
    component: () => import('../views/cost/CostAdd.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cost/edit/:id',
    name: 'CostEdit',
    component: () => import('../views/cost/CostAdd.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cost/detail/:id',
    name: 'CostDetail',
    component: () => import('../views/cost/CostDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cost/records',
    name: 'CostRecords',
    component: () => import('../views/cost/CostRecords.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { requiresAuth: false }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const token = getToken()
  
  // 需要认证的页面
  if (to.meta.requiresAuth) {
    if (!token) {
      // 没有token，跳转登录
      next('/login')
      return
    }

    // 检查token是否过期
    if (isTokenExpired()) {
      clearAuth()
      next('/login')
      return
    }

    // 如果是应用首次加载（刷新页面或直接访问），验证token有效性
    if (from.path === '/' || from.name === null) {
      try {
        const { useAuthStore } = await import('../store/auth')
        const authStore = useAuthStore()
        await authStore.fetchUserInfo()
        next()
      } catch (error) {
        // Token无效，清除并跳转登录
        clearAuth()
        next('/login')
      }
    } else {
      next()
    }
  } else {
    // 已登录用户访问登录页，重定向到仪表盘
    if (to.path === '/login' && token && !isTokenExpired()) {
      next('/dashboard')
    } else {
      next()
    }
  }
})

export default router
