/**
 * 认证状态管理
 */

import { defineStore } from 'pinia'
import request from '../utils/request'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null')
  }),

  getters: {
    // 是否已登录
    isLoggedIn: (state) => !!state.token,
    
    // 用户角色
    userRole: (state) => state.user?.role || null,
    
    // 用户名
    username: (state) => state.user?.username || '',
    
    // 真实姓名
    realName: (state) => state.user?.real_name || state.user?.username || '',

    // 权限检查
    isAdmin: (state) => state.user?.role === 'admin',
    isPurchaser: (state) => state.user?.role === 'purchaser',
    isProducer: (state) => state.user?.role === 'producer',
    isReviewer: (state) => state.user?.role === 'reviewer',
    isSalesperson: (state) => state.user?.role === 'salesperson',
    isReadonly: (state) => state.user?.role === 'readonly'
  },

  actions: {
    // 登录
    async login(username, password) {
      try {
        const response = await request.post('/auth/login', {
          username,
          password
        })

        if (response.success) {
          this.token = response.data.token
          this.user = response.data.user

          // 保存到 localStorage
          localStorage.setItem('token', response.data.token)
          localStorage.setItem('user', JSON.stringify(response.data.user))

          return response.data
        } else {
          throw new Error(response.message || '登录失败')
        }
      } catch (error) {
        throw error
      }
    },

    // 登出
    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },

    // 获取当前用户信息
    async fetchUserInfo() {
      try {
        const response = await request.get('/auth/me')
        if (response.success) {
          this.user = response.data
          localStorage.setItem('user', JSON.stringify(response.data))
          return response.data
        }
      } catch (error) {
        // Token 可能已过期，清除登录状态
        this.logout()
        throw error
      }
    },

    // 修改密码
    async changePassword(oldPassword, newPassword) {
      try {
        const response = await request.post('/auth/change-password', {
          oldPassword,
          newPassword
        })
        return response
      } catch (error) {
        throw error
      }
    }
  }
})
