<template>
  <div class="material-manage">
    <CostPageHeader :title="currentTitle" :show-back="false">
      <template #actions>
        <div class="toolbar-wrapper">
          <el-button class="toolbar-toggle" :icon="showToolbar ? CaretRight : CaretLeft" circle @click="showToolbar = !showToolbar" :title="showToolbar ? '收起工具栏' : '展开工具栏'" />
          <transition name="toolbar-fade">
            <el-space v-if="showToolbar">
              <ActionButton type="download" @click="handleDownloadTemplate">下载模板</ActionButton>
              <el-upload action="#" :auto-upload="false" :on-change="handleFileChange" :show-file-list="false" accept=".xlsx,.xls">
                <ActionButton type="import">导入Excel</ActionButton>
              </el-upload>
              <ActionButton type="export" @click="handleExport">导出Excel</ActionButton>
              <ActionButton type="delete" :disabled="selectedMaterials.length === 0" @click="handleBatchDelete">批量删除</ActionButton>
              <ActionButton type="add" @click="handleAdd">新增原料</ActionButton>
            </el-space>
          </transition>
        </div>
      </template>
    </CostPageHeader>

    <el-card>
      <!-- 筛选区域 -->
      <div class="filter-container">
        <!-- 搜索框 -->
        <div class="search-row">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索品号、名称、厂商"
            clearable
            @input="handleSearch"
            style="width: 300px"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </div>

        <!-- 子分类筛选（仅在特定类型下显示） -->
        <div v-if="currentType" class="category-row">
          <el-radio-group 
            v-model="currentSubcategory" 
            @change="handleSubcategoryChange" 
            size="default"
          >
            <el-radio-button label="">全部</el-radio-button>
            <el-radio-button 
              v-for="sub in (currentType === 'half_mask' ? categoryStructure.half_mask : categoryStructure.general)" 
              :key="sub" 
              :label="sub"
             >
              {{ sub }}
            </el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <el-table 
        :data="tableData" 
        border 
        stripe 
        v-loading="loading" 
        @selection-change="handleSelectionChange" 
        empty-text="暂无原料数据"
      >
        <el-table-column type="selection" width="55" align="center" />
        
        <!-- 半面罩类视图 -->
        <template v-if="isHalfMaskView">
           <el-table-column prop="item_no" label="品号" width="120" />
           <el-table-column prop="name" label="原料名称" width="200" show-overflow-tooltip />
           <el-table-column prop="product_desc" label="绑定型号" width="160" show-overflow-tooltip />
           <el-table-column prop="packaging_mode" label="包装方式" width="100" />
           <el-table-column prop="supplier" label="供应商" width="150" show-overflow-tooltip />
           <el-table-column prop="usage_amount" label="用量" width="80" />
           <el-table-column prop="price" label="单价" width="100" sortable>
             <template #default="{ row }">{{ formatMoney(row.price, row.currency) }}</template>
           </el-table-column>
           <el-table-column prop="currency" label="币别" width="70" align="center" />
           <el-table-column prop="unit" label="单位" width="70" align="center" />
           <el-table-column prop="production_cycle" label="生产周期" width="100" />
           <el-table-column prop="moq" label="MOQ" width="80" />
        </template>

        <!-- 非半面罩类视图 (口罩类/通用) -->
        <template v-else>
           <el-table-column prop="category" label="品名类别" width="100">
             <template #default="{ row }">
               <div class="category-cell">
                 <span class="status-badge" :class="getCategoryClass(row.category)">{{ row.category }}</span>
               </div>
             </template>
           </el-table-column>
           <el-table-column prop="subcategory" label="细分类" width="120" />
           <el-table-column prop="item_no" label="品号" width="120" />
           <el-table-column prop="name" label="原料名称" width="220" show-overflow-tooltip />
           
           <el-table-column prop="manufacturer" label="厂商" width="120" show-overflow-tooltip />
        </template>

        <!-- 非半面罩类 公共列 -->
        <template v-if="!isHalfMaskView">
          <el-table-column prop="price" label="单价" width="120" sortable>
            <template #default="{ row }">{{ formatMoney(row.price, row.currency) }}</template>
          </el-table-column>
          <el-table-column prop="unit" label="单位" width="80" align="center" />
          <el-table-column prop="currency" label="币别" width="80" align="center" />
          <el-table-column prop="remark" label="备注" width="200" show-overflow-tooltip />
        </template>
        
        <el-table-column prop="updated_at" label="更新时间" width="160">
           <template #default="{ row }">{{ formatDateTime(row.updated_at) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="100" fixed="right" align="center" v-if="canEdit">
          <template #default="{ row }">
            <el-button :icon="EditPen" circle size="small" @click="handleEdit(row)" title="编辑" />
            <el-button :icon="Delete" circle size="small" class="delete-btn" @click="handleDelete(row)" title="删除" />
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <CommonPagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="total" />
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="650px"
      append-to-body
      :close-on-click-modal="false"
      class="minimal-dialog-auto"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px" class="material-form">
        <el-row :gutter="20">
          <!-- 1. 品号 -->
          <el-col :span="24">
            <el-form-item label="品号" prop="item_no">
              <el-input v-model="form.item_no" />
            </el-form-item>
          </el-col>

          <!-- 2. 原料名称 -->
          <el-col :span="24">
             <el-form-item label="原料名称" prop="name">
                <el-input v-model="form.name" />
             </el-form-item>
          </el-col>

          <!-- 3. 原料类型 -->
          <el-col :span="24">
            <el-form-item label="原料类型" prop="material_type">
              <el-select v-model="form.material_type" @change="handleTypeChange" style="width: 100%">
                <el-option label="半面罩类" value="half_mask" />
                <el-option label="口罩类(通用)" value="general" />
              </el-select>
            </el-form-item>
          </el-col>
          
          <!-- 4. 品名类别 (通用) -->
          <el-col :span="24" v-if="form.material_type !== 'half_mask'">
            <el-form-item label="品名类别">
               <el-select v-model="form.category" style="width: 100%" clearable>
                 <el-option label="原料" value="原料" />
                 <el-option label="包材" value="包材" />
               </el-select>
            </el-form-item>
          </el-col>

          <!-- 5. 细分类 -->
          <el-col :span="24">
            <el-form-item label="细分类" prop="subcategory">
              <el-input v-model="form.subcategory" placeholder="如：活性炭、配件" />
            </el-form-item>
          </el-col>

          <!-- 6. 厂商 (通用) -->
          <el-col :span="24" v-if="form.material_type !== 'half_mask'">
             <el-form-item label="厂商">
               <el-input v-model="form.manufacturer" />
             </el-form-item>
          </el-col>

          <!-- 7,8,9. 单价、单位、币别 (保持一行) -->
           <el-col :span="8">
             <el-form-item label="单价" prop="price">
                <el-input-number v-model="form.price" :min="0" :controls="false" style="width: 100%" />
             </el-form-item>
          </el-col>
           <el-col :span="8">
             <el-form-item label="单位" prop="unit">
                <el-input v-model="form.unit" />
             </el-form-item>
          </el-col>
           <el-col :span="8">
             <el-form-item label="币别" prop="currency">
                <el-select v-model="form.currency" style="width: 100%">
                  <el-option label="CNY" value="CNY" />
                  <el-option label="USD" value="USD" />
                </el-select>
             </el-form-item>
          </el-col>

          <!-- 10. 备注 (通用) / 半面罩其他信息 -->
          <template v-if="form.material_type === 'half_mask'">
             <!-- 绑定型号 -->
             <el-col :span="24">
               <el-form-item label="绑定型号">
                 <el-select v-model="form.product_desc" filterable clearable placeholder="选择要绑定的产品型号" style="width: 100%">
                   <el-option v-for="model in modelList" :key="model.id" :label="model.model_name" :value="model.model_name" />
                 </el-select>
               </el-form-item>
             </el-col>
             <!-- 包装方式 -->
             <el-col :span="24">
               <el-form-item label="包装方式">
                 <el-input v-model="form.packaging_mode" />
               </el-form-item>
             </el-col>
             <!-- 供应商 -->
             <el-col :span="12">
               <el-form-item label="供应商">
                 <el-input v-model="form.supplier" />
               </el-form-item>
             </el-col>
             <!-- 用量 -->
             <el-col :span="12">
               <el-form-item label="用量">
                 <el-input-number v-model="form.usage_amount" :controls="false" style="width: 100%" />
               </el-form-item>
             </el-col>
             <!-- 生产周期 -->
             <el-col :span="12">
               <el-form-item label="生产周期">
                 <el-input v-model="form.production_cycle" placeholder="如15天" />
               </el-form-item>
             </el-col>
             <!-- MOQ -->
             <el-col :span="12">
               <el-form-item label="MOQ">
                 <el-input-number v-model="form.moq" :controls="false" style="width: 100%" />
               </el-form-item>
             </el-col>
          </template>

          <template v-else>
             <el-col :span="24">
               <el-form-item label="备注">
                 <el-input v-model="form.remark" type="textarea" :rows="2" />
               </el-form-item>
             </el-col>
          </template>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="formLoading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Search, EditPen, CaretLeft, CaretRight } from '@element-plus/icons-vue'
