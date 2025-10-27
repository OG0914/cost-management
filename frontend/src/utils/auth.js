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

// 检查token是否可能过期（简单的JWT解析）
export function isTokenExpired() {
  const token = getToken()
  if (!token) return true

  try {
    // JWT格式: header.payload.signature
    const payload = token.split('.')[1]
    if (!payload) return true

    // Base64解码
    const decodedPayload = JSON.parse(atob(payload))
    
    // 检查过期时间（exp字段，单位是秒）
    if (decodedPayload.exp) {
      const currentTime = Math.floor(Date.now() / 1000)
      return decodedPayload.exp < currentTime
    }
    
    return false
  } catch (error) {
    console.error('Token解析失败:', error)
    return true
  }
}
