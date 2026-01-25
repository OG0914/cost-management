// CostAdd 组件常量配置
export const AUTO_SAVE_INTERVAL = 30000 // 自动保存间隔 30秒
export const MAX_LCL_CBM = 58 // 散货最大CBM阈值

// 默认表单数据结构
export const DEFAULT_FORM_DATA = {
  regulation_id: null,
  model_id: null,
  packaging_config_id: null,
  customer_name: '',
  customer_region: '',
  sales_type: 'domestic',
  shipping_method: '',
  port_type: 'fob_shenzhen',
  port: '',
  quantity: null,
  freight_total: null,
  include_freight_in_base: true,
  vat_rate: null,
  materials: [],
  processes: [],
  packaging: [],
  customFees: [],
  is_estimation: false,
  reference_standard_cost_id: null
}

// 默认明细行结构
export const DEFAULT_MATERIAL_ROW = {
  category: 'material',
  material_id: null,
  item_name: '',
  usage_amount: null,
  unit_price: null,
  subtotal: 0,
  is_changed: 1,
  from_standard: false,
  after_overhead: false
}

export const DEFAULT_PROCESS_ROW = {
  category: 'process',
  item_name: '',
  usage_amount: null,
  unit_price: null,
  subtotal: 0,
  is_changed: 1,
  from_standard: false
}

export const DEFAULT_PACKAGING_ROW = {
  category: 'packaging',
  material_id: null,
  item_name: '',
  usage_amount: null,
  unit_price: null,
  carton_volume: null,
  subtotal: 0,
  is_changed: 1,
  from_standard: false
}

// 常用地区列表
export const COMMON_REGIONS = ['广东', '浙江', '江苏', '上海', '北京', '福建', '山东', '四川', '湖北', '河南', '美国', '欧洲', '东南亚', '日本', '韩国']
