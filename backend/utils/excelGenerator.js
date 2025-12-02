/**
 * Excel 生成工具
 */

const ExcelJS = require('exceljs');

class ExcelGenerator {
  /**
   * 生成原料 Excel
   */
  static async generateMaterialExcel(materials) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('原料清单');
    
    worksheet.columns = [
      { header: '品号', key: 'item_no', width: 15 },
      { header: '原料名称', key: 'name', width: 20 },
      { header: '单位', key: 'unit', width: 10 },
      { header: '单价', key: 'price', width: 12 },
      { header: '币别', key: 'currency', width: 10 },
      { header: '更新时间', key: 'updated_at', width: 20 }
    ];
    
    materials.forEach(m => {
      worksheet.addRow({
        item_no: m.item_no,
        name: m.name,
        unit: m.unit,
        price: m.price,
        currency: m.currency,
        updated_at: m.updated_at
      });
    });
    
    return workbook;
  }

  /**
   * 生成型号 Excel
   */
  static async generateModelExcel(models) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('型号清单');
    
    worksheet.columns = [
      { header: '法规类别', key: 'regulation_name', width: 20 },
      { header: '型号名称', key: 'model_name', width: 25 },
      { header: '备注', key: 'remark', width: 30 },
      { header: '状态', key: 'is_active', width: 10 },
      { header: '创建时间', key: 'created_at', width: 20 }
    ];
    
    models.forEach(m => {
      worksheet.addRow({
        regulation_name: m.regulation_name,
        model_name: m.model_name,
        remark: m.remark || '',
        is_active: m.is_active ? '激活' : '禁用',
        created_at: m.created_at
      });
    });
    
    return workbook;
  }

  /**
   * 生成工序 Excel
   * 列顺序：型号、配置、包装方式、工序、单价
   */
  static async generateProcessExcel(processes) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('工序清单');
    
    worksheet.columns = [
      { header: '型号', key: 'model_name', width: 15 },
      { header: '配置', key: 'config_name', width: 20 },
      { header: '包装方式', key: 'packaging_method', width: 40 },
      { header: '工序', key: 'process_name', width: 20 },
      { header: '单价', key: 'unit_price', width: 12 }
    ];
    
    processes.forEach(p => {
      worksheet.addRow({
        model_name: p.model_name,
        config_name: p.config_name,
        packaging_method: p.packaging_method,
        process_name: p.process_name,
        unit_price: p.unit_price
      });
    });
    
    return workbook;
  }

  /**
   * 生成包材 Excel
   * 列顺序：型号、配置、包装方式、包材名称、基本用量、单价、纸箱体积
   */
  static async generatePackagingMaterialExcel(materials) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('包材清单');
    
    worksheet.columns = [
      { header: '型号', key: 'model_name', width: 15 },
      { header: '配置', key: 'config_name', width: 20 },
      { header: '包装方式', key: 'packaging_method', width: 40 },
      { header: '包材名称', key: 'material_name', width: 20 },
      { header: '基本用量', key: 'basic_usage', width: 12 },
      { header: '单价', key: 'unit_price', width: 12 },
      { header: '纸箱体积', key: 'carton_volume', width: 12 }
    ];
    
    materials.forEach(m => {
      worksheet.addRow({
        model_name: m.model_name,
        config_name: m.config_name,
        packaging_method: m.packaging_method,
        material_name: m.material_name,
        basic_usage: m.basic_usage,
        unit_price: m.unit_price,
        carton_volume: m.carton_volume || ''
      });
    });
    
    return workbook;
  }

  /**
   * 生成原料导入模板
   */
  static async generateMaterialTemplate() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('原料导入模板');
    
    worksheet.columns = [
      { header: '品号', key: 'item_no', width: 15 },
      { header: '原料名称', key: 'name', width: 20 },
      { header: '单位', key: 'unit', width: 10 },
      { header: '单价', key: 'price', width: 12 },
      { header: '币别', key: 'currency', width: 10 }
    ];
    
    worksheet.addRow({
      item_no: 'MAT001',
      name: '示例原料',
      unit: 'kg',
      price: 10.5,
      currency: 'CNY'
    });
    
    return workbook;
  }

  /**
   * 生成型号导入模板
   */
  static async generateModelTemplate() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('型号导入模板');
    
    worksheet.columns = [
      { header: '法规类别', key: 'regulation_name', width: 20 },
      { header: '型号名称', key: 'model_name', width: 25 },
      { header: '备注', key: 'remark', width: 30 }
    ];
    
    worksheet.addRow({
      regulation_name: 'CE',
      model_name: 'MODEL-001',
      remark: '示例型号'
    });
    
    return workbook;
  }

  /**
   * 生成工序导入模板
   * 列顺序：型号、配置、包装方式、工序、单价
   */
  static async generateProcessTemplate() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('工序导入模板');
    
    worksheet.columns = [
      { header: '型号', key: 'model_name', width: 15 },
      { header: '配置', key: 'config_name', width: 20 },
      { header: '包装方式', key: 'packaging_method', width: 40 },
      { header: '工序', key: 'process_name', width: 20 },
      { header: '单价', key: 'unit_price', width: 12 }
    ];
    
    worksheet.addRow({
      model_name: 'MODEL-001',
      config_name: '标准配置',
      packaging_method: '10pc/bag, 10bags/box, 24boxes/carton',
      process_name: '示例工序',
      unit_price: 5.0
    });
    
    return workbook;
  }

  /**
   * 生成包材导入模板
   * 列顺序：型号、配置、包装方式、包材名称、基本用量、单价、纸箱体积
   */
  static async generatePackagingMaterialTemplate() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('包材导入模板');
    
    worksheet.columns = [
      { header: '型号', key: 'model_name', width: 15 },
      { header: '配置', key: 'config_name', width: 20 },
      { header: '包装方式', key: 'packaging_method', width: 40 },
      { header: '包材名称', key: 'material_name', width: 20 },
      { header: '基本用量', key: 'basic_usage', width: 12 },
      { header: '单价', key: 'unit_price', width: 12 },
      { header: '纸箱体积', key: 'carton_volume', width: 12 }
    ];
    
    worksheet.addRow({
      model_name: 'MODEL-001',
      config_name: '标准配置',
      packaging_method: '10pc/bag, 10bags/box, 24boxes/carton',
      material_name: '示例包材',
      basic_usage: 100,
      unit_price: 10.5,
      carton_volume: 0.05
    });
    
    return workbook;
  }
}

module.exports = ExcelGenerator;
