<template>
  <div class="cost-add-container">
    <el-card class="header-card">
      <div class="header-content">
        <div class="header-left">
          <el-button icon="ArrowLeft" @click="goBack">返回</el-button>
          <h2>新增报价单</h2>
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
            <el-form-item label="产品型号" prop="model_id">
              <el-select
                v-model="form.model_id"
                placeholder="请选择产品型号"
                @change="onModelChange"
                style="width: 100%"
                :disabled="!form.regulation_id"
              >
                <el-option
                  v-for="model in filteredModels"
                  :key="model.id"
                  :label="model.model_name"
                  :value="model.id"
                />
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
              <el-select v-model="form.customer_region" placeholder="请选择客户地区" style="width: 100%">
                <el-option label="华东" value="华东" />
                <el-option label="华南" value="华南" />
                <el-option label="华北" value="华北" />
                <el-option label="华中" value="华中" />
                <el-option label="西南" value="西南" />
                <el-option label="西北" value="西北" />
                <el-option label="东北" value="东北" />
              </el-select>
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
                :step="100"
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
                :precision="2"
                @change="calculateCost"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 原料明细 -->
      <el-card class="form-section">
        <template #header>
          <div class="section-header">
            <span class="section-title">原料明细</span>
            <el-button type="primary" size="small" @click="addMaterialRow">添加原料</el-button>
          </div>
        </template>

        <el-table :data="form.materials" border style="width: 100%">
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column label="原料名称" min-width="150">
            <template #default="{ row }">
              <el-input v-model="row.item_name" @change="calculateItemSubtotal(row)" />
            </template>
          </el-table-column>
          <el-table-column label="用量" width="120">
            <template #default="{ row }">
              <el-input-number
                v-model="row.usage_amount"
                :min="0"
                :precision="2"
                @change="calculateItemSubtotal(row)"
                size="small"
                style="width: 100%"
              />
            </template>
          </el-table-column>
          <el-table-column label="单价" width="120">
            <template #default="{ row }">
              <el-input-number
                v-model="row.unit_price"
                :min="0"
                :precision="2"
                @change="calculateItemSubtotal(row)"
                size="small"
                style="width: 100%"
              />
            </template>
          </el-table-column>
          <el-table-column label="小计" width="120">
            <template #default="{ row }">
              <span>{{ row.subtotal.toFixed(2) }}</span>
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
          <span class="total-value">{{ materialTotal.toFixed(2) }}</span>
        </div>
      </el-card>

      <!-- 工序明细 -->
      <el-card class="form-section">
        <template #header>
          <div class="section-header">
            <span class="section-title">工序明细</span>
            <el-button type="primary" size="small" @click="addProcessRow">添加工序</el-button>
          </div>
        </template>

        <el-table :data="form.processes" border style="width: 100%">
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column label="工序名称" min-width="150">
            <template #default="{ row }">
              <el-input v-model="row.item_name" @change="calculateItemSubtotal(row)" />
            </template>
          </el-table-column>
          <el-table-column label="用量" width="120">
            <template #default="{ row }">
              <el-input-number
                v-model="row.usage_amount"
                :min="0"
                :precision="2"
                @change="calculateItemSubtotal(row)"
                size="small"
                style="width: 100%"
              />
            </template>
          </el-table-column>
          <el-table-column label="单价" width="120">
            <template #default="{ row }">
              <el-input-number
                v-model="row.unit_price"
                :min="0"
                :precision="2"
                @change="calculateItemSubtotal(row)"
                size="small"
                style="width: 100%"
              />
            </template>
          </el-table-column>
          <el-table-column label="小计" width="120">
            <template #default="{ row }">
              <span>{{ row.subtotal.toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ $index }">
              <el-button type="danger" size="small" @click="removeProcessRow($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="total-row">
          <span>工序总计：</span>
          <span class="total-value">{{ processTotal.toFixed(2) }}</span>
        </div>
      </el-card>

      <!-- 包材明细 -->
      <el-card class="form-section">
        <template #header>
          <div class="section-header">
            <span class="section-title">包材明细</span>
            <el-button type="primary" size="small" @click="addPackagingRow">添加包材</el-button>
          </div>
        </template>

        <el-table :data="form.packaging" border style="width: 100%">
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column label="包材名称" min-width="150">
            <template #default="{ row }">
              <el-input v-model="row.item_name" @change="calculateItemSubtotal(row)" />
            </template>
          </el-table-column>
          <el-table-column label="用量" width="120">
            <template #default="{ row }">
              <el-input-number
                v-model="row.usage_amount"
                :min="0"
                :precision="2"
                @change="calculateItemSubtotal(row)"
                size="small"
                style="width: 100%"
              />
            </template>
          </el-table-column>
          <el-table-column label="单价" width="120">
            <template #default="{ row }">
              <el-input-number
                v-model="row.unit_price"
                :min="0"
                :precision="2"
                @change="calculateItemSubtotal(row)"
                size="small"
                style="width: 100%"
              />
            </template>
          </el-table-column>
          <el-table-column label="小计" width="120">
            <template #default="{ row }">
              <span>{{ row.subtotal.toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ $index }">
              <el-button type="danger" size="small" @click="removePackagingRow($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="total-row">
          <span>包材总计：</span>
          <span class="total-value">{{ packagingTotal.toFixed(2) }}</span>
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
          <el-descriptions-item label="最终价格" v-if="form.sales_type === 'domestic'">
            {{ calculation.domesticPrice?.toFixed(4) || '0.0000' }} CNY
          </el-descriptions-item>
          <el-descriptions-item label="外销价" v-if="form.sales_type === 'export'">
            {{ calculation.exportPrice?.toFixed(4) || '0.0000' }} USD
          </el-descriptions-item>
          <el-descriptions-item label="保险价" v-if="form.sales_type === 'export'">
            {{ calculation.insurancePrice?.toFixed(4) || '0.0000' }} USD
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
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import request from '@/utils/request'

const router = useRouter()
const formRef = ref(null)

// 表单数据
const form = reactive({
  regulation_id: null,
  model_id: null,
  customer_name: '',
  customer_region: '',
  sales_type: 'domestic',
  quantity: 1000,
  freight_total: 0,
  materials: [],
  processes: [],
  packaging: []
})

// 表单验证规则
const rules = {
  regulation_id: [{ required: true, message: '请选择法规类别', trigger: 'change' }],
  model_id: [{ required: true, message: '请选择产品型号', trigger: 'change' }],
  customer_name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  customer_region: [{ required: true, message: '请选择客户地区', trigger: 'change' }],
  sales_type: [{ required: true, message: '请选择销售类型', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入购买数量', trigger: 'blur' }],
  freight_total: [{ required: true, message: '请输入运费总价', trigger: 'blur' }]
}

// 数据列表
const regulations = ref([])
const models = ref([])
const calculation = ref(null)
const saving = ref(false)
const submitting = ref(false)

// 过滤后的型号列表
const filteredModels = computed(() => {
  if (!form.regulation_id) return []
  return models.value.filter(m => m.regulation_id === form.regulation_id)
})

// 计算总计
const materialTotal = computed(() => {
  return form.materials.reduce((sum, item) => sum + item.subtotal, 0)
})

const processTotal = computed(() => {
  return form.processes.reduce((sum, item) => sum + item.subtotal, 0)
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

// 加载型号列表
const loadModels = async () => {
  try {
    const res = await request.get('/models')
    if (res.success) {
      models.value = res.data
    }
  } catch (error) {
    console.error('加载型号列表失败:', error)
  }
}

// 法规变化
const onRegulationChange = () => {
  form.model_id = null
  form.materials = []
  form.processes = []
  form.packaging = []
  calculation.value = null
}

// 型号变化 - 加载标准数据
const onModelChange = async () => {
  if (!form.model_id) return

  try {
    const res = await request.get(`/cost/models/${form.model_id}/standard-data`)
    if (res.success) {
      const { materials, processes, packaging } = res.data

      // 加载原料
      form.materials = materials.map(m => ({
        category: 'material',
        item_name: m.name,
        usage_amount: m.usage_amount || 0,
        unit_price: m.price || 0,
        subtotal: (m.usage_amount || 0) * (m.price || 0),
        is_changed: 0
      }))

      // 加载工序
      form.processes = processes.map(p => ({
        category: 'process',
        item_name: p.name,
        usage_amount: 1,
        unit_price: p.price || 0,
        subtotal: p.price || 0,
        is_changed: 0
      }))

      // 加载包材
      form.packaging = packaging.map(p => ({
        category: 'packaging',
        item_name: p.name,
        usage_amount: p.usage_amount || 0,
        unit_price: p.price || 0,
        subtotal: (p.usage_amount || 0) * (p.price || 0),
        is_changed: 0
      }))

      // 自动计算
      calculateCost()
    }
  } catch (error) {
    console.error('加载型号标准数据失败:', error)
    ElMessage.error('加载型号标准数据失败')
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
  row.subtotal = (row.usage_amount || 0) * (row.unit_price || 0)
  calculateCost()
}

// 添加行
const addMaterialRow = () => {
  form.materials.push({
    category: 'material',
    item_name: '',
    usage_amount: 0,
    unit_price: 0,
    subtotal: 0,
    is_changed: 1
  })
}

const addProcessRow = () => {
  form.processes.push({
    category: 'process',
    item_name: '',
    usage_amount: 1,
    unit_price: 0,
    subtotal: 0,
    is_changed: 1
  })
}

const addPackagingRow = () => {
  form.packaging.push({
    category: 'packaging',
    item_name: '',
    usage_amount: 0,
    unit_price: 0,
    subtotal: 0,
    is_changed: 1
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

    const res = await request.post('/cost/quotations', {
      customer_name: form.customer_name,
      customer_region: form.customer_region,
      model_id: form.model_id,
      regulation_id: form.regulation_id,
      quantity: form.quantity,
      freight_total: form.freight_total || 0,
      sales_type: form.sales_type,
      items
    })

    if (res.success) {
      ElMessage.success('保存成功')
      router.push('/cost/records')
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

    // 先创建报价单
    const createRes = await request.post('/cost/quotations', {
      customer_name: form.customer_name,
      customer_region: form.customer_region,
      model_id: form.model_id,
      regulation_id: form.regulation_id,
      quantity: form.quantity,
      freight_total: form.freight_total || 0,
      sales_type: form.sales_type,
      items
    })

    if (createRes.success) {
      // 再提交审核
      const submitRes = await request.post(`/cost/quotations/${createRes.data.quotation.id}/submit`)
      
      if (submitRes.success) {
        ElMessage.success('提交成功')
        router.push('/cost/records')
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

// 初始化
onMounted(() => {
  loadRegulations()
  loadModels()
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
