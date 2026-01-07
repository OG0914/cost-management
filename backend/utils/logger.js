/**
 * Winston 日志配置
 * 替代 console.log/console.error，支持日志分级和文件输出
 */

const winston = require('winston');
const path = require('path');

const logDir = path.join(__dirname, '../logs'); // 日志目录

// 北京时间格式化函数
const formatBeijingTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: formatBeijingTime }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
        return stack
            ? `${timestamp} [${level.toUpperCase()}] ${message}\n${stack}`
            : `${timestamp} [${level.toUpperCase()}] ${message}`;
    })
);

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        new winston.transports.Console({ // 控制台输出（开发环境彩色）
            format: winston.format.combine(
                winston.format.colorize(),
                logFormat
            )
        })
    ]
});

// 生产环境添加文件日志
if (process.env.NODE_ENV === 'production') {
    logger.add(new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
    }));
    logger.add(new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        maxsize: 5242880,
        maxFiles: 5
    }));
}

module.exports = logger;
