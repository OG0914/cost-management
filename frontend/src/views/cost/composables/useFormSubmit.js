/**
 * 表单提交逻辑
 * 处理报价单保存草稿和提交审核
 * 拆分自 CostAdd.vue，代码完整无修改
 */

import { ElMessage } from 'element-plus'
import logger from '@/utils/logger'

/**
 * 创建表单提交 composable
 * @param {Object} deps - 依赖项
 */
export function useFormSubmit(deps) {
    const {
        form,
        route,
        router,
        validateForm,
        prepareCustomProfitTiersForSave,
        saveQuotation,
        submitQuotation,
        clearDraft,
        stopAutoSave
    } = deps

    // 字段标签映射（用于错误提示）
    const fieldLabels = {
        regulation_id: '法规标准',
        model_id: '新产品型号',
        packaging_config_id: '型号配置',
        customer_name: '客户名称',
        customer_region: '客户地区',
        sales_type: '销售类型',
        port: '港口名称',
        quantity: '数量',
        freight_total: '运费总价',
        vat_rate: '增值税率'
    }

    /**
     * 准备提交/保存的数据
     */
    const prepareData = () => ({
        customer_name: form.customer_name,
        customer_region: form.customer_region,
        model_id: form.model_id,
        regulation_id: form.regulation_id,
        packaging_config_id: form.packaging_config_id,
        quantity: form.quantity,
        freight_total: form.freight_total || 0,
        sales_type: form.sales_type,
        shipping_method: form.shipping_method || null,
        port: form.port || null,
        include_freight_in_base: form.include_freight_in_base,
        vat_rate: form.vat_rate,
        custom_profit_tiers: prepareCustomProfitTiersForSave(),
        custom_fees: form.customFees,
        is_estimation: form.is_estimation,
        reference_standard_cost_id: form.reference_standard_cost_id,
        items: [...form.materials, ...form.processes, ...form.packaging]
    })

    /**
     * 保存草稿
     */
    const handleSaveDraft = async () => {
        try {
            const valid = await validateForm()
            if (valid !== true) {
                const invalidFields = Object.keys(valid).map(key => fieldLabels[key] || key).join('、')
                logger.warn('表单校验失败', valid)
                ElMessage.error(`保存失败：请完善以下红色必填项：${invalidFields}`)
                return
            }
            if ([...form.materials, ...form.processes, ...form.packaging].length === 0) {
                ElMessage.warning('请至少添加一项明细')
                return
            }
            const res = await saveQuotation(route.params.id, prepareData())
            if (res) {
                clearDraft()
                stopAutoSave()
                router.push('/cost/records')
            }
        } catch (error) {
            logger.error('保存失败:', error)
            ElMessage.error(error.message || '保存失败')
        }
    }

    /**
     * 提交审核
     */
    const handleSubmitQuotation = async () => {
        try {
            const valid = await validateForm()
            if (valid !== true) {
                const invalidFields = Object.keys(valid).map(key => fieldLabels[key] || key).join('、')
                ElMessage.error(`提交失败：请完善以下红色必填项：${invalidFields}`)
                return
            }
            if ([...form.materials, ...form.processes, ...form.packaging].length === 0) {
                ElMessage.warning('请至少添加一项明细')
                return
            }
            const res = await submitQuotation(route.params.id, prepareData())
            if (res) {
                clearDraft()
                stopAutoSave()
                router.push('/cost/records')
            }
        } catch (error) {
            logger.error('提交失败:', error)
            ElMessage.error(error.message || '提交失败')
        }
    }

    return {
        fieldLabels,
        prepareData,
        handleSaveDraft,
        handleSubmitQuotation
    }
}
