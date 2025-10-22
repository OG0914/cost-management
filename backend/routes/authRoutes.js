/**
 * 认证路由
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

// 公开路由（不需要认证）
router.post('/login', authController.login);
router.post('/register', authController.register);

// 需要认证的路由
router.get('/me', verifyToken, authController.getCurrentUser);
router.post('/change-password', verifyToken, authController.changePassword);

// 管理员路由 - 用户管理
router.get('/users', verifyToken, checkRole('admin'), authController.getAllUsers);
router.put('/users/:id', verifyToken, checkRole('admin'), authController.updateUser);
router.delete('/users/:id', verifyToken, checkRole('admin'), authController.deleteUser);
router.post('/users/:id/reset-password', verifyToken, checkRole('admin'), authController.resetUserPassword);

module.exports = router;