import request from '../../utils/request'
import { formatNumber, formatDateTime, downloadBlob } from '../../utils/format'
import CostPageHeader from '@/components/cost/CostPageHeader.vue'
import ActionButton from '@/components/common/ActionButton.vue'
import CommonPagination from '@/components/common/CommonPagination.vue'
import { usePagination } from '@/composables/usePagination'
import { useAuthStore } from '@/store/auth'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 状态定义
const showToolbar = ref(true)
const currentType = ref(null) // 'half_mask' | 'general' | null (all)
const currentSubcategory = ref('') // 子分类筛选（如活性炭）
const categoryStructure = reactive({ half_mask: [], general: [] })
const searchKeyword = ref('')
const tableData = ref([])
const loading = ref(false)
const selectedMaterials = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增原料')
const isEdit = ref(false)
const formLoading = ref(false)
const formRef = ref(null)
const searchTimer = ref(null)
const modelList = ref([]) // 型号列表（用于绑定型号下拉）

// 分页
const { currentPage, pageSize, total } = usePagination('material')

// 格式化工具
const getCategoryClass = (val) => {
  if (val === '原料') return 'type-material'
  if (val === '包材') return 'type-packaging'
  return 'type-default'
}
const formatMoney = (val, currency = 'CNY') => {
  const symbol = currency === 'USD' ? '$' : '¥'
  return val || val === 0 ? `${symbol}${formatNumber(val)}` : '-'
}
const formatDate = (val) => val ? dayjs(val).format('YYYY-MM-DD') : '-'

