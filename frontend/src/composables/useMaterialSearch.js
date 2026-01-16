/**
 * 原料搜索 Composable
 */

import { ref } from 'vue'
import request from '@/utils/request'
import logger from '@/utils/logger'

export function useMaterialSearch() {
  const allMaterials = ref([])
  const materialSearchOptions = ref([])
  const materialSearchLoading = ref(false)

  const loadAllMaterials = async () => {
    try {
      const res = await request.get('/materials', { params: { pageSize: 100 } })
      if (res.success) {
        allMaterials.value = res.data
      }
    } catch (error) {
      logger.error('加载原料库失败:', error)
    }
  }

  const searchMaterials = async (query) => {
    if (!query || query.length < 1) {
      materialSearchOptions.value = []
      return
    }
    materialSearchLoading.value = true
    try {
      const res = await request.get('/materials', { params: { keyword: query, pageSize: 50 } })
      if (res.success) {
        materialSearchOptions.value = res.data || []
      }
    } catch (e) {
      materialSearchOptions.value = []
    } finally {
      materialSearchLoading.value = false
    }
  }

  const onMaterialSelect = (row, materialCoefficient, calculateItemSubtotal) => {
    if (!row.material_id) {
      row.item_name = ''
      row.unit_price = 0
      row.usage_amount = 0
      row.subtotal = 0
      return
    }

    const material = materialSearchOptions.value.find(m => m.id === row.material_id)
      || allMaterials.value.find(m => m.id === row.material_id)
    if (material) {
      row.item_name = material.name
      row.unit_price = material.price
      row.usage_amount = row.usage_amount || 0
      calculateItemSubtotal(row) // calculateItemSubtotal 内部使用 materialCoefficient.value
    }
  }

  const onPackagingMaterialSelect = (row, calculateItemSubtotal) => {
    if (!row.material_id) {
      row.item_name = ''
      row.unit_price = 0
      row.usage_amount = 0
      row.subtotal = 0
      return
    }

    const material = materialSearchOptions.value.find(m => m.id === row.material_id)
      || allMaterials.value.find(m => m.id === row.material_id)
    if (material) {
      row.item_name = material.name
      row.unit_price = material.price
      row.usage_amount = row.usage_amount || 0
      calculateItemSubtotal(row)
    }
  }

  const preloadSelectedMaterials = async (materialIds) => { // 预加载已选原料信息
    if (!materialIds || materialIds.length === 0) return
    try {
      logger.debug('预加载原料信息，IDs:', materialIds)
      const res = await request.get('/materials/batch', { params: { ids: materialIds.join(',') } })
      if (res.success && res.data) {
        logger.debug('预加载成功，数据:', res.data)
        const existingIds = new Set(materialSearchOptions.value.map(m => m.id))
        res.data.forEach(material => {
          if (!existingIds.has(material.id)) materialSearchOptions.value.push(material)
        })
        logger.debug('当前选项列表:', materialSearchOptions.value)
      }
    } catch (error) {
      logger.error('预加载原料信息失败:', error)
    }
  }

  return {
    allMaterials,
    materialSearchOptions,
    materialSearchLoading,
    loadAllMaterials,
    searchMaterials,
    onMaterialSelect,
    onPackagingMaterialSelect,
    preloadSelectedMaterials
  }
}
