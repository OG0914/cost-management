/**
 * 成本报价控制器
 * 处理报价单的创建、查询、更新、提交等操作
 */

const Quotation = require('../models/Quotation');
const QuotationItem = require('../models/QuotationItem');
const QuotationCustomFee = require('../models/QuotationCustomFee');
const SystemConfig = require('../models/SystemConfig');
const Model = require('../models/Model');
const CostCalculator = require('../utils/costCalculator');
const { success, error, paginated } = require('../utils/response');
const dbManager = require('../db/database');

/**
 * 创建报价单
 * POST /api/cost/quotations
 */
const createQuotation = async (req, res) => {
    try {
        const {
            customer_name,
            customer_region,
            model_id,
            regulation_id,
            quantity,
            freight_total,
            sales_type,
            shipping_method,
            port,
            items // 报价单明细数组
        } = req.body;

        // 数据验证
        if (!customer_name || !customer_region || !model_id || !regulation_id || !quantity || !sales_type) {
            return res.status(400).json(error('缺少必填字段', 400));
        }

        if (!['domestic', 'export'].includes(sales_type)) {
            return res.status(400).json(error('销售类型必须是 domestic 或 export', 400));
        }

        if (quantity <= 0) {
            return res.status(400).json(error('数量必须大于0', 400));
        }

        // 获取原料系数
        let materialCoefficient = 1;
        const model = Model.findById(model_id);
        if (model && model.model_category) {
            const coefficients = SystemConfig.getValue('material_coefficients') || {};
            materialCoefficient = CostCalculator.getMaterialCoefficient(model.model_category, coefficients);
        }

        // 计算运费成本
        const freight_per_unit = freight_total / quantity;

        // 计算明细总计（应用原料系数）
        // 原料总计：不包含管销后算的原料
        const materialTotal = items
            .filter(item => item.category === 'material' && !item.after_overhead)
            .reduce((sum, item) => {
                // 如果前端已经传递了应用系数后的subtotal，直接使用
                if (item.coefficient_applied) {
                    return sum + item.subtotal;
                }
                // 使用原料系数重新计算小计
                const subtotal = CostCalculator.calculateMaterialSubtotal(
                    item.usage_amount || 0,
                    item.unit_price || 0,
                    materialCoefficient
                );
                return sum + subtotal;
            }, 0);

        // 管销后算的原料总计
        const afterOverheadMaterialTotal = items
            .filter(item => item.category === 'material' && item.after_overhead)
            .reduce((sum, item) => {
                if (item.coefficient_applied) {
                    return sum + item.subtotal;
                }
                const subtotal = CostCalculator.calculateMaterialSubtotal(
                    item.usage_amount || 0,
                    item.unit_price || 0,
                    materialCoefficient
                );
                return sum + subtotal;
            }, 0);

        const processTotal = items
            .filter(item => item.category === 'process')
            .reduce((sum, item) => sum + item.subtotal, 0);

        const packagingTotal = items
            .filter(item => item.category === 'packaging')
            .reduce((sum, item) => sum + item.subtotal, 0);

        // 获取系统配置并计算报价
        const calculatorConfig = SystemConfig.getCalculatorConfig();
        
        // 如果请求中包含 vat_rate，验证并覆盖全局配置
        let vatRateToSave = null;
        if (req.body.vat_rate !== undefined && req.body.vat_rate !== null) {
            const vatRate = parseFloat(req.body.vat_rate);
            if (isNaN(vatRate) || vatRate < 0 || vatRate > 1) {
                return res.status(400).json(error('增值税率必须在 0 到 1 之间', 400));
            }
            calculatorConfig.vatRate = vatRate;
            vatRateToSave = vatRate;
        }
        
        const calculator = new CostCalculator(calculatorConfig);

        // 处理自定义费用
        const customFees = req.body.custom_fees || [];

        const calculation = calculator.calculateQuotation({
            materialTotal,
            processTotal,
            packagingTotal,
            freightTotal: freight_total,
            quantity,
            salesType: sales_type,
            includeFreightInBase: req.body.include_freight_in_base !== false,
            afterOverheadMaterialTotal,
            customFees
        });
        
        // 在计算结果中包含实际使用的增值税率
        calculation.vatRate = calculatorConfig.vatRate;

        // 生成报价单编号
        const quotation_no = Quotation.generateQuotationNo();

        // 确定最终成本价（不含利润）
        // 内销：domesticPrice（含13%增值税）
        // 外销：insurancePrice（保险价，即管销价/汇率×1.003）
        const final_price = sales_type === 'domestic' 
            ? calculation.domesticPrice 
            : calculation.insurancePrice;

        // 处理自定义利润档位
        let customProfitTiersJson = null;
        if (req.body.custom_profit_tiers && Array.isArray(req.body.custom_profit_tiers) && req.body.custom_profit_tiers.length > 0) {
            customProfitTiersJson = JSON.stringify(req.body.custom_profit_tiers);
        }

        // 创建报价单
        const quotationId = Quotation.create({
            quotation_no,
            customer_name,
            customer_region,
            model_id,
            regulation_id,
            packaging_config_id: req.body.packaging_config_id || null,
            quantity,
            freight_total,
            freight_per_unit,
            sales_type,
            shipping_method: shipping_method || null,
            port: port || null,
            base_cost: calculation.baseCost,
            overhead_price: calculation.overheadPrice,
            final_price,
            currency: calculation.currency,
            include_freight_in_base: req.body.include_freight_in_base !== false,
            custom_profit_tiers: customProfitTiersJson,
            vat_rate: vatRateToSave,
            status: 'draft',
            created_by: req.user.id
        });

        // 批量创建报价单明细
        if (items && items.length > 0) {
            const itemsWithQuotationId = items.map(item => ({
                ...item,
                quotation_id: quotationId
            }));
            QuotationItem.batchCreate(itemsWithQuotationId);
        }

        // 保存自定义费用
        if (customFees && customFees.length > 0) {
            QuotationCustomFee.replaceByQuotationId(quotationId, customFees);
        }

        // 查询完整的报价单信息
        const quotation = Quotation.findById(quotationId);

        res.status(201).json(success({
            quotation,
            calculation
        }, '报价单创建成功'));

    } catch (err) {
        console.error('创建报价单失败:', err);
        res.status(500).json(error('创建报价单失败: ' + err.message, 500));
    }
};

