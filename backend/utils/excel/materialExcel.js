/**
 * 原料 Excel 导入导出
 */

const ExcelJS = require('exceljs');

// 半面罩类表头配置
const HALF_MASK_COLUMNS = [
    { header: '产品描述', key: 'product_desc', width: 20 },
    { header: '包装方式', key: 'packaging_mode', width: 12 },
    { header: '供应商', key: 'supplier', width: 15 },
    { header: '品号', key: 'item_no', width: 15 },
    { header: '品名/规格', key: 'name', width: 25 },
    { header: '单价RMB', key: 'price', width: 12 },
    { header: '单位', key: 'unit', width: 10 },
    { header: '用量', key: 'usage_amount', width: 10 },
    { header: '生产日期', key: 'production_date', width: 15 },
    { header: 'MOQ', key: 'moq', width: 10 }
];

// 非半面罩类表头配置
const GENERAL_COLUMNS = [
    { header: '厂商', key: 'manufacturer', width: 15 },
    { header: '品号', key: 'item_no', width: 15 },
    { header: '原料品名', key: 'name', width: 25 },
    { header: '单价RMB', key: 'price', width: 12 },
    { header: '单位', key: 'unit', width: 10 },
    { header: '备注', key: 'remark', width: 20 }
];

// 通用表头配置（兼容旧版）
const UNIVERSAL_COLUMNS = [
    { header: '品号', key: 'item_no', width: 15 },
    { header: '原料名称', key: 'name', width: 20 },
    { header: '类别', key: 'category', width: 12 },
    { header: '原料类型', key: 'material_type', width: 12 },
    { header: '子分类', key: 'subcategory', width: 15 },
    { header: '单位', key: 'unit', width: 10 },
    { header: '单价', key: 'price', width: 12 },
    { header: '币别', key: 'currency', width: 10 },
    { header: '厂商', key: 'manufacturer', width: 20 },
    { header: '供应商', key: 'supplier', width: 15 },
    { header: '产品描述', key: 'product_desc', width: 20 },
    { header: '包装方式', key: 'packaging_mode', width: 12 },
    { header: '用量', key: 'usage_amount', width: 10 },
    { header: '生产日期', key: 'production_date', width: 15 },
    { header: 'MOQ', key: 'moq', width: 10 },
    { header: '备注', key: 'remark', width: 20 },
    { header: '更新时间', key: 'updated_at', width: 20 }
];

async function generateMaterialExcel(materials, exportType = 'universal') { // 生成原料 Excel
    const workbook = new ExcelJS.Workbook();

    if (exportType === 'universal') {
        const worksheet = workbook.addWorksheet('原料清单');
        worksheet.columns = UNIVERSAL_COLUMNS;
        materials.forEach(m => worksheet.addRow({
            item_no: m.item_no, name: m.name, category: m.category || '', material_type: m.material_type || 'general',
            subcategory: m.subcategory || '', unit: m.unit, price: m.price, currency: m.currency,
            manufacturer: m.manufacturer || '', supplier: m.supplier || '', product_desc: m.product_desc || '',
            packaging_mode: m.packaging_mode || '', usage_amount: m.usage_amount || '', production_date: m.production_date || '',
            moq: m.moq || '', remark: m.remark || '', updated_at: m.updated_at
        }));
    } else {
        const halfMaskMaterials = materials.filter(m => m.material_type === 'half_mask'); // 按类型分组
        const generalMaterials = materials.filter(m => m.material_type !== 'half_mask');

        if (halfMaskMaterials.length > 0) { // 半面罩类工作表
            const ws1 = workbook.addWorksheet('半面罩类原料');
            ws1.columns = HALF_MASK_COLUMNS;
            halfMaskMaterials.forEach(m => ws1.addRow({
                product_desc: m.product_desc || '', packaging_mode: m.packaging_mode || '', supplier: m.supplier || '',
                item_no: m.item_no, name: m.name, price: m.price, unit: m.unit, usage_amount: m.usage_amount || '',
                production_date: m.production_date || '', moq: m.moq || ''
            }));
        }

        if (generalMaterials.length > 0) { // 非半面罩类工作表
            const ws2 = workbook.addWorksheet('通用原料');
            ws2.columns = GENERAL_COLUMNS;
            generalMaterials.forEach(m => ws2.addRow({
                manufacturer: m.manufacturer || '', item_no: m.item_no, name: m.name,
                price: m.price, unit: m.unit, remark: m.remark || ''
            }));
        }
    }
    return workbook;
}

async function generateMaterialTemplate(templateType = 'universal') { // 生成原料导入模板
    const workbook = new ExcelJS.Workbook();

    if (templateType === 'half_mask') { // 半面罩类模板
        const worksheet = workbook.addWorksheet('半面罩类原料导入模板');
        worksheet.columns = HALF_MASK_COLUMNS;
        worksheet.addRow({ product_desc: '示例产品', packaging_mode: '袋装', supplier: '示例供应商', item_no: 'HM001', name: '半面罩活性炭', price: 15.5, unit: 'pcs', usage_amount: 2, production_date: '2026-01-01', moq: 1000 });
    } else if (templateType === 'general') { // 非半面罩类模板
        const worksheet = workbook.addWorksheet('通用原料导入模板');
        worksheet.columns = GENERAL_COLUMNS;
        worksheet.addRow({ manufacturer: '示例厂商', item_no: 'MAT001', name: '示例原料', price: 10.5, unit: 'kg', remark: '' });
    } else { // 通用模板
        const worksheet = workbook.addWorksheet('原料导入模板');
        worksheet.columns = [
            { header: '品号', key: 'item_no', width: 15 }, { header: '原料名称', key: 'name', width: 20 }, { header: '类别', key: 'category', width: 12 },
            { header: '原料类型', key: 'material_type', width: 12 }, { header: '子分类', key: 'subcategory', width: 15 }, { header: '单位', key: 'unit', width: 10 },
            { header: '单价', key: 'price', width: 12 }, { header: '币别', key: 'currency', width: 10 }, { header: '厂商', key: 'manufacturer', width: 20 }
        ];
        worksheet.addRow({ item_no: 'MAT001', name: '示例原料', category: '塑料', material_type: 'general', subcategory: '', unit: 'kg', price: 10.5, currency: 'CNY', manufacturer: '示例厂商' });
    }
    return workbook;
}

module.exports = { generateMaterialExcel, generateMaterialTemplate, HALF_MASK_COLUMNS, GENERAL_COLUMNS, UNIVERSAL_COLUMNS };

