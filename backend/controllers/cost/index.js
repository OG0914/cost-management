/**
 * Cost 控制器模块索引
 * 汇总导出所有子控制器，供主控制器引用
 */

const crudController = require('./quotationCrudController');
const workflowController = require('./quotationWorkflowController');
const configController = require('./costConfigController');
const exportController = require('./quotationExportController');

module.exports = {
    // CRUD 操作
    createQuotation: crudController.createQuotation,
    updateQuotation: crudController.updateQuotation,
    deleteQuotation: crudController.deleteQuotation,
    getQuotationList: crudController.getQuotationList,
    getQuotationDetail: crudController.getQuotationDetail,

    // 工作流操作
    submitQuotation: workflowController.submitQuotation,
    calculateQuotation: workflowController.calculateQuotation,

    // 配置查询
    getModelStandardData: configController.getModelStandardData,
    getPackagingConfigs: configController.getPackagingConfigs,
    getPackagingConfigDetails: configController.getPackagingConfigDetails,
    getMaterialCoefficients: configController.getMaterialCoefficients,

    // 导出功能
    exportQuotation: exportController.exportQuotation
};
