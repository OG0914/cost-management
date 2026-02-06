/**
 * 用户导入导出控制器
 * 处理用户Excel导入、导出和模板下载
 * 拆分自 authController.js
 */

const User = require('../../models/User');
const ExcelParser = require('../../utils/excelParser');
const ExcelGenerator = require('../../utils/excel');
const { success, error } = require('../../utils/response');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

// 导入用户 Excel
const importUsers = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json(error('请上传文件', 400));
        }

        const filePath = req.file.path;
        const result = await ExcelParser.parseUserExcel(filePath);

        fs.unlinkSync(filePath); // 删除临时文件

        if (!result.success) {
            return res.status(400).json(error('文件解析失败', 400, result.errors));
        }

        let created = 0, updated = 0;
        const errors = [];

        for (const userData of result.data) {
            try {
                const existing = await User.findByUsername(userData.username);
                if (existing) {
                    await User.update(existing.id, { real_name: userData.real_name, email: userData.email, role: userData.role });
                    updated++;
                } else {
                    const hashedPassword = await bcrypt.hash(userData.password || '123456', 10);
                    await User.create({ ...userData, password: hashedPassword });
                    created++;
                }
            } catch (err) {
                errors.push(`用户 ${userData.username}: ${err.message}`);
            }
        }

        res.json(success({ total: result.total, valid: result.valid, created, updated, errors }, '导入成功'));
    } catch (err) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        next(err);
    }
};

// 导出用户 Excel
const exportUsers = async (req, res, next) => {
    try {
        const { ids } = req.body;

        let users;
        if (ids && ids.length > 0) {
            const userPromises = ids.map(id => User.findById(id));
            users = (await Promise.all(userPromises)).filter(u => u !== null);
        } else {
            users = await User.findAll();
        }

        if (users.length === 0) {
            return res.status(400).json(error('没有可导出的数据', 400));
        }

        const workbook = await ExcelGenerator.generateUserExcel(users);
        const fileName = `用户清单_${Date.now()}.xlsx`;
        // 修正：确保路径解析正确，相对于当前文件位置
        const tempDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        const filePath = path.join(tempDir, fileName);

        await workbook.xlsx.writeFile(filePath);

        res.download(filePath, fileName, (err) => {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            if (err) next(err);
        });
    } catch (err) {
        next(err);
    }
};

// 下载用户导入模板
const downloadUserTemplate = async (req, res, next) => {
    try {
        const workbook = await ExcelGenerator.generateUserTemplate();
        const fileName = '用户导入模板.xlsx';
        const tempDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        const filePath = path.join(tempDir, fileName);

        await workbook.xlsx.writeFile(filePath);

        res.download(filePath, fileName, (err) => {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            if (err) next(err);
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    importUsers,
    exportUsers,
    downloadUserTemplate
};
