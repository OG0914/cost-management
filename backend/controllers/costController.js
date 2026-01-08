/**
 * 成本报价控制器 - 聚合入口
 * 功能已拆分到:
 * - quotationCrudController.js (报价单 CRUD)
 * - quotationWorkflowController.js (报价单工作流)
 * - costConfigController.js (成本配置查询)
 * 
 * 本文件保持向后兼容，重新导出所有函数
 */

const quotationCrudController = require('./cost/quotationCrudController');
const quotationWorkflowController = require('./cost/quotationWorkflowController');
const costConfigController = require('./cost/costConfigController');

// 报价单 CRUD
module.exports.createQuotation = quotationCrudController.createQuotation;
module.exports.updateQuotation = quotationCrudController.updateQuotation;
module.exports.deleteQuotation = quotationCrudController.deleteQuotation;
module.exports.getQuotationList = quotationCrudController.getQuotationList;
module.exports.getQuotationDetail = quotationCrudController.getQuotationDetail;

// 报价单工作流
module.exports.submitQuotation = quotationWorkflowController.submitQuotation;
module.exports.calculateQuotation = quotationWorkflowController.calculateQuotation;

// 成本配置查询
module.exports.getModelStandardData = costConfigController.getModelStandardData;
module.exports.getPackagingConfigs = costConfigController.getPackagingConfigs;
module.exports.getPackagingConfigDetails = costConfigController.getPackagingConfigDetails;
module.exports.getMaterialCoefficients = costConfigController.getMaterialCoefficients;
