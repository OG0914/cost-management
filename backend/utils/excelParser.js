/**
 * Excel 解析工具
 */

const ExcelJS = require('exceljs');
const { isValidPackagingType, PACKAGING_TYPES, VALID_PACKAGING_TYPE_KEYS } = require('../config/packagingTypes');
const logger = require('./logger');

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
   * 解析原料 Excel，支持三种格式：通用、半面罩类、非半面罩类
   */
  static async parseMaterialExcel(filePath) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const worksheet = workbook.worksheets[0];
      const data = [], headers = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) { row.eachCell({ includeEmpty: true }, (cell, colNumber) => { headers[colNumber] = cell.value; }); }
        else {
          const rowData = {};
          row.eachCell({ includeEmpty: true }, (cell, colNumber) => { if (headers[colNumber]) rowData[headers[colNumber]] = cell.value; });
          if (Object.keys(rowData).length > 0) data.push(rowData);
        }
      });

      const materials = [], errors = [];
      const getValue = (value) => (value && typeof value === 'object' && value.richText) ? value.richText.map(t => t.text).join('') : value; // 处理富文本
      const isHalfMaskFormat = headers.includes('产品描述') || headers.includes('供应商') || headers.includes('MOQ'); // 检测表头格式
      const isGeneralFormat = headers.includes('厂商') && headers.includes('原料品名') && !isHalfMaskFormat;

      data.forEach((row, index) => {
        const rowNum = index + 2;
        const itemNo = getValue(row['品号']) || getValue(row['item_no']);
        const name = getValue(row['原料名称']) || getValue(row['品名/规格']) || getValue(row['原料品名']) || getValue(row['name']);
        const unit = getValue(row['单位']) || getValue(row['unit']);
        const price = getValue(row['单价']) || getValue(row['单价RMB']) || getValue(row['price']);

        if (!itemNo) { errors.push(`第 ${rowNum} 行：缺少品号`); return; }
        if (!name) { errors.push(`第 ${rowNum} 行：缺少原料名称`); return; }
        if (!unit) { errors.push(`第 ${rowNum} 行：缺少单位`); return; }
        if (price === undefined && price !== 0) { errors.push(`第 ${rowNum} 行：缺少单价`); return; }

        const priceNum = parseFloat(price);
        if (isNaN(priceNum)) { errors.push(`第 ${rowNum} 行：单价必须是数字`); return; }

        const material = {
          item_no: String(itemNo).trim(), name: String(name).trim(), unit: String(unit).trim(), price: priceNum,
          category: String(getValue(row['类别']) || getValue(row['category']) || '').trim() || null,
          currency: String(getValue(row['币别']) || getValue(row['currency']) || 'CNY'),
          material_type: isHalfMaskFormat ? 'half_mask' : (String(getValue(row['原料类型']) || getValue(row['material_type']) || 'general').trim()),
          subcategory: String(getValue(row['子分类']) || getValue(row['subcategory']) || '').trim() || null,
          manufacturer: String(getValue(row['厂商']) || getValue(row['manufacturer']) || '').trim() || null, // 非半面罩类使用
          supplier: String(getValue(row['供应商']) || getValue(row['supplier']) || '').trim() || null, // 半面罩类使用
          product_desc: String(getValue(row['产品描述']) || getValue(row['product_desc']) || '').trim() || null,
          packaging_mode: String(getValue(row['包装方式']) || getValue(row['packaging_mode']) || '').trim() || null,
          usage_amount: parseFloat(getValue(row['用量']) || getValue(row['usage_amount'])) || null,
          production_date: getValue(row['生产日期']) || getValue(row['production_date']) || null,
          moq: parseInt(getValue(row['MOQ']) || getValue(row['moq'])) || null,
          remark: String(getValue(row['备注']) || getValue(row['remark']) || '').trim() || null
        };
        materials.push(material);
      });

      return { success: errors.length === 0, data: materials, errors, total: data.length, valid: materials.length };
    } catch (error) {
      return { success: false, data: [], errors: [error.message], total: 0, valid: 0 };
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
          model_category: String(getValue(row['型号分类']) || getValue(row['model_category']) || '').trim() || null,
          model_series: String(getValue(row['产品系列']) || getValue(row['model_series']) || '').trim() || null
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

      logger.debug('工序Excel数据行数:', data.length);
      if (data.length > 0) {
        logger.debug('第一行数据:', data[0]);
        logger.debug('列名:', Object.keys(data[0]));
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

      logger.debug('包材Excel数据行数:', data.length);
      if (data.length > 0) {
        logger.debug('第一行数据:', data[0]);
        logger.debug('列名:', Object.keys(data[0]));
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

        const crypto = require('crypto');
        const providedPassword = getValue(row['密码']) || getValue(row['password']);
        const password = providedPassword ? String(providedPassword).trim() : crypto.randomBytes(8).toString('base64').slice(0, 12); // 随机12位密码

        users.push({
          username: String(getValue(row['用户代号']) || getValue(row['username']) || '').trim(),
          real_name: String(getValue(row['真实姓名']) || getValue(row['real_name']) || '').trim() || null,
          role,
          email: String(getValue(row['邮箱']) || getValue(row['email']) || '').trim() || null,
          password,
          isRandomPassword: !providedPassword // 标记是否为随机密码，用于提示用户
        });
      });

      return { success: errors.length === 0, data: users, errors, total: data.length, valid: users.length };
    } catch (error) {
      return { success: false, data: [], errors: [error.message], total: 0, valid: 0 };
    }
  }
}

module.exports = ExcelParser;
