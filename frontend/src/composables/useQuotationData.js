/**
 * 报价单数据加载 Composable
 * 处理报价单、标准成本的加载和保存
 */

import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import logger from '@/utils/logger'

export function useQuotationData() {
  const saving = ref(false)
  const submitting = ref(false)
  const isSaved = ref(false)

  const loadRegulations = async () => {
    try {
      const res = await request.get('/regulations')
      return res.success ? res.data : []
    } catch (error) {
      logger.error('加载法规列表失败:', error)
      return []
    }
  }

  const loadPackagingConfigs = async () => {
    try {
      const res = await request.get('/cost/packaging-configs')
      return res.success ? res.data : []
    } catch (error) {
      logger.error('加载包装配置列表失败:', error)
      return []
    }
  }

  const loadBomMaterials = async (modelId, materialCoefficient) => {
    if (!modelId) return []
    try {
      const res = await request.get(`/bom/${modelId}`)
      if (res.success && res.data && res.data.length > 0) {
        return res.data.map(b => {
          const coefficient = materialCoefficient || 1
          const rawSubtotal = (parseFloat(b.usage_amount) || 0) * (parseFloat(b.unit_price) || 0)
          const subtotal = coefficient !== 0 ? rawSubtotal / coefficient : rawSubtotal
          return {
            category: 'material',
            material_id: b.material_id,
            item_name: b.material_name,
            usage_amount: parseFloat(b.usage_amount) || 0,
            unit_price: parseFloat(b.unit_price) || 0,
            subtotal: Math.round(subtotal * 10000) / 10000,
            is_changed: 0,
            from_bom: true,
            from_standard: true,
            after_overhead: false,
            coefficient_applied: true
          }
        })
      }
      return []
    } catch (e) {
      logger.error('加载BOM原料失败:', e)
      return []
    }
  }

  const loadPackagingConfigDetails = async (configId) => {
    try {
      const res = await request.get(`/cost/packaging-configs/${configId}/details`)
      if (res.success) {
        return res.data
      }
      return null
    } catch (error) {
      logger.error('加载包装配置详情失败:', error)
      return null
    }
  }

  const loadQuotationData = async (id) => {
    try {
      const res = await request.get(`/cost/quotations/${id}`)
      if (res.success) {
        return res.data
      }
      return null
    } catch (error) {
      logger.error('加载报价单数据失败:', error)
      return null
    }
  }

  const loadStandardCostData = async (id) => {
    try {
      const res = await request.get(`/standard-costs/${id}`)
      if (res.success) {
        return res.data
      }
      return null
    } catch (error) {
      logger.error('加载标准成本数据失败:', error)
      return null
    }
  }

  const saveQuotation = async (quotationId, data) => {
    saving.value = true
    try {
      let res
      if (quotationId) {
        res = await request.put(`/cost/quotations/${quotationId}`, data)
      } else {
        res = await request.post('/cost/quotations', data)
      }

      if (res.success) {
        isSaved.value = true
        ElMessage.success(quotationId ? '更新成功' : '保存成功')
        return res
      }
      return null
    } catch (error) {
      logger.error('保存失败:', error)
      const errorMsg = error.response?.data?.message || error.message || '保存失败'
      ElMessage.error(errorMsg)
      return null
    } finally {
      saving.value = false
    }
  }

  const submitQuotation = async (quotationId, data) => {
    submitting.value = true
    try {
      let targetId = quotationId

      if (quotationId) {
        const updateRes = await request.put(`/cost/quotations/${quotationId}`, data)
        if (!updateRes.success) return null
      } else {
        const createRes = await request.post('/cost/quotations', data)
        if (!createRes.success) return null
        targetId = createRes.data.quotation.id
      }

      const submitRes = await request.post(`/cost/quotations/${targetId}/submit`)
      if (submitRes.success) {
        isSaved.value = true
        ElMessage.success('提交成功')
        return submitRes
      }
      return null
    } catch (error) {
      logger.error('提交失败:', error)
      const errorMsg = error.response?.data?.message || error.message || '提交失败'
      ElMessage.error(errorMsg)
      return null
    } finally {
      submitting.value = false
    }
  }

  return {
    saving,
    submitting,
    isSaved,
    loadRegulations,
    loadPackagingConfigs,
    loadBomMaterials,
    loadPackagingConfigDetails,
    loadQuotationData,
    loadStandardCostData,
    saveQuotation,
    submitQuotation
  }
}
