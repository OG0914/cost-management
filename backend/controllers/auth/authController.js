/**
 * 认证控制器
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const ExcelParser = require('../../utils/excelParser');
const ExcelGenerator = require('../../utils/excelGenerator');
const { success, error } = require('../../utils/response');
const path = require('path');
const fs = require('fs');

// 用户登录
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json(error('用户名和密码不能为空', 400));
    }

    // 查找用户
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json(error('用户名或密码错误', 401));
    }

    // 检查用户是否被禁用
    if (user.is_active === 0 || user.is_active === false) {
      return res.status(403).json(error('该账号已被禁用，请联系管理员', 403));
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json(error('用户名或密码错误', 401));
    }

    // 生成 JWT Token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    // 返回用户信息和 token（不包含密码）
    res.json(success({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        real_name: user.real_name,
        email: user.email
      }
    }, '登录成功'));

  } catch (err) {
    next(err);
  }
};

// 用户注册
const register = async (req, res, next) => {
  try {
    const { username, password, role, real_name, email } = req.body;

    // 验证必填字段
    if (!username || !password || !role) {
      return res.status(400).json(error('用户名、密码和角色不能为空', 400));
    }

    // 验证角色是否合法
    const validRoles = ['admin', 'purchaser', 'producer', 'reviewer', 'salesperson', 'readonly'];
    if (!validRoles.includes(role)) {
      return res.status(400).json(error('无效的角色类型', 400));
    }

    // 检查用户名是否已存在
    if (await User.exists(username)) {
      return res.status(400).json(error('用户名已存在', 400));
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const userId = await User.create({
      username,
      password: hashedPassword,
      role,
      real_name,
      email
    });

    res.status(201).json(success({ id: userId }, '注册成功'));

  } catch (err) {
    next(err);
  }
};

// 获取当前用户信息
const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json(error('用户不存在', 404));
    }

    // 返回用户信息（不包含密码）
    res.json(success({
      id: user.id,
      username: user.username,
      role: user.role,
      real_name: user.real_name,
      email: user.email
    }));

  } catch (err) {
    next(err);
  }
};

// 修改密码
const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json(error('旧密码和新密码不能为空', 400));
    }

    // 获取当前用户
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json(error('用户不存在', 404));
    }

    // 验证旧密码
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json(error('旧密码错误', 401));
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await User.updatePassword(req.user.id, hashedPassword);

    res.json(success(null, '密码修改成功'));

  } catch (err) {
    next(err);
  }
};

// 获取所有用户（管理员）
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll();
    
    // 不返回密码字段
    const usersWithoutPassword = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.json(success(usersWithoutPassword));
  } catch (err) {
    next(err);
  }
};

// 更新用户信息（管理员）
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username, real_name, email, role, is_active } = req.body;

    // 检查用户是否存在
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json(error('用户不存在', 404));
    }

    // 不能禁用管理员账号
    if (user.username === 'admin' && is_active === false) {
      return res.status(400).json(error('不能禁用管理员账号', 400));
    }

    // 如果修改用户名，检查新用户名是否已存在
    if (username && username !== user.username) {
      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        return res.status(400).json(error('用户代号已存在', 400));
      }
    }

    // 验证角色是否合法
    const validRoles = ['admin', 'purchaser', 'producer', 'reviewer', 'salesperson', 'readonly'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json(error('无效的角色类型', 400));
    }

    await User.update(id, { username, real_name, email, role, is_active });

    res.json(success(null, '用户信息更新成功'));
  } catch (err) {
    next(err);
  }
};

// 删除用户（管理员）
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 不能删除管理员账号
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json(error('用户不存在', 404));
    }
    
    if (user.username === 'admin') {
      return res.status(400).json(error('不能删除管理员账号', 400));
    }

    // 管理员删除用户时，自动处理关联的报价单
    // 1. 删除用户创建的所有报价单
    // 2. 将用户审核的报价单的 reviewed_by 设置为 NULL
    const result = await User.deleteWithRelations(id);
    
    if (!result.success) {
      return res.status(500).json(error('删除用户失败', 500));
    }

    res.json(success({
      deletedQuotations: result.deletedQuotations,
      updatedQuotations: result.updatedQuotations
    }, `用户删除成功。已删除 ${result.deletedQuotations} 个报价单，更新 ${result.updatedQuotations} 个审核记录。`));
  } catch (err) {
    console.error('删除用户失败:', err);
    next(err);
  }
};

// 重置用户密码（管理员）
const resetUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json(error('新密码不能为空', 400));
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await User.updatePassword(id, hashedPassword);

    res.json(success(null, '密码重置成功'));
  } catch (err) {
    next(err);
  }
};

// 禁用/启用用户（管理员）
const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    // 检查用户是否存在
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json(error('用户不存在', 404));
    }

    // 不能禁用管理员账号
    if (user.username === 'admin' && is_active === false) {
      return res.status(400).json(error('不能禁用管理员账号', 400));
    }

    // 更新用户状态
    await User.update(id, { is_active });

    const statusText = is_active ? '启用' : '禁用';
    res.json(success(null, `用户${statusText}成功`));
  } catch (err) {
    next(err);
  }
};

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
    const tempDir = path.join(__dirname, '../temp');
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
    const tempDir = path.join(__dirname, '../temp');
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
  login,
  register,
  getCurrentUser,
  changePassword,
  getAllUsers,
  updateUser,
  deleteUser,
  resetUserPassword,
  toggleUserStatus,
  importUsers,
  exportUsers,
  downloadUserTemplate
};
