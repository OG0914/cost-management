<template>
  <div class="packaging-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>包材管理</span>
          <el-space v-if="canEdit">
            <el-button type="success" @click="handleDownloadTemplate">
              <el-icon><Download /></el-icon>
              下载模板
            </el-button>
            <el-upload
              action="#"
              :auto-upload="false"
              :on-change="handleFileChange"
              :show-file-list="false"
              accept=".xlsx,.xls"
            >
              <el-button type="warning">
                <el-icon><Upload /></el-icon>
                导入Excel
              </el-button>
            </el-upload>
            <el-button type="info" @click="handleExport">
              <el-icon><Download /></el-icon>
              导出Excel
            </el-button>
            <el-button type="danger" @click="handleBatchDelete" :disabled="selectedConfigs.length === 0">
              <el-icon><Delete /></el-icon>
              批量删除
            </el-button>
            <el-button type="primary" @click="showCreateDialog">
              <el-icon><Plus /></el-icon>
              新增包装配置
            </el-button>
          </el-space>
        </div>
      </template>

      <!-- 筛选栏 -->
      <div class="filter-bar">
        <el-select 
          v-model="selectedModelId" 
          placeholder="选择型号筛选" 
          @change="loadPackagingConfigs" 
          clearable
          filterable
          style="width: 300px; margin-right: 16px"
        >
          <el-option
            v-for="model in models"
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
      </div>

      <!-- 包装配置列表 -->
      <el-table 
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
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="success" @click="viewMaterials(row)">查看</el-button>
            <el-button size="small" type="primary" @click="editConfig(row)" v-if="canEdit">编辑</el-button>
            <el-button size="small" type="warning" @click="copyConfig(row)" v-if="canEdit">复制</el-button>
            <el-button size="small" type="danger" @click="deleteConfig(row)" v-if="canEdit">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <div class="pagination-total">共 {{ packagingConfigs.length }} 条记录</div>
        <div class="pagination-right">
          <span class="pagination-info">{{ currentPage }} / {{ totalPages }} 页</span>
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="packagingConfigs.length"
            layout="sizes, prev, pager, next, jumper"
          />
        </div>
      </div>
    </el-card>

    <!-- 创建/编辑包装配置对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑包装配置' : '新增包装配置'"
      width="800px"
    >
      <el-form :model="form" ref="formRef" label-width="140px">
        <el-form-item label="型号" required>
          <el-select 
            v-model="form.model_id" 
            placeholder="请选择型号" 
            :disabled="isEdit"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="model in models"
              :key="model.id"
              :label="`${model.model_name} (${model.regulation_name})`"
              :value="model.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="配置名称" required>
          <el-input v-model="form.config_name" placeholder="如：标准包装" :disabled="isEdit" />
        </el-form-item>

        <el-divider content-position="left">包装方式（只读，由工序管理控制）</el-divider>

        <!-- 包装类型（只读显示） -->
        <el-form-item label="包装类型">
          <el-tag :type="getPackagingTypeTagType(form.packaging_type)" size="large">
            {{ getPackagingTypeName(form.packaging_type) || '标准彩盒' }}
          </el-tag>
        </el-form-item>

        <!-- 包装方式（只读显示） -->
        <el-form-item label="包装方式">
          <span class="readonly-packaging-info">{{ formatPackagingMethodFromConfig(form) }}</span>
        </el-form-item>

        <!-- 每箱总数（只读显示） -->
        <el-form-item label="每箱总数">
          <span class="total-per-carton">{{ calculateTotalFromConfig(form) }} pcs</span>
        </el-form-item>

        <el-form-item label="状态" v-if="isEdit">
          <el-switch
            v-model="form.is_active"
            :active-value="1"
            :inactive-value="0"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>

        <el-divider content-position="left">
          包材列表
          <el-button size="small" type="primary" @click="addMaterial" style="margin-left: 10px">
            <el-icon><Plus /></el-icon>
            添加包材
          </el-button>
        </el-divider>

        <el-table :data="form.materials" border style="margin-bottom: 20px" show-summary :summary-method="getSummaries">
          <el-table-column label="序号" width="60" type="index" />
          <el-table-column label="包材名称" min-width="200">
            <template #default="{ row }">
              <el-autocomplete
                v-model="row.material_name"
                :fetch-suggestions="queryMaterials"
                placeholder="输入关键字搜索原料"
                size="small"
                style="width: 100%"
                @select="(item) => handleSelectMaterial(row, item)"
                clearable
              >
                <template #default="{ item }">
                  <div class="material-option">
                    <span class="material-name">{{ item.name }}</span>
                    <span class="material-price">¥{{ formatNumber(item.price) }}/{{ item.unit }}</span>
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
                style="width: 100%"
              />
            </template>
          </el-table-column>
          <el-table-column label="单价" width="120">
            <template #default="{ row }">
              <el-input-number 
                v-model="row.unit_price" 
                :min="0" 
                :precision="4" 
                :step="0.01" 
                :controls="false"
                size="small"
                style="width: 100%"
              />
            </template>
          </el-table-column>
          <el-table-column label="小计" width="120" align="right">
            <template #default="{ row }">
              <span class="subtotal-text">¥{{ formatNumber(row.basic_usage && row.basic_usage !== 0 ? ((row.unit_price || 0) / row.basic_usage) : 0) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="外箱材积(m³)" width="130">
            <template #default="{ row }">
              <el-input-number 
                v-model="row.carton_volume" 
                :min="0" 
                :precision="4" 
                :step="0.001" 
                :controls="false"
                size="small"
                style="width: 100%"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80">
            <template #default="{ $index }">
              <el-button size="small" type="danger" @click="removeMaterial($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="loading">确定</el-button>
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, ArrowLeft, Download, Delete, Upload } from '@element-plus/icons-vue';
import request from '../../utils/request';
import { useAuthStore } from '../../store/auth';
import { formatNumber, formatDateTime } from '../../utils/format';
import { 
  getPackagingTypeOptions, 
  getPackagingTypeName, 
  getPackagingTypeByKey,
  formatPackagingMethodFromConfig,
  calculateTotalFromConfig
} from '../../config/packagingTypes';

const router = useRouter();
const authStore = useAuthStore();



// 权限检查 - 只有管理员和采购人员可以编辑包材
const canEdit = computed(() => authStore.isAdmin || authStore.isPurchaser);

// 包装类型选项
const packagingTypeOptions = getPackagingTypeOptions();

// 数据
const models = ref([]);
const packagingConfigs = ref([]);
const selectedConfigs = ref([]);
const selectedModelId = ref(null);
const selectedPackagingType = ref(null);
const loading = ref(false);
const allMaterials = ref([]); // 所有原料列表

// 分页状态
const currentPage = ref(1);
const pageSize = ref(10);

// 总页数
const totalPages = computed(() => {
  return Math.ceil(packagingConfigs.value.length / pageSize.value) || 1;
});

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

// 加载所有原料
const loadMaterials = async () => {
  try {
    const response = await request.get('/materials');
    if (response.success) {
      allMaterials.value = response.data;
    }
  } catch (error) {
    console.error('加载原料失败:', error);
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
      packagingConfigs.value = response.data;
    }
  } catch (error) {
    ElMessage.error('加载包装配置失败');
  } finally {
    loading.value = false;
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
      form.is_active = data.is_active;
      form.materials = data.materials || [];
      
      dialogVisible.value = true;
    }
  } catch (error) {
    // 错误已在拦截器处理
  }
};

