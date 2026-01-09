/**
 * Excel 公共样式配置
 */

const quotationStyles = { // 报价单专用样式
    title: { font: { size: 18, bold: true }, alignment: { horizontal: 'center', vertical: 'middle' } },
    headerVal: { font: { size: 14, bold: true }, alignment: { horizontal: 'left', vertical: 'middle' } },
    sectionTitle: {
        font: { bold: true, size: 12 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F7FA' } },
        border: { top: { style: 'thin', color: { argb: 'FFEBEEF5' } }, bottom: { style: 'thin', color: { argb: 'FFEBEEF5' } } }
    },
    label: { font: { color: { argb: 'FF909399' } }, alignment: { horizontal: 'right', vertical: 'middle' } },
    value: { font: { bold: true }, alignment: { horizontal: 'left', vertical: 'middle', wrapText: true } },
    tableHeader: {
        font: { bold: true, color: { argb: 'FF606266' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F7FA' } },
        border: { top: { style: 'thin', color: { argb: 'FFEBEEF5' } }, bottom: { style: 'thin', color: { argb: 'FFEBEEF5' } }, left: { style: 'thin', color: { argb: 'FFEBEEF5' } }, right: { style: 'thin', color: { argb: 'FFEBEEF5' } } },
        alignment: { horizontal: 'center', vertical: 'middle' }
    },
    tableCell: {
        border: { top: { style: 'thin', color: { argb: 'FFEBEEF5' } }, bottom: { style: 'thin', color: { argb: 'FFEBEEF5' } }, left: { style: 'thin', color: { argb: 'FFEBEEF5' } }, right: { style: 'thin', color: { argb: 'FFEBEEF5' } } },
        alignment: { horizontal: 'center', vertical: 'middle' }
    }
};

module.exports = { quotationStyles };