/**
 * 获取型号标准数据
 * GET /api/cost/models/:modelId/standard-data
 * 注意：原料不绑定型号，只返回工序和包材数据
 */
const getModelStandardData = async (req, res) => {
    try {
        const { modelId } = req.params;
        console.log('获取型号标准数据，modelId:', modelId);
        
        const db = dbManager.getDatabase();

        // 获取工序数据
        const processesStmt = db.prepare(`
      SELECT id, name, price
      FROM processes
      WHERE model_id = ?
      ORDER BY id
    `);
        const processes = processesStmt.all(modelId);
        console.log(`找到 ${processes.length} 个工序`);

        // 获取包材数据
        const packagingStmt = db.prepare(`
      SELECT id, name, usage_amount, price, currency
      FROM packaging
      WHERE model_id = ?
      ORDER BY id
    `);
        const packaging = packagingStmt.all(modelId);
        console.log(`找到 ${packaging.length} 个包材`);

        res.json(success({
            processes,
            packaging
        }, '获取型号标准数据成功'));

    } catch (err) {
        console.error('获取型号标准数据失败:', err);
        res.status(500).json(error('获取型号标准数据失败: ' + err.message, 500));
    }
};

/**
 * 计算报价（不保存）
 * POST /api/cost/calculate
 */
