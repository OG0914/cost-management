/**
 * 统一响应格式工具
 */

// 成功响应
const success = (data = null, message = '操作成功') => {
  return {
    success: true,
    message,
    data
  };
};

// 失败响应
const error = (message = '操作失败', code = 500) => {
  return {
    success: false,
    message,
    code
  };
};

// 分页响应
const paginated = (data, total, page, pageSize) => {
  return {
    success: true,
    data,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  };
};

module.exports = {
  success,
  error,
  paginated
};
