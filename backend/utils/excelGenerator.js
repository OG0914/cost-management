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
   */
  static generateProcessExcel(processes) {
    const data = processes.map(p => ({
      '工序名称': p.name,
      '单价': p.price,
      '适用型号': p.model_name || '',
      '更新时间': p.updated_at
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '工序清单');
    
    return workbook;
  }

  /**
   * 生成原料导入模板
   */
  static generateMaterialTemplate() {
    const data = [
      {
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
   */
  static generateProcessTemplate() {
    const data = [
      {
        '工序名称': '示例工序',
        '单价': 5.0,
        '型号ID': 1
      }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '工序导入模板');
    
    return workbook;
  }
}

module.exports = ExcelGenerator;
