/**
 * 认证路由
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth/authController');
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
router.patch('/users/:id/toggle-status', verifyToken, checkRole('admin'), authController.toggleUserStatus);

// 用户导入导出
const multer = require('multer');
const path = require('path');
const upload = multer({ dest: path.join(__dirname, '../uploads/temp') });
router.post('/users/import', verifyToken, checkRole('admin'), upload.single('file'), authController.importUsers);
router.post('/users/export/excel', verifyToken, checkRole('admin'), authController.exportUsers);
router.get('/users/template/download', verifyToken, checkRole('admin'), authController.downloadUserTemplate);

module.exports = router;
