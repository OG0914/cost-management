/**
 * 包材 Excel 导入导出
 */

const ExcelJS = require('exceljs');
const { getPackagingTypeName } = require('../../config/packagingTypes');

async function generatePackagingMaterialExcel(materials) { // 生成包材 Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('包材清单');

    worksheet.columns = [
        { header: '型号', key: 'model_name', width: 15 },
        { header: '配置', key: 'config_name', width: 20 },
        { header: '包装类型', key: 'packaging_type', width: 15 },
        { header: '包装方式', key: 'packaging_method', width: 40 },
        { header: '包材名称', key: 'material_name', width: 20 },
        { header: '基本用量', key: 'basic_usage', width: 12 },
        { header: '单价', key: 'unit_price', width: 12 },
        { header: '纸箱体积', key: 'carton_volume', width: 12 }
    ];

    materials.forEach(m => {
        worksheet.addRow({
            model_name: m.model_name,
            config_name: m.config_name,
            packaging_type: m.packaging_type_name || getPackagingTypeName(m.packaging_type) || '标准彩盒',
            packaging_method: m.packaging_method,
            material_name: m.material_name,
            basic_usage: m.basic_usage,
            unit_price: m.unit_price,
            carton_volume: m.carton_volume || ''
        });
    });

    return workbook;
}

async function generatePackagingMaterialTemplate() { // 生成包材导入模板
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('包材导入模板');

    worksheet.columns = [
        { header: '型号', key: 'model_name', width: 15 },
        { header: '配置', key: 'config_name', width: 20 },
        { header: '包装类型', key: 'packaging_type', width: 15 },
        { header: '包装方式', key: 'packaging_method', width: 40 },
        { header: '包材名称', key: 'material_name', width: 20 },
        { header: '基本用量', key: 'basic_usage', width: 12 },
        { header: '单价', key: 'unit_price', width: 12 },
        { header: '纸箱体积', key: 'carton_volume', width: 12 }
    ];

    worksheet.addRow({ model_name: 'MODEL-001', config_name: '标准配置', packaging_type: '标准彩盒', packaging_method: '10pc/袋, 10袋/盒, 24盒/箱', material_name: '示例包材', basic_usage: 100, unit_price: 10.5, carton_volume: 0.05 });

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
    instructionSheet.addRow({ field: '包材名称', description: '包材名称', valid_values: '必填' });
    instructionSheet.addRow({ field: '基本用量', description: '基本用量', valid_values: '数字' });
    instructionSheet.addRow({ field: '单价', description: '包材单价', valid_values: '数字' });
    instructionSheet.addRow({ field: '纸箱体积', description: '外箱材积（立方米）', valid_values: '数字，可选' });

    return workbook;
}

module.exports = { generatePackagingMaterialExcel, generatePackagingMaterialTemplate };