// 计算属性
const isHalfMaskView = computed(() => currentType.value === 'half_mask')
const canEdit = computed(() => authStore.isAdmin || authStore.isPurchaser)
const currentTitle = computed(() => {
  if (currentType.value === 'half_mask') return '原料管理 - 半面罩类'
  if (currentType.value === 'general') return '原料管理 - 口罩类(通用)'
  return '原料管理 - 全部'
})

// 表单对象
const form = reactive({
  id: null,
  material_type: 'general',
  subcategory: '',
  item_no: '',
  name: '',
  unit: '',
  price: 0,
  currency: 'CNY',
  // half_mask 字段
  supplier: '',
  packaging_mode: '',
  product_desc: '', // 绑定型号（存储型号名称）
  usage_amount: null,
  moq: null,
  production_cycle: '', // 生产周期（如15天）
  // general 字段
  manufacturer: '',
  category: '',
  remark: ''
})

const formRules = {
  material_type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  item_no: [{ required: true, message: '请输入品号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  unit: [{ required: true, message: '请输入单位', trigger: 'blur' }],
  price: [{ required: true, message: '请输入单价', trigger: 'blur' }],
  category: [{ required: true, message: '请选择品名类别', trigger: 'change' }],
  subcategory: [{ required: true, message: '请输入细分类', trigger: 'blur' }]
}

// 获取分类结构
const fetchCategoryStructure = async () => {
  try {
    const res = await request.get('/materials/structure')
    if (res.success) {
      categoryStructure.half_mask = res.data.half_mask || []
      categoryStructure.general = res.data.general || []
    }
  } catch (e) { console.error(e) }
}

// 获取型号列表（用于绑定型号下拉）
const fetchModelList = async () => {
  try {
    const res = await request.get('/models')
    if (res.success) modelList.value = res.data || []
  } catch (e) { console.error(e) }
}

// 获取列表数据
const fetchMaterials = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value || undefined,
      material_type: currentType.value || undefined,
      subcategory: currentSubcategory.value || undefined // 只有当 currentSubcategory 不为空时才传
    }
    const res = await request.get('/materials', { params })
    if (res.success) {
      tableData.value = res.data
      total.value = res.total
    }
  } catch (error) { ElMessage.error('获取失败') } 
  finally { loading.value = false }
}

// 搜索
const handleSearch = () => {
  if (searchTimer.value) clearTimeout(searchTimer.value)
  searchTimer.value = setTimeout(() => { currentPage.value = 1; fetchMaterials() }, 300)
}

// 子分类筛选变化
const handleSubcategoryChange = () => {
  currentPage.value = 1
  fetchMaterials()
}

// 分页监听
watch([currentPage, pageSize], fetchMaterials)

// 导出
const handleExport = async () => {
  try {
    const payload = { ids: selectedMaterials.value.map(i => i.id) } 
    if (payload.ids.length === 0) { return ElMessage.warning('请先选择要导出的数据') }
    const res = await request.post('/materials/export/excel', payload, { responseType: 'blob' })
    downloadBlob(res, `原料清单_${dayjs().format('YYYYMMDD')}.xlsx`)
    ElMessage.success('导出成功')
  } catch (e) { ElMessage.error('导出失败') }
}

