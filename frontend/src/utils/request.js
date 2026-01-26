/**
 * Axios 请求封装
 */

import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'
import { getToken, clearAuth } from './auth'
import logger from './logger'

// 默认超时时间（毫秒）
const DEFAULT_TIMEOUT = 30000 // 30秒，适合大部分操作
const LONG_TIMEOUT = 120000   // 120秒，用于导入/导出等耗时操作

// 创建 axios 实例
const request = axios.create({
  baseURL: '/api', // 通过 Vite 代理转发到后端
  timeout: DEFAULT_TIMEOUT
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 从 localStorage 获取 token
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 导入/导出接口使用更长的超时时间
    if (config.url?.includes('/import') || config.url?.includes('/export') || config.url?.includes('/template')) {
      config.timeout = LONG_TIMEOUT
    }

    return config
  },
  error => {
    logger.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    // 直接返回响应数据
    return response.data
  },
  error => {
    logger.error('响应错误:', error)

    // 超时错误特殊处理
    if (error.code === 'ECONNABORTED' && error.message?.includes('timeout')) {
      ElMessage.error('请求超时，请检查网络或稍后重试')
      return Promise.reject(error)
    }

    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 401:
          // 如果是登录接口本身的 401 错误，不视为 token 过期，直接抛出由页面处理
          if (error.config.url && error.config.url.includes('/auth/login')) {
            return Promise.reject(error)
          }

          ElMessage.error('登录已过期，请重新登录')
          // 清除所有认证信息
          clearAuth()
          // 跳转到登录页
          if (router.currentRoute.value.path !== '/login') {
            router.push('/login')
          }
          break
        case 403:
          ElMessage.error('您没有权限执行此操作')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 429:
          ElMessage.error('请求过于频繁，请稍后再试')
          break
        case 500:
          ElMessage.error('服务器错误，请稍后重试')
          break
        default:
          ElMessage.error(data.message || '请求失败')
      }
    } else if (error.request) {
      ElMessage.error('网络错误，请检查网络连接')
    } else {
      ElMessage.error('请求配置错误')
    }

    return Promise.reject(error)
  }
)

export default request

// 导出自定义超时配置，供特殊场景使用
export { DEFAULT_TIMEOUT, LONG_TIMEOUT }
