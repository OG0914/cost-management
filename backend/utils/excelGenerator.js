/**
 * Excel 生成工具
 */

const XLSX = require('xlsx');

class ExcelGenerator {
  /**
   * 生成原料 Excel
   */
  static generateMaterialExcel(materials) {
    const data = materials.map(m => ({
      '品号': m.item_no,
      '原料名称': m.name,
      '单位': m.unit,
      '单价': m.price,
      '币别': m.currency,
      '更新时间': m.updated_at
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '原料清单');
    
    return workbook;
  }

  /**
   * 生成工序 Excel
   * 列顺序：型号、配置、包装方式、工序、单价
   */
  static generateProcessExcel(processes) {
    const data = processes.map(p => ({
      '型号': p.model_name,
      '配置': p.config_name,
      '包装方式': p.packaging_method,
      '工序': p.process_name,
      '单价': p.unit_price
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '工序清单');
    
    return workbook;
  }

  /**
   * 生成包材 Excel
   * 列顺序：型号、配置、包装方式、包材名称、基本用量、单价、纸箱体积
   */
  static generatePackagingMaterialExcel(materials) {
    const data = materials.map(m => ({
      '型号': m.model_name,
      '配置': m.config_name,
      '包装方式': m.packaging_method,
      '包材名称': m.material_name,
      '基本用量': m.basic_usage,
      '单价': m.unit_price,
      '纸箱体积': m.carton_volume || ''
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '包材清单');
    
    return workbook;
  }

  /**
   * 生成原料导入模板
   */
  static generateMaterialTemplate() {
    const data = [
      {
        '品号': 'MAT001',
        '原料名称': '示例原料',
        '单位': 'kg',
        '单价': 10.5,
        '币别': 'CNY'
      }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '原料导入模板');
    
    return workbook;
  }

  /**
   * 生成工序导入模板
   * 列顺序：型号、配置、包装方式、工序、单价
   */
  static generateProcessTemplate() {
    const data = [
      {
        '型号': 'MODEL-001',
        '配置': '标准配置',
        '包装方式': '10pc/bag, 10bags/box, 24boxes/carton',
        '工序': '示例工序',
        '单价': 5.0
      }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '工序导入模板');
    
    return workbook;
  }

  /**
   * 生成包材导入模板
   * 列顺序：型号、配置、包装方式、包材名称、基本用量、单价、纸箱体积
   */
  static generatePackagingMaterialTemplate() {
    const data = [
      {
        '型号': 'MODEL-001',
        '配置': '标准配置',
        '包装方式': '10pc/bag, 10bags/box, 24boxes/carton',
        '包材名称': '示例包材',
        '基本用量': 100,
        '单价': 10.5,
        '纸箱体积': 0.05
      }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '包材导入模板');
    
    return workbook;
  }
}

module.exports = ExcelGenerator;
