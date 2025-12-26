/**
 * Excel 解析工具
 */

const ExcelJS = require('exceljs');
const { isValidPackagingType, PACKAGING_TYPES, VALID_PACKAGING_TYPE_KEYS } = require('../config/packagingTypes');

// 包装类型中文名称到 key 的映射
const PACKAGING_TYPE_NAME_TO_KEY = {
  '标准彩盒': 'standard_box',
  '无彩盒': 'no_box',
  '泡壳直装': 'blister_direct',
  '泡壳袋装': 'blister_bag'
};

/**
 * 解析包装类型（支持中文名称和英文 key）
 * @param {string} value - 包装类型值
 * @returns {string|null} 包装类型 key 或 null
 */
function parsePackagingType(value) {
  if (!value) return 'standard_box'; // 默认值
  
  const trimmed = String(value).trim();
  
  // 如果是有效的 key，直接返回
  if (isValidPackagingType(trimmed)) {
    return trimmed;
  }
  
  // 尝试从中文名称映射
  if (PACKAGING_TYPE_NAME_TO_KEY[trimmed]) {
    return PACKAGING_TYPE_NAME_TO_KEY[trimmed];
  }
  
  return null; // 无效值
}

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
   * 期望列：法规类别、型号名称、型号分类
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
          model_category: String(getValue(row['型号分类']) || getValue(row['model_category']) || '').trim() || null
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
   * 期望列：型号、配置、包装类型、包装方式、工序、单价
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
        
        // 解析包装类型（支持中文名称和英文 key）
        const packagingTypeValue = row['包装类型'];
        const packagingType = parsePackagingType(packagingTypeValue);
        
        if (packagingTypeValue && packagingType === null) {
          errors.push(`第 ${rowNum} 行：无效的包装类型 "${packagingTypeValue}"。有效值：标准彩盒、无彩盒、泡壳直装、泡壳袋装`);
          return;
        }
        
        processes.push({
          model_name: String(row['型号']).trim(),
          config_name: String(row['配置']).trim(),
          packaging_type: packagingType || 'standard_box',
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
   * 期望列：型号、配置、包装类型、包装方式、包材名称、基本用量、单价、纸箱体积
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
        
        // 解析包装类型（支持中文名称和英文 key）
        const packagingTypeValue = row['包装类型'];
        const packagingType = parsePackagingType(packagingTypeValue);
        
        if (packagingTypeValue && packagingType === null) {
          errors.push(`第 ${rowNum} 行：无效的包装类型 "${packagingTypeValue}"。有效值：标准彩盒、无彩盒、泡壳直装、泡壳袋装`);
          return;
        }
        
        materials.push({
          model_name: String(row['型号']).trim(),
          config_name: String(row['配置']).trim(),
          packaging_type: packagingType || 'standard_box',
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

  /** 解析用户 Excel，期望列：用户代号、真实姓名、角色、邮箱、密码 */
  static async parseUserExcel(filePath) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const worksheet = workbook.worksheets[0];
      
      const data = [], headers = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          row.eachCell({ includeEmpty: true }, (cell, colNumber) => { headers[colNumber] = cell.value; });
        } else {
          const rowData = {};
          row.eachCell({ includeEmpty: true }, (cell, colNumber) => { if (headers[colNumber]) rowData[headers[colNumber]] = cell.value; });
          if (Object.keys(rowData).length > 0) data.push(rowData);
        }
      });
      
      const users = [], errors = [];
      const validRoles = ['admin', 'purchaser', 'producer', 'reviewer', 'salesperson', 'readonly'];
      const roleMap = { '管理员': 'admin', '采购': 'purchaser', '生产': 'producer', '审核': 'reviewer', '业务': 'salesperson', '只读': 'readonly' };
      const getValue = (value) => (value && typeof value === 'object' && value.richText) ? value.richText.map(t => t.text).join('') : value;
      
      data.forEach((row, index) => {
        const rowNum = index + 2;
        if (!row['用户代号'] && !row['username']) { errors.push(`第 ${rowNum} 行：缺少用户代号`); return; }
        if (!row['角色'] && !row['role']) { errors.push(`第 ${rowNum} 行：缺少角色`); return; }
        
        let role = String(getValue(row['角色']) || getValue(row['role']) || '').trim();
        if (roleMap[role]) role = roleMap[role];
        if (!validRoles.includes(role)) { errors.push(`第 ${rowNum} 行：无效角色 "${role}"`); return; }
        
        users.push({
          username: String(getValue(row['用户代号']) || getValue(row['username']) || '').trim(),
          real_name: String(getValue(row['真实姓名']) || getValue(row['real_name']) || '').trim() || null,
          role,
          email: String(getValue(row['邮箱']) || getValue(row['email']) || '').trim() || null,
          password: String(getValue(row['密码']) || getValue(row['password']) || '123456').trim()
        });
      });
      
      return { success: errors.length === 0, data: users, errors, total: data.length, valid: users.length };
    } catch (error) {
      return { success: false, data: [], errors: [error.message], total: 0, valid: 0 };
    }
  }
}

module.exports = ExcelParser;
