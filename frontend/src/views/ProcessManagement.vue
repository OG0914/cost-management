<template>
  <div class="process-management">
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
          <span>工序管理</span>
          <el-button type="primary" @click="showCreateDialog" v-if="canEdit">
            <el-icon><Plus /></el-icon>
            新增包装配置
          </el-button>
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
      <el-table :data="packagingConfigs" border stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="model_name" label="型号" width="120" />
        <el-table-column prop="config_name" label="配置名称" width="150" />
        <el-table-column label="包装方式" min-width="250">
          <template #default="{ row }">
            <span class="packaging-info">
              {{ row.pc_per_bag }}pc/bag, {{ row.bags_per_box }}bags/box, {{ row.boxes_per_carton }}boxes/carton
            </span>
          </template>
        </el-table-column>
        <el-table-column label="工序总价" width="130" align="right">
          <template #default="{ row }">
            <span class="price-info">¥{{ (row.process_total_price || 0).toFixed(4) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'danger'" class="status-tag">
              {{ row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="350" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="success" @click="viewProcesses(row)">查看</el-button>
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
      width="700px"
    >
      <el-form :model="form" ref="formRef" label-width="120px">
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

        <el-form-item label="每袋数量（只）" required>
          <el-input-number v-model="form.pc_per_bag" :min="1" style="width: 100%" />
        </el-form-item>

        <el-form-item label="每盒袋数（袋）" required>
          <el-input-number v-model="form.bags_per_box" :min="1" style="width: 100%" />
        </el-form-item>

        <el-form-item label="每箱盒数（盒）" required>
          <el-input-number v-model="form.boxes_per_carton" :min="1" style="width: 100%" />
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
          工序列表
          <el-button size="small" type="primary" @click="addProcess" style="margin-left: 10px">
            <el-icon><Plus /></el-icon>
            添加工序
          </el-button>
        </el-divider>

        <el-table :data="form.processes" border style="margin-bottom: 20px">
          <el-table-column label="序号" width="60" type="index" />
          <el-table-column label="工序名称" min-width="200">
            <template #default="{ row }">
              <el-input v-model="row.process_name" placeholder="请输入工序名称" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="单价" width="150">
            <template #default="{ row }">
              <el-input-number 
                v-model="row.unit_price" 
                :min="0" 
                :precision="4" 
                :step="0.01" 
                size="small"
                style="width: 100%"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80">
            <template #default="{ $index }">
              <el-button size="small" type="danger" @click="removeProcess($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="loading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 查看工序对话框 -->
    <el-dialog v-model="processDialogVisible" title="工序列表" width="600px">
      <div class="mb-4">
        <p class="text-lg font-bold">{{ currentConfig?.model_name }} - {{ currentConfig?.config_name }}</p>
        <p class="text-gray-600">
          {{ currentConfig?.pc_per_bag }}pc/bag, 
          {{ currentConfig?.bags_per_box }}bags/box, 
          {{ currentConfig?.boxes_per_carton }}boxes/carton
        </p>
      </div>
      
      <el-table :data="currentProcesses" border>
        <el-table-column label="序号" width="60" type="index" />
        <el-table-column prop="process_name" label="工序名称" />
        <el-table-column prop="unit_price" label="单价" width="120">
          <template #default="{ row }">
            ¥{{ row.unit_price.toFixed(4) }}
          </template>
        </el-table-column>
      </el-table>

      <div class="mt-4 text-right">
        <p class="text-sm text-gray-600 mb-2">
          工序小计: ¥{{ currentProcesses.reduce((sum, p) => sum + p.unit_price, 0).toFixed(4) }}
        </p>
        <p class="text-lg font-bold">
          工序总价（含系数1.56）: <span class="text-blue-600">¥{{ totalProcessPrice.toFixed(4) }}</span>
        </p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, ArrowLeft } from '@element-plus/icons-vue';
import request from '../utils/request';
import { useAuthStore } from '../store/auth';

const router = useRouter();
const authStore = useAuthStore();

// 返回上一级
const goBack = () => {
  router.push('/dashboard');
};

// 权限检查
const canEdit = computed(() => authStore.isAdmin || authStore.isProducer);

// 数据
const models = ref([]);
const packagingConfigs = ref([]);
const selectedModelId = ref(null);
const loading = ref(false);

// 对话框
const dialogVisible = ref(false);
const processDialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref(null);

// 表单
const form = reactive({
  id: null,
  model_id: null,
  config_name: '',
  pc_per_bag: 1,
  bags_per_box: 10,
  boxes_per_carton: 24,
  is_active: 1,
  processes: []
});

// 当前查看的配置
const currentConfig = ref(null);
const currentProcesses = ref([]);

// 工序总价（总数 * 1.56）
const totalProcessPrice = computed(() => {
  const sum = currentProcesses.value.reduce((total, p) => total + p.unit_price, 0);
  return sum * 1.56;
});

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
      // 调试：打印第一条数据
      if (response.data.length > 0) {
        console.log('第一条配置数据:', response.data[0]);
        console.log('工序总价:', response.data[0].process_total_price);
      }
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
    const response = await request.get(`/processes/packaging-configs/${row.id}`);
    
    if (response.success) {
      const data = response.data;
      form.id = data.id;
      form.model_id = data.model_id;
      form.config_name = data.config_name;
      form.pc_per_bag = data.pc_per_bag;
      form.bags_per_box = data.bags_per_box;
      form.boxes_per_carton = data.boxes_per_carton;
      form.is_active = data.is_active;
      form.processes = data.processes || [];
      
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
    const response = await request.get(`/processes/packaging-configs/${row.id}`);
    
    if (response.success) {
      const data = response.data;
      
      // 生成唯一的配置名称
      let copyName = data.config_name + ' - 副本';
      let counter = 1;
      
      // 检查是否已存在同名配置
      const sameModelConfigs = packagingConfigs.value.filter(c => c.model_id === data.model_id);
      while (sameModelConfigs.some(c => c.config_name === copyName)) {
        counter++;
        copyName = `${data.config_name} - 副本${counter}`;
      }
      
      form.id = null; // 清空ID，表示新建
      form.model_id = data.model_id;
      form.config_name = copyName;
      form.pc_per_bag = data.pc_per_bag;
      form.bags_per_box = data.bags_per_box;
      form.boxes_per_carton = data.boxes_per_carton;
      form.is_active = 1;
      // 复制工序列表
      form.processes = (data.processes || []).map(p => ({
        process_name: p.process_name,
        unit_price: p.unit_price,
        sort_order: p.sort_order
      }));
      
      dialogVisible.value = true;
      ElMessage.success('已复制配置，请修改配置名称后保存');
    }
  } catch (error) {
    // 错误已在拦截器处理
  }
};

// 查看工序
const viewProcesses = async (row) => {
  try {
    const response = await request.get(`/processes/packaging-configs/${row.id}`);
    
    if (response.success) {
      currentConfig.value = response.data;
      currentProcesses.value = response.data.processes || [];
      processDialogVisible.value = true;
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

// 添加工序
const addProcess = () => {
  form.processes.push({
    process_name: '',
    unit_price: 0,
    sort_order: form.processes.length
  });
};

// 删除工序
const removeProcess = (index) => {
  form.processes.splice(index, 1);
  // 重新排序
  form.processes.forEach((p, i) => {
    p.sort_order = i;
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
      processes: form.processes
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
  form.pc_per_bag = 1;
  form.bags_per_box = 10;
  form.boxes_per_carton = 24;
  form.is_active = 1;
  form.processes = [];
};

onMounted(() => {
  loadModels();
  loadPackagingConfigs();
});
</script>

<style scoped>
.process-management {
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

.status-tag {
  min-width: 48px;
  text-align: center;
}
</style>