// 复制配置
const copyConfig = async (row) => {
  isEdit.value = false;
  
  try {
    const response = await request.get(`/processes/packaging-configs/${row.id}/full`);
    
    if (response.success) {
      const data = response.data;
      
      // 获取该型号下所有配置（从后端获取，确保完整性）
      const modelConfigsResponse = await request.get(`/processes/packaging-configs/model/${data.model_id}`);
      const allModelConfigs = modelConfigsResponse.success ? modelConfigsResponse.data : [];
      
      // 生成唯一的配置名称
      let copyName = data.config_name + ' - 副本';
      let counter = 1;
      
      while (allModelConfigs.some(c => c.config_name === copyName)) {
        counter++;
        copyName = `${data.config_name} - 副本${counter}`;
      }
      
      form.id = null;
      form.model_id = data.model_id;
      form.config_name = copyName;
      form.packaging_type = data.packaging_type || 'standard_box';
      form.layer1_qty = data.layer1_qty ?? data.pc_per_bag;
      form.layer2_qty = data.layer2_qty ?? data.bags_per_box;
      form.layer3_qty = data.layer3_qty ?? data.boxes_per_carton;
      // 兼容旧字段名
      form.pc_per_bag = data.pc_per_bag;
      form.bags_per_box = data.bags_per_box;
      form.boxes_per_carton = data.boxes_per_carton;
      form.is_active = 1;
      form.materials = (data.materials || []).map(m => ({
        material_name: m.material_name,
        basic_usage: m.basic_usage,
        unit_price: m.unit_price,
        carton_volume: m.carton_volume,
        sort_order: m.sort_order
      }));
      
      dialogVisible.value = true;
      ElMessage.success('已复制配置，请修改配置名称后保存');
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
  loadMaterials();
  loadPackagingConfigs();
});
</script>

<style scoped>
.packaging-management {
  /* padding 由 MainLayout 提供 */
}

.page-header {
  margin-bottom: 16px;
}

.back-button {
  font-size: 14px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-bar {
  margin-bottom: 16px;
}

/* 分页样式 */
.pagination-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.pagination-total {
  font-size: 14px;
  color: #606266;
}

.pagination-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.pagination-info {
  font-size: 14px;
  color: #606266;
}

.packaging-info {
  color: #409EFF;
  font-weight: 500;
}

.price-info {
  color: #E6A23C;
  font-weight: 600;
  font-size: 14px;
}

.subtotal-text {
  color: #67C23A;
  font-weight: 500;
}

.status-tag {
  min-width: 48px;
  text-align: center;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-4 {
  margin-top: 16px;
}

.text-lg {
  font-size: 18px;
}

.text-sm {
  font-size: 14px;
}

.font-bold {
  font-weight: 600;
}

.text-gray-600 {
  color: #606266;
}

.text-blue-600 {
  color: #409EFF;
}

.text-right {
  text-align: right;
}

.material-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.material-name {
  flex: 1;
  font-weight: 500;
}

.material-price {
  color: #909399;
  font-size: 12px;
  margin-left: 12px;
}

.readonly-packaging-info {
  color: #409EFF;
  font-weight: 500;
  font-size: 14px;
}

.total-per-carton {
  font-size: 18px;
  font-weight: bold;
  color: #409EFF;
}

.filter-bar {
  display: flex;
  align-items: center;
}

/* 查看对话框样式 */
:deep(.view-dialog .el-dialog__body) {
  max-height: 60vh;
  overflow-y: auto;
}
</style>
