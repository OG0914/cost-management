/**
 * 运费计算 Composable
 * 处理 FOB 深圳整柜、散货运费计算逻辑
 */

import { ref, reactive } from 'vue'
import request from '@/utils/request'
import logger from '@/utils/logger'

// 常量定义
const CBM_DIVISOR = 35.32  // 立方英寸转CBM的除数
const FCL_20_VOLUME = 950  // 20尺柜容积(立方英寸)
const FCL_40_VOLUME = 1950 // 40尺柜容积(立方英寸)

export function useFreightCalculation() {
  const freightCalculation = ref(null)
  const quantityUnit = ref('pcs')
  const quantityInput = ref(null)
  const domesticCbmPrice = ref(null)
  const currentFactory = ref('dongguan_xunan')

  const systemConfig = ref({
    fobShenzhenExchangeRate: 7.1,
    fcl20FreightUsd: 840,
    fcl40FreightUsd: 940,
    lclBaseFreight1_3: 900,
    lclBaseFreight3_5: 1000,
    lclBaseFreight5_8: 1100,
    lclBaseFreight8_10: 1200,
    lclBaseFreight10_12: 1300,
    lclBaseFreight12_15: 1400,
    lclHandlingCharge: 500,
    lclCfsPerCbm: 170,
    lclDocumentFee: 500,
    // CIF 深圳配置
    cifShenzhenCfsPerCbm: 60,
    cifShenzhenDocFee: 500,
    cifShenzhenCustomsFee: 400,
    cifShenzhenWarehouseFee: 130,
    cifShenzhenSeafreightUsd: 10,
    cifHubeiTruckPerCbm: 400
  })

  const shippingInfo = reactive({
    cartons: null,
    cbm: null,
    cartonVolume: null,
    pcsPerCarton: null
  })

  const loadSystemConfig = async () => {
    try {
      const response = await request.get('/config')
      if (response.success && response.data) {
        systemConfig.value.fobShenzhenExchangeRate = response.data.fob_shenzhen_exchange_rate || 7.1
        systemConfig.value.fcl20FreightUsd = response.data.fcl_20_freight_usd || 840
        systemConfig.value.fcl40FreightUsd = response.data.fcl_40_freight_usd || 940
        systemConfig.value.lclBaseFreight1_3 = response.data.lcl_base_freight_1_3 || 900
        systemConfig.value.lclBaseFreight3_5 = response.data.lcl_base_freight_3_5 || 1000
        systemConfig.value.lclBaseFreight5_8 = response.data.lcl_base_freight_5_8 || 1100
        systemConfig.value.lclBaseFreight8_10 = response.data.lcl_base_freight_8_10 || 1200
        systemConfig.value.lclBaseFreight10_12 = response.data.lcl_base_freight_10_12 || 1300
        systemConfig.value.lclBaseFreight12_15 = response.data.lcl_base_freight_12_15 || 1400
        systemConfig.value.lclHandlingCharge = response.data.lcl_handling_charge || 500
        systemConfig.value.lclCfsPerCbm = response.data.lcl_cfs_per_cbm || 170
        systemConfig.value.lclDocumentFee = response.data.lcl_document_fee || 500

        systemConfig.value.cifShenzhenCfsPerCbm = response.data.cif_shenzhen_cfs_per_cbm || 60
        systemConfig.value.cifShenzhenDocFee = response.data.cif_shenzhen_doc_fee || 500
        systemConfig.value.cifShenzhenCustomsFee = response.data.cif_shenzhen_customs_fee || 400
        systemConfig.value.cifShenzhenWarehouseFee = response.data.cif_shenzhen_warehouse_fee || 130
        systemConfig.value.cifShenzhenSeafreightUsd = response.data.cif_shenzhen_seafreight_usd || 10
        systemConfig.value.cifHubeiTruckPerCbm = response.data.cif_hubei_truck_per_cbm || 400
      }
    } catch (error) {
      logger.error('加载系统配置失败:', error.message || error)
    }
  }

  const setShippingInfoFromConfig = (pcsPerCarton, cartonVolume) => {
    shippingInfo.pcsPerCarton = pcsPerCarton
    shippingInfo.cartonVolume = cartonVolume
  }

  const calculateShippingInfo = (form, onCalculateCost) => {
    shippingInfo.cartons = null
    shippingInfo.cbm = null

    if (!form.quantity || form.quantity <= 0) return
    if (!shippingInfo.pcsPerCarton || shippingInfo.pcsPerCarton <= 0) return

    const exactCartons = form.quantity / shippingInfo.pcsPerCarton
    const cartons = Math.ceil(exactCartons)
    shippingInfo.cartons = cartons

    if (form.quantity % shippingInfo.pcsPerCarton !== 0) {
      // 除不尽时的逻辑已移至页面内提示，此处不再弹窗
    }
    // 计算 CBM
    if (shippingInfo.cartonVolume && shippingInfo.cartonVolume > 0) {
      const totalVolume = shippingInfo.cartonVolume * cartons
      const cbm = (totalVolume / CBM_DIVISOR).toFixed(1)
      shippingInfo.cbm = cbm

      // 内销：自动计算运费
      if (form.sales_type === 'domestic' && domesticCbmPrice.value && domesticCbmPrice.value > 0) {
        const ceiledCbm = Math.ceil(parseFloat(cbm))
        form.freight_total = Math.round(domesticCbmPrice.value * ceiledCbm * 100) / 100
      }
    }

    // FOB 深圳自动计算运费
    if (form.sales_type === 'export') {
      if (form.port_type === 'fob_shenzhen') {
        calculateFOBFreight(form, onCalculateCost)
      } else if (form.port_type === 'cif_shenzhen') {
        calculateCIFShenzhen(form, onCalculateCost)
      }
    }
  }

  const calculateFOBFreight = (form, onCalculateCost) => {
    freightCalculation.value = null

    if (form.sales_type !== 'export' || form.port_type !== 'fob_shenzhen') return

    // 整柜（FCL）
    if (form.shipping_method === 'fcl_20' || form.shipping_method === 'fcl_40') {
      const containerVolume = form.shipping_method === 'fcl_40' ? FCL_40_VOLUME : FCL_20_VOLUME
      const freightUSD = form.shipping_method === 'fcl_40'
        ? systemConfig.value.fcl40FreightUsd
        : systemConfig.value.fcl20FreightUsd

      const exchangeRate = systemConfig.value.fobShenzhenExchangeRate
      const totalFreight = freightUSD * exchangeRate

      let suggestedQuantity = null
      let maxCartons = null
      const cartonVolume = shippingInfo.cartonVolume || null
      const pcsPerCarton = shippingInfo.pcsPerCarton || null

      if (cartonVolume && cartonVolume > 0) {
        maxCartons = Math.floor(containerVolume / cartonVolume)
        if (pcsPerCarton && pcsPerCarton > 0) {
          suggestedQuantity = maxCartons * pcsPerCarton
          form.quantity = suggestedQuantity
          quantityUnit.value = 'carton'
          quantityInput.value = maxCartons
          shippingInfo.cartons = maxCartons
          shippingInfo.cbm = (cartonVolume * maxCartons / CBM_DIVISOR).toFixed(1)
        }
      }

      freightCalculation.value = {
        freightUSD, exchangeRate, totalFreight, containerVolume,
        cartonVolume, maxCartons, pcsPerCarton, suggestedQuantity
      }

      form.freight_total = totalFreight
      if (form.quantity && form.quantity > 0 && onCalculateCost) {
        onCalculateCost()
      }
      return
    }

    // 散货（LCL）
    if (form.shipping_method === 'lcl') {
      if (!shippingInfo.cbm || shippingInfo.cbm <= 0) return

      const cbm = parseFloat(shippingInfo.cbm)
      const ceiledCBM = Math.ceil(cbm)

      let baseFreight = 0
      if (ceiledCBM >= 1 && ceiledCBM <= 3) {
        baseFreight = systemConfig.value.lclBaseFreight1_3
      } else if (ceiledCBM > 3 && ceiledCBM <= 5) {
        baseFreight = systemConfig.value.lclBaseFreight3_5
      } else if (ceiledCBM > 5 && ceiledCBM <= 8) {
        baseFreight = systemConfig.value.lclBaseFreight5_8
      } else if (ceiledCBM > 8 && ceiledCBM <= 10) {
        baseFreight = systemConfig.value.lclBaseFreight8_10
      } else if (ceiledCBM > 10 && ceiledCBM <= 12) {
        baseFreight = systemConfig.value.lclBaseFreight10_12
      } else if (ceiledCBM > 12 && ceiledCBM <= 15) {
        baseFreight = systemConfig.value.lclBaseFreight12_15
      } else if (ceiledCBM > 15) {
        // CBM超过15，清空运费并返回
        form.freight_total = null
        freightCalculation.value = null
        return
      }

      const handlingCharge = systemConfig.value.lclHandlingCharge
      const cfs = systemConfig.value.lclCfsPerCbm * ceiledCBM
      const documentFee = systemConfig.value.lclDocumentFee
      const totalFreight = baseFreight + handlingCharge + cfs + documentFee

      freightCalculation.value = {
        cbm: cbm.toFixed(1), ceiledCBM, baseFreight,
        handlingCharge, cfs, documentFee, totalFreight
      }

      form.freight_total = totalFreight
      if (onCalculateCost) onCalculateCost()
    }
  }

  const calculateCIFShenzhen = (form, onCalculateCost) => {
    freightCalculation.value = null
    if (form.sales_type !== 'export' || form.port_type !== 'cif_shenzhen') return
    if (!shippingInfo.cbm || shippingInfo.cbm <= 0) return

    const cbm = parseFloat(shippingInfo.cbm)
    const ceiledCBM = Math.ceil(cbm)
    if (ceiledCBM > 15) {
      // CBM超过15，清空运费并返回
      form.freight_total = null
      freightCalculation.value = null
      return
    }

    const factory = currentFactory.value

    // 1. 海上运输费
    const cfs = systemConfig.value.cifShenzhenCfsPerCbm * ceiledCBM
    const docFee = systemConfig.value.cifShenzhenDocFee
    const customsFee = systemConfig.value.cifShenzhenCustomsFee
    const warehouseFee = systemConfig.value.cifShenzhenWarehouseFee

    const seaFreightUSDPerCbm = systemConfig.value.cifShenzhenSeafreightUsd
    const seaFreightUSDEstimated = seaFreightUSDPerCbm * ceiledCBM
    const exchangeRate = systemConfig.value.fobShenzhenExchangeRate
    const seaFreightCNY = seaFreightUSDEstimated * exchangeRate

    // 2. 运送到深圳港口费用
    let domesticTransportFee = 0
    if (factory === 'hubei_zhiteng') {
      const truckRate = systemConfig.value.cifHubeiTruckPerCbm
      domesticTransportFee = truckRate * ceiledCBM // 按 CBM 计算
    } else {
      // 东莞迅安，使用 LCL 分档基础运费
      if (ceiledCBM >= 1 && ceiledCBM <= 3) domesticTransportFee = systemConfig.value.lclBaseFreight1_3
      else if (ceiledCBM > 3 && ceiledCBM <= 5) domesticTransportFee = systemConfig.value.lclBaseFreight3_5
      else if (ceiledCBM > 5 && ceiledCBM <= 8) domesticTransportFee = systemConfig.value.lclBaseFreight5_8
      else if (ceiledCBM > 8 && ceiledCBM <= 10) domesticTransportFee = systemConfig.value.lclBaseFreight8_10
      else if (ceiledCBM > 10 && ceiledCBM <= 12) domesticTransportFee = systemConfig.value.lclBaseFreight10_12
      else if (ceiledCBM > 12 && ceiledCBM <= 15) domesticTransportFee = systemConfig.value.lclBaseFreight12_15
    }

    // 总运费
    const totalFreight = cfs + docFee + customsFee + warehouseFee + seaFreightCNY + domesticTransportFee

    freightCalculation.value = {
      cbm: cbm.toFixed(1), ceiledCBM, factory,
      cfs, docFee, customsFee, warehouseFee,
      seaFreightUSDPerCbm, seaFreightUSDEstimated, exchangeRate, seaFreightCNY,
      domesticTransportFee,
      totalFreight
    }

    form.freight_total = totalFreight
    if (onCalculateCost) onCalculateCost()
  }

  const onQuantityUnitChange = (form, onCalculateCost) => {
    if (!shippingInfo.pcsPerCarton) {
      quantityUnit.value = 'pcs'
      return
    }

    if (quantityUnit.value === 'carton') {
      if (form.quantity && form.quantity > 0) {
        quantityInput.value = Math.ceil(form.quantity / shippingInfo.pcsPerCarton)
        form.quantity = quantityInput.value * shippingInfo.pcsPerCarton
      }
    } else {
      quantityInput.value = form.quantity
    }

    calculateShippingInfo(form, onCalculateCost)
    if (onCalculateCost) onCalculateCost()
  }

  const onQuantityInputChange = (form, onCalculateCost) => {
    if (quantityUnit.value === 'carton' && shippingInfo.pcsPerCarton) {
      form.quantity = quantityInput.value * shippingInfo.pcsPerCarton
    } else {
      form.quantity = quantityInput.value
    }

    calculateShippingInfo(form, onCalculateCost)
    if (onCalculateCost) onCalculateCost()
  }

  const onDomesticCbmPriceChange = (form, onCalculateCost) => {
    if (domesticCbmPrice.value && domesticCbmPrice.value > 0 && shippingInfo.cbm) {
      const ceiledCbm = Math.ceil(parseFloat(shippingInfo.cbm))
      form.freight_total = Math.round(domesticCbmPrice.value * ceiledCbm * 100) / 100
    }
    if (onCalculateCost) onCalculateCost()
  }

  const onShippingMethodChange = (form, onCalculateCost) => {
    form.port_type = 'fob_shenzhen'
    form.port = ''
    freightCalculation.value = null
    calculateShippingInfo(form, onCalculateCost)
    if (form.sales_type === 'export') {
      if (form.shipping_method === 'fcl_20' || form.shipping_method === 'fcl_40') {
        calculateFOBFreight(form, onCalculateCost)
      } else if (form.shipping_method === 'cif_lcl') {
        form.port_type = 'cif_shenzhen'
        form.port = 'CIF深圳'
        calculateCIFShenzhen(form, onCalculateCost)
      }
    }
  }

  const onPortTypeChange = (form, onCalculateCost) => {
    if (form.port_type === 'fob_shenzhen') {
      form.port = 'FOB深圳'
      calculateShippingInfo(form, onCalculateCost)
      if (form.sales_type === 'export' && (form.shipping_method === 'fcl_20' || form.shipping_method === 'fcl_40')) {
        calculateFOBFreight(form, onCalculateCost)
      }
    } else if (form.port_type === 'cif_shenzhen') {
      form.port = 'CIF深圳'
      calculateShippingInfo(form, onCalculateCost)
      if (form.sales_type === 'export') {
        calculateCIFShenzhen(form, onCalculateCost)
      }
    } else {
      form.port = ''
      form.freight_total = null
      freightCalculation.value = null
    }
  }

  const resetShippingInfo = () => {
    shippingInfo.cartons = null
    shippingInfo.cbm = null
    freightCalculation.value = null
  }

  return {
    freightCalculation,
    systemConfig,
    shippingInfo,
    quantityUnit,
    quantityInput,
    domesticCbmPrice,
    currentFactory,
    loadSystemConfig,
    setShippingInfoFromConfig,
    calculateShippingInfo,
    calculateFOBFreight,
    calculateCIFShenzhen,
    onQuantityUnitChange,
    onQuantityInputChange,
    onDomesticCbmPriceChange,
    onShippingMethodChange,
    onPortTypeChange,
    resetShippingInfo
  }
}
