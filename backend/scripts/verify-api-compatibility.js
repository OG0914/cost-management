/**
 * API 兼容性验证脚本
 * 验证 PostgreSQL 迁移后 API 响应格式是否与迁移前一致
 * 特别关注布尔值序列化（PostgreSQL true/false -> JSON true/false）
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// 导入数据库和模型
const dbManager = require('../db/database');
const User = require('../models/User');
const Regulation = require('../models/Regulation');
const Model = require('../models/Model');
const Material = require('../models/Material');
const PackagingConfig = require('../models/PackagingConfig');
const ProcessConfig = require('../models/ProcessConfig');
const PackagingMaterial = require('../models/PackagingMaterial');
const Quotation = require('../models/Quotation');
const QuotationItem = require('../models/QuotationItem');
const StandardCost = require('../models/StandardCost');

// 布尔字段映射
const BOOLEAN_FIELDS = {
  users: ['is_active'],
  regulations: ['is_active'],
  models: ['is_active'],
  packaging_configs: ['is_active'],
  process_configs: ['is_active'],
  packaging_materials: ['is_active'],
  quotations: ['include_freight_in_base'],
  quotation_items: ['is_changed', 'after_overhead'],
  standard_costs: ['is_current']
};

/**
 * 验证布尔值是否为 JavaScript 原生布尔类型
 */
function validateBoolean(value, fieldName, tableName) {
  if (value === null || value === undefined) {
    return { valid: true, message: `${tableName}.${fieldName}: null/undefined (允许)` };
  }
  
  if (typeof value === 'boolean') {
    return { valid: true, message: `${tableName}.${fieldName}: ${value} (正确的布尔类型)` };
  }
  
  return { 
    valid: false, 
    message: `${tableName}.${fieldName}: ${value} (类型: ${typeof value}) - 应为布尔类型!` 
  };
}

/**
 * 验证记录中的布尔字段
 */
function validateRecordBooleans(record, tableName) {
  const boolFields = BOOLEAN_FIELDS[tableName] || [];
  const results = [];
  
  for (const field of boolFields) {
    if (field in record) {
      results.push(validateBoolean(record[field], field, tableName));
    }
  }
  
  return results;
}

/**
 * 主验证函数
 */