const calculateQuotation = async (req, res) => {
    try {
        const {
            quantity,
            freight_total,
            sales_type,
            items,
            model_id
        } = req.body;

        // 数据验证
        if (!quantity || !sales_type || !items) {
            return res.status(400).json(error('缺少必填字段', 400));
        }

        // 获取原料系数
        let materialCoefficient = 1;
        if (model_id) {
            const model = Model.findById(model_id);
            if (model && model.model_category) {
                const coefficients = SystemConfig.getValue('material_coefficients') || {};
                materialCoefficient = CostCalculator.getMaterialCoefficient(model.model_category, coefficients);
            }
        }

        // 计算明细总计
        // 原料总计：不包含管销后算的原料，应用原料系数
        const materialTotal = items
            .filter(item => item.category === 'material' && !item.after_overhead)
            .reduce((sum, item) => {
                // 如果前端已经传递了应用系数后的subtotal，直接使用
                // 否则重新计算（兼容旧版本）
                if (item.coefficient_applied) {
                    return sum + item.subtotal;
                }
                // 使用原料系数重新计算小计
                const subtotal = CostCalculator.calculateMaterialSubtotal(
                    item.usage_amount || 0,
                    item.unit_price || 0,
                    materialCoefficient
                );
                return sum + subtotal;
            }, 0);

        // 管销后算的原料总计（同样应用原料系数）
        const afterOverheadMaterialTotal = items
            .filter(item => item.category === 'material' && item.after_overhead)
            .reduce((sum, item) => {
                if (item.coefficient_applied) {
                    return sum + item.subtotal;
                }
                const subtotal = CostCalculator.calculateMaterialSubtotal(
                    item.usage_amount || 0,
                    item.unit_price || 0,
                    materialCoefficient
                );
                return sum + subtotal;
            }, 0);

        const processTotal = items
            .filter(item => item.category === 'process')
            .reduce((sum, item) => sum + item.subtotal, 0);

        const packagingTotal = items
            .filter(item => item.category === 'packaging')
            .reduce((sum, item) => sum + item.subtotal, 0);

        // 获取系统配置并计算报价
        const calculatorConfig = SystemConfig.getCalculatorConfig();
        
        // 如果请求中包含 vat_rate，验证并覆盖全局配置
        if (req.body.vat_rate !== undefined && req.body.vat_rate !== null) {
            const vatRate = parseFloat(req.body.vat_rate);
            if (!isNaN(vatRate) && vatRate >= 0 && vatRate <= 1) {
                calculatorConfig.vatRate = vatRate;
            }
        }
        
        const calculator = new CostCalculator(calculatorConfig);

        // 处理自定义费用
        const customFees = req.body.custom_fees || [];

        const calculation = calculator.calculateQuotation({
            materialTotal,
            processTotal,
            packagingTotal,
            freightTotal: freight_total || 0,
            quantity,
            salesType: sales_type,
            includeFreightInBase: req.body.include_freight_in_base !== false,
            afterOverheadMaterialTotal,
            customFees
        });

        // 返回结果中包含原料系数信息和实际使用的增值税率
        calculation.materialCoefficient = materialCoefficient;
        calculation.vatRate = calculatorConfig.vatRate;

        res.json(success(calculation, '计算成功'));

    } catch (err) {
        console.error('计算报价失败:', err);
        res.status(500).json(error('计算报价失败: ' + err.message, 500));
    }
};

/**
 * 更新报价单
 * PUT /api/cost/quotations/:id
 */
