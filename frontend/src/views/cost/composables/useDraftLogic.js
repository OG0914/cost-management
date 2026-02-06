/**
 * 草稿逻辑
 * 处理报价单草稿的保存、恢复和检测
 * 拆分自 CostAdd.vue，代码完整无修改
 */

import { nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import logger from '@/utils/logger'

/**
 * 创建草稿逻辑 composable
 * @param {Object} deps - 依赖项
 */
export function useDraftLogic(deps) {
    const {
        form,
        route,
        currentModelCategory,
        quantityUnit,
        quantityInput,
        domesticCbmPrice,
        customProfitTiers,
        editMode,
        hasFormData,
        getDraftInfo,
        loadDraft,
        saveDraft,
        clearDraft,
        handleCalculateCost
    } = deps

    /**
     * 格式化草稿时间
     */
    const formatDraftTime = (isoString) => {
        const date = new Date(isoString)
        return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    }

    /**
     * 获取表单数据用于草稿保存
     */
    const getFormDataForDraft = () => ({
        form,
        extras: {
            modelCategory: currentModelCategory.value,
            quantityUnit: quantityUnit.value,
            quantityInput: quantityInput.value,
            domesticCbmPrice: domesticCbmPrice.value,
            customProfitTiers: customProfitTiers.value,
            editMode
        },
        hasData: hasFormData.value
    })

    /**
     * 恢复草稿
     */
    const restoreDraft = async () => {
        const draft = loadDraft()
        if (!draft) return false
        try {
            if (draft.modelCategory) currentModelCategory.value = draft.modelCategory
            Object.assign(form, draft.form)
            if (draft.quantityUnit) quantityUnit.value = draft.quantityUnit
            if (draft.quantityInput) quantityInput.value = draft.quantityInput
            if (draft.domesticCbmPrice) domesticCbmPrice.value = draft.domesticCbmPrice
            if (draft.customProfitTiers) customProfitTiers.value = draft.customProfitTiers
            if (draft.editMode) Object.assign(editMode, draft.editMode)
            await nextTick()
            handleCalculateCost()
            ElMessage.success('草稿已恢复')
            return true
        } catch (error) {
            logger.error('恢复草稿失败:', error)
            ElMessage.error('恢复草稿失败')
            return false
        }
    }

    /**
     * 检查并恢复草稿
     */
    const checkAndRestoreDraft = async () => {
        if (route.params.id || route.query.copyFrom || route.query.copyFromStandardCost) return false
        const draftInfo = getDraftInfo()
        if (!draftInfo || !draftInfo.hasData) return false
        try {
            await ElMessageBox.confirm(
                `保存时间：${formatDraftTime(draftInfo.savedAt)}${draftInfo.modelCategory ? `\n产品类别：${draftInfo.modelCategory}` : ''}${draftInfo.customerName ? `\n客户：${draftInfo.customerName}` : ''}`,
                '检测到未完成的报价草稿',
                { distinguishCancelAndClose: true, confirmButtonText: '继续编辑', cancelButtonText: '新建报价', type: 'info' }
            )
            return await restoreDraft()
        } catch (action) {
            if (action === 'cancel') clearDraft()
            return false
        }
    }

    return {
        formatDraftTime,
        getFormDataForDraft,
        restoreDraft,
        checkAndRestoreDraft
    }
}
