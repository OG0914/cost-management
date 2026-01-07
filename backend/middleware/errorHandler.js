/**
 * 统一错误处理中间件
 */

const errorHandler = (err, req, res, next) => {
  console.error('错误详情:', err);

  // 数据验证错误
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors: err.errors
    });
  }

  // JWT 认证错误
  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: '未授权访问，请先登录'
    });
  }

  // Token 过期错误
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token 已过期，请重新登录'
    });
  }

  // PostgreSQL 数据库错误
  // PostgreSQL 错误码参考: https://www.postgresql.org/docs/current/errcodes-appendix.html
  if (err.code && /^[0-9]{5}$/.test(err.code)) {
    const pgErrorMessages = {
      '23505': '数据已存在（唯一约束冲突）',
      '23503': '关联数据不存在（外键约束冲突）',
      '23502': '必填字段不能为空',
      '22P02': '数据格式错误',
      '42P01': '数据表不存在',
      '42703': '字段不存在'
    };
    return res.status(500).json({
      success: false,
      message: pgErrorMessages[err.code] || '数据库操作失败',
      ...(process.env.NODE_ENV === 'development' && { code: err.code, detail: err.detail })
    });
  }

  // 默认服务器错误
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