const updateQuotation = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            customer_name,
            customer_region,
            quantity,
            freight_total,
            sales_type,
            shipping_method,
            port,
            items
        } = req.body;

        // 检查报价单是否存在
        const quotation = Quotation.findById(id);
        if (!quotation) {
            return res.status(404).json(error('报价单不存在', 404));
        }

        // 检查权限：创建者、管理员、审核人可以编辑
        if (quotation.created_by !== req.user.id && !['admin', 'reviewer'].includes(req.user.role)) {
            return res.status(403).json(error('无权限编辑此报价单', 403));
        }

        // 检查状态：只有草稿和已退回状态可以编辑
        if (!['draft', 'rejected'].includes(quotation.status)) {
            return res.status(400).json(error('当前状态不允许编辑', 400));
        }

        // 获取原料系数（使用报价单关联的型号）
        let materialCoefficient = 1;
        const model = Model.findById(quotation.model_id);
        if (model && model.model_category) {
            const coefficients = SystemConfig.getValue('material_coefficients') || {};
            materialCoefficient = CostCalculator.getMaterialCoefficient(model.model_category, coefficients);
        }

        // 计算运费成本
        const freight_per_unit = freight_total / quantity;

        // 计算明细总计（应用原料系数）
        // 原料总计：不包含管销后算的原料
        const materialTotal = items
            .filter(item => item.category === 'material' && !item.after_overhead)
            .reduce((sum, item) => {
                if (item.coefficient_applied) {
                    return sum + item.subtotal;
                }
                const subtotal = CostCalculator.calculateMaterialSubtotal(
                    item.usage_amount || 0,
                    item.unit_price || 0,
                    materialCoefficient
                );
                return sum + subtotal;
            }, 0);

        // 管销后算的原料总计
        const afterOverheadMaterialTotal = items
            .filter(item => item.category === 'material' && item.after_overhead)
            .reduce((sum, item) => {
                if (item.coefficient_applied) {
                    return sum + item.subtotal;
                }
                const subtotal = CostCalculator.calculateMaterialSubtotal(
                    item.usage_amount || 0,
                    item.unit_price || 0,
                    materialCoefficient
                );
                return sum + subtotal;
            }, 0);

        const processTotal = items
            .filter(item => item.category === 'process')
            .reduce((sum, item) => sum + item.subtotal, 0);

        const packagingTotal = items
            .filter(item => item.category === 'packaging')
            .reduce((sum, item) => sum + item.subtotal, 0);

        // 获取系统配置并计算报价
        const calculatorConfig = SystemConfig.getCalculatorConfig();
        
        // 如果请求中包含 vat_rate，验证并覆盖全局配置
        let vatRateToSave = null;
        if (req.body.vat_rate !== undefined && req.body.vat_rate !== null) {
            const vatRate = parseFloat(req.body.vat_rate);
            if (isNaN(vatRate) || vatRate < 0 || vatRate > 1) {
                return res.status(400).json(error('增值税率必须在 0 到 1 之间', 400));
            }
            calculatorConfig.vatRate = vatRate;
            vatRateToSave = vatRate;
        }
        
        const calculator = new CostCalculator(calculatorConfig);

        // 处理自定义费用
        const customFees = req.body.custom_fees || [];

        const calculation = calculator.calculateQuotation({
            materialTotal,
            processTotal,
            packagingTotal,
            freightTotal: freight_total,
            quantity,
            salesType: sales_type,
            includeFreightInBase: req.body.include_freight_in_base !== false,
            afterOverheadMaterialTotal,
            customFees
        });
        
        // 在计算结果中包含实际使用的增值税率
        calculation.vatRate = calculatorConfig.vatRate;

        console.log('更新报价单 - 计算结果:', {
            salesType: sales_type,
            domesticPrice: calculation.domesticPrice,
            exportPrice: calculation.exportPrice,
            insurancePrice: calculation.insurancePrice,
            currency: calculation.currency
        });

        // 确定最终成本价（不含利润）
        // 内销：domesticPrice（含13%增值税）
        // 外销：insurancePrice（保险价，即管销价/汇率×1.003）
        const final_price = sales_type === 'domestic' 
            ? calculation.domesticPrice 
            : calculation.insurancePrice;

        if (!final_price) {
            console.error('最终价格计算失败:', { sales_type, calculation });
            return res.status(500).json(error('价格计算失败', 500));
        }

        // 处理自定义利润档位
        let customProfitTiersJson = null;
        if (req.body.custom_profit_tiers && Array.isArray(req.body.custom_profit_tiers) && req.body.custom_profit_tiers.length > 0) {
            customProfitTiersJson = JSON.stringify(req.body.custom_profit_tiers);
        }

        // 更新报价单
        Quotation.update(id, {
            customer_name,
            customer_region,
            quantity,
            freight_total,
            freight_per_unit,
            sales_type,
            shipping_method: shipping_method || null,
            port: port || null,
            base_cost: calculation.baseCost,
            overhead_price: calculation.overheadPrice,
            final_price,
            currency: calculation.currency,
            packaging_config_id: req.body.packaging_config_id || null,
            include_freight_in_base: req.body.include_freight_in_base !== false ? 1 : 0,
            custom_profit_tiers: customProfitTiersJson,
            vat_rate: vatRateToSave
        });

        // 删除旧明细并创建新明细
        QuotationItem.deleteByQuotationId(id);
        if (items && items.length > 0) {
            const itemsWithQuotationId = items.map(item => ({
                ...item,
                quotation_id: id
            }));
            QuotationItem.batchCreate(itemsWithQuotationId);
        }

        // 更新自定义费用
        QuotationCustomFee.replaceByQuotationId(id, customFees);

        // 查询更新后的报价单
        const updatedQuotation = Quotation.findById(id);

        res.json(success({
            quotation: updatedQuotation,
            calculation
        }, '报价单更新成功'));

    } catch (err) {
        console.error('更新报价单失败:', err);
        res.status(500).json(error('更新报价单失败: ' + err.message, 500));
    }
};

