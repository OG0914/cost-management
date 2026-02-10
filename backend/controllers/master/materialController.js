/**
 * 原料控制器 - 入口文件
 * 聚合导出所有原料相关方法
 */

const crud = require('./materialCrudController');
const query = require('./materialQueryController');
const importExport = require('./materialImportController');

module.exports = {
  // CRUD操作
  getAllMaterials: crud.getAllMaterials,
  createMaterial: crud.createMaterial,
  updateMaterial: crud.updateMaterial,
  deleteMaterial: crud.deleteMaterial,
  batchDeleteMaterials: crud.batchDeleteMaterials,

  // 查询方法
  getMaterialsByIds: query.getMaterialsByIds,
  getMaterialsByManufacturer: query.getMaterialsByManufacturer,
  getMaterialById: query.getMaterialById,
  getCategories: query.getCategories,
  getCategoryStructure: query.getCategoryStructure,
  checkOrCreate: query.checkOrCreate,

  // 导入导出
  importMaterials: importExport.importMaterials,
  preCheckImport: importExport.preCheckImport,
  confirmImport: importExport.confirmImport,
  exportMaterials: importExport.exportMaterials,
  downloadTemplate: importExport.downloadTemplate
};
