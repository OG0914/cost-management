import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '../utils/auth'

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
router.beforeEach((to, from, next) => {
  const token = getToken()
  
  // 需要认证的页面
  if (to.meta.requiresAuth) {
    if (token) {
      next()
    } else {
      next('/login')
    }
  } else {
    // 已登录用户访问登录页，重定向到仪表盘
    if (to.path === '/login' && token) {
      next('/dashboard')
    } else {
      next()
    }
  }
})

export default router
