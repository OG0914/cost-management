/**
 * 成本计算 Composable
 * 处理成本计算、利润档位、自定义费用逻辑
 */

import { ref, computed } from 'vue'
import request from '@/utils/request'
import logger from '@/utils/logger'

export function useCostCalculation() {
  const calculation = ref(null)
  const customProfitTiers = ref([])
  const materialCoefficient = ref(1)
  const materialCoefficientsCache = ref({})

  const loadMaterialCoefficients = async (currentModelCategory) => {
    try {
      const res = await request.get('/cost/material-coefficients')
      if (res.success && res.data) {
        materialCoefficientsCache.value = res.data
        if (currentModelCategory && res.data[currentModelCategory]) {
          materialCoefficient.value = res.data[currentModelCategory]
        } else {
          materialCoefficient.value = 1
        }
      }
    } catch (error) {
      logger.error('加载原料系数配置失败:', error)
      materialCoefficient.value = 1
    }
  }

  const calculateItemSubtotal = (row) => {
    if (row.category === 'packaging') {
      row.subtotal = (row.usage_amount && row.usage_amount !== 0)
        ? (row.unit_price || 0) / row.usage_amount
        : 0
    } else if (row.category === 'material') {
      const coefficient = materialCoefficient.value || 1
      const rawSubtotal = (row.usage_amount || 0) * (row.unit_price || 0)
      row.subtotal = coefficient !== 0 ? rawSubtotal / coefficient : rawSubtotal
      row.subtotal = Math.round(row.subtotal * 10000) / 10000
      row.coefficient_applied = true
    } else {
      row.subtotal = (row.usage_amount || 0) * (row.unit_price || 0)
    }
    return row.subtotal
  }

  const calculateCost = async (form) => {
    if (!form.quantity || form.quantity <= 0) return null

    const items = [...form.materials, ...form.processes, ...form.packaging]
    if (items.length === 0) return null

    try {
      const res = await request.post('/cost/calculate', {
        quantity: form.quantity,
        freight_total: form.freight_total || 0,
        sales_type: form.sales_type,
        include_freight_in_base: form.include_freight_in_base,
        model_id: form.model_id,
        vat_rate: form.vat_rate,
        custom_fees: form.customFees,
        items
      })

      if (res.success) {
        calculation.value = res.data
        customProfitTiers.value.forEach(tier => updateCustomTierPrice(tier))
        return res.data
      }
    } catch (error) {
      logger.error('计算成本失败:', error)
    }
    return null
  }

  const addCustomProfitTier = () => {
    if (!calculation.value) return false
    customProfitTiers.value.push({ profitRate: null, profitPercentage: '', price: 0, sortKey: 9999 })
    return true
  }

  const updateCustomTierPrice = (tier) => {
    if (!calculation.value) return

    if (tier.profitRate === null || tier.profitRate === undefined || tier.profitRate === '') {
      tier.price = 0
      tier.profitPercentage = ''
      return
    }

    let basePrice = calculation.value.salesType === 'domestic'
      ? calculation.value.domesticPrice
      : calculation.value.insurancePrice

    if (!basePrice) return

    const rate = parseFloat(tier.profitRate)
    if (isNaN(rate) || rate < 0 || rate >= 100) { // 利润率必须小于100%，否则会导致负价格
      tier.price = 0
      tier.profitPercentage = ''
      return
    }

    tier.profitPercentage = `${rate}%`
    tier.price = basePrice / (1 - rate / 100)
  }

  const updateTierSort = (tier) => {
    const rate = parseFloat(tier.profitRate)
    tier.sortKey = isNaN(rate) ? 9999 : rate
  }

  const removeCustomProfitTier = (customIndex) => {
    if (customIndex >= 0 && customIndex < customProfitTiers.value.length) {
      customProfitTiers.value.splice(customIndex, 1)
    }
  }

  const prepareCustomProfitTiersForSave = () => {
    return customProfitTiers.value
      .filter(tier => tier.profitRate !== null && tier.profitRate !== undefined && tier.profitRate !== '')
      .map(tier => ({ profitRate: tier.profitRate, profitPercentage: tier.profitPercentage, price: tier.price }))
      .sort((a, b) => a.profitRate - b.profitRate)
  }

  const getAllProfitTiers = computed(() => {
    if (!calculation.value || !calculation.value.profitTiers) return []

    const systemTiers = calculation.value.profitTiers.map(tier => ({
      ...tier, isCustom: false, originalTier: null, customIndex: -1,
      // 解析排序值: "25%" -> 25
      sortValue: parseFloat(tier.profitPercentage)
    }))

    const customTiersFormatted = customProfitTiers.value.map((tier, index) => ({
      profitRate: tier.profitRate,
      profitPercentage: tier.profitPercentage,
      price: tier.price,
      isCustom: true,
      originalTier: tier,
      customIndex: index,
      // 解析排序值: 优先使用sortKey，否则退化到profitRate，默认为极大值放在最后
      sortValue: (tier.sortKey !== undefined && tier.sortKey !== null) ? tier.sortKey : (tier.profitRate ? parseFloat(tier.profitRate) : 9999)
    }))

    return [...systemTiers, ...customTiersFormatted].sort((a, b) => a.sortValue - b.sortValue)
  })

  return {
    calculation,
    customProfitTiers,
    materialCoefficient,
    materialCoefficientsCache,
    loadMaterialCoefficients,
    calculateItemSubtotal,
    calculateCost,
    addCustomProfitTier,
    updateCustomTierPrice,
    updateTierSort,
    removeCustomProfitTier,
    prepareCustomProfitTiersForSave,
    getAllProfitTiers
  }
}