/**
 * 提交报价单
 * POST /api/cost/quotations/:id/submit
 */
const submitQuotation = async (req, res) => {
    try {
        const { id } = req.params;

        // 检查报价单是否存在
        const quotation = Quotation.findById(id);
        if (!quotation) {
            return res.status(404).json(error('报价单不存在', 404));
        }

        // 检查权限
        if (quotation.created_by !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json(error('无权限提交此报价单', 403));
        }

        // 检查状态：只有草稿和已退回状态可以提交
        if (!['draft', 'rejected'].includes(quotation.status)) {
            return res.status(400).json(error('当前状态不允许提交', 400));
        }

        // 更新状态为已提交
        Quotation.updateStatus(id, 'submitted');

        // 查询更新后的报价单
        const updatedQuotation = Quotation.findById(id);

        res.json(success(updatedQuotation, '报价单提交成功'));

    } catch (err) {
        console.error('提交报价单失败:', err);
        res.status(500).json(error('提交报价单失败: ' + err.message, 500));
    }
};

/**
 * 获取报价单列表
 * GET /api/cost/quotations
 */
const getQuotationList = async (req, res) => {
    try {
        const {
            status,
            customer_name,
            model_name,
            start_date,
            end_date,
            page = 1,
            pageSize = 20
        } = req.query;

        // 根据角色过滤数据
        const options = {
            status,
            customer_name,
            model_name,
            date_from: start_date,
            date_to: end_date,
            page: parseInt(page),
            pageSize: parseInt(pageSize)
        };

        // 如果不是管理员或审核人，只能查看自己创建的报价单
        if (!['admin', 'reviewer'].includes(req.user.role)) {
            options.created_by = req.user.id;
        }

        const result = Quotation.findAll(options);

        res.json(paginated(result.data, result.total, result.page, result.pageSize));

    } catch (err) {
        console.error('获取报价单列表失败:', err);
        res.status(500).json(error('获取报价单列表失败: ' + err.message, 500));
    }
};

/**
 * 获取报价单详情
 * GET /api/cost/quotations/:id
 */
