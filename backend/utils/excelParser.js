/**
 * Excel 解析工具
 */

const XLSX = require('xlsx');

class ExcelParser {
  /**
   * 解析原料 Excel
   * 期望列：原料名称、单位、单价、币别
   */
  static parseMaterialExcel(filePath) {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // 转换为 JSON
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      // 验证和转换数据
      const materials = [];
      const errors = [];
      
      data.forEach((row, index) => {
        const rowNum = index + 2; // Excel 行号（从 2 开始，因为第 1 行是表头）
        
        // 验证必填字段
        if (!row['原料名称'] && !row['name']) {
          errors.push(`第 ${rowNum} 行：缺少原料名称`);
          return;
        }
        if (!row['单位'] && !row['unit']) {
          errors.push(`第 ${rowNum} 行：缺少单位`);
          return;
        }
        if (!row['单价'] && !row['price']) {
          errors.push(`第 ${rowNum} 行：缺少单价`);
          return;
        }
        
        const material = {
          name: row['原料名称'] || row['name'],
          unit: row['单位'] || row['unit'],
          price: parseFloat(row['单价'] || row['price']),
          currency: row['币别'] || row['currency'] || 'CNY'
        };
        
        // 验证数据类型
        if (isNaN(material.price)) {
          errors.push(`第 ${rowNum} 行：单价必须是数字`);
          return;
        }
        
        materials.push(material);
      });
      
      return {
        success: errors.length === 0,
        data: materials,
        errors,
        total: data.length,
        valid: materials.length
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        errors: [error.message],
        total: 0,
        valid: 0
      };
    }
  }

  /**
   * 解析工序 Excel
   * 期望列：工序名称、单价、适用型号
   */
  static parseProcessExcel(filePath) {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const data = XLSX.utils.sheet_to_json(worksheet);
      const processes = [];
      const errors = [];
      
      data.forEach((row, index) => {
        const rowNum = index + 2;
        
        if (!row['工序名称'] && !row['name']) {
          errors.push(`第 ${rowNum} 行：缺少工序名称`);
          return;
        }
        if (!row['单价'] && !row['price']) {
          errors.push(`第 ${rowNum} 行：缺少单价`);
          return;
        }
        
        const process = {
          name: row['工序名称'] || row['name'],
          price: parseFloat(row['单价'] || row['price']),
          model_id: row['型号ID'] || row['model_id'] || null
        };
        
        if (isNaN(process.price)) {
          errors.push(`第 ${rowNum} 行：单价必须是数字`);
          return;
        }
        
        processes.push(process);
      });
      
      return {
        success: errors.length === 0,
        data: processes,
        errors,
        total: data.length,
        valid: processes.length
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        errors: [error.message],
        total: 0,
        valid: 0
      };
    }
  }
}

module.exports = ExcelParser;
