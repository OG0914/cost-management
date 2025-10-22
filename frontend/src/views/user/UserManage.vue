<template>
  <div class="user-manage">
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
          <span>用户管理</span>
          <el-button type="primary" @click="showCreateDialog">
            <el-icon><Plus /></el-icon>
            新增用户
          </el-button>
        </div>
      </template>

      <!-- 用户列表 -->
      <el-table :data="users" border stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="real_name" label="真实姓名" min-width="120" />
        <el-table-column prop="role" label="角色" width="110">
          <template #default="{ row }">
            <el-tag :type="getRoleType(row.role)">{{ getRoleName(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="created_at" label="创建时间" width="170" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="editUser(row)">编辑</el-button>
            <el-button size="small" type="warning" @click="resetPassword(row)">重置密码</el-button>
            <el-button size="small" type="danger" @click="deleteUser(row)" :disabled="row.username === 'admin'">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑用户对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      width="500px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="isEdit" placeholder="请输入用户名" />
        </el-form-item>

        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input v-model="form.password" type="password" placeholder="请输入密码（至少6位）" show-password />
        </el-form-item>

        <el-form-item label="真实姓名" prop="real_name">
          <el-input v-model="form.real_name" placeholder="请输入真实姓名" />
        </el-form-item>

        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" placeholder="请选择角色" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="采购人员" value="purchaser" />
            <el-option label="生产人员" value="producer" />
            <el-option label="审核人员" value="reviewer" />
            <el-option label="业务员" value="salesperson" />
            <el-option label="只读用户" value="readonly" />
          </el-select>
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="loading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, ArrowLeft } from '@element-plus/icons-vue';
import request from '../../utils/request';

const router = useRouter();

// 返回上一级
const goBack = () => {
  router.push('/dashboard');
};

// 数据
const users = ref([]);
const loading = ref(false);

// 对话框
const dialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref(null);

// 表单
const form = reactive({
  id: null,
  username: '',
  password: '',
  real_name: '',
  role: '',
  email: ''
});

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少 6 个字符', trigger: 'blur' }
  ],
  real_name: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
};

// 获取角色名称
const getRoleName = (role) => {
  const roleMap = {
    admin: '管理员',
    purchaser: '采购人员',
    producer: '生产人员',
    reviewer: '审核人员',
    salesperson: '业务员',
    readonly: '只读用户'
  };
  return roleMap[role] || role;
};

// 获取角色标签类型
const getRoleType = (role) => {
  const typeMap = {
    admin: 'danger',
    purchaser: 'warning',
    producer: 'success',
    reviewer: 'primary',
    salesperson: 'info',
    readonly: ''
  };
  return typeMap[role] || '';
};

// 加载用户列表
const loadUsers = async () => {
  loading.value = true;
  try {
    const response = await request.get('/auth/users');
    if (response.success) {
      users.value = response.data;
    }
  } catch (error) {
    ElMessage.error('加载用户列表失败');
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

// 编辑用户
const editUser = (row) => {
  isEdit.value = true;
  form.id = row.id;
  form.username = row.username;
  form.real_name = row.real_name;
  form.role = row.role;
  form.email = row.email;
  dialogVisible.value = true;
};

// 重置密码
const resetPassword = async (row) => {
  try {
    const result = await ElMessageBox.prompt('请输入新密码（至少6位）', '重置密码', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'password',
      inputPattern: /.{6,}/,
      inputErrorMessage: '密码长度至少 6 个字符'
    });

    if (result.value) {
      const response = await request.post(`/auth/users/${row.id}/reset-password`, {
        newPassword: result.value
      });

      if (response.success) {
        ElMessage.success('密码重置成功');
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      // 错误已在拦截器处理
    }
  }
};

// 删除用户
const deleteUser = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除用户"${row.username}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    const response = await request.delete(`/auth/users/${row.id}`);

    if (response.success) {
      ElMessage.success('删除成功');
      loadUsers();
    }
  } catch (error) {
    if (error !== 'cancel') {
      // 错误已在拦截器处理
    }
  }
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    loading.value = true;
    try {
      if (isEdit.value) {
        // 调用更新用户 API
        const response = await request.put(`/auth/users/${form.id}`, {
          role: form.role,
          real_name: form.real_name,
          email: form.email
        });

        if (response.success) {
          ElMessage.success('更新成功');
          dialogVisible.value = false;
          loadUsers();
        }
      } else {
        const response = await request.post('/auth/register', {
          username: form.username,
          password: form.password,
          role: form.role,
          real_name: form.real_name,
          email: form.email
        });

        if (response.success) {
          ElMessage.success('创建成功');
          dialogVisible.value = false;
          loadUsers();
        }
      }
    } catch (error) {
      // 错误已在拦截器处理
    } finally {
      loading.value = false;
    }
  });
};

// 重置表单
const resetForm = () => {
  form.id = null;
  form.username = '';
  form.password = '';
  form.real_name = '';
  form.role = '';
  form.email = '';
  if (formRef.value) {
    formRef.value.resetFields();
  }
};

onMounted(() => {
  loadUsers();
});
</script>

<style scoped>
.user-manage {
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
</style>
