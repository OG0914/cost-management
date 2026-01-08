<template>
  <div class="packaging-management">
    <!-- 页面表头 -->
    <PageHeader title="包材管理">
      <template #actions>
        <div class="toolbar-wrapper">
          <el-button class="toolbar-toggle" :icon="showToolbar ? CaretRight : CaretLeft" circle @click="showToolbar = !showToolbar" :title="showToolbar ? '收起工具栏' : '展开工具栏'" />
          <transition name="toolbar-fade">
            <el-space v-if="showToolbar && canEdit">
              <ActionButton type="download" @click="handleDownloadTemplate">下载模板</ActionButton>
              <el-upload action="#" :auto-upload="false" :on-change="handleFileChange" :show-file-list="false" accept=".xlsx,.xls">
                <ActionButton type="import">导入Excel</ActionButton>
              </el-upload>
              <ActionButton type="export" @click="handleExport">导出Excel</ActionButton>
              <ActionButton type="delete" :disabled="selectedConfigs.length === 0" @click="handleBatchDelete">批量删除</ActionButton>
              <ActionButton type="add" @click="showCreateDialog">新增包装配置</ActionButton>
            </el-space>
          </transition>
        </div>
      </template>
    </PageHeader>

    <el-card>

      <!-- 筛选栏 -->
      <div class="filter-bar">
        <!-- 产品类别筛选 -->
        <el-select 
          v-model="selectedCategory" 
          placeholder="选择产品类别" 
          @change="onCategoryChange" 
          clearable
          style="width: 150px; margin-right: 16px"
        >
          <el-option
            v-for="cat in categories"
            :key="cat"
            :label="cat"
            :value="cat"
          />
        </el-select>

        <el-select 
          v-model="selectedModelId" 
          placeholder="选择型号筛选" 
          @change="loadPackagingConfigs" 
          clearable
          filterable
          style="width: 300px; margin-right: 16px"
        >
          <el-option
            v-for="model in filteredModels"
            :key="model.id"
            :label="`${model.model_name} (${model.regulation_name})`"
            :value="model.id"
          />
        </el-select>
        
        <!-- 包装类型筛选 -->
        <el-select 
          v-model="selectedPackagingType" 
          placeholder="选择包装类型筛选" 
          @change="loadPackagingConfigs" 
          clearable
          style="width: 200px"
        >
          <el-option
            v-for="type in packagingTypeOptions"
            :key="type.value"
            :label="type.label"
            :value="type.value"
          />
        </el-select>

        <!-- 视图切换按钮 -->
        <el-button-group class="view-toggle">
          <el-button
            :type="viewMode === 'card' ? 'primary' : 'default'"
            :icon="Grid"
            @click="viewMode = 'card'"
          />
          <el-button
            :type="viewMode === 'list' ? 'primary' : 'default'"
            :icon="List"
            @click="viewMode = 'list'"
          />
        </el-button-group>
      </div>

      <!-- 卡片视图 -->
      <div v-if="viewMode === 'card'" class="config-cards" v-loading="loading">
        <div v-if="paginatedConfigs.length === 0" class="empty-tip">
          暂无匹配数据
        </div>
        <div
          v-for="config in paginatedConfigs"
          :key="config.id"
          class="config-card"
        >
          <!-- 卡片头部 -->
          <div class="card-header-section">
            <div class="header-info">
              <div class="model-name">{{ config.model_name }}</div>
              <div class="config-name">{{ config.config_name }}</div>
              <div class="packaging-method">
                {{ formatPackagingMethodFromConfig(config) }}
              </div>
              <div class="total-qty">
                每箱: {{ calculateTotalFromConfig(config) }} pcs
              </div>
            </div>
            <div class="category-badge" :style="{ backgroundColor: getRegulationColor(config.regulation_name) }">
              {{ config.regulation_name || '未知法规' }}
            </div>
          </div>
          
          <div class="card-body">
            <el-tag :type="getPackagingTypeTagType(config.packaging_type)" size="small">
              {{ config.packaging_type_name || getPackagingTypeName(config.packaging_type) }}
            </el-tag>
            <div class="price">
              包材总价: ¥{{ formatNumber(config.material_total_price || 0) }}
            </div>
            <div class="status">
              <span :class="config.is_active ? 'status-active' : 'status-inactive'"></span>
              {{ config.is_active ? '已启用' : '已禁用' }}
            </div>
          </div>
          
          <!-- 操作栏 -->
          <div class="card-actions">
            <el-button :icon="View" circle @click="viewMaterials(config)" title="查看" />
            <el-button :icon="EditPen" circle @click="editConfig(config)" v-if="canEdit" title="编辑" />
            <el-button :icon="Delete" circle class="delete-btn" @click="deleteConfig(config)" v-if="canEdit" title="删除" />
          </div>
        </div>
      </div>

      <!-- 包装配置列表 -->
      <el-table 
        v-if="viewMode === 'list'" 
        :data="paginatedConfigs" 
        border 
        stripe 
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="model_category" label="产品类别" width="110" sortable />
        <el-table-column prop="model_name" label="型号" width="120" sortable />
        <el-table-column prop="config_name" label="配置名称" width="150" sortable />
        <!-- 包装类型列（只读） -->
        <el-table-column label="包装类型" width="120" sortable sort-by="packaging_type">
          <template #default="{ row }">
            <el-tag :type="getPackagingTypeTagType(row.packaging_type)">
              {{ row.packaging_type_name || getPackagingTypeName(row.packaging_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="包装方式" min-width="280" sortable>
          <template #default="{ row }">
            <span class="packaging-info">
              {{ formatPackagingMethodFromConfig(row) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="每箱数量" width="100" align="right">
          <template #default="{ row }">
            {{ calculateTotalFromConfig(row) }}
          </template>
        </el-table-column>
        <el-table-column label="包材总价" width="130" align="right" sortable sort-by="material_total_price">
          <template #default="{ row }">
            <span class="price-info">¥{{ formatNumber(row.material_total_price || 0) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center" sortable sort-by="is_active">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'danger'" class="status-tag">
              {{ row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180" sortable>
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button :icon="View" circle size="small" @click="viewMaterials(row)" title="查看" />
            <el-button :icon="EditPen" circle size="small" @click="editConfig(row)" v-if="canEdit" title="编辑" />
            <el-button :icon="Delete" circle size="small" class="delete-btn" @click="deleteConfig(row)" v-if="canEdit" title="删除" />
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <CommonPagination 
        v-model:current-page="currentPage" 
        v-model:page-size="pageSize" 
        :total="packagingConfigs.length" 
      />
    </el-card>

    <!-- 创建/编辑包装配置对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑包装配置' : '新增包装配置'"
      width="850px"
      top="5vh"
      class="minimal-dialog"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form :model="form" ref="formRef" label-position="top" class="px-2">
        
        <!-- 第一部分：基础信息 -->
        <div class="grid grid-cols-2 gap-6 mb-6">
          <el-form-item label="产品型号" required class="mb-0">
            <el-select 
              v-model="form.model_id" 
              placeholder="选择型号" 
              :disabled="isEdit"
              filterable
              class="w-full"
            >
              <el-option
                v-for="model in models"
                :key="model.id"
                :label="`${model.model_name} (${model.regulation_name})`"
                :value="model.id"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="配置名称" required class="mb-0">
            <el-input v-model="form.config_name" placeholder="例如：美规标准包装" :disabled="isEdit" />
          </el-form-item>
        </div>

        <!-- 第二部分：包装规格与参数 -->
        <div class="bg-slate-50 rounded-xl p-5 mb-8 border border-slate-100">
          <div class="mb-4">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">包装类型</span>
            <el-radio-group v-model="form.packaging_type" size="small">
              <el-radio-button label="standard_box">标准彩盒</el-radio-button>
              <el-radio-button label="no_box">无彩盒</el-radio-button>
              <el-radio-button label="blister_direct">吸塑直出</el-radio-button>
              <el-radio-button label="blister_bag">袋装吸塑</el-radio-button>
            </el-radio-group>
          </div>

          <div class="flex items-center space-x-4">
            <!-- 包装层级可视化 -->
            <div class="flex-1 grid grid-cols-3 gap-4">
              <div class="bg-white p-3 rounded-lg shadow-sm border border-slate-100 text-center">
                <div class="text-xs text-slate-500 mb-1">第一层数量</div>
                <div class="text-lg font-semibold text-slate-800">
                   <span v-if="form.packaging_type === 'standard_box' || !form.packaging_type">{{ form.layer1_qty || '-' }} pcs/盒</span>
                   <span v-else>{{ form.layer1_qty || '-' }}</span>
                </div>
              </div>
              <div class="bg-white p-3 rounded-lg shadow-sm border border-slate-100 text-center">
                <div class="text-xs text-slate-500 mb-1">第二层数量</div>
                <div class="text-lg font-semibold text-slate-800">
                   <span v-if="form.packaging_type === 'standard_box' || !form.packaging_type">{{ form.layer2_qty || '-' }} 盒/箱</span>
                   <span v-else>{{ form.layer2_qty || '-' }}</span>
                </div>
              </div>
              <div class="bg-white p-3 rounded-lg shadow-sm border border-slate-100 text-center relative overflow-hidden">
                <div class="absolute top-0 right-0 p-1">
                  <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                </div>
                <div class="text-xs text-slate-500 mb-1">每箱总数</div>
                <div class="text-xl font-bold text-blue-600">
                   {{ calculateTotalFromConfig(form) }} <span class="text-sm font-normal text-slate-400">pcs</span>
                </div>
              </div>
            </div>
          </div>
          <div class="mt-3 text-xs text-slate-400 flex items-center">
            <el-icon class="mr-1"><InfoFilled /></el-icon>
            包装层级数量通常由“工序管理”模块定义，此处仅作展示。
          </div>
        </div>

        <!-- 第三部分：包材明细 -->
        <div class="mb-3 flex justify-between items-end">
          <div>
            <div class="text-sm font-bold text-slate-900">包材明细</div>
            <div class="text-xs text-slate-500 mt-1">添加并管理该配置所需的所有包装材料</div>
          </div>
          <div class="flex gap-2">
            <el-button type="success" plain size="small" @click="openMaterialCopyDialog">
              <el-icon class="mr-1"><CopyDocument /></el-icon>一键复制
            </el-button>
            <el-button type="primary" plain size="small" @click="addMaterial">
              <el-icon class="mr-1"><Plus /></el-icon>Add Material
            </el-button>
          </div>
        </div>

        <div class="border border-slate-200 rounded-lg overflow-hidden mb-6">
          <el-table 
            :data="form.materials" 
            style="width: 100%" 
            :header-cell-style="{ background: '#f8fafc', color: '#64748b', fontWeight: '500', fontSize: '12px' }"
            show-summary 
            :summary-method="getSummaries"
          >
            <el-table-column label="包材名称" min-width="200">
              <template #default="{ row }">
                <el-autocomplete
                  v-model="row.material_name"
                  :fetch-suggestions="queryMaterials"
                  placeholder="搜索包材..."
                  size="small"
                  class="w-full"
                  @select="(item) => handleSelectMaterial(row, item)"
                  clearable
                >
                  <template #default="{ item }">
                    <div class="flex justify-between items-center py-1">
                      <span class="text-slate-700">{{ item.name }}</span>
                      <span class="text-xs text-slate-400">¥{{ formatNumber(item.price) }}/{{ item.unit }}</span>
                    </div>
                  </template>
                </el-autocomplete>
              </template>
            </el-table-column>
            
            <el-table-column label="基本用量" width="120">
              <template #default="{ row }">
                <el-input-number 
                  v-model="row.basic_usage" 
                  :min="0" 
                  :precision="4" 
                  :step="0.01" 
                  :controls="false"
                  size="small"
                  class="w-full"
                  placeholder="0.00"
                />
              </template>
            </el-table-column>
            
            <el-table-column label="单价 (¥)" width="120">
              <template #default="{ row }">
                <el-input-number 
                  v-model="row.unit_price" 
                  :min="0" 
                  :precision="4" 
                  :step="0.01" 
                  :controls="false"
                  size="small"
                  class="w-full"
                  placeholder="0.00"
                />
              </template>
            </el-table-column>
            
            <el-table-column label="小计" width="120" align="right">
              <template #default="{ row }">
                <span class="font-medium text-slate-700">¥{{ formatNumber(row.basic_usage && row.basic_usage !== 0 ? ((row.unit_price || 0) / row.basic_usage) : 0) }}</span>
              </template>
            </el-table-column>
            
            <el-table-column label="材积 (m³)" width="110">
              <template #default="{ row }">
                <el-input-number 
                  v-model="row.carton_volume" 
                  :min="0" 
                  :precision="4" 
                  :step="0.001" 
                  :controls="false"
                  size="small"
                  class="w-full"
                />
              </template>
            </el-table-column>
            
            <el-table-column width="60" align="center">
              <template #default="{ $index }">
                <el-button 
                  link 
                  type="danger" 
                  size="small" 
                  @click="removeMaterial($index)"
                  class="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div v-if="isEdit" class="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
           <span class="text-sm text-slate-600 font-medium">配置状态</span>
           <StatusSwitch
            v-model="form.is_active"
            :active-value="1"
            :inactive-value="0"
            active-text="启用中"
            inactive-text="已停用"
          />
        </div>

      </el-form>
      
      <template #footer>
        <div class="flex justify-end pt-4 border-t border-slate-100">
          <el-button @click="dialogVisible = false" size="large" class="w-32">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="loading" size="large" class="w-32">保存变更</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 查看包材对话框 -->
    <el-dialog v-model="materialDialogVisible" title="包材列表" width="700px" class="view-dialog" append-to-body>
      <div class="mb-4">
        <p class="text-lg font-bold">{{ currentConfig?.model_name }} - {{ currentConfig?.config_name }}</p>
        <p class="text-gray-600">
          <el-tag size="small" :type="getPackagingTypeTagType(currentConfig?.packaging_type)" style="margin-right: 8px">
            {{ getPackagingTypeName(currentConfig?.packaging_type) }}
          </el-tag>
          {{ formatPackagingMethodFromConfig(currentConfig) }}
          （每箱 {{ calculateTotalFromConfig(currentConfig) }} pcs）
        </p>
      </div>
      
      <el-table :data="currentMaterials" border show-summary :summary-method="getViewSummaries">
        <el-table-column label="序号" width="60" type="index" />
        <el-table-column prop="material_name" label="包材名称" min-width="150" />
        <el-table-column prop="basic_usage" label="基本用量" width="100">
          <template #default="{ row }">
            {{ formatNumber(row.basic_usage) }}
          </template>
        </el-table-column>
        <el-table-column prop="unit_price" label="单价" width="100">
          <template #default="{ row }">
            ¥{{ formatNumber(row.unit_price) }}
          </template>
        </el-table-column>
        <el-table-column label="小计" width="120" align="right">
          <template #default="{ row }">
            <span class="subtotal-text">¥{{ formatNumber(row.basic_usage !== 0 ? (row.unit_price / row.basic_usage) : 0) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="carton_volume" label="外箱材积(m³)" width="120">
          <template #default="{ row }">
            {{ row.carton_volume ? formatNumber(row.carton_volume) : '-' }}
          </template>
        </el-table-column>
      </el-table>

      <div class="mt-4 text-right">
        <p class="text-lg font-bold">
          包材总价: <span class="text-blue-600">¥{{ formatNumber(totalMaterialPrice) }}</span>
        </p>
      </div>
    </el-dialog>

    <!-- 一键复制包材弹窗 -->
    <el-dialog v-model="showMaterialCopyDialog" title="从其他配置复制包材" width="550px" append-to-body :close-on-click-modal="false">
      <el-form label-width="100px">
        <el-form-item label="源配置" required>
          <el-select v-model="copySourceConfigId" filterable placeholder="选择要复制的源配置" style="width: 100%" @change="handleCopySourceChange" :loading="copyConfigsLoading">
            <template #empty>
              <div style="padding: 10px; text-align: center; color: #909399;">{{ copyConfigsLoading ? '加载中...' : '暂无已配置包材的配置' }}</div>
            </template>
            <el-option v-for="c in configsWithMaterials" :key="c.id" :label="`${c.model_name} - ${c.config_name}`" :value="c.id">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>{{ c.model_name }} - {{ c.config_name }}</span>
                <el-tag size="small" type="success">{{ c.material_count }}项</el-tag>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="包材预览" v-if="copySourcePreview.length > 0">
          <div class="source-preview">
            <el-tag v-for="item in copySourcePreview.slice(0, 5)" :key="item.id" size="small" style="margin: 2px">
              {{ item.material_name }}
            </el-tag>
            <el-tag v-if="copySourcePreview.length > 5" size="small" type="info">+{{ copySourcePreview.length - 5 }}项</el-tag>
          </div>
        </el-form-item>
        <el-form-item label="复制模式">
          <el-radio-group v-model="copyMode">
            <el-radio value="replace">
              <span>替换模式</span>
              <el-text type="info" size="small" style="margin-left: 4px">清空现有包材后复制</el-text>
            </el-radio>
            <el-radio value="merge">
              <span>合并模式</span>
              <el-text type="info" size="small" style="margin-left: 4px">保留现有，追加新包材</el-text>
            </el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showMaterialCopyDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCopyMaterials" :loading="copyLoading" :disabled="!copySourceConfigId">确认复制</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, ArrowLeft, Download, Delete, Upload, Grid, List, View, EditPen, CaretLeft, CaretRight, InfoFilled, CopyDocument } from '@element-plus/icons-vue';
import request from '../../utils/request';
import { useAuthStore } from '../../store/auth';
import { formatNumber, formatDateTime } from '../../utils/format';
import logger from '../../utils/logger';
import { 
  getPackagingTypeOptions, 
  getPackagingTypeName, 
  getPackagingTypeByKey,
  formatPackagingMethodFromConfig,
  calculateTotalFromConfig
} from '../../config/packagingTypes';
import PageHeader from '../../components/common/PageHeader.vue';
import CommonPagination from '../../components/common/CommonPagination.vue';
import ActionButton from '../../components/common/ActionButton.vue';
import StatusSwitch from '../../components/common/StatusSwitch.vue';

const router = useRouter();
const authStore = useAuthStore();
const showToolbar = ref(false);



// 权限检查 - 只有管理员和采购人员可以编辑包材
const canEdit = computed(() => authStore.isAdmin || authStore.isPurchaser);

// 包装类型选项
const packagingTypeOptions = getPackagingTypeOptions();

// 数据
const models = ref([]);
const categories = ref([]);
const packagingConfigs = ref([]);
const selectedConfigs = ref([]);
const selectedCategory = ref(null);
const selectedModelId = ref(null);
const selectedPackagingType = ref(null);
const loading = ref(false);
const allMaterials = ref([]); // 所有原料列表

// 根据产品类别过滤型号
const filteredModels = computed(() => {
  if (!selectedCategory.value) return models.value;
  return models.value.filter(m => m.model_category === selectedCategory.value);
});

// 产品类别变化
const onCategoryChange = () => {
  selectedModelId.value = null;
  loadPackagingConfigs();
};

// 视图切换状态: 'card' | 'list'
const viewMode = ref('card');

// 切换视图时清空选择
watch(viewMode, (newMode) => {
  if (newMode === 'card') {
    selectedConfigs.value = [];
  }
});

// 分页状态
const currentPage = ref(1);
const pageSize = ref(10);

// 分页后的数据
const paginatedConfigs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return packagingConfigs.value.slice(start, end);
});

// 包装类型标签颜色
const getPackagingTypeTagType = (type) => {
  const typeMap = {
    standard_box: '',
    no_box: 'success',
    blister_direct: 'warning',
    blister_bag: 'info'
  };
  return typeMap[type] || '';
};

// 法规颜色映射
const REGULATION_COLORS = { 
  'NIOSH': '#409EFF', 
  'GB': '#67C23A', 
  'CE': '#E6A23C', 
  'ASNZS': '#F56C6C', 
  'KN': '#9B59B6' 
}
const getRegulationColor = (name) => REGULATION_COLORS[name] || '#909399'

// 产品类别颜色 - 引用统一配置
import { getCategoryColor } from '@/config/categoryColors'

// 对话框
const dialogVisible = ref(false);
const materialDialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref(null);

// 表单
const form = reactive({
  id: null,
  model_id: null,
  config_name: '',
  packaging_type: 'standard_box',
  layer1_qty: null,
  layer2_qty: null,
  layer3_qty: null,
  // 兼容旧字段名
  pc_per_bag: null,
  bags_per_box: null,
  boxes_per_carton: null,
  is_active: 1,
  materials: []
});

// 当前查看的配置
const currentConfig = ref(null);
const currentMaterials = ref([]);

// 一键复制包材相关
const showMaterialCopyDialog = ref(false);
const copySourceConfigId = ref(null);
const copyMode = ref('replace');
const copyLoading = ref(false);
const copyConfigsLoading = ref(false);
const copySourcePreview = ref([]);
const allConfigsForCopy = ref([]);

// 过滤有包材的配置（排除当前配置）
const configsWithMaterials = computed(() => {
  return allConfigsForCopy.value.filter(c => c.id !== form.id && c.material_count > 0);
});

// 包材总价（小计之和：单价÷基本用量）
const totalMaterialPrice = computed(() => {
  return currentMaterials.value.reduce((total, m) => {
    return total + (m.basic_usage !== 0 ? m.unit_price / m.basic_usage : 0);
  }, 0);
});

// 编辑表单的合计方法
const getSummaries = (param) => {
  const { columns, data } = param;
  const sums = [];
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '合计';
      return;
    }
    if (index === 4) { // 小计列
      const values = data.map(item => {
        const usage = item.basic_usage || 0;
        const price = item.unit_price || 0;
        return usage !== 0 ? price / usage : 0;
      });
      const total = values.reduce((prev, curr) => prev + curr, 0);
      sums[index] = `¥${formatNumber(total)}`;
    } else {
      sums[index] = '';
    }
  });
  return sums;
};

// 查看对话框的合计方法
const getViewSummaries = (param) => {
  const { columns, data } = param;
  const sums = [];
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '合计';
      return;
    }
    if (index === 4) { // 小计列
      const values = data.map(item => {
        return item.basic_usage !== 0 ? item.unit_price / item.basic_usage : 0;
      });
      const total = values.reduce((prev, curr) => prev + curr, 0);
      sums[index] = `¥${formatNumber(total)}`;
    } else {
      sums[index] = '';
    }
  });
  return sums;
};

// 加载型号列表
const loadModels = async () => {
  try {
    const response = await request.get('/models/active');
    if (response.success) {
      models.value = response.data;
    }
  } catch (error) {
    // 错误已在拦截器处理
  }
};

// 加载产品类别
const loadCategories = async () => {
  try {
    const response = await request.get('/models/categories');
    if (response.success) {
      categories.value = response.data;
    }
  } catch (error) {
    // 错误已在拦截器处理
  }
};

// 加载所有原料
const loadMaterials = async () => {
  try {
    const response = await request.get('/materials');
    if (response.success) {
      allMaterials.value = response.data;
    }
  } catch (error) {
    logger.error('加载原料失败:', error);
  }
};

// 搜索原料（用于自动完成）
const queryMaterials = (queryString, cb) => {
  if (!queryString) {
    cb(allMaterials.value.slice(0, 20)); // 默认显示前20条
    return;
  }
  
  const results = allMaterials.value.filter(material => {
    const query = queryString.toLowerCase();
    return (
      material.name.toLowerCase().includes(query) ||
      material.item_no.toLowerCase().includes(query)
    );
  });
  
  cb(results.slice(0, 20)); // 最多显示20条结果
};

// 选择原料后自动填充单价
const handleSelectMaterial = (row, material) => {
  row.material_name = material.name;
  row.unit_price = material.price;
};

// 加载包装配置
const loadPackagingConfigs = async () => {
  loading.value = true;
  try {
    let url = '/processes/packaging-configs';
    const params = new URLSearchParams();
    
    if (selectedModelId.value) {
      url = `/processes/packaging-configs/model/${selectedModelId.value}`;
    }
    
    if (selectedPackagingType.value) {
      params.append('packaging_type', selectedPackagingType.value);
    }
    
    const queryString = params.toString();
    if (queryString && !selectedModelId.value) {
      url += '?' + queryString;
    }
    
    const response = await request.get(url);
    
    if (response.success) {
      let data = response.data;
      // 按产品类别过滤
      if (selectedCategory.value && !selectedModelId.value) {
        data = data.filter(item => item.model_category === selectedCategory.value);
      }
      packagingConfigs.value = data;
    }
  } catch (error) {
    ElMessage.error('加载包装配置失败');
  } finally {
    loading.value = false;
  }
};

// 加载所有配置及其包材数量（用于一键复制）
const loadConfigsForCopy = async () => {
  copyConfigsLoading.value = true;
  try {
    const response = await request.get('/processes/packaging-configs');
    if (response.success) {
      // 获取每个配置的包材数量
      const configsWithCount = await Promise.all(
        response.data.map(async (config) => {
          try {
            const detailResponse = await request.get(`/processes/packaging-configs/${config.id}/full`);
            return {
              ...config,
              material_count: detailResponse.success ? (detailResponse.data.materials?.length || 0) : 0
            };
          } catch {
            return { ...config, material_count: 0 };
          }
        })
      );
      allConfigsForCopy.value = configsWithCount;
    }
  } catch (error) {
    logger.error('加载配置列表失败:', error);
  } finally {
    copyConfigsLoading.value = false;
  }
};

// 打开一键复制弹窗
const openMaterialCopyDialog = async () => {
  copySourceConfigId.value = null;
  copySourcePreview.value = [];
  copyMode.value = 'replace';
  showMaterialCopyDialog.value = true;
  await loadConfigsForCopy();
};

// 选择源配置时加载预览
const handleCopySourceChange = async (configId) => {
  if (!configId) {
    copySourcePreview.value = [];
    return;
  }
  try {
    const response = await request.get(`/processes/packaging-configs/${configId}/full`);
    if (response.success) {
      copySourcePreview.value = response.data.materials || [];
    }
  } catch (error) {
    copySourcePreview.value = [];
  }
};

// 执行包材复制
const handleCopyMaterials = () => {
  if (!copySourceConfigId.value || copySourcePreview.value.length === 0) {
    ElMessage.warning('请选择有包材的源配置');
    return;
  }
  
  copyLoading.value = true;
  try {
    if (copyMode.value === 'replace') {
      // 替换模式：清空现有包材
      form.materials = copySourcePreview.value.map((m, index) => ({
        material_name: m.material_name,
        basic_usage: m.basic_usage,
        unit_price: m.unit_price,
        carton_volume: m.carton_volume,
        sort_order: index
      }));
    } else {
      // 合并模式：追加新包材（跳过重复）
      const existingNames = form.materials.map(m => m.material_name);
      const newMaterials = copySourcePreview.value
        .filter(m => !existingNames.includes(m.material_name))
        .map((m, index) => ({
          material_name: m.material_name,
          basic_usage: m.basic_usage,
          unit_price: m.unit_price,
          carton_volume: m.carton_volume,
          sort_order: form.materials.length + index
        }));
      form.materials.push(...newMaterials);
      
      if (newMaterials.length < copySourcePreview.value.length) {
        const skipped = copySourcePreview.value.length - newMaterials.length;
        ElMessage.info(`已跳过 ${skipped} 个重复包材`);
      }
    }
    
    showMaterialCopyDialog.value = false;
    ElMessage.success(`成功复制 ${copyMode.value === 'replace' ? copySourcePreview.value.length : form.materials.length} 项包材`);
  } finally {
    copyLoading.value = false;
  }
};

// 显示创建对话框
const showCreateDialog = () => {
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
};

// 编辑配置
const editConfig = async (row) => {
  isEdit.value = true;
  
  try {
    const response = await request.get(`/processes/packaging-configs/${row.id}/full`);
    
    if (response.success) {
      const data = response.data;
      form.id = data.id;
      form.model_id = data.model_id;
      form.config_name = data.config_name;
      form.packaging_type = data.packaging_type || 'standard_box';
      form.layer1_qty = data.layer1_qty ?? data.pc_per_bag;
      form.layer2_qty = data.layer2_qty ?? data.bags_per_box;
      form.layer3_qty = data.layer3_qty ?? data.boxes_per_carton;
      // 兼容旧字段名
      form.pc_per_bag = data.pc_per_bag;
      form.bags_per_box = data.bags_per_box;
      form.boxes_per_carton = data.boxes_per_carton;
      form.is_active = data.is_active ? 1 : 0;
      form.materials = data.materials || [];
      
      dialogVisible.value = true;
    }
  } catch (error) {
    // 错误已在拦截器处理
  }
};



// 查看包材
const viewMaterials = async (row) => {
  try {
    const response = await request.get(`/processes/packaging-configs/${row.id}/full`);
    
    if (response.success) {
      currentConfig.value = response.data;
      currentMaterials.value = response.data.materials || [];
      materialDialogVisible.value = true;
    }
  } catch (error) {
    // 错误已在拦截器处理
  }
};

// 删除配置
const deleteConfig = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除包装配置"${row.config_name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    await request.delete(`/processes/packaging-configs/${row.id}`);
    ElMessage.success('删除成功');
    loadPackagingConfigs();
  } catch (error) {
    if (error !== 'cancel') {
      // 错误已在拦截器处理
    }
  }
};

// 批量删除
const handleBatchDelete = async () => {
  if (selectedConfigs.value.length === 0) {
    ElMessage.warning('请先选择要删除的配置');
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedConfigs.value.length} 条包装配置吗？此操作不可恢复！`, 
      '批量删除确认', 
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    const ids = selectedConfigs.value.map(item => item.id);
    
    // 逐个删除
    let successCount = 0;
    let failCount = 0;
    
    for (const id of ids) {
      try {
        await request.delete(`/processes/packaging-configs/${id}`);
        successCount++;
      } catch (error) {
        failCount++;
      }
    }
    
    if (successCount > 0) {
      ElMessage.success(`成功删除 ${successCount} 条配置${failCount > 0 ? `，失败 ${failCount} 条` : ''}`);
      loadPackagingConfigs();
    } else {
      ElMessage.error('删除失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      // 错误已在拦截器处理
    }
  }
};

// 添加包材
const addMaterial = () => {
  form.materials.push({
    material_name: '',
    basic_usage: null,
    unit_price: null,
    carton_volume: null,
    sort_order: form.materials.length
  });
};

// 删除包材
const removeMaterial = (index) => {
  form.materials.splice(index, 1);
  // 重新排序
  form.materials.forEach((m, i) => {
    m.sort_order = i;
  });
};

// 提交表单
const submitForm = async () => {
  // 验证必填字段
  if (!form.model_id) {
    ElMessage.warning('请选择型号');
    return;
  }
  if (!form.config_name) {
    ElMessage.warning('请输入配置名称');
    return;
  }
  
  // 获取包装类型配置
  const typeConfig = getPackagingTypeByKey(form.packaging_type);
  const l1 = form.layer1_qty ?? form.pc_per_bag;
  const l2 = form.layer2_qty ?? form.bags_per_box;
  const l3 = form.layer3_qty ?? form.boxes_per_carton;
  
  if (!l1 || !l2) {
    ElMessage.warning('请填写完整的包装方式');
    return;
  }
  if (typeConfig && typeConfig.layers === 3 && !l3) {
    ElMessage.warning('请填写完整的包装方式');
    return;
  }
  
  loading.value = true;
  try {
    const data = {
      model_id: form.model_id,
      config_name: form.config_name,
      packaging_type: form.packaging_type,
      layer1_qty: l1,
      layer2_qty: l2,
      layer3_qty: typeConfig && typeConfig.layers === 3 ? l3 : null,
      is_active: form.is_active,
      materials: form.materials
    };
    
    if (isEdit.value) {
      await request.put(`/processes/packaging-configs/${form.id}`, data);
      ElMessage.success('更新成功');
    } else {
      await request.post('/processes/packaging-configs', data);
      ElMessage.success('创建成功');
    }
    
    dialogVisible.value = false;
    loadPackagingConfigs();
  } catch (error) {
    // 错误已在拦截器处理
  } finally {
    loading.value = false;
  }
};

// 重置表单
const resetForm = () => {
  form.id = null;
  form.model_id = selectedModelId.value || null;
  form.config_name = '';
  form.packaging_type = 'standard_box';
  form.layer1_qty = null;
  form.layer2_qty = null;
  form.layer3_qty = null;
  form.pc_per_bag = null;
  form.bags_per_box = null;
  form.boxes_per_carton = null;
  form.is_active = 1;
  form.materials = [];
};

// 选择变化
const handleSelectionChange = (selection) => {
  selectedConfigs.value = selection;
};

// 文件选择
const handleFileChange = async (file) => {
  const formData = new FormData();
  formData.append('file', file.raw);

  try {
    const response = await request.post('/processes/packaging-materials/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    if (response.success) {
      const { created, updated, errors } = response.data;
      let message = `导入成功！创建 ${created} 条，更新 ${updated} 条`;
      if (errors && errors.length > 0) {
        message += `\n${errors.slice(0, 3).join('\n')}`;
        if (errors.length > 3) {
          message += `\n...还有 ${errors.length - 3} 条错误`;
        }
      }
      ElMessage.success(message);
      loadPackagingConfigs();
    }
  } catch (error) {
    // 错误已在拦截器处理
  }
};

// 导出
const handleExport = async () => {
  if (selectedConfigs.value.length === 0) {
    ElMessage.warning('请先选择要导出的数据');
    return;
  }

  try {
    const ids = selectedConfigs.value.map(item => item.id);
    const response = await request.post('/processes/packaging-materials/export/excel', 
      { ids },
      { responseType: 'blob' }
    );
    
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `包材清单_${Date.now()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    ElMessage.success('导出成功');
  } catch (error) {
    ElMessage.error('导出失败');
  }
};

// 下载模板
const handleDownloadTemplate = async () => {
  try {
    const response = await request.get('/processes/packaging-materials/template/download', {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '包材导入模板.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    ElMessage.success('下载成功');
  } catch (error) {
    ElMessage.error('下载失败');
  }
};

onMounted(() => {
  loadModels();
  loadCategories();
  loadMaterials();
  loadPackagingConfigs();
});
</script>

<style scoped>
.packaging-management {
  /* padding 由 MainLayout 提供 */
}

.filter-bar {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.view-toggle {
  margin-left: auto;
}

.packaging-info { color: #409EFF; font-weight: 500; }
.price-info { color: #E6A23C; font-weight: 600; font-size: 14px; }
.subtotal-text { color: #67C23A; font-weight: 500; }
.status-tag { min-width: 48px; text-align: center; }
.mb-4 { margin-bottom: 16px; }
.mt-4 { margin-top: 16px; }
.text-lg { font-size: 18px; }
.text-sm { font-size: 14px; }
.font-bold { font-weight: 600; }
.text-gray-600 { color: #606266; }
.text-blue-600 { color: #409EFF; }
.text-right { text-align: right; }
.material-option { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; }
.material-name { flex: 1; font-weight: 500; }
.material-price { color: #909399; font-size: 12px; margin-left: 12px; }
.readonly-packaging-info { color: #409EFF; font-weight: 500; font-size: 14px; }
.total-per-carton { font-size: 18px; font-weight: bold; color: #409EFF; }

/* 卡片视图样式 */
.config-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 1199px) {
  .config-cards {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 991px) {
  .config-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 767px) {
  .config-cards {
    grid-template-columns: 1fr;
  }
}

.empty-tip {
  grid-column: 1 / -1;
  text-align: center;
  color: #909399;
  padding: 40px 0;
}

.config-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fff;
  transition: box-shadow 0.3s, border-color 0.3s;
}

.config-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.model-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.config-name {
  font-size: 14px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-badge {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  text-align: center;
  line-height: 1.2;
  flex-shrink: 0;
  margin-left: 12px;
}

.config-card .card-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.packaging-method {
  color: #303133;
  font-weight: 500;
  font-size: 14px;
}

.total-qty {
  font-size: 13px;
  color: #606266;
}

.price {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;
}

.status-active {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #67c23a;
}

.status-inactive {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #909399;
}

.card-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid #ebeef5;
  background: #fafafa;
  border-radius: 0 0 8px 8px;
}

.card-actions .el-button {
  transition: transform 0.2s, box-shadow 0.2s;
}

.card-actions .el-button:hover:not(:disabled) {
  transform: scale(1.05);
}

/* 删除按钮样式 */
.delete-btn {
  color: #F56C6C;
}

.delete-btn:hover:not(:disabled) {
  color: #f78989;
  border-color: #f78989;
}

/* 查看对话框样式 */
:deep(.view-dialog .el-dialog__body) {
  max-height: 60vh;
  overflow-y: auto;
}

/* 工具栏折叠 */
.toolbar-wrapper { display: flex; align-items: center; gap: 12px; }
.toolbar-toggle { flex-shrink: 0; }
.toolbar-fade-enter-active, .toolbar-fade-leave-active { transition: opacity 0.3s, transform 0.3s; }
.toolbar-fade-enter-from, .toolbar-fade-leave-to { opacity: 0; transform: translateX(10px); }


/* No Border Input for the Grid */
:deep(.no-border-input .el-input__wrapper) {
  box-shadow: none !important;
  background: transparent !important;
  padding: 0;
}
:deep(.no-border-input .el-input__inner) {
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: #334155;
}
</style>


