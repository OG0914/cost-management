/**
 * 报价单导出控制器
 * 处理报价单 Excel 导出功能
 */

const Quotation = require('../../models/Quotation');
const QuotationItem = require('../../models/QuotationItem');
const QuotationCustomFee = require('../../models/QuotationCustomFee');
const SystemConfig = require('../../models/SystemConfig');
const CostCalculator = require('../../utils/costCalculator');
const ExcelGenerator = require('../../utils/excel');
const { success, error } = require('../../utils/response');
const logger = require('../../utils/logger');

/**
 * 导出报价单 Excel
 * POST /api/cost/quotations/:id/export
 */
const exportQuotation = async (req, res) => {
    try {
        const { id } = req.params;

        // 查询报价单
        const quotation = await Quotation.findById(id);
        if (!quotation) {
            return res.status(404).json(error('报价单不存在', 404));
        }

        // 检查权限
        const StandardCost = require('../../models/StandardCost');
        const isStandardCost = await StandardCost.findByQuotationId(quotation.id);

        if (
            quotation.created_by !== req.user.id &&
            !['admin', 'reviewer', 'readonly'].includes(req.user.role) &&
            !isStandardCost
        ) {
            return res.status(403).json(error('无权限导出此报价单', 403));
        }

        // 查询报价单明细
        const items = await QuotationItem.getGroupedByCategory(id);

        // 重新计算以获取利润区间
        const calculatorConfig = await SystemConfig.getCalculatorConfig();
        if (quotation.vat_rate !== null && quotation.vat_rate !== undefined) {
            calculatorConfig.vatRate = parseFloat(quotation.vat_rate);
        }

        const calculator = new CostCalculator(calculatorConfig);

        const materialTotal = items.material.items
            .filter(item => !item.after_overhead)
            .reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);

        const afterOverheadMaterialTotal = items.material.items
            .filter(item => item.after_overhead)
            .reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);

        const customFeesFromDb = await QuotationCustomFee.findByQuotationId(id);
        const customFees = customFeesFromDb.map(fee => ({
            name: fee.fee_name,
            rate: fee.fee_rate,
            sortOrder: fee.sort_order
        }));

        const calculation = calculator.calculateQuotation({
            materialTotal,
            processTotal: parseFloat(items.process.total || 0),
            packagingTotal: parseFloat(items.packaging.total || 0),
            freightTotal: parseFloat(quotation.freight_total || 0),
            quantity: parseFloat(quotation.quantity || 1),
            salesType: quotation.sales_type,
            includeFreightInBase: quotation.include_freight_in_base !== false,
            afterOverheadMaterialTotal,
            customFees
        });

        // 准备导出数据
        // 需要计算箱数和CBM
        if (quotation.quantity && quotation.pc_per_bag && quotation.bags_per_box && quotation.boxes_per_carton) {
            const pcsPerCarton = quotation.pc_per_bag * quotation.bags_per_box * quotation.boxes_per_carton;
            if (pcsPerCarton > 0) {
                calculation.shipping = calculation.shipping || {};
                calculation.shipping.cartons = Math.ceil(quotation.quantity / pcsPerCarton);

                const cartonMaterial = items.packaging.items.find(item => item.carton_volume && item.carton_volume > 0);
                if (cartonMaterial && cartonMaterial.carton_volume > 0) {
                    const totalVolume = cartonMaterial.carton_volume * calculation.shipping.cartons;
                    calculation.shipping.cbm = (totalVolume / 35.32).toFixed(1); // 材积转换
                }
            }
        }

        // 生成Excel
        const workbook = await ExcelGenerator.generateQuotationExcel({
            quotation,
            items,
            calculation,
            processCoefficient: calculatorConfig.processCoefficient || 1.56
        });

        // 设置响应头
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Quot_${quotation.quotation_no}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        logger.error('导出报价单失败:', err.message);
        res.status(500).json(error('导出报价单失败: ' + err.message, 500));
    }
};

module.exports = {
    exportQuotation
};
