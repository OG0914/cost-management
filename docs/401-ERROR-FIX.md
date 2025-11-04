# 401错误修复说明

## 问题描述
用户每次隔天登录系统时出现401未授权错误。

## 根本原因

### 1. 前端响应拦截器问题
- 401错误处理中跳转登录页的代码被注释
- 用户收到错误提示但停留在当前页面

### 2. 路由守卫缺陷
- 只检查token是否存在，不验证token有效性
- 过期的token仍被认为是有效的

### 3. 应用启动验证缺失
- 隔天打开应用时，localStorage中的过期token未被清理
- 直到第一个API请求才发现token过期

### 4. JWT配置不明确
- 缺少.env配置文件
- Token过期时间未明确设置

## 修复方案

### 1. 修复响应拦截器 (`frontend/src/utils/request.js`)
```javascript
// ✅ 添加router导入
import router from '../router'

// ✅ 401错误时自动跳转登录页
case 401:
  ElMessage.error('登录已过期，请重新登录')
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  if (router.currentRoute.value.path !== '/login') {
    router.push('/login')
  }
  break
```

### 2. 增强Token工具 (`frontend/src/utils/auth.js`)
```javascript
// ✅ 新增token过期检查函数
export function isTokenExpired() {
  const token = getToken()
  if (!token) return true

  try {
    const payload = token.split('.')[1]
    const decodedPayload = JSON.parse(atob(payload))
    
    if (decodedPayload.exp) {
      const currentTime = Math.floor(Date.now() / 1000)
      return decodedPayload.exp < currentTime
    }
    
    return false
  } catch (error) {
    return true
  }
}
```

### 3. 改进路由守卫 (`frontend/src/router/index.js`)
```javascript
// ✅ 在路由跳转前检查token有效性
router.beforeEach(async (to, from, next) => {
  const token = getToken()
  
  if (to.meta.requiresAuth) {
    if (!token) {
      next('/login')
      return
    }

    // ✅ 检查token是否过期
    if (isTokenExpired()) {
      clearAuth()
      next('/login')
      return
    }

    // ✅ 应用首次加载时验证token
    if (from.path === '/' || from.name === null) {
      try {
        const { useAuthStore } = await import('../store/auth')
        const authStore = useAuthStore()
        await authStore.fetchUserInfo()
        next()
      } catch (error) {
        clearAuth()
        next('/login')
      }
    } else {
      next()
    }
  } else {
    next()
  }
})
```

### 4. 完善登出逻辑 (`frontend/src/store/auth.js`)
```javascript
// ✅ 登出时自动跳转
logout() {
  this.token = null
  this.user = null
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}
```

### 5. 配置JWT (`backend/.env`)
```env
# ✅ 设置30天过期时间，避免频繁登录
JWT_SECRET=cost-management-secret-key-2024
JWT_EXPIRES_IN=30d
```

## 修复效果

### 修复前
1. 隔天打开系统，页面正常显示
2. 点击任何操作，弹出401错误
3. 停留在当前页面，需要手动刷新或跳转登录

### 修复后
1. 隔天打开系统，自动检测token过期
2. 自动清除过期token并跳转登录页
3. 提示"登录已过期，请重新登录"
4. 任何401错误都会自动跳转登录页

## 测试建议

### 1. 测试token过期
```javascript
// 在浏览器控制台手动设置一个过期的token
localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTYwMDAwMDAwMH0.xxx')
// 刷新页面，应该自动跳转到登录页
```

### 2. 测试正常登录
- 登录后关闭浏览器
- 第二天打开，如果在30天内应该仍然保持登录状态

### 3. 测试401响应
- 登录后，在后端手动修改JWT_SECRET
- 刷新页面，应该自动跳转到登录页

## 注意事项

1. **JWT_SECRET安全性**：生产环境请使用强随机字符串
2. **Token过期时间**：根据业务需求调整（建议7-30天）
3. **浏览器兼容性**：atob()在所有现代浏览器中都支持
4. **多标签页同步**：可以考虑使用localStorage事件监听实现多标签页登出同步

## 相关文件

- `frontend/src/utils/request.js` - HTTP请求拦截器
- `frontend/src/utils/auth.js` - Token管理工具
- `frontend/src/router/index.js` - 路由守卫
- `frontend/src/store/auth.js` - 认证状态管理
- `backend/.env` - 后端环境变量配置
- `backend/middleware/auth.js` - JWT验证中间件
- `backend/controllers/authController.js` - 认证控制器
