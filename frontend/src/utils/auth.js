/**
 * Token 管理工具
 */

// 获取 Token
export function getToken() {
  return localStorage.getItem('token')
}

// 设置 Token
export function setToken(token) {
  localStorage.setItem('token', token)
}

// 移除 Token
export function removeToken() {
  localStorage.removeItem('token')
}

// 获取用户信息
export function getUser() {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
}

// 设置用户信息
export function setUser(user) {
  localStorage.setItem('user', JSON.stringify(user))
}

// 移除用户信息
export function removeUser() {
  localStorage.removeItem('user')
}

// 清除所有认证信息
export function clearAuth() {
  removeToken()
  removeUser()
}
