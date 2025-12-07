<template>
  <div class="packaging-management">
    <!-- 返回按钮 -->
    <div class="page-header">
      <el-button @click="goBack" class="back-button">
        <el-icon><ArrowLeft /></el-icon>
        返回上一级
      </el-button>
    </div>

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
          style="width: 300px"
        >
          <el-option
            v-for="model in models"
            :key="model.id"
            :label="`${model.model_name} (${model.regulation_name})`"
            :value="model.id"
          />
        </el-select>
      </div>

      <!-- 包装配置列表 -->
      <el-table 
        :data="packagingConfigs" 
        border 
        stripe 
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="model_category" label="产品类别" width="110" sortable />
        <el-table-column prop="model_name" label="型号" width="120" sortable />
        <el-table-column prop="config_name" label="配置名称" width="150" sortable />
        <el-table-column label="包装方式" min-width="280" sortable>
          <template #default="{ row }">
            <span class="packaging-info">
              {{ row.pc_per_bag }}pc/bag, {{ row.bags_per_box }}bags/box, {{ row.boxes_per_carton }}boxes/carton
            </span>
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
          <el-input v-model="form.config_name" placeholder="如：标准包装" />
        </el-form-item>

        <el-divider content-position="left">包装方式</el-divider>

        <el-form-item label="每袋数量（pcs）" required>
          <el-input-number v-model="form.pc_per_bag" :min="1" :controls="false" style="width: 200px" />
        </el-form-item>

        <el-form-item label="每盒袋数（bags）" required>
          <el-input-number v-model="form.bags_per_box" :min="1" :controls="false" style="width: 200px" />
        </el-form-item>

        <el-form-item label="每箱盒数（boxes）" required>
          <el-input-number v-model="form.boxes_per_carton" :min="1" :controls="false" style="width: 200px" />
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
    <el-dialog v-model="materialDialogVisible" title="包材列表" width="700px">
      <div class="mb-4">
        <p class="text-lg font-bold">{{ currentConfig?.model_name }} - {{ currentConfig?.config_name }}</p>
        <p class="text-gray-600">
          {{ currentConfig?.pc_per_bag }}pc/bag, 
          {{ currentConfig?.bags_per_box }}bags/box, 
          {{ currentConfig?.boxes_per_carton }}boxes/carton
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

const router = useRouter();
const authStore = useAuthStore();

// 返回上一级
const goBack = () => {
  router.push('/dashboard');
};

// 权限检查 - 只有管理员和采购人员可以编辑包材
const canEdit = computed(() => authStore.isAdmin || authStore.isPurchaser);

// 数据
const models = ref([]);
const packagingConfigs = ref([]);
const selectedConfigs = ref([]);
const selectedModelId = ref(null);
const loading = ref(false);
const allMaterials = ref([]); // 所有原料列表

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
    const url = selectedModelId.value
      ? `/processes/packaging-configs/model/${selectedModelId.value}`
      : '/processes/packaging-configs';
    
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
  if (!form.pc_per_bag || !form.bags_per_box || !form.boxes_per_carton) {
    ElMessage.warning('请填写完整的包装方式');
    return;
  }
  
  loading.value = true;
  try {
    const data = {
      model_id: form.model_id,
      config_name: form.config_name,
      pc_per_bag: form.pc_per_bag,
      bags_per_box: form.bags_per_box,
      boxes_per_carton: form.boxes_per_carton,
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
  padding: 20px;
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
</style>
