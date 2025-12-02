/**
 * Excel 解析工具
 */

const ExcelJS = require('exceljs');

class ExcelParser {
  /**
   * 解析原料 Excel
   * 期望列：品号、原料名称、单位、单价、币别、厂商
   */
  static async parseMaterialExcel(filePath) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const worksheet = workbook.worksheets[0];
      
      // 转换为 JSON
      const data = [];
      const headers = [];
      
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          // 读取表头
          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            headers[colNumber] = cell.value;
          });
        } else {
          // 读取数据行
          const rowData = {};
          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            if (headers[colNumber]) {
              rowData[headers[colNumber]] = cell.value;
            }
          });
          // 只添加非空行
          if (Object.keys(rowData).length > 0) {
            data.push(rowData);
          }
        }
      });
      
      // 验证和转换数据
      const materials = [];
      const errors = [];
      
      data.forEach((row, index) => {
        const rowNum = index + 2; // Excel 行号（从 2 开始，因为第 1 行是表头）
        
        // 验证必填字段
        if (!row['品号'] && !row['item_no']) {
          errors.push(`第 ${rowNum} 行：缺少品号`);
          return;
        }
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
        
        // 处理富文本对象
        const getValue = (value) => {
          if (value && typeof value === 'object' && value.richText) {
            return value.richText.map(t => t.text).join('');
          }
          return value;
        };
        
        const material = {
          item_no: String(getValue(row['品号']) || getValue(row['item_no']) || '').trim(),
          name: String(getValue(row['原料名称']) || getValue(row['name']) || ''),
          unit: String(getValue(row['单位']) || getValue(row['unit']) || ''),
          price: parseFloat(getValue(row['单价']) || getValue(row['price']) || 0),
          currency: String(getValue(row['币别']) || getValue(row['currency']) || 'CNY'),
          manufacturer: String(getValue(row['厂商']) || getValue(row['manufacturer']) || '').trim() || null,
          usage_amount: null
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
   * 解析型号 Excel
   * 期望列：法规类别、型号名称、备注
   */
  static async parseModelExcel(filePath) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const worksheet = workbook.worksheets[0];
      
      const data = [];
      const headers = [];
      
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          // 读取表头
          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            headers[colNumber] = cell.value;
          });
        } else {
          // 读取数据行
          const rowData = {};
          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            if (headers[colNumber]) {
              rowData[headers[colNumber]] = cell.value;
            }
          });
          // 只添加非空行
          if (Object.keys(rowData).length > 0) {
            data.push(rowData);
          }
        }
      });
      
      const models = [];
      const errors = [];
      
      data.forEach((row, index) => {
        const rowNum = index + 2;
        
        // 验证必填字段
        if (!row['法规类别'] && !row['regulation_name']) {
          errors.push(`第 ${rowNum} 行：缺少法规类别`);
          return;
        }
        if (!row['型号名称'] && !row['model_name']) {
          errors.push(`第 ${rowNum} 行：缺少型号名称`);
          return;
        }
        
        // 处理富文本对象
        const getValue = (value) => {
          if (value && typeof value === 'object' && value.richText) {
            return value.richText.map(t => t.text).join('');
          }
          return value;
        };
        
        const model = {
          regulation_name: String(getValue(row['法规类别']) || getValue(row['regulation_name']) || '').trim(),
          model_name: String(getValue(row['型号名称']) || getValue(row['model_name']) || '').trim(),
          remark: String(getValue(row['备注']) || getValue(row['remark']) || '')
        };
        
        models.push(model);
      });
      
      return {
        success: errors.length === 0,
        data: models,
        errors,
        total: data.length,
        valid: models.length
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
   * 期望列：型号、配置、包装方式、工序、单价
   */
  static async parseProcessExcel(filePath) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const worksheet = workbook.worksheets[0];
      
      const data = [];
      const headers = [];
      
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          // 读取表头
          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            headers[colNumber] = cell.value;
          });
        } else {
          // 读取数据行
          const rowData = {};
          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            if (headers[colNumber]) {
              rowData[headers[colNumber]] = cell.value;
            }
          });
          // 只添加非空行
          if (Object.keys(rowData).length > 0) {
            data.push(rowData);
          }
        }
      });
      
      console.log('工序Excel数据行数:', data.length);
      if (data.length > 0) {
        console.log('第一行数据:', data[0]);
        console.log('列名:', Object.keys(data[0]));
      }
      
      const processes = [];
      const errors = [];
      
      data.forEach((row, index) => {
        const rowNum = index + 2;
        
        if (!row['型号']) {
          errors.push(`第 ${rowNum} 行：缺少型号`);
          return;
        }
        if (!row['配置']) {
          errors.push(`第 ${rowNum} 行：缺少配置`);
          return;
        }
        if (!row['包装方式']) {
          errors.push(`第 ${rowNum} 行：缺少包装方式`);
          return;
        }
        if (!row['工序']) {
          errors.push(`第 ${rowNum} 行：缺少工序`);
          return;
        }
        if (!row['单价'] && row['单价'] !== 0) {
          errors.push(`第 ${rowNum} 行：缺少单价`);
          return;
        }
        
        const unitPrice = parseFloat(row['单价']);
        if (isNaN(unitPrice)) {
          errors.push(`第 ${rowNum} 行：单价必须是数字`);
          return;
        }
        
        processes.push({
          model_name: String(row['型号']).trim(),
          config_name: String(row['配置']).trim(),
          packaging_method: String(row['包装方式']).trim(),
          process_name: String(row['工序']).trim(),
          unit_price: unitPrice
        });
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

  /**
   * 解析包材 Excel
   * 期望列：型号、配置、包装方式、包材名称、基本用量、单价、纸箱体积
   */
  static async parsePackagingMaterialExcel(filePath) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const worksheet = workbook.worksheets[0];
      
      const data = [];
      const headers = [];
      
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          // 读取表头
          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            headers[colNumber] = cell.value;
          });
        } else {
          // 读取数据行
          const rowData = {};
          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            if (headers[colNumber]) {
              rowData[headers[colNumber]] = cell.value;
            }
          });
          // 只添加非空行
          if (Object.keys(rowData).length > 0) {
            data.push(rowData);
          }
        }
      });
      
      console.log('包材Excel数据行数:', data.length);
      if (data.length > 0) {
        console.log('第一行数据:', data[0]);
        console.log('列名:', Object.keys(data[0]));
      }
      
      const materials = [];
      const errors = [];
      
      data.forEach((row, index) => {
        const rowNum = index + 2;
        
        if (!row['型号']) {
          errors.push(`第 ${rowNum} 行：缺少型号`);
          return;
        }
        if (!row['配置']) {
          errors.push(`第 ${rowNum} 行：缺少配置`);
          return;
        }
        if (!row['包装方式']) {
          errors.push(`第 ${rowNum} 行：缺少包装方式`);
          return;
        }
        if (!row['包材名称']) {
          errors.push(`第 ${rowNum} 行：缺少包材名称`);
          return;
        }
        if (!row['基本用量'] && row['基本用量'] !== 0) {
          errors.push(`第 ${rowNum} 行：缺少基本用量`);
          return;
        }
        if (!row['单价'] && row['单价'] !== 0) {
          errors.push(`第 ${rowNum} 行：缺少单价`);
          return;
        }
        
        const basicUsage = parseFloat(row['基本用量']);
        const unitPrice = parseFloat(row['单价']);
        const cartonVolume = row['纸箱体积'] ? parseFloat(row['纸箱体积']) : null;
        
        if (isNaN(basicUsage)) {
          errors.push(`第 ${rowNum} 行：基本用量必须是数字`);
          return;
        }
        if (isNaN(unitPrice)) {
          errors.push(`第 ${rowNum} 行：单价必须是数字`);
          return;
        }
        if (cartonVolume !== null && isNaN(cartonVolume)) {
          errors.push(`第 ${rowNum} 行：纸箱体积必须是数字`);
          return;
        }
        
        materials.push({
          model_name: String(row['型号']).trim(),
          config_name: String(row['配置']).trim(),
          packaging_method: String(row['包装方式']).trim(),
          material_name: String(row['包材名称']).trim(),
          basic_usage: basicUsage,
          unit_price: unitPrice,
          carton_volume: cartonVolume
        });
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
}

module.exports = ExcelParser;