// 导入
const handleFileChange = async (file) => {
  const formData = new FormData()
  formData.append('file', file.raw)
  try {
    const res = await request.post('/materials/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    if (res.success) {
      if (res.data.needConfirm) {
         ElMessage.warning('存在重复品号，部分数据未导入')
      } else {
         ElMessage.success(`导入成功，新增 ${res.data.created} 条`)
         fetchCategoryStructure()
         fetchMaterials()
      }
    }
  } catch (e) { /* Error handled by interceptor */ }
}

const handleTypeChange = () => { }

// 新增/编辑
const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增原料'
  // 重置表单，保留当前选中的分类
  Object.keys(form).forEach(k => form[k] = (k === 'price' || k === 'usage_amount' || k === 'moq') ? null : '')
  form.price = 0
  form.currency = 'CNY'
  form.material_type = currentType.value || 'general'
  form.subcategory = currentSubcategory.value || ''
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  dialogTitle.value = '编辑原料'
  Object.assign(form, row)
  form.price = parseFloat(row.price)
  dialogVisible.value = true
}

const handleSubmit = async () => {
  try { await formRef.value.validate() } catch (e) { return }
  formLoading.value = true
  try {
    const api = isEdit.value ? request.put(`/materials/${form.id}`, form) : request.post('/materials', form)
    await api
    ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
    dialogVisible.value = false
    fetchMaterials()
    fetchCategoryStructure()
  } catch (e) { } 
  finally { formLoading.value = false }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除该原料吗？', '警告', { type: 'warning' })
    await request.delete(`/materials/${row.id}`)
    ElMessage.success('删除成功')
    fetchMaterials()
    fetchCategoryStructure()
  } catch (e) {}
}

const handleBatchDelete = async () => {
  if (!selectedMaterials.value.length) return
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedMaterials.value.length} 条数据吗？`, '警告', { type: 'warning' })
    const ids = selectedMaterials.value.map(i => i.id)
    const res = await request.post('/materials/batch-delete', { ids })
    if (res.success) {
      ElMessage.success(res.message || '删除成功')
      fetchMaterials()
      fetchCategoryStructure()
    }
  } catch (e) {}
}

const handleSelectionChange = (val) => selectedMaterials.value = val
const handleDownloadTemplate = async () => {
  try {
    const res = await request.get('/materials/template/download', { responseType: 'blob' })
    downloadBlob(res, '导入模板.xlsx')
  } catch (e) { ElMessage.error('下载失败') }
}

// 监听路由参数变化
watch(
  () => route.query.type,
  (newType) => {
    // 只有当参数真正改变时才重置
    if (currentType.value !== newType) {
      currentType.value = newType || null
      currentSubcategory.value = '' // 切换大类时重置子分类筛选
      fetchMaterials()
    }
  },
  { immediate: true }
)

onMounted(() => {
  fetchCategoryStructure()
  fetchModelList() // 获取型号列表
})

onUnmounted(() => { if (searchTimer.value) clearTimeout(searchTimer.value) })
</script>

<style scoped>
.material-manage {
  /* page content */
}

.toolbar-wrapper { display: flex; align-items: center; gap: 12px; }
.toolbar-toggle { flex-shrink: 0; }
.toolbar-fade-enter-active, .toolbar-fade-leave-active { transition: opacity 0.3s, transform 0.3s; }
.toolbar-fade-enter-from, .toolbar-fade-leave-to { opacity: 0; transform: translateX(10px); }

/* 筛选与搜索样式 */
.filter-container {
  margin-bottom: 20px;
}

.search-row {
  margin-bottom: 12px;
}

.category-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.material-form :deep(.el-form-item) {
  margin-bottom: 22px;
}

/* 操作按钮样式同步 */
.delete-btn { color: #F56C6C; }
.delete-btn:hover:not(:disabled) { color: #f78989; border-color: #f78989; }
.el-table .el-button.is-circle { transition: transform 0.2s, box-shadow 0.2s; }
.el-table .el-button.is-circle:hover:not(:disabled) { transform: scale(1.1); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); }
:deep(.el-table th.el-table__cell) { background-color: #f5f7fa; }

/* Status Badge Style (Soft Pill) */
.category-cell { display: flex; align-items: center; }
.status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.6;
  transition: all 0.3s;
}
/* Material: Fresh Emerald */
.type-material { background-color: #ecfdf5; color: #059669; }
/* Packaging: Warm Amber */
.type-packaging { background-color: #fffbeb; color: #d97706; }
/* Default: Cool Gray */
.type-default { background-color: #f3f4f6; color: #4b5563; }
</style>
