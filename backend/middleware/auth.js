/**
 * JWT 认证中间件
 */

const jwt = require('jsonwebtoken');
const { error } = require('../utils/response');

// 验证 Token
const verifyToken = (req, res, next) => {
  try {
    // 从请求头获取 token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(error('未提供认证令牌', 401));
    }

    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀

    // 验证 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 将用户信息附加到请求对象
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json(error('Token 已过期，请重新登录', 401));
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json(error('无效的 Token', 401));
    }
    return res.status(401).json(error('认证失败', 401));
  }
};

// 可选的 Token 验证（不强制要求登录）
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role
      };
    }
    
    next();
  } catch (err) {
    // 可选认证失败不阻止请求
    next();
  }
};

module.exports = {
  verifyToken,
  optionalAuth
};
