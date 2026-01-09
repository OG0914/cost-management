/**
 * 报价单 Excel 导出 - 拆分自 excelGenerator，内部重构为多个辅助函数
 */

const ExcelJS = require('exceljs');
const { quotationStyles } = require('./excelStyles');

// ========== 辅助函数 ==========

function renderHeader(worksheet, quotation, styles) { // 渲染标题区
    worksheet.mergeCells('A1:B1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = '报价单';
    titleCell.font = styles.title.font;
    titleCell.alignment = styles.title.alignment;

    worksheet.mergeCells('C1:E1');
    const noCell = worksheet.getCell('C1');
    noCell.value = quotation.quotation_no;
    noCell.font = styles.headerVal.font;
    noCell.alignment = styles.headerVal.alignment;
    worksheet.getRow(1).height = 40;
    worksheet.addRow([]);
}

function renderBasicInfo(worksheet, quotation, styles) { // 渲染基本信息
    const header = worksheet.addRow(['▌基本信息']);
    header.font = styles.sectionTitle.font;
    worksheet.mergeCells(`A${header.number}:F${header.number}`);
    header.height = 30;
    header.getCell(1).alignment = { vertical: 'middle' };

    const data = [
        ['客户名称', quotation.customer_name, '客户地区', quotation.customer_region, '型号', quotation.model_name],
        ['包装配置', quotation.packaging_config_name, '业务员', quotation.creator_name, '审核日期', quotation.updated_at ? new Date(quotation.updated_at).toLocaleDateString() : '-']
    ];
    data.forEach(rowData => {
        const r = worksheet.addRow(rowData);
        r.height = 24;
        [1, 3, 5].forEach(c => { r.getCell(c).font = styles.label.font; r.getCell(c).alignment = styles.label.alignment; });
        [2, 4, 6].forEach(c => { r.getCell(c).font = styles.value.font; r.getCell(c).alignment = styles.value.alignment; });
    });
    worksheet.addRow([]);
}

function renderShippingInfo(worksheet, quotation, calculation, styles) { // 渲染运费信息
    const header = worksheet.addRow(['▌运费信息']);
    header.font = styles.sectionTitle.font;
    worksheet.mergeCells(`A${header.number}:F${header.number}`);
    header.height = 30;
    header.getCell(1).alignment = { vertical: 'middle' };

    const data = [
        ['销售类型', quotation.sales_type === 'export' ? '外销 (USD)' : '内销 (CNY)', '汇率', calculation?.exchangeRate || '-', '订购数量', quotation.quantity],
        ['货柜类型', quotation.shipping_method || '-', '装柜数量', calculation?.shipping?.cartons ? `${calculation.shipping.cartons} 箱` : '-', '总体积', calculation?.shipping?.cbm ? `${calculation.shipping.cbm} CBM` : '-'],
        ['运费总价', quotation.freight_total || '-', '单只运费', quotation.freight_per_unit || '-', '计入成本', quotation.include_freight_in_base ? '是' : '否']
    ];
    data.forEach(rowData => {
        const r = worksheet.addRow(rowData);
        r.height = 24;
        [1, 3, 5].forEach(c => { r.getCell(c).font = styles.label.font; r.getCell(c).alignment = styles.label.alignment; });
        [2, 4, 6].forEach(c => { r.getCell(c).font = styles.value.font; r.getCell(c).alignment = styles.value.alignment; });
    });
    worksheet.addRow([]);
}

function renderMaterialTable(worksheet, materialItems, styles) { // 渲染原料表
    const header = worksheet.addRow(['▌原料成本明细']);
    header.font = styles.sectionTitle.font;
    worksheet.mergeCells(`A${header.number}:F${header.number}`);
    header.height = 30;
    header.getCell(1).alignment = { vertical: 'middle' };

    const tHead = worksheet.addRow(['品号', '原料名称', '单位', '用量', '单价(¥)', '小计(¥)']);
    tHead.height = 24;
    tHead.eachCell(c => c.style = styles.tableHeader);

    if (materialItems?.items) {
        materialItems.items.forEach(item => {
            const r = worksheet.addRow([item.item_no || '-', item.item_name, item.unit || '-', Number(item.usage_amount).toFixed(4), Number(item.unit_price).toFixed(4), Number(item.subtotal).toFixed(4)]);
            r.eachCell(c => c.style = styles.tableCell);
        });
        const rTotal = worksheet.addRow(['', '', '', '', '原料小计:', Number(materialItems.total).toFixed(4)]);
        rTotal.getCell(5).alignment = { horizontal: 'right' };
        rTotal.getCell(6).font = { bold: true, color: { argb: 'FF409EFF' } };
        rTotal.getCell(6).style = styles.tableCell;
    }
    worksheet.addRow([]);
}

function renderProcessTable(worksheet, processItems, processCoefficient, styles) { // 渲染工序表
    const header = worksheet.addRow(['▌工序成本明细']);
    header.font = styles.sectionTitle.font;
    worksheet.mergeCells(`A${header.number}:F${header.number}`);
    header.height = 30;
    header.getCell(1).alignment = { vertical: 'middle' };

    const tHead = worksheet.addRow(['工序名称', '', '', '', '单价(¥)', '小计(¥)']);
    tHead.height = 24;
    tHead.eachCell(c => c.style = styles.tableHeader);
    worksheet.mergeCells(`A${tHead.number}:D${tHead.number}`);

    if (processItems?.items) {
        processItems.items.forEach(item => {
            const r = worksheet.addRow([item.item_name, '', '', '', Number(item.unit_price).toFixed(4), Number(item.subtotal).toFixed(4)]);
            worksheet.mergeCells(`A${r.number}:D${r.number}`);
            r.eachCell(c => c.style = styles.tableCell);
        });
        const coefficient = processCoefficient || 1.56;
        const finalTotal = (Number(processItems.total) * coefficient).toFixed(4);
        const rTotal = worksheet.addRow(['', '', '', '', `工价系数(${coefficient}):`, finalTotal]);
        rTotal.getCell(5).alignment = { horizontal: 'right' };
        rTotal.getCell(5).font = { bold: true };
        rTotal.getCell(6).font = { bold: true, color: { argb: 'FF409EFF' } };
        rTotal.getCell(6).style = styles.tableCell;
    }
    worksheet.addRow([]);
}

function renderPackagingTable(worksheet, packagingItems, styles) { // 渲染包材表
    const header = worksheet.addRow(['▌包材成本明细']);
    header.font = styles.sectionTitle.font;
    worksheet.mergeCells(`A${header.number}:F${header.number}`);
    header.height = 30;
    header.getCell(1).alignment = { vertical: 'middle' };

    const tHead = worksheet.addRow(['包材名称', '', '用量', '单价(¥)', '外箱材积', '小计(¥)']);
    tHead.height = 24;
    tHead.eachCell(c => c.style = styles.tableHeader);
    worksheet.mergeCells(`A${tHead.number}:B${tHead.number}`);

    if (packagingItems?.items) {
        packagingItems.items.forEach(item => {
            const r = worksheet.addRow([item.item_name, '', Number(item.usage_amount).toFixed(4), Number(item.unit_price).toFixed(4), item.carton_volume ? Number(item.carton_volume).toFixed(4) : '-', Number(item.subtotal).toFixed(4)]);
            worksheet.mergeCells(`A${r.number}:B${r.number}`);
            r.eachCell(c => c.style = styles.tableCell);
        });
        const rTotal = worksheet.addRow(['', '', '', '', '包材小计:', Number(packagingItems.total).toFixed(4)]);
        rTotal.getCell(5).alignment = { horizontal: 'right' };
        rTotal.getCell(6).font = { bold: true, color: { argb: 'FF409EFF' } };
        rTotal.getCell(6).style = styles.tableCell;
    }
    worksheet.addRow([]);
}

function renderCostSummary(worksheet, quotation, styles) { // 渲染成本汇总
    const header = worksheet.addRow(['▌成本汇总']);
    header.font = styles.sectionTitle.font;
    worksheet.mergeCells(`A${header.number}:F${header.number}`);
    header.height = 30;
    header.getCell(1).alignment = { vertical: 'middle' };

    const rows = [
        ['基础成本价', Number(quotation.base_cost).toFixed(4) + ' CNY'],
        ['运费(每片)', Number(quotation.freight_per_unit || 0).toFixed(4) + ' CNY'],
        ['管销价', Number(quotation.overhead_price || 0).toFixed(4) + ' CNY'],
        ['最终成本价', Number(quotation.final_price || 0).toFixed(4) + ` ${quotation.currency}`]
    ];

    rows.forEach((item, index) => {
        const isFinal = index === 3;
        const r = worksheet.addRow(['', '', '', item[0], '', item[1]]);
        worksheet.mergeCells(`D${r.number}:E${r.number}`);
        const labelCell = r.getCell(4);
        labelCell.font = { color: { argb: 'FF606266' }, size: isFinal ? 12 : 11 };
        labelCell.alignment = { horizontal: 'right', vertical: 'middle' };
        const valCell = r.getCell(6);
        valCell.font = { bold: true, size: isFinal ? 14 : 12, color: { argb: isFinal ? 'FF409EFF' : 'FF303133' } };
        valCell.alignment = { horizontal: 'right', vertical: 'middle' };
        if (isFinal) {
            r.getCell(4).border = { bottom: { style: 'medium', color: { argb: 'FF409EFF' } } };
            r.getCell(6).border = { bottom: { style: 'medium', color: { argb: 'FF409EFF' } } };
        } else {
            r.getCell(4).border = { bottom: { style: 'thin', color: { argb: 'FFEBEEF5' } } };
            r.getCell(6).border = { bottom: { style: 'thin', color: { argb: 'FFEBEEF5' } } };
        }
        r.height = isFinal ? 30 : 24;
    });
    worksheet.addRow([]);
}

function renderProfitTiers(worksheet, quotation, calculation, styles) { // 渲染利润区间
    if (!calculation?.profitTiers) return;

    const header = worksheet.addRow(['▌利润区间']);
    header.font = styles.sectionTitle.font;
    worksheet.mergeCells(`A${header.number}:F${header.number}`);
    header.height = 30;
    header.getCell(1).alignment = { vertical: 'middle' };

    let tiers = [...(calculation.profitTiers || [])];
    if (quotation.custom_profit_tiers) {
        try { tiers = [...tiers, ...JSON.parse(quotation.custom_profit_tiers)]; } catch (e) { }
    }
    tiers.sort((a, b) => a.profitRate - b.profitRate);

    const pHead = worksheet.addRow(['利润率', '报价 (' + quotation.currency + ')', '利润额', '', '', '']);
    [1, 2, 3].forEach(c => pHead.getCell(c).style = styles.tableHeader);

    tiers.forEach(tier => {
        const pRate = (tier.profitRate * 100).toFixed(0) + '%';
        const profitVal = Number(tier.price) - Number(quotation.final_price);
        const r = worksheet.addRow([pRate, Number(tier.price).toFixed(4), profitVal.toFixed(4), '', '', '']);
        [1, 2, 3].forEach(c => r.getCell(c).style = styles.tableCell);
    });
}

// ========== 主函数 ==========

async function generateQuotationExcel(data) { // 生成报价单 Excel
    const { quotation, items, calculation, processCoefficient } = data;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('报价单');
    const styles = quotationStyles;

    worksheet.columns = [
        { key: 'A', width: 22 }, { key: 'B', width: 25 }, { key: 'C', width: 12 },
        { key: 'D', width: 15 }, { key: 'E', width: 15 }, { key: 'F', width: 20 }
    ];

    renderHeader(worksheet, quotation, styles);
    renderBasicInfo(worksheet, quotation, styles);
    renderShippingInfo(worksheet, quotation, calculation, styles);
    renderMaterialTable(worksheet, items.material, styles);
    renderProcessTable(worksheet, items.process, processCoefficient, styles);
    renderPackagingTable(worksheet, items.packaging, styles);
    renderCostSummary(worksheet, quotation, styles);
    renderProfitTiers(worksheet, quotation, calculation, styles);

    return workbook;
}

module.exports = { generateQuotationExcel };