const getQuotationDetail = async (req, res) => {
    try {
        const { id } = req.params;

        // 查询报价单
        const quotation = Quotation.findById(id);
        if (!quotation) {
            return res.status(404).json(error('报价单不存在', 404));
        }

        // 检查权限：创建者、管理员、审核人可以查看
        // 如果报价单已被设为标准成本，所有用户都可以查看（用于标准成本对比）
        const StandardCost = require('../models/StandardCost');
        const isStandardCost = StandardCost.findByQuotationId(quotation.id);
        
        if (
            quotation.created_by !== req.user.id &&
            !['admin', 'reviewer'].includes(req.user.role) &&
            !isStandardCost
        ) {
            return res.status(403).json(error('无权限查看此报价单', 403));
        }

        // 查询报价单明细
        const items = QuotationItem.getGroupedByCategory(id);

        // 获取原料系数
        let materialCoefficient = 1;
        const model = Model.findById(quotation.model_id);
        if (model && model.model_category) {
            const coefficients = SystemConfig.getValue('material_coefficients') || {};
            materialCoefficient = CostCalculator.getMaterialCoefficient(model.model_category, coefficients);
        }

        // 重新计算以获取利润区间
        // 注意：工序总计传入原始值，计算器内部会自动乘以工价系数
        const calculatorConfig = SystemConfig.getCalculatorConfig();
        
        // 如果报价单保存了自定义增值税率，使用该值
        if (quotation.vat_rate !== null && quotation.vat_rate !== undefined) {
            calculatorConfig.vatRate = quotation.vat_rate;
        }
        
        const calculator = new CostCalculator(calculatorConfig);

        // 计算原料总计（不含管销后算的原料）
        // 注意：数据库中存储的subtotal已经是应用系数后的值，直接使用
        const materialTotal = items.material.items
            .filter(item => !item.after_overhead)
            .reduce((sum, item) => sum + item.subtotal, 0);

        // 管销后算的原料总计
        const afterOverheadMaterialTotal = items.material.items
            .filter(item => item.after_overhead)
            .reduce((sum, item) => sum + item.subtotal, 0);

        // 加载自定义费用
        const customFeesFromDb = QuotationCustomFee.findByQuotationId(id);
        const customFees = customFeesFromDb.map(fee => ({
            name: fee.fee_name,
            rate: fee.fee_rate,
            sortOrder: fee.sort_order
        }));

        const calculation = calculator.calculateQuotation({
            materialTotal,
            processTotal: items.process.total, // 原始工序总计，不需要手动乘以工价系数
            packagingTotal: items.packaging.total,
            freightTotal: quotation.freight_total,
            quantity: quotation.quantity,
            salesType: quotation.sales_type,
            includeFreightInBase: quotation.include_freight_in_base !== false,
            afterOverheadMaterialTotal,
            customFees
        });

        // 返回原料系数信息和实际使用的增值税率
        calculation.materialCoefficient = materialCoefficient;
        calculation.vatRate = calculatorConfig.vatRate;

        // 工序总计已包含工价系数，直接显示
        items.process.displayTotal = items.process.total;

        res.json(success({
            quotation,
            items,
            calculation,
            customFees
        }, '获取报价单详情成功'));

    } catch (err) {
        console.error('获取报价单详情失败:', err);
        res.status(500).json(error('获取报价单详情失败: ' + err.message, 500));
    }
};

/**
 * 删除报价单
 * DELETE /api/cost/quotations/:id
 */
const deleteQuotation = async (req, res) => {
    try {
        const { id } = req.params;

        // 检查报价单是否存在
        const quotation = Quotation.findById(id);
        if (!quotation) {
            return res.status(404).json(error('报价单不存在', 404));
        }

        // 管理员可以删除任何报价单，无论审批与否
        if (req.user.role === 'admin') {
            const success_flag = Quotation.delete(id);
            if (success_flag) {
                return res.json(success(null, '报价单删除成功'));
            } else {
                return res.status(500).json(error('删除报价单失败', 500));
            }
        }

        // 非管理员：只能删除自己创建的报价单
        if (quotation.created_by !== req.user.id) {
            return res.status(403).json(error('无权限删除此报价单', 403));
        }

        // 非管理员：只能删除草稿状态的报价单
        if (quotation.status !== 'draft') {
            return res.status(400).json(error('只有草稿状态的报价单可以删除', 400));
        }

        // 删除报价单（会级联删除明细）
        const success_flag = Quotation.delete(id);

        if (success_flag) {
            res.json(success(null, '报价单删除成功'));
        } else {
            res.status(500).json(error('删除报价单失败', 500));
        }

    } catch (err) {
        console.error('删除报价单失败:', err);
        res.status(500).json(error('删除报价单失败: ' + err.message, 500));
    }
};

