/**
 * Express 服务器主入口
 * PostgreSQL 异步版本
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dbManager = require('./db/database');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// 中间件配置
app.use(cors()); // 允许跨域
app.use(express.json()); // 解析 JSON 请求体
app.use(express.urlencoded({ extended: true })); // 解析 URL 编码请求体

// 健康检查路由
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString(),
    database: dbManager.isInitialized ? 'connected' : 'disconnected'
  });
});

// API 路由
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/regulations', require('./routes/regulationRoutes'));
app.use('/api/models', require('./routes/modelRoutes'));
app.use('/api/materials', require('./routes/materialRoutes'));
app.use('/api/processes', require('./routes/processRoutes'));
app.use('/api/config', require('./routes/configRoutes'));
app.use('/api/cost', require('./routes/costRoutes'));
app.use('/api/standard-costs', require('./routes/standardCostRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/review', require('./routes/reviewRoutes'));
app.use('/api/bom', require('./routes/bomRoutes'));

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在'
  });
});

// 统一错误处理
app.use(errorHandler);

// 服务器实例（用于优雅关闭）
let server = null;

/**
 * 启动服务器
 * 异步初始化数据库后再启动 HTTP 服务
 */
async function startServer() {
  try {
    // 异步初始化数据库连接
    console.log('正在连接 PostgreSQL 数据库...');
    await dbManager.initialize();
    console.log('数据库连接成功');

    // 启动 HTTP 服务
    server = app.listen(PORT, HOST, () => {
      const os = require('os');
      const networkInterfaces = os.networkInterfaces();
      const localIPs = [];
      
      // 获取所有局域网 IP
      Object.keys(networkInterfaces).forEach(interfaceName => {
        networkInterfaces[interfaceName].forEach(iface => {
          if (iface.family === 'IPv4' && !iface.internal) {
            localIPs.push(iface.address);
          }
        });
      });

      console.log(`========================================`);
      console.log(`成本分析管理系统后端服务已启动`);
      console.log(`端口: ${PORT}`);
      console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`数据库: PostgreSQL`);
      console.log(`----------------------------------------`);
      console.log(`本地访问: http://localhost:${PORT}`);
      if (localIPs.length > 0) {
        console.log(`局域网访问:`);
        localIPs.forEach(ip => {
          console.log(`  http://${ip}:${PORT}`);
        });
      }
      console.log(`----------------------------------------`);
      console.log(`健康检查: http://localhost:${PORT}/api/health`);
      console.log(`========================================`);
    });

  } catch (error) {
    console.error('服务器启动失败:', error.message);
    process.exit(1);
  }
}

/**
 * 优雅关闭服务器
 * 先关闭 HTTP 服务，再关闭数据库连接
 */
async function gracefulShutdown(signal) {
  console.log(`\n收到 ${signal} 信号，正在优雅关闭服务器...`);
  
  try {
    // 关闭 HTTP 服务器（停止接受新连接）
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      console.log('HTTP 服务已关闭');
    }

    // 关闭数据库连接池
    await dbManager.close();
    console.log('数据库连接已关闭');
    
    console.log('服务器已安全关闭');
    process.exit(0);
  } catch (error) {
    console.error('关闭服务器时发生错误:', error.message);
    process.exit(1);
  }
}

// 监听进程信号
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
});

// 启动服务器
startServer();
