/**
 * 用户 Excel 导入导出
 */

const ExcelJS = require('exceljs');

const ROLE_MAP = { admin: '管理员', purchaser: '采购', producer: '生产', reviewer: '审核', salesperson: '业务', readonly: '只读' };

async function generateUserExcel(users) { // 生成用户 Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('用户清单');

    worksheet.columns = [
        { header: '用户代号', key: 'username', width: 15 },
        { header: '真实姓名', key: 'real_name', width: 15 },
        { header: '角色', key: 'role', width: 12 },
        { header: '邮箱', key: 'email', width: 25 },
        { header: '状态', key: 'is_active', width: 10 },
        { header: '创建时间', key: 'created_at', width: 20 }
    ];

    users.forEach(u => {
        worksheet.addRow({
            username: u.username,
            real_name: u.real_name || '',
            role: ROLE_MAP[u.role] || u.role,
            email: u.email || '',
            is_active: u.is_active ? '启用' : '禁用',
            created_at: u.created_at
        });
    });

    return workbook;
}

async function generateUserTemplate() { // 生成用户导入模板
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('用户导入模板');

    worksheet.columns = [
        { header: '用户代号', key: 'username', width: 15 },
        { header: '真实姓名', key: 'real_name', width: 15 },
        { header: '角色', key: 'role', width: 12 },
        { header: '邮箱', key: 'email', width: 25 },
        { header: '密码', key: 'password', width: 15 }
    ];

    worksheet.addRow({ username: 'user001', real_name: '张三', role: '业务', email: 'zhangsan@example.com', password: '123456' });

    const instructionSheet = workbook.addWorksheet('填写说明');
    instructionSheet.columns = [
        { header: '字段', key: 'field', width: 15 },
        { header: '说明', key: 'description', width: 40 },
        { header: '有效值', key: 'valid_values', width: 50 }
    ];
    instructionSheet.addRow({ field: '用户代号', description: '登录账号，必填', valid_values: '3-20个字符' });
    instructionSheet.addRow({ field: '真实姓名', description: '用户姓名', valid_values: '可选' });
    instructionSheet.addRow({ field: '角色', description: '用户角色，必填', valid_values: '管理员、采购、生产、审核、业务、只读' });
    instructionSheet.addRow({ field: '邮箱', description: '邮箱地址', valid_values: '可选' });
    instructionSheet.addRow({ field: '密码', description: '登录密码', valid_values: '默认123456，至少6位' });

    return workbook;
}

module.exports = { generateUserExcel, generateUserTemplate };
