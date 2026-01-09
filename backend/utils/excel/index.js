/**
 * Excel 生成工具 - 统一入口
 * 整合各模块导出方法，保持向后兼容
 */

const { generateMaterialExcel, generateMaterialTemplate } = require('./materialExcel');
const { generateModelExcel, generateModelTemplate } = require('./modelExcel');
const { generateProcessExcel, generateProcessTemplate } = require('./processExcel');
const { generatePackagingMaterialExcel, generatePackagingMaterialTemplate } = require('./packagingExcel');
const { generateUserExcel, generateUserTemplate } = require('./userExcel');
const { generateQuotationExcel } = require('./quotationExcel');

class ExcelGenerator { // 兼容旧 API，静态方法封装
    static generateMaterialExcel = generateMaterialExcel;
    static generateMaterialTemplate = generateMaterialTemplate;
    static generateModelExcel = generateModelExcel;
    static generateModelTemplate = generateModelTemplate;
    static generateProcessExcel = generateProcessExcel;
    static generateProcessTemplate = generateProcessTemplate;
    static generatePackagingMaterialExcel = generatePackagingMaterialExcel;
    static generatePackagingMaterialTemplate = generatePackagingMaterialTemplate;
    static generateUserExcel = generateUserExcel;
    static generateUserTemplate = generateUserTemplate;
    static generateQuotationExcel = generateQuotationExcel;
}

module.exports = ExcelGenerator;
