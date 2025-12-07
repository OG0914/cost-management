/**
 * Excel 生成工具
 */

const ExcelJS = require('exceljs');
const { VALID_PACKAGING_TYPE_KEYS, getPackagingTypeName, formatPackagingMethod } = require('../config/packagingTypes');

class ExcelGenerator {
  /**
   * 生成原料 Excel
   */
  static async generateMaterialExcel(materials) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('原料清单');
    
    worksheet.columns = [
      { header: '品号', key: 'item_no', width: 15 },
      { header: '原料名称', key: 'name', width: 20 },
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
        unit: m.unit,
        price: m.price,
        currency: m.currency,
        manufacturer: m.manufacturer || '',
        updated_at: m.updated_at
      });
    });
    
    return workbook;
  }

  /**
   * 生成型号 Excel
   */
  static async generateModelExcel(models) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('型号清单');
    
    worksheet.columns = [
      { header: '法规类别', key: 'regulation_name', width: 20 },
      { header: '型号名称', key: 'model_name', width: 25 },
      { header: '型号分类', key: 'model_category', width: 30 },
      { header: '状态', key: 'is_active', width: 10 },
      { header: '创建时间', key: 'created_at', width: 20 }
    ];
    
    models.forEach(m => {
      worksheet.addRow({
        regulation_name: m.regulation_name,
        model_name: m.model_name,
        model_category: m.model_category || '',
        is_active: m.is_active ? '激活' : '禁用',
        created_at: m.created_at
      });
    });
    
    return workbook;
  }

  /**
   * 生成工序 Excel
   * 列顺序：型号、配置、包装类型、包装方式、工序、单价
   */
  static async generateProcessExcel(processes) {
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

  /**
   * 生成包材 Excel
   * 列顺序：型号、配置、包装类型、包装方式、包材名称、基本用量、单价、纸箱体积
   */
  static async generatePackagingMaterialExcel(materials) {
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

  /**
   * 生成原料导入模板
   */
  static async generateMaterialTemplate() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('原料导入模板');
    
    worksheet.columns = [
      { header: '品号', key: 'item_no', width: 15 },
      { header: '原料名称', key: 'name', width: 20 },
      { header: '单位', key: 'unit', width: 10 },
      { header: '单价', key: 'price', width: 12 },
      { header: '币别', key: 'currency', width: 10 },
      { header: '厂商', key: 'manufacturer', width: 20 }
    ];
    
    worksheet.addRow({
      item_no: 'MAT001',
      name: '示例原料',
      unit: 'kg',
      price: 10.5,
      currency: 'CNY',
      manufacturer: '示例厂商'
    });
    
    return workbook;
  }

  /**
   * 生成型号导入模板
   */
  static async generateModelTemplate() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('型号导入模板');
    
    worksheet.columns = [
      { header: '法规类别', key: 'regulation_name', width: 20 },
      { header: '型号名称', key: 'model_name', width: 25 },
      { header: '型号分类', key: 'model_category', width: 30 }
    ];
    
    worksheet.addRow({
      regulation_name: 'CE',
      model_name: 'MODEL-001',
      model_category: '口罩'
    });
    
    return workbook;
  }

  /**
   * 生成工序导入模板
   * 列顺序：型号、配置、包装类型、包装方式、工序、单价
   */
  static async generateProcessTemplate() {
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
    
    // 添加示例数据
    worksheet.addRow({
      model_name: 'MODEL-001',
      config_name: '标准配置',
      packaging_type: '标准彩盒',
      packaging_method: '10pc/袋, 10袋/盒, 24盒/箱',
      process_name: '示例工序',
      unit_price: 5.0
    });
    
    // 添加说明工作表
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

  /**
   * 生成包材导入模板
   * 列顺序：型号、配置、包装类型、包装方式、包材名称、基本用量、单价、纸箱体积
   */
  static async generatePackagingMaterialTemplate() {
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
    
    // 添加示例数据
    worksheet.addRow({
      model_name: 'MODEL-001',
      config_name: '标准配置',
      packaging_type: '标准彩盒',
      packaging_method: '10pc/袋, 10袋/盒, 24盒/箱',
      material_name: '示例包材',
      basic_usage: 100,
      unit_price: 10.5,
      carton_volume: 0.05
    });
    
    // 添加说明工作表
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
}

module.exports = ExcelGenerator;
