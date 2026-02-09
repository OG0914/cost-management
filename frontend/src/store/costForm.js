/**
 * 成本报价单表单 Store
 * 集中管理 CostAdd.vue 的表单状态
 */
import { defineStore } from 'pinia'
import { reactive, computed, ref } from 'vue'

export const useCostFormStore = defineStore('costForm', () => {
  // ========== 基础表单状态 ==========
  const form = reactive({
    customer_name: '',
    customer_region: '',
    model_id: null,
    regulation_id: null,
    packaging_config_id: null,
    quantity: 1,
    freight_total: 0,
    sales_type: 'domestic',
    shipping_method: '',
    port_type: 'fob_shenzhen',
    port: '',
    include_freight_in_base: true,
    vat_rate: 0.13,
    is_estimation: false,
    reference_standard_cost_id: null,
    customFees: [],
    materials: [],
    processes: [],
    packaging: []
  })

  // ========== UI/中间状态 ==========
  const quantityUnit = ref('pcs') // pcs | carton
  const quantityInput = ref(1)
  const domesticCbmPrice = ref(0)

  // ========== 派生状态 ==========
  const isExport = computed(() => form.sales_type === 'export')
  const isDomestic = computed(() => form.sales_type === 'domestic')
  const isLCL = computed(() => ['lcl', 'cif_lcl'].includes(form.shipping_method))
  const isFCL = computed(() => ['fcl_20', 'fcl_40'].includes(form.shipping_method))
  const isCIF = computed(() => form.shipping_method === 'cif_lcl')
  const isFOBShenzhen = computed(() => form.port_type === 'fob_shenzhen')

  // ========== 方法 ==========

  /**
   * 设置销售类型
   */
  const setSalesType = (type) => {
    form.sales_type = type
    if (type === 'domestic') {
      form.shipping_method = ''
      form.port_type = 'fob_shenzhen'
      form.port = ''
      quantityUnit.value = 'pcs'
    } else {
      form.shipping_method = 'fcl_20'
      quantityUnit.value = 'carton'
    }
  }

  /**
   * 设置运输方式
   */
  const setShippingMethod = (method) => {
    form.shipping_method = method
    if (method === 'cif_lcl') {
      form.port_type = 'cif_shenzhen'
    } else {
      form.port_type = 'fob_shenzhen'
    }
  }

  /**
   * 设置港口类型
   */
  const setPortType = (type) => {
    form.port_type = type
    if (type === 'fob_shenzhen') {
      form.port = ''
    }
  }

  /**
   * 设置数量单位
   */
  const setQuantityUnit = (unit, pcsPerCarton = 0) => {
    quantityUnit.value = unit
    if (unit === 'carton' && pcsPerCarton > 0) {
      form.quantity = quantityInput.value * pcsPerCarton
    } else {
      form.quantity = quantityInput.value
    }
  }

  /**
   * 设置数量输入
   */
  const setQuantityInput = (val, pcsPerCarton = 0) => {
    quantityInput.value = val
    if (quantityUnit.value === 'carton' && pcsPerCarton > 0) {
      form.quantity = val * pcsPerCarton
    } else {
      form.quantity = val
    }
  }

  /**
   * 设置国内运费单价
   */
  const setDomesticCbmPrice = (price, cbm = 0) => {
    domesticCbmPrice.value = price
    if (price > 0 && cbm > 0) {
      form.freight_total = price * Math.ceil(parseFloat(cbm))
    }
  }

  /**
   * 重置表单
   */
  const resetForm = () => {
    form.customer_name = ''
    form.customer_region = ''
    form.model_id = null
    form.regulation_id = null
    form.packaging_config_id = null
    form.quantity = 1
    form.freight_total = 0
    form.sales_type = 'domestic'
    form.shipping_method = ''
    form.port_type = 'fob_shenzhen'
    form.port = ''
    form.include_freight_in_base = true
    form.is_estimation = false
    form.reference_standard_cost_id = null
    form.materials = []
    form.processes = []
    form.packaging = []
    form.customFees = []
    quantityUnit.value = 'pcs'
    quantityInput.value = 1
    domesticCbmPrice.value = 0
  }

  return {
    // 状态
    form,
    quantityUnit,
    quantityInput,
    domesticCbmPrice,
    // 派生
    isExport,
    isDomestic,
    isLCL,
    isFCL,
    isCIF,
    isFOBShenzhen,
    // 方法
    setSalesType,
    setShippingMethod,
    setPortType,
    setQuantityUnit,
    setQuantityInput,
    setDomesticCbmPrice,
    resetForm
  }
})
