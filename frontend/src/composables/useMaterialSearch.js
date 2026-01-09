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

  return {
    allMaterials,
    materialSearchOptions,
    materialSearchLoading,
    loadAllMaterials,
    searchMaterials,
    onMaterialSelect,
    onPackagingMaterialSelect
  }
}