/**
 * 获取所有包装配置列表
 * GET /api/cost/packaging-configs
 */
const getPackagingConfigs = async (req, res) => {
    try {
        const db = dbManager.getDatabase();

        const stmt = db.prepare(`
            SELECT 
                pc.id,
                pc.model_id,
                pc.config_name,
                pc.pc_per_bag,
                pc.bags_per_box,
                pc.boxes_per_carton,
                pc.is_active,
                m.model_name,
                m.model_category,
                m.regulation_id,
                r.name as regulation_name
            FROM packaging_configs pc
            JOIN models m ON pc.model_id = m.id
            JOIN regulations r ON m.regulation_id = r.id
            WHERE pc.is_active = 1
            ORDER BY m.model_name, pc.config_name
        `);
        
        const configs = stmt.all();
        console.log(`找到 ${configs.length} 个包装配置`);

        res.json(success(configs, '获取包装配置列表成功'));

    } catch (err) {
        console.error('获取包装配置列表失败:', err);
        res.status(500).json(error('获取包装配置列表失败: ' + err.message, 500));
    }
};

/**
 * 获取包装配置详情（包含工序和包材）
 * GET /api/cost/packaging-configs/:configId/details
 */
const getPackagingConfigDetails = async (req, res) => {
    try {
        const { configId } = req.params;
        console.log('获取包装配置详情，configId:', configId);
        
        const db = dbManager.getDatabase();

        // 获取配置基本信息
        const configStmt = db.prepare(`
            SELECT 
                pc.*,
                m.model_name,
                m.regulation_id,
                r.name as regulation_name
            FROM packaging_configs pc
            JOIN models m ON pc.model_id = m.id
            JOIN regulations r ON m.regulation_id = r.id
            WHERE pc.id = ?
        `);
        const config = configStmt.get(configId);

        if (!config) {
            return res.status(404).json(error('包装配置不存在', 404));
        }

        // 获取工序配置
        const processesStmt = db.prepare(`
            SELECT 
                id,
                process_name,
                unit_price,
                sort_order
            FROM process_configs
            WHERE packaging_config_id = ? AND is_active = 1
            ORDER BY sort_order, id
        `);
        const processes = processesStmt.all(configId);
        console.log(`找到 ${processes.length} 个工序`);

        // 获取包材配置
        const materialsStmt = db.prepare(`
            SELECT 
                id,
                material_name,
                basic_usage,
                unit_price,
                carton_volume,
                sort_order
            FROM packaging_materials
            WHERE packaging_config_id = ? AND is_active = 1
            ORDER BY sort_order, id
        `);
        const materials = materialsStmt.all(configId);
        console.log(`找到 ${materials.length} 个包材`);

        res.json(success({
            config,
            processes,
            materials
        }, '获取包装配置详情成功'));

    } catch (err) {
        console.error('获取包装配置详情失败:', err);
        res.status(500).json(error('获取包装配置详情失败: ' + err.message, 500));
    }
};

/**
 * 获取原料系数配置
 * GET /api/cost/material-coefficients
 */
const getMaterialCoefficients = async (req, res) => {
    try {
        const coefficients = SystemConfig.getValue('material_coefficients');
        res.json(success(coefficients || { '口罩': 0.97, '半面罩': 0.99 }));
    } catch (err) {
        console.error('获取原料系数配置失败:', err);
        res.status(500).json(error('获取原料系数配置失败: ' + err.message, 500));
    }
};

module.exports = {
    createQuotation,
    getModelStandardData,
    getPackagingConfigs,
    getPackagingConfigDetails,
    calculateQuotation,
    updateQuotation,
    submitQuotation,
    getQuotationList,
    getQuotationDetail,
    deleteQuotation,
    getMaterialCoefficients
};
