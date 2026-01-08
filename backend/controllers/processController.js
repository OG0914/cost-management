/**
 * 工序管理控制器 - 聚合入口
 * 功能已拆分到:
 * - packagingConfigController.js (包装配置)
 * - processConfigController.js (工序配置)
 * - packagingMaterialController.js (包材)
 * - processExcelController.js (Excel导入导出)
 * 
 * 本文件保持向后兼容，重新导出所有函数
 */

const packagingConfigController = require('./process/packagingConfigController');
const processConfigController = require('./process/processConfigController');
const packagingMaterialController = require('./process/packagingMaterialController');
const processExcelController = require('./process/processExcelController');

// 包装配置
exports.getAllPackagingConfigs = packagingConfigController.getAllPackagingConfigs;
exports.getPackagingConfigsByModel = packagingConfigController.getPackagingConfigsByModel;
exports.getPackagingConfigDetail = packagingConfigController.getPackagingConfigDetail;
exports.getPackagingConfigFullDetail = packagingConfigController.getPackagingConfigFullDetail;
exports.createPackagingConfig = packagingConfigController.createPackagingConfig;
exports.updatePackagingConfig = packagingConfigController.updatePackagingConfig;
exports.deletePackagingConfig = packagingConfigController.deletePackagingConfig;
exports.getPackagingConfigsGrouped = packagingConfigController.getPackagingConfigsGrouped;
exports.getPackagingConfigsWithMaterialCount = packagingConfigController.getPackagingConfigsWithMaterialCount;

// 工序配置
exports.getProcessConfigs = processConfigController.getProcessConfigs;
exports.createProcessConfig = processConfigController.createProcessConfig;
exports.updateProcessConfig = processConfigController.updateProcessConfig;
exports.deleteProcessConfig = processConfigController.deleteProcessConfig;

// 包材
exports.getPackagingMaterials = packagingMaterialController.getPackagingMaterials;
exports.createPackagingMaterial = packagingMaterialController.createPackagingMaterial;
exports.updatePackagingMaterial = packagingMaterialController.updatePackagingMaterial;
exports.deletePackagingMaterial = packagingMaterialController.deletePackagingMaterial;

// Excel 导入导出
exports.importProcesses = processExcelController.importProcesses;
exports.exportProcesses = processExcelController.exportProcesses;
exports.downloadProcessTemplate = processExcelController.downloadProcessTemplate;
exports.importPackagingMaterials = processExcelController.importPackagingMaterials;
exports.exportPackagingMaterials = processExcelController.exportPackagingMaterials;
exports.downloadPackagingMaterialTemplate = processExcelController.downloadPackagingMaterialTemplate;
