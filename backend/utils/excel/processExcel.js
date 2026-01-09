/**
 * 工序 Excel 导入导出
 */

const ExcelJS = require('exceljs');
const { getPackagingTypeName } = require('../../config/packagingTypes');

async function generateProcessExcel(processes) { // 生成工序 Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('工序清单');

    worksheet.columns = [
        { header: '型号', key: 'model_name', width: 15 },
        { header: '配置', key: 'config_name', width: 20 },
        { header: '包装类型', key: 'packaging_type', width: 15 },
        { header: '包装方式', key: 'packaging_method', width: 40 },
        { header: '工序', key: 'process_name', width: 20 },
        { header: '单价', key: 'unit_price', width: 12 }
    ];

    processes.forEach(p => {
        worksheet.addRow({
            model_name: p.model_name,
            config_name: p.config_name,
            packaging_type: p.packaging_type_name || getPackagingTypeName(p.packaging_type) || '标准彩盒',
            packaging_method: p.packaging_method,
            process_name: p.process_name,
            unit_price: p.unit_price
        });
    });

    return workbook;
}

async function generateProcessTemplate() { // 生成工序导入模板
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('工序导入模板');

    worksheet.columns = [
        { header: '型号', key: 'model_name', width: 15 },
        { header: '配置', key: 'config_name', width: 20 },
        { header: '包装类型', key: 'packaging_type', width: 15 },
        { header: '包装方式', key: 'packaging_method', width: 40 },
        { header: '工序', key: 'process_name', width: 20 },
        { header: '单价', key: 'unit_price', width: 12 }
    ];

    worksheet.addRow({ model_name: 'MODEL-001', config_name: '标准配置', packaging_type: '标准彩盒', packaging_method: '10pc/袋, 10袋/盒, 24盒/箱', process_name: '示例工序', unit_price: 5.0 });

    const instructionSheet = workbook.addWorksheet('填写说明');
    instructionSheet.columns = [
        { header: '字段', key: 'field', width: 15 },
        { header: '说明', key: 'description', width: 50 },
        { header: '有效值', key: 'valid_values', width: 40 }
    ];
    instructionSheet.addRow({ field: '型号', description: '产品型号名称', valid_values: '必填' });
    instructionSheet.addRow({ field: '配置', description: '包装配置名称', valid_values: '必填' });
    instructionSheet.addRow({ field: '包装类型', description: '包装结构类型', valid_values: '标准彩盒、无彩盒、泡壳直装、泡壳袋装' });
    instructionSheet.addRow({ field: '包装方式', description: '包装层级数量', valid_values: '如：10pc/袋, 10袋/盒, 24盒/箱' });
    instructionSheet.addRow({ field: '工序', description: '工序名称', valid_values: '必填' });
    instructionSheet.addRow({ field: '单价', description: '工序单价', valid_values: '数字' });

    return workbook;
}

module.exports = { generateProcessExcel, generateProcessTemplate };
