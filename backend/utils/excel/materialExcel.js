/**
 * 原料 Excel 导入导出
 */

const ExcelJS = require('exceljs');

async function generateMaterialExcel(materials) { // 生成原料 Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('原料清单');

    worksheet.columns = [
        { header: '品号', key: 'item_no', width: 15 },
        { header: '原料名称', key: 'name', width: 20 },
        { header: '类别', key: 'category', width: 12 },
        { header: '单位', key: 'unit', width: 10 },
        { header: '单价', key: 'price', width: 12 },
        { header: '币别', key: 'currency', width: 10 },
        { header: '厂商', key: 'manufacturer', width: 20 },
        { header: '更新时间', key: 'updated_at', width: 20 }
    ];

    materials.forEach(m => {
        worksheet.addRow({
            item_no: m.item_no,
            name: m.name,
            category: m.category || '',
            unit: m.unit,
            price: m.price,
            currency: m.currency,
            manufacturer: m.manufacturer || '',
            updated_at: m.updated_at
        });
    });

    return workbook;
}

async function generateMaterialTemplate() { // 生成原料导入模板
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('原料导入模板');

    worksheet.columns = [
        { header: '品号', key: 'item_no', width: 15 },
        { header: '原料名称', key: 'name', width: 20 },
        { header: '类别', key: 'category', width: 12 },
        { header: '单位', key: 'unit', width: 10 },
        { header: '单价', key: 'price', width: 12 },
        { header: '币别', key: 'currency', width: 10 },
        { header: '厂商', key: 'manufacturer', width: 20 }
    ];

    worksheet.addRow({ item_no: 'MAT001', name: '示例原料', category: '塑料', unit: 'kg', price: 10.5, currency: 'CNY', manufacturer: '示例厂商' });

    return workbook;
}

module.exports = { generateMaterialExcel, generateMaterialTemplate };