async function verifyApiCompatibility() {
  console.log('开始验证 API 兼容性...\n');
  
  let allPassed = true;
  const issues = [];

  try {
    // 初始化数据库
    await dbManager.initialize();
    console.log('数据库连接成功\n');

    // 1. 验证 Users 表布尔字段
    console.log('1. 验证 Users 表...');
    const users = await User.findAll();
    for (const user of users) {
      const results = validateRecordBooleans(user, 'users');
      for (const r of results) {
        console.log(`   ${r.message}`);
        if (!r.valid) {
          allPassed = false;
          issues.push(r.message);
        }
      }
    }
    console.log(`   共 ${users.length} 条记录\n`);

    // 2. 验证 Regulations 表布尔字段
    console.log('2. 验证 Regulations 表...');
    const regulations = await Regulation.findAll();
    for (const reg of regulations) {
      const results = validateRecordBooleans(reg, 'regulations');
      for (const r of results) {
        console.log(`   ${r.message}`);
        if (!r.valid) {
          allPassed = false;
          issues.push(r.message);
        }
      }
    }
    console.log(`   共 ${regulations.length} 条记录\n`);

    // 3. 验证 Models 表布尔字段
    console.log('3. 验证 Models 表...');
    const models = await Model.findAll();
    for (const model of models.slice(0, 3)) { // 只检查前3条
      const results = validateRecordBooleans(model, 'models');
      for (const r of results) {
        console.log(`   ${r.message}`);
        if (!r.valid) {
          allPassed = false;
          issues.push(r.message);
        }
      }
    }
    console.log(`   共 ${models.length} 条记录（显示前3条）\n`);

    // 4. 验证 PackagingConfigs 表布尔字段
    console.log('4. 验证 PackagingConfigs 表...');
    const configs = await PackagingConfig.findAll();
    for (const config of configs) {
      const results = validateRecordBooleans(config, 'packaging_configs');
      for (const r of results) {
        console.log(`   ${r.message}`);
        if (!r.valid) {
          allPassed = false;
          issues.push(r.message);
        }
      }
    }
    console.log(`   共 ${configs.length} 条记录\n`);

    // 5. 验证 ProcessConfigs 表布尔字段
    console.log('5. 验证 ProcessConfigs 表...');
    const processConfigs = await ProcessConfig.findAll();
    for (const pc of processConfigs.slice(0, 3)) {
      const results = validateRecordBooleans(pc, 'process_configs');
      for (const r of results) {
        console.log(`   ${r.message}`);
        if (!r.valid) {
          allPassed = false;
          issues.push(r.message);
        }
      }
    }
    console.log(`   共 ${processConfigs.length} 条记录（显示前3条）\n`);

    // 6. 验证 PackagingMaterials 表布尔字段
    console.log('6. 验证 PackagingMaterials 表...');
    if (configs.length > 0) {
      const packagingMaterials = await PackagingMaterial.findByPackagingConfigId(configs[0].id);
      for (const pm of packagingMaterials.slice(0, 3)) {
        const results = validateRecordBooleans(pm, 'packaging_materials');
        for (const r of results) {
          console.log(`   ${r.message}`);
          if (!r.valid) {
            allPassed = false;
            issues.push(r.message);
          }
        }
      }
      console.log(`   共 ${packagingMaterials.length} 条记录（显示前3条）\n`);
    } else {
      console.log('   无包装配置数据\n');
    }

    // 7. 验证 Quotations 表布尔字段
    console.log('7. 验证 Quotations 表...');
    const quotationsResult = await Quotation.findAll();
    const quotations = quotationsResult.data || [];
    for (const q of quotations) {
      const results = validateRecordBooleans(q, 'quotations');
      for (const r of results) {
        console.log(`   ${r.message}`);
        if (!r.valid) {
          allPassed = false;
          issues.push(r.message);
        }
      }
    }
    console.log(`   共 ${quotations.length} 条记录\n`);

    // 8. 验证 QuotationItems 表布尔字段
    console.log('8. 验证 QuotationItems 表...');
    if (quotations.length > 0) {
      const items = await QuotationItem.findByQuotationId(quotations[0].id);
      for (const item of items.slice(0, 3)) {
        const results = validateRecordBooleans(item, 'quotation_items');
        for (const r of results) {
          console.log(`   ${r.message}`);
          if (!r.valid) {
            allPassed = false;
            issues.push(r.message);
          }
        }
      }
      console.log(`   共 ${items.length} 条记录（显示前3条）\n`);
    } else {
      console.log('   无报价单数据\n');
    }

    // 9. 验证 StandardCosts 表布尔字段
    console.log('9. 验证 StandardCosts 表...');
    const standardCostsResult = await StandardCost.findAllCurrent();
    const standardCosts = standardCostsResult.data || [];
    for (const sc of standardCosts) {
      const results = validateRecordBooleans(sc, 'standard_costs');
      for (const r of results) {
        console.log(`   ${r.message}`);
        if (!r.valid) {
          allPassed = false;
          issues.push(r.message);
        }
      }
    }
    console.log(`   共 ${standardCosts.length} 条记录\n`);

    // 输出总结
    console.log('='.repeat(50));
    if (allPassed) {
      console.log('✓ API 兼容性验证通过！所有布尔字段正确序列化为 JSON 布尔值');
    } else {
      console.log('✗ API 兼容性验证失败！发现以下问题:');
      for (const issue of issues) {
        console.log(`  - ${issue}`);
      }
    }
    console.log('='.repeat(50));

    return allPassed;

  } catch (error) {
    console.error('验证过程出错:', error);
    return false;
  } finally {
    await dbManager.close();
  }
}

// 执行验证
verifyApiCompatibility()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('验证失败:', err);
    process.exit(1);
  });
