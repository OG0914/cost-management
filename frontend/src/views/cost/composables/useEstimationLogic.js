import { ref, computed } from 'vue'
import request from '@/utils/request'
import logger from '@/utils/logger'
import { ElMessage } from 'element-plus'

export function useEstimationLogic({ form, currentModelCategory, materialCoefficient, materialCoefficientsCache, quantityInput, quantityUnit, loadMaterialCoefficients, setShippingInfoFromConfig, calculateShippingInfo, handleCalculateCost }) {

    const newProductModels = ref([])
    const referenceStandardCosts = ref([])
    const referenceStandardCostsLoading = ref(false)
    const referenceStandardCostId = ref(null)

    // 计算属性
    const isEstimationMode = computed(() => form.is_estimation)

    const selectedNewProductCategory = computed(() => {
        if (!form.model_id || !newProductModels.value.length) return ''
        const model = newProductModels.value.find(m => m.id === form.model_id)
        return model?.model_category || ''
    })

    // 加载新产品型号列表
    const loadNewProductModels = async () => {
        try {
            const res = await request.get('/models')
            newProductModels.value = res.data || []
        } catch (error) {
            logger.error('加载型号列表失败:', error.message || error)
            newProductModels.value = []
        }
    }

    // 加载参考标准成本列表
    const loadReferenceStandardCosts = async (regulationId, modelCategory) => {
        referenceStandardCostsLoading.value = true
        try {
            const res = await request.get('/standard-costs', { params: { regulation_id: regulationId, model_category: modelCategory, page: 1, pageSize: 100 } })
            referenceStandardCosts.value = res.data || []
        } catch (error) {
            logger.error('加载参考标准成本失败:', error.message || error)
            referenceStandardCosts.value = []
        } finally {
            referenceStandardCostsLoading.value = false
        }
    }

    // 填充参考标准成本数据
    const fillReferenceStandardCostData = async (data, shippingInfo) => {
        const { standardCost, items } = data
        const currentModelId = form.model_id
        const currentRegulationId = form.regulation_id

        // 只保留必要的字段复制，避免覆盖所有
        form.sales_type = standardCost.sales_type || 'domestic'
        form.quantity = standardCost.quantity || null

        if (items?.material) {
            form.materials = items.material.items.map(item => ({
                category: 'material', material_id: item.material_id || null, item_name: item.item_name,
                usage_amount: parseFloat(item.usage_amount) || 0, unit_price: parseFloat(item.unit_price) || 0,
                subtotal: parseFloat(item.subtotal) || 0, is_changed: 0, from_standard: true, from_reference: true,
                after_overhead: item.after_overhead || false, coefficient_applied: true
            }))
        }
        if (items?.process) {
            form.processes = items.process.items.map(item => ({
                category: 'process', item_name: item.item_name,
                usage_amount: parseFloat(item.usage_amount) || 0, unit_price: parseFloat(item.unit_price) || 0,
                subtotal: parseFloat(item.subtotal) || 0, is_changed: 0, from_standard: true, from_reference: true
            }))
        }

        let cartonVolume = null
        if (items?.packaging) {
            form.packaging = items.packaging.items.map(item => ({
                category: 'packaging', material_id: item.material_id || null, item_name: item.item_name,
                usage_amount: parseFloat(item.usage_amount) || 0, unit_price: parseFloat(item.unit_price) || 0,
                carton_volume: item.carton_volume ? parseFloat(item.carton_volume) : null,
                subtotal: parseFloat(item.subtotal) || 0, is_changed: 0, from_standard: true, from_reference: true
            }))
            const cartonMaterial = items.packaging.items.find(item => item.carton_volume && item.carton_volume > 0)
            if (cartonMaterial) cartonVolume = parseFloat(cartonMaterial.carton_volume)
        }

        if (standardCost.pc_per_bag && standardCost.bags_per_box && standardCost.boxes_per_carton) {
            const pcsPerCarton = standardCost.pc_per_bag * standardCost.bags_per_box * standardCost.boxes_per_carton
            if (setShippingInfoFromConfig) setShippingInfoFromConfig(pcsPerCarton, cartonVolume)
        }

        // 恢复原来的ID，保留预估模式状态
        form.model_id = currentModelId
        form.regulation_id = currentRegulationId
        form.is_estimation = true

        if (form.quantity) {
            quantityInput.value = form.quantity
            quantityUnit.value = 'pcs'
        }
        if (form.quantity && shippingInfo?.pcsPerCarton && calculateShippingInfo) {
            calculateShippingInfo(form, handleCalculateCost)
        }

        if (handleCalculateCost) handleCalculateCost()
    }

    // 事件处理
    const onNewProductModelChange = async () => {
        if (!form.model_id) return
        const model = newProductModels.value.find(m => m.id === form.model_id)
        if (model) {
            form.regulation_id = model.regulation_id
            currentModelCategory.value = model.model_category
            if (materialCoefficientsCache.value[model.model_category]) {
                materialCoefficient.value = materialCoefficientsCache.value[model.model_category]
            } else if (loadMaterialCoefficients) {
                // 如果缓存没有，可能需要加载，但这里假设外部会处理或缓存已就绪
                // 实际可以调用 await loadMaterialCoefficients(model.model_category)
            }
            await loadReferenceStandardCosts(model.regulation_id, model.model_category)
        }
        referenceStandardCostId.value = null
        form.materials = []
        form.processes = []
        form.packaging = []
        // calculation.value = null // 外部处理
    }

    const onReferenceStandardCostChange = async (loadStandardCostData, shippingInfo) => {
        if (!referenceStandardCostId.value) return
        form.reference_standard_cost_id = referenceStandardCostId.value
        try {
            const data = await loadStandardCostData(referenceStandardCostId.value)
            if (data) {
                await fillReferenceStandardCostData(data, shippingInfo)
                ElMessage.success('已从参考标准成本复制数据，请根据新产品需求调整')
            }
        } catch (error) {
            logger.error('加载参考标准成本数据失败:', error.message || error)
            ElMessage.error('加载参考标准成本数据失败')
        }
    }

    return {
        newProductModels,
        referenceStandardCosts,
        referenceStandardCostsLoading,
        referenceStandardCostId,
        isEstimationMode,
        selectedNewProductCategory,
        loadNewProductModels,
        loadReferenceStandardCosts,
        onNewProductModelChange,
        onReferenceStandardCostChange,
    }
}
