/**
 * 成本报价控制器 - 入口文件
 * 
 * 已拆分到 ./cost/ 目录下的子模块：
 * - quotationCrudController.js    (创建/更新/删除/列表/详情)
 * - quotationWorkflowController.js (提交/计算)
 * - costConfigController.js        (配置查询)
 * - quotationExportController.js   (导出Excel)
 * - utils/quotationHelper.js       (公共工具函数)
 * 
 * 重构日期: 2026-02-06
 * 重构说明: 将994行代码拆分为模块化结构，提高可维护性
 */

module.exports = require('./cost');
