const Customer = require('../../models/Customer');
const { success, error, paginated } = require('../../utils/response');
const ExcelJS = require('exceljs');
const logger = require('../../utils/logger');

const getCustomerList = async (req, res) => {
    try {
        const { page = 1, pageSize = 12, keyword } = req.query;
        const currentUser = req.user;
        // 管理员/审核员看全部，业务员只看自己的客户+公共客户
        const userId = (currentUser?.role === 'admin' || currentUser?.role === 'reviewer') ? null : currentUser?.id;
        const result = await Customer.findAll({ page: parseInt(page), pageSize: parseInt(pageSize), keyword, userId, includePublic: true });
        res.json(paginated(result.data, result.total, result.page, result.pageSize));
    } catch (err) {
        logger.error('获取客户列表失败:', err);
        res.status(500).json(error('获取客户列表失败: ' + err.message, 500));
    }
};

const getCustomerById = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) return res.status(404).json(error('客户不存在', 404));
        res.json(success(customer));
    } catch (err) {
        res.status(500).json(error('获取客户详情失败: ' + err.message, 500));
    }
};

const createCustomer = async (req, res) => {
    try {
        const { vc_code, name, region, remark, user_id } = req.body;
        if (!vc_code || !name) return res.status(400).json(error('VC号和客户名称为必填项', 400));
        
        const existing = await Customer.findByVcCode(vc_code);
        if (existing) return res.status(400).json(error('VC号已存在', 400));
        
        const id = await Customer.create({ vc_code, name, region, remark, user_id });
        const customer = await Customer.findById(id);
        res.status(201).json(success(customer, '创建成功'));
    } catch (err) {
        res.status(500).json(error('创建客户失败: ' + err.message, 500));
    }
};

const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { vc_code, name, region, remark, user_id } = req.body;
        if (!vc_code || !name) return res.status(400).json(error('VC号和客户名称为必填项', 400));
        
        const customer = await Customer.findById(id);
        if (!customer) return res.status(404).json(error('客户不存在', 404));
        
        const existingVc = await Customer.findByVcCode(vc_code);
        if (existingVc && existingVc.id !== parseInt(id)) return res.status(400).json(error('VC号已被其他客户使用', 400));
        
        await Customer.update(id, { vc_code, name, region, remark, user_id });
        const updated = await Customer.findById(id);
        res.json(success(updated, '更新成功'));
    } catch (err) {
        res.status(500).json(error('更新客户失败: ' + err.message, 500));
    }
};

const deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) return res.status(404).json(error('客户不存在', 404));
        await Customer.delete(req.params.id);
        res.json(success(null, '删除成功'));
    } catch (err) {
        res.status(500).json(error('删除客户失败: ' + err.message, 500));
    }
};

const batchDeleteCustomers = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json(error('请提供要删除的客户ID', 400));
        const count = await Customer.batchDelete(ids);
        res.json(success({ deleted: count }, `成功删除 ${count} 条记录`));
    } catch (err) {
        res.status(500).json(error('批量删除失败: ' + err.message, 500));
    }
};

const searchCustomers = async (req, res) => {
    try {
        const { keyword } = req.query;
        if (!keyword) return res.json(success([]));
        const currentUserId = req.user?.id || null;
        const customers = await Customer.search(keyword, currentUserId);
        res.json(success(customers));
    } catch (err) {
        res.status(500).json(error('搜索客户失败: ' + err.message, 500));
    }
};

const downloadTemplate = async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('客户导入模板');
        sheet.columns = [
            { header: 'VC号', key: 'vc_code', width: 15 },
            { header: '客户名称', key: 'name', width: 25 },
            { header: '地区', key: 'region', width: 15 },
            { header: '备注', key: 'remark', width: 30 }
        ];
        sheet.getRow(1).font = { bold: true };
        sheet.addRow({ vc_code: 'VC001', name: '示例客户', region: '广东', remark: '示例备注' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=customer_template.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        res.status(500).json(error('下载模板失败: ' + err.message, 500));
    }
};

const importCustomers = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json(error('请上传文件', 400));
        
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);
        const sheet = workbook.worksheets[0];
        
        let created = 0, updated = 0;
        sheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const vc_code = row.getCell(1).value?.toString().trim();
            const name = row.getCell(2).value?.toString().trim();
            if (!vc_code || !name) return;
            
            const region = row.getCell(3).value?.toString().trim() || null;
            const remark = row.getCell(4).value?.toString().trim() || null;
            
            Customer.upsert({ vc_code, name, region, remark }).then(result => {
                if (result.action === 'created') created++;
                else updated++;
            });
        });
        
        setTimeout(() => res.json(success({ created, updated }, '导入完成')), 500);
    } catch (err) {
        res.status(500).json(error('导入失败: ' + err.message, 500));
    }
};

const exportCustomers = async (req, res) => {
    try {
        const { ids } = req.body;
        let customers;
        if (ids && ids.length > 0) {
            const result = await Promise.all(ids.map(id => Customer.findById(id)));
            customers = result.filter(c => c);
        } else {
            const result = await Customer.findAll({ pageSize: 10000 });
            customers = result.data;
        }
        
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('客户列表');
        sheet.columns = [
            { header: 'VC号', key: 'vc_code', width: 15 },
            { header: '客户名称', key: 'name', width: 25 },
            { header: '地区', key: 'region', width: 15 },
            { header: '备注', key: 'remark', width: 30 }
        ];
        sheet.getRow(1).font = { bold: true };
        customers.forEach(c => sheet.addRow({ vc_code: c.vc_code, name: c.name, region: c.region || '', remark: c.remark || '' }));
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=customers_${Date.now()}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        res.status(500).json(error('导出失败: ' + err.message, 500));
    }
};

module.exports = {
    getCustomerList,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    batchDeleteCustomers,
    searchCustomers,
    downloadTemplate,
    importCustomers,
    exportCustomers
};
