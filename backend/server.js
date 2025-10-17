/**
 * Express 服务器主入口
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const dbManager = require('./db/database');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors()); // 允许跨域
app.use(express.json()); // 解析 JSON 请求体
app.use(express.urlencoded({ extended: true })); // 解析 URL 编码请求体

// 初始化数据库
const dbPath = path.resolve(__dirname, process.env.DB_PATH || './db/cost_analysis.db');
dbManager.initialize(dbPath);

// 健康检查路由
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString()
  });
});

// API 路由
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/regulations', require('./routes/regulationRoutes'));
app.use('/api/models', require('./routes/modelRoutes'));
app.use('/api/materials', require('./routes/materialRoutes'));
// app.use('/api/cost', require('./routes/costRoutes'));
// app.use('/api/processes', require('./routes/processRoutes'));
// app.use('/api/packaging', require('./routes/packagingRoutes'));
// app.use('/api/report', require('./routes/reportRoutes'));
// app.use('/api/dashboard', require('./routes/dashboardRoutes'));
// app.use('/api/config', require('./routes/configRoutes'));

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在'
  });
});

// 统一错误处理
app.use(errorHandler);

// 启动服务器
app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`成本分析管理系统后端服务已启动`);
  console.log(`端口: ${PORT}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`数据库: ${dbPath}`);
  console.log(`访问: http://localhost:${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/api/health`);
  console.log(`========================================`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  dbManager.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n正在关闭服务器...');
  dbManager.close();
  process.exit(0);
});
