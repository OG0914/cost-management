/**
 * 型号 Excel 导入导出
 */

const ExcelJS = require('exceljs');

async function generateModelExcel(models) { // 生成型号 Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('型号清单');

    worksheet.columns = [
        { header: '法规类别', key: 'regulation_name', width: 20 },
        { header: '型号名称', key: 'model_name', width: 25 },
        { header: '型号分类', key: 'model_category', width: 20 },
        { header: '产品系列', key: 'model_series', width: 15 },
        { header: '状态', key: 'is_active', width: 10 },
        { header: '创建时间', key: 'created_at', width: 20 }
    ];

    models.forEach(m => {
        worksheet.addRow({
            regulation_name: m.regulation_name,
            model_name: m.model_name,
            model_category: m.model_category || '',
            model_series: m.model_series || '',
            is_active: m.is_active ? '激活' : '禁用',
            created_at: m.created_at
        });
    });

    return workbook;
}

async function generateModelTemplate() { // 生成型号导入模板
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('型号导入模板');

    worksheet.columns = [
        { header: '法规类别', key: 'regulation_name', width: 20 },
        { header: '型号名称', key: 'model_name', width: 25 },
        { header: '型号分类', key: 'model_category', width: 20 },
        { header: '产品系列', key: 'model_series', width: 15 }
    ];

    worksheet.addRow({ regulation_name: 'CE', model_name: 'MK8151', model_category: '口罩', model_series: 'MK81' });

    return workbook;
}

module.exports = { generateModelExcel, generateModelTemplate };
