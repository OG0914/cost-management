/**
 * 认证路由
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// 公开路由（不需要认证）
router.post('/login', authController.login);
router.post('/register', authController.register);

// 需要认证的路由
router.get('/me', verifyToken, authController.getCurrentUser);
router.post('/change-password', verifyToken, authController.changePassword);

module.exports = router;
