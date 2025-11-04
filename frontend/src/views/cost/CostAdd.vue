<template>
  <div class="cost-add-container">
    <el-card class="header-card">
      <div class="header-content">
        <div class="header-left">
          <el-button icon="ArrowLeft" @click="goBack">返回</el-button>
          <h2>{{ pageTitle }}</h2>
        </div>
      </div>
    </el-card>

    <el-form :model="form" :rules="rules" ref="formRef" label-width="120px" class="cost-form">
      <!-- 基本信息 -->
      <el-card class="form-section">
        <template #header>
          <span class="section-title">基本信息</span>
        </template>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="法规类别" prop="regulation_id">
              <el-select
                v-model="form.regulation_id"
                placeholder="请选择法规类别"
                @change="onRegulationChange"
                style="width: 100%"
                :disabled="isEditMode"
              >
                <el-option
                  v-for="reg in regulations"
                  :key="reg.id"
                  :label="reg.name"
                  :value="reg.id"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="型号配置" prop="packaging_config_id">
              <el-select
                v-model="form.packaging_config_id"
                placeholder="请选择型号和包装配置"
                @change="onPackagingConfigChange"
                style="width: 100%"
                :disabled="!form.regulation_id || isEditMode"
                filterable
              >
                <el-option
                  v-for="config in filteredPackagingConfigs"
                  :key="config.id"
                  :label="`${config.model_name} - ${config.config_name} (${config.pc_per_bag}pc/${config.bags_per_box}bags/${config.boxes_per_carton}boxes)`"
                  :value="config.id"
                >
                  <div style="display: flex; justify-content: space-between;">
                    <span><strong>{{ config.model_name }}</strong> - {{ config.config_name }}</span>
                    <span style="color: #8492a6; font-size: 12px;">
                      {{ config.pc_per_bag }}pc/{{ config.bags_per_box }}bags/{{ config.boxes_per_carton }}boxes
                    </span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户名称" prop="customer_name">
              <el-input v-model="form.customer_name" placeholder="请输入客户名称" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="客户地区" prop="customer_region">
              <el-input v-model="form.customer_region" placeholder="请输入客户地区" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="销售类型" prop="sales_type">
              <el-radio-group v-model="form.sales_type" @change="onSalesTypeChange">
                <el-radio label="domestic">内销</el-radio>
                <el-radio label="export">外销</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="购买数量" prop="quantity">
              <el-input-number
                v-model="form.quantity"
                :min="1"
                :precision="0"
                :controls="false"
                @change="onQuantityChange"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="运费总价" prop="freight_total">
              <el-input-number
                v-model="form.freight_total"
                :min="0"
                :precision="4"
                :controls="false"
                @change="calculateCost"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="运费计入成本" prop="include_freight_in_base">
              <el-radio-group v-model="form.include_freight_in_base" @change="calculateCost">
                <el-radio :label="true">是</el-radio>
                <el-radio :label="false">否</el-radio>
              </el-radio-group>
              <div style="color: #909399; font-size: 12px; margin-top: 5px;">
                选择"否"时，运费将在管销价基础上单独计算
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 原料明细 -->
      <el-card class="form-section">
        <template #header>
          <div class="section-header">
            <span class="section-title">原料明细</span>
            <div>
              <el-button type="primary" size="small" @click="addMaterialRow">添加原料</el-button>
            </div>
          </div>
        </template>

        <el-table :data="form.materials" border style="width: 100%">
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column label="原料名称" min-width="200">
            <template #default="{ row, $index }">
              <el-select
                v-model="row.material_id"
                filterable
                clearable
                placeholder="输入关键词搜索原料"
                @change="onMaterialSelect(row, $index)"
                style="width: 100%"
              >
                <el-option
                  v-for="material in allMaterials"
                  :key="material.id"
                  :label="`${material.name} (${material.item_no})`"
                  :value="material.id"
                >
                  <span>{{ material.name }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">
                    ¥{{ material.price }}/{{ material.unit }}
                  </span>
                </el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="用量" width="120">
            <template #default="{ row }">
              <el-input-number
                v-model="row.usage_amount"
                :min="0"
                :precision="4"
                :controls="false"
                @change="calculateItemSubtotal(row)"
                size="small"
                style="width: 100%"
              />
            </template>
          </el-table-column>
          <el-table-column label="单价" width="120">
            <template #default="{ row }">
              <span>{{ row.unit_price?.toFixed(4) || '0.0000' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="小计" width="120">
            <template #default="{ row }">
              <span>{{ row.subtotal?.toFixed(4) || '0.0000' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ $index }">
              <el-button type="danger" size="small" @click="removeMaterialRow($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="total-row">
          <span>原料总计：</span>
          <span class="total-value">{{ materialTotal.toFixed(4) }}</span>
        </div>
      </el-card>

      <!-- 工序明细 -->
      <el-card class="form-section">
        <template #header>
          <div class="section-header">
            <span class="section-title">工序明细</span>
            <div>
              <el-button 
                v-if="!editMode.processes && form.processes.some(p => p.from_standard)" 
                type="warning" 
                size="small" 
                @click="toggleEditMode('processes')"
              >
                解锁编辑
              </el-button>
              <el-button 
                v-if="editMode.processes" 
                type="success" 
                size="small" 
                @click="toggleEditMode('processes')"
              >
                锁定编辑
              </el-button>
              <el-button type="primary" size="small" @click="addProcessRow">添加工序</el-button>
            </div>
          </div>
        </template>

        <el-table :data="form.processes" border style="width: 100%">
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column label="工序名称" min-width="150">
            <template #default="{ row }">
              <el-input 
                v-model="row.item_name" 
                @change="calculateItemSubtotal(row)"
                :disabled="row.from_standard && !editMode.processes"
              />
            </template>
          </el-table-column>
          <el-table-column label="用量" width="120">
            <template #default="{ row }">
              <el-input-number
                v-model="row.usage_amount"
                :min="0"
                :precision="4"
                :controls="false"
                @change="calculateItemSubtotal(row)"
                size="small"
                style="width: 100%"
                :disabled="row.from_standard && !editMode.processes"
              />
            </template>
          </el-table-column>
          <el-table-column label="单价" width="120">
            <template #default="{ row }">
              <el-input-number
                v-model="row.unit_price"
                :min="0"
                :precision="4"
                :controls="false"
                @change="calculateItemSubtotal(row)"
                size="small"
                style="width: 100%"
                :disabled="row.from_standard && !editMode.processes"
              />
            </template>
          </el-table-column>
          <el-table-column label="小计" width="120">
            <template #default="{ row }">
              <span>{{ row.subtotal.toFixed(4) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ $index, row }">
              <el-button 
                type="danger" 
                size="small" 
                @click="removeProcessRow($index)"
                :disabled="row.from_standard && !editMode.processes"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="total-row">
          <span>工序总计：</span>
          <span class="total-value">{{ processTotal.toFixed(4) }}</span>
        </div>
      </el-card>

      <!-- 包材明细 -->
      <el-card class="form-section">
        <template #header>
          <div class="section-header">
            <span class="section-title">包材明细</span>
            <div>
              <el-button 
                v-if="!editMode.packaging && form.packaging.some(p => p.from_standard)" 
                type="warning" 
                size="small" 
                @click="toggleEditMode('packaging')"
              >
                解锁编辑
              </el-button>
              <el-button 
                v-if="editMode.packaging" 
                type="success" 
                size="small" 
                @click="toggleEditMode('packaging')"
              >
                锁定编辑
              </el-button>
              <el-button type="primary" size="small" @click="addPackagingRow">添加包材</el-button>
            </div>
          </div>
        </template>

        <el-table :data="form.packaging" border style="width: 100%">
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column label="包材名称" min-width="200">
            <template #default="{ row, $index }">
              <el-select
                v-if="!row.from_standard || editMode.packaging"
                v-model="row.material_id"
                filterable
                clearable
                placeholder="输入关键词搜索原料"
                @change="onPackagingMaterialSelect(row, $index)"
                style="width: 100%"
              >
                <el-option
                  v-for="material in allMaterials"
                  :key="material.id"
                  :label="`${material.name} (${material.item_no})`"
                  :value="material.id"
                >
                  <span>{{ material.name }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">
                    ¥{{ material.price }}/{{ material.unit }}
                  </span>
                </el-option>
              </el-select>
              <span v-else>{{ row.item_name }}</span>
            </template>
          </el-table-column>
          <el-table-column label="用量" width="120">
            <template #default="{ row }">
              <el-input-number
                v-model="row.usage_amount"
                :min="0"
                :precision="4"
                :controls="false"
                @change="calculateItemSubtotal(row)"
                size="small"
                style="width: 100%"
                :disabled="row.from_standard && !editMode.packaging"
              />
            </template>
          </el-table-column>
          <el-table-column label="单价" width="120">
            <template #default="{ row }">
              <span>{{ row.unit_price?.toFixed(4) || '0.0000' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="小计" width="120">
            <template #default="{ row }">
              <span>{{ row.subtotal?.toFixed(4) || '0.0000' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ $index, row }">
              <el-button 
                type="danger" 
                size="small" 
                @click="removePackagingRow($index)"
                :disabled="row.from_standard && !editMode.packaging"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="total-row">
          <span>包材总计：</span>
          <span class="total-value">{{ packagingTotal.toFixed(4) }}</span>
        </div>
      </el-card>

      <!-- 成本计算结果 -->
      <el-card class="form-section" v-if="calculation">
        <template #header>
          <span class="section-title">成本计算</span>
        </template>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="运费成本（每片）">
            {{ calculation.freightCost?.toFixed(4) || '0.0000' }}
          </el-descriptions-item>
          <el-descriptions-item label="基础成本价">
            {{ calculation.baseCost?.toFixed(4) || '0.0000' }}
          </el-descriptions-item>
          <el-descriptions-item label="管销价">
            {{ calculation.overheadPrice?.toFixed(4) || '0.0000' }}
          </el-descriptions-item>
          <el-descriptions-item label="汇率（CNY/USD）" v-if="form.sales_type === 'export'">
            {{ calculation.exchangeRate || '7.2000' }}
          </el-descriptions-item>
          <el-descriptions-item :label="form.sales_type === 'domestic' ? '最终成本价（含13%增值税）' : '最终成本价（不含增值税）'">
            <span v-if="form.sales_type === 'domestic'">
              {{ calculation.domesticPrice?.toFixed(4) || '0.0000' }} CNY
            </span>
            <span v-else>
              {{ calculation.insurancePrice?.toFixed(4) || '0.0000' }} USD
            </span>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 利润区间报价表 -->
        <div class="profit-tiers" v-if="calculation.profitTiers">
          <h4>利润区间报价</h4>
          <el-table :data="calculation.profitTiers" border style="width: 100%">
            <el-table-column label="利润率" prop="profitPercentage" width="120" />
            <el-table-column label="报价" width="150">
              <template #default="{ row }">
                {{ row.price.toFixed(4) }} {{ calculation.currency }}
              </template>
            </el-table-column>
            <el-table-column label="说明">
              <template #default="{ row }">
                在基础价格上增加 {{ row.profitPercentage }} 利润
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>

      <!-- 操作按钮 -->
      <el-card class="form-section">
        <div class="button-group">
          <el-button @click="goBack">取消</el-button>
          <el-button type="info" @click="saveDraft" :loading="saving">保存草稿</el-button>
          <el-button type="primary" @click="submitQuotation" :loading="submitting">提交审核</el-button>
        </div>
      </el-card>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import request from '@/utils/request'

const router = useRouter()
const route = useRoute()
const formRef = ref(null)

// 是否编辑模式
const isEditMode = computed(() => {
  return !!route.params.id
})

// 页面标题
const pageTitle = computed(() => {
  if (route.params.id) {
    return '编辑报价单'
  } else if (route.query.copyFrom) {
    return '复制报价单'
  } else {
    return '新增报价单'
  }
})

// 表单数据
const form = reactive({
  regulation_id: null,
  model_id: null,
  packaging_config_id: null,
  customer_name: '',
  customer_region: '',
  sales_type: 'domestic',
  quantity: 1000,
  freight_total: 0,
  include_freight_in_base: true,
  materials: [],
  processes: [],
  packaging: []
})

// 编辑状态控制
const editMode = reactive({
  materials: false,
  processes: false,
  packaging: false
})

// 原料库数据（用于搜索选择）
const allMaterials = ref([])

// 表单验证规则
const rules = {
  regulation_id: [{ required: true, message: '请选择法规类别', trigger: 'change' }],
  packaging_config_id: [{ required: true, message: '请选择型号配置', trigger: 'change' }],
  customer_name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  customer_region: [{ required: true, message: '请输入客户地区', trigger: 'blur' }],
  sales_type: [{ required: true, message: '请选择销售类型', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入购买数量', trigger: 'blur' }],
  freight_total: [{ required: true, message: '请输入运费总价', trigger: 'blur' }]
}

// 数据列表
const regulations = ref([])
const packagingConfigs = ref([])
const calculation = ref(null)
const saving = ref(false)
const submitting = ref(false)

// 过滤后的包装配置列表
const filteredPackagingConfigs = computed(() => {
  if (!form.regulation_id) return []
  return packagingConfigs.value.filter(c => c.regulation_id === form.regulation_id)
})

// 计算总计
const materialTotal = computed(() => {
  return form.materials.reduce((sum, item) => sum + item.subtotal, 0)
})

const processTotal = computed(() => {
  // 工序总和（显示时乘以1.56系数，但发送给后端时使用原始值）
  const sum = form.processes.reduce((sum, item) => sum + item.subtotal, 0)
  return sum * 1.56
})

const packagingTotal = computed(() => {
  return form.packaging.reduce((sum, item) => sum + item.subtotal, 0)
})

// 加载法规列表
const loadRegulations = async () => {
  try {
    const res = await request.get('/regulations')
    if (res.success) {
      regulations.value = res.data
    }
  } catch (error) {
    console.error('加载法规列表失败:', error)
  }
}

// 加载包装配置列表
const loadPackagingConfigs = async () => {
  try {
    const res = await request.get('/cost/packaging-configs')
    if (res.success) {
      packagingConfigs.value = res.data
    }
  } catch (error) {
    console.error('加载包装配置列表失败:', error)
  }
}

// 法规变化
const onRegulationChange = () => {
  form.packaging_config_id = null
  form.model_id = null
  form.materials = []
  form.processes = []
  form.packaging = []
  calculation.value = null
}

// 包装配置变化 - 加载该配置的工序和包材
const onPackagingConfigChange = async () => {
  if (!form.packaging_config_id) return

  console.log('开始加载包装配置数据，config_id:', form.packaging_config_id)

  try {
    const res = await request.get(`/cost/packaging-configs/${form.packaging_config_id}/details`)
    console.log('接口返回数据:', res)
    
    if (res.success) {
      const { config, processes, materials } = res.data
      
      // 设置 model_id
      form.model_id = config.model_id
      
      console.log('工序数据:', processes)
      console.log('包材数据:', materials)

      // 加载工序
      form.processes = (processes || []).map(p => ({
        category: 'process',
        item_name: p.process_name,
        usage_amount: 1,
        unit_price: p.unit_price || 0,
        subtotal: p.unit_price || 0,
        is_changed: 0,
        from_standard: true // 标记为标准数据
      }))

      // 加载包材
      form.packaging = (materials || []).map(m => ({
        category: 'packaging',
        item_name: m.material_name,
        usage_amount: m.basic_usage || 0,
        unit_price: m.unit_price || 0,
        subtotal: (m.basic_usage && m.basic_usage !== 0) ? (m.unit_price || 0) / m.basic_usage : 0,
        is_changed: 0,
        from_standard: true // 标记为标准数据
      }))

      console.log('加载后的工序:', form.processes)
      console.log('加载后的包材:', form.packaging)

      // 重置编辑状态
      editMode.processes = false
      editMode.packaging = false

      // 自动计算
      calculateCost()
      
      if (form.processes.length > 0 || form.packaging.length > 0) {
        ElMessage.success(`已加载 ${config.config_name}：${form.processes.length} 个工序和 ${form.packaging.length} 个包材`)
      } else {
        ElMessage.warning('该配置暂无绑定的工序和包材数据')
      }
    } else {
      ElMessage.error(res.message || '加载失败')
    }
  } catch (error) {
    console.error('加载包装配置数据失败:', error)
    ElMessage.error('加载包装配置数据失败: ' + (error.message || '未知错误'))
  }
}

// 销售类型变化
const onSalesTypeChange = () => {
  calculateCost()
}

// 数量变化
const onQuantityChange = () => {
  calculateCost()
}

// 计算明细小计
const calculateItemSubtotal = (row) => {
  if (row.category === 'packaging') {
    // 包材：单价 / 基本用量
    row.subtotal = (row.usage_amount && row.usage_amount !== 0) 
      ? (row.unit_price || 0) / row.usage_amount 
      : 0
  } else {
    // 原料和工序：用量 * 单价
    row.subtotal = (row.usage_amount || 0) * (row.unit_price || 0)
  }
  calculateCost()
}

// 原料选择处理
const onMaterialSelect = (row, index) => {
  if (!row.material_id) {
    row.item_name = ''
    row.unit_price = 0
    row.usage_amount = 0
    row.subtotal = 0
    return
  }
  
  const material = allMaterials.value.find(m => m.id === row.material_id)
  if (material) {
    row.item_name = material.name
    row.unit_price = material.price
    row.usage_amount = row.usage_amount || 0
    calculateItemSubtotal(row)
  }
}

// 包材原料选择处理
const onPackagingMaterialSelect = (row, index) => {
  if (!row.material_id) {
    row.item_name = ''
    row.unit_price = 0
    row.usage_amount = 0
    row.subtotal = 0
    return
  }
  
  const material = allMaterials.value.find(m => m.id === row.material_id)
  if (material) {
    row.item_name = material.name
    row.unit_price = material.price
    row.usage_amount = row.usage_amount || 0
    calculateItemSubtotal(row)
  }
}

// 添加行
const addMaterialRow = () => {
  form.materials.push({
    category: 'material',
    material_id: null,
    item_name: '',
    usage_amount: 0,
    unit_price: 0,
    subtotal: 0,
    is_changed: 1,
    from_standard: false
  })
}

const addProcessRow = () => {
  form.processes.push({
    category: 'process',
    item_name: '',
    usage_amount: 1,
    unit_price: 0,
    subtotal: 0,
    is_changed: 1,
    from_standard: false
  })
}

const addPackagingRow = () => {
  form.packaging.push({
    category: 'packaging',
    material_id: null,
    item_name: '',
    usage_amount: 0,
    unit_price: 0,
    subtotal: 0,
    is_changed: 1,
    from_standard: false
  })
}

// 删除行
const removeMaterialRow = (index) => {
  form.materials.splice(index, 1)
  calculateCost()
}

const removeProcessRow = (index) => {
  form.processes.splice(index, 1)
  calculateCost()
}

const removePackagingRow = (index) => {
  form.packaging.splice(index, 1)
  calculateCost()
}

// 计算成本
const calculateCost = async () => {
  if (!form.quantity || form.quantity <= 0) return

  const items = [
    ...form.materials,
    ...form.processes,
    ...form.packaging
  ]

  if (items.length === 0) return

  try {
    const res = await request.post('/cost/calculate', {
      quantity: form.quantity,
      freight_total: form.freight_total || 0,
      sales_type: form.sales_type,
      include_freight_in_base: form.include_freight_in_base,
      items
    })

    if (res.success) {
      calculation.value = res.data
    }
  } catch (error) {
    console.error('计算成本失败:', error)
  }
}

// 保存草稿
const saveDraft = async () => {
  try {
    await formRef.value.validate()

    const items = [
      ...form.materials,
      ...form.processes,
      ...form.packaging
    ]

    if (items.length === 0) {
      ElMessage.warning('请至少添加一项明细')
      return
    }

    saving.value = true

    const quotationId = route.params.id
    
    if (quotationId) {
      // 编辑模式：更新报价单
      const res = await request.put(`/cost/quotations/${quotationId}`, {
        customer_name: form.customer_name,
        customer_region: form.customer_region,
        packaging_config_id: form.packaging_config_id,
        quantity: form.quantity,
        freight_total: form.freight_total || 0,
        sales_type: form.sales_type,
        include_freight_in_base: form.include_freight_in_base,
        items
      })

      if (res.success) {
        ElMessage.success('更新成功')
        router.push('/cost/records')
      }
    } else {
      // 新增模式：创建报价单
      const res = await request.post('/cost/quotations', {
        customer_name: form.customer_name,
        customer_region: form.customer_region,
        model_id: form.model_id,
        regulation_id: form.regulation_id,
        packaging_config_id: form.packaging_config_id,
        quantity: form.quantity,
        freight_total: form.freight_total || 0,
        sales_type: form.sales_type,
        include_freight_in_base: form.include_freight_in_base,
        items
      })

      if (res.success) {
        ElMessage.success('保存成功')
        router.push('/cost/records')
      }
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 提交审核
const submitQuotation = async () => {
  try {
    await formRef.value.validate()

    const items = [
      ...form.materials,
      ...form.processes,
      ...form.packaging
    ]

    if (items.length === 0) {
      ElMessage.warning('请至少添加一项明细')
      return
    }

    submitting.value = true

    const quotationId = route.params.id
    
    if (quotationId) {
      // 编辑模式：先更新，再提交
      const updateRes = await request.put(`/cost/quotations/${quotationId}`, {
        customer_name: form.customer_name,
        customer_region: form.customer_region,
        packaging_config_id: form.packaging_config_id,
        quantity: form.quantity,
        freight_total: form.freight_total || 0,
        sales_type: form.sales_type,
        include_freight_in_base: form.include_freight_in_base,
        items
      })

      if (updateRes.success) {
        // 提交审核
        const submitRes = await request.post(`/cost/quotations/${quotationId}/submit`)
        
        if (submitRes.success) {
          ElMessage.success('提交成功')
          router.push('/cost/records')
        }
      }
    } else {
      // 新增模式：先创建，再提交
      const createRes = await request.post('/cost/quotations', {
        customer_name: form.customer_name,
        customer_region: form.customer_region,
        model_id: form.model_id,
        regulation_id: form.regulation_id,
        packaging_config_id: form.packaging_config_id,
        quantity: form.quantity,
        freight_total: form.freight_total || 0,
        sales_type: form.sales_type,
        include_freight_in_base: form.include_freight_in_base,
        items
      })

      if (createRes.success) {
        // 提交审核
        const submitRes = await request.post(`/cost/quotations/${createRes.data.quotation.id}/submit`)
        
        if (submitRes.success) {
          ElMessage.success('提交成功')
          router.push('/cost/records')
        }
      }
    }
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('提交失败')
  } finally {
    submitting.value = false
  }
}

// 返回
const goBack = () => {
  router.back()
}

// 加载原料库
const loadAllMaterials = async () => {
  try {
    const res = await request.get('/materials')
    if (res.success) {
      allMaterials.value = res.data
    }
  } catch (error) {
    console.error('加载原料库失败:', error)
  }
}

// 切换编辑模式
const toggleEditMode = (section) => {
  editMode[section] = !editMode[section]
  if (editMode[section]) {
    ElMessage.info(`${section === 'materials' ? '原料' : section === 'processes' ? '工序' : '包材'}明细已解锁，可以编辑`)
  }
}

// 加载报价单数据（用于编辑和复制）
const loadQuotationData = async (id, isCopy = false) => {
  try {
    const res = await request.get(`/cost/quotations/${id}`)
    
    if (res.success) {
      const { quotation, items } = res.data
      
      // 填充基本信息
      form.regulation_id = quotation.regulation_id
      form.packaging_config_id = quotation.packaging_config_id || null
      form.model_id = quotation.model_id
      form.customer_name = isCopy ? `${quotation.customer_name}（复制）` : quotation.customer_name
      form.customer_region = quotation.customer_region
      form.sales_type = quotation.sales_type
      form.quantity = quotation.quantity
      form.freight_total = quotation.freight_total
      form.include_freight_in_base = quotation.include_freight_in_base !== false
      
      // 填充明细数据 - 保留完整的数据结构
      form.materials = items.material.items.map(item => ({
        category: 'material',
        material_id: item.material_id || null,
        item_name: item.item_name,
        usage_amount: item.usage_amount,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        is_changed: item.is_changed || 0,
        from_standard: false
      }))
      
      form.processes = items.process.items.map(item => ({
        category: 'process',
        item_name: item.item_name,
        usage_amount: item.usage_amount,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        is_changed: item.is_changed || 0,
        from_standard: false
      }))
      
      form.packaging = items.packaging.items.map(item => ({
        category: 'packaging',
        material_id: item.material_id || null,
        item_name: item.item_name,
        usage_amount: item.usage_amount,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        is_changed: item.is_changed || 0,
        from_standard: false
      }))
      
      // 尝试从原料库匹配原料ID（如果没有的话）
      form.materials.forEach(material => {
        if (!material.material_id) {
          const found = allMaterials.value.find(m => m.name === material.item_name)
          if (found) {
            material.material_id = found.id
          }
        }
      })
      
      // 尝试从原料库匹配包材ID（如果没有的话）
      form.packaging.forEach(pkg => {
        if (!pkg.material_id) {
          const found = allMaterials.value.find(m => m.name === pkg.item_name)
          if (found) {
            pkg.material_id = found.id
          }
        }
      })
      
      // 计算成本
      calculateCost()
      
      if (isCopy) {
        ElMessage.success('报价单数据已复制，请修改后保存')
      } else {
        ElMessage.success('报价单数据已加载')
      }
    }
  } catch (error) {
    console.error('加载报价单数据失败:', error)
    ElMessage.error('加载报价单数据失败')
  }
}

// 初始化
onMounted(async () => {
  await loadRegulations()
  await loadPackagingConfigs()
  await loadAllMaterials()
  
  // 检查是否是编辑模式
  if (route.params.id) {
    const id = route.params.id
    await loadQuotationData(id, false)
  }
  // 检查是否是复制模式
  else if (route.query.copyFrom) {
    const id = route.query.copyFrom
    await loadQuotationData(id, true)
  }
})
</script>

<style scoped>
.cost-add-container {
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-left h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.form-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-row {
  margin-top: 10px;
  text-align: right;
  font-size: 16px;
  font-weight: bold;
}

.total-value {
  color: #409eff;
  margin-left: 10px;
}

.profit-tiers {
  margin-top: 20px;
}

.profit-tiers h4 {
  margin-bottom: 10px;
  color: #303133;
}

.button-group {
  display: flex;
  justify-content: center;
  gap: 20px;
}

:deep(.el-input-number) {
  width: 100%;
}
</style>
