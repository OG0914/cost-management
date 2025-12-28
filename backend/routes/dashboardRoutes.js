/**
 * 仪表盘路由
 */

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/auth');

// 所有仪表盘接口都需要认证
router.use(verifyToken);

// GET /api/dashboard/stats - 获取统计数据
router.get('/stats', dashboardController.getStats);

// GET /api/dashboard/regulations - 获取法规总览
router.get('/regulations', dashboardController.getRegulations);

// GET /api/dashboard/top-models - 获取型号排行
router.get('/top-models', dashboardController.getTopModels);

// GET /api/dashboard/weekly-quotations - 获取周报价统计
router.get('/weekly-quotations', dashboardController.getWeeklyQuotations);

// GET /api/dashboard/recent-activities - 获取最近操作记录
router.get('/recent-activities', dashboardController.getRecentActivities);

module.exports = router;
