<template>
  <div class="user-manage">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">用户管理</span>
          <div class="header-actions">
            <!-- 视图切换 -->
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
            <!-- 新增用户 -->
            <el-button type="primary" @click="showCreateDialog">
              <el-icon><Plus /></el-icon>
              新增用户
            </el-button>
          </div>
        </div>
      </template>

      <!-- 筛选区域 -->
      <div class="filter-section">
        <el-input
          v-model="searchText"
          placeholder="搜索用户..."
          :prefix-icon="Search"
          clearable
          style="width: 200px"
        />
      </div>

      <!-- 卡片视图 -->
      <div v-if="viewMode === 'card'" class="user-cards" v-loading="loading">
        <div v-if="paginatedUsers.length === 0" class="empty-tip">
          暂无匹配用户
        </div>
        <div
          v-for="user in paginatedUsers"
          :key="user.id"
          class="user-card"
        >
          <!-- 卡片头部：头像 + 用户信息 -->
          <div class="card-body">
            <div class="user-header">
              <div
                class="avatar"
                :style="{ backgroundColor: getRoleColor(user.role) }"
              >
                {{ getInitial(user.real_name) }}
              </div>
              <div class="user-info">
                <div class="username">{{ user.username }}</div>
                <div class="real-name">{{ user.real_name || '-' }}</div>
                <el-tag
                  size="small"
                  :color="getRoleColor(user.role)"
                  effect="dark"
                  style="border: none;"
                >
                  {{ getRoleName(user.role) }}
                </el-tag>
              </div>
            </div>
            <!-- 邮箱和状态 -->
            <div class="user-details">
              <div class="email">📧 {{ user.email || '-' }}</div>
              <div class="status">
                <span :class="getStatusClass(user.is_active)"></span>
                {{ user.is_active ? '已启用' : '已禁用' }}
              </div>
            </div>
          </div>
          <!-- 操作栏 -->
          <div class="card-actions">
            <el-button :icon="Key" circle @click="resetPassword(user)" title="重置密码" />
            <el-button :icon="EditPen" circle @click="editUser(user)" title="编辑" />
            <el-button
              :icon="Delete"
              circle
              class="delete-btn"
              @click="deleteUser(user)"
              :disabled="user.username === 'admin'"
              title="删除"
            />
          </div>
        </div>
      </div>

      <!-- 用户列表 -->
      <el-table v-if="viewMode === 'list'" :data="paginatedUsers" border stripe v-loading="loading">
        <el-table-column prop="username" label="用户代号" min-width="120" />
        <el-table-column prop="real_name" label="真实姓名" min-width="120" />
        <el-table-column prop="role" label="角色" width="110">
          <template #default="{ row }">
            <el-tag
              size="small"
              :color="getRoleColor(row.role)"
              effect="dark"
              style="border: none;"
            >
              {{ getRoleName(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <div class="status">
              <span :class="getStatusClass(row.is_active)"></span>
              {{ row.is_active ? '已启用' : '已禁用' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button :icon="Key" circle size="small" @click="resetPassword(row)" title="重置密码" />
            <el-button :icon="EditPen" circle size="small" @click="editUser(row)" title="编辑" />
            <el-button
              :icon="Delete"
              circle
              size="small"
              class="delete-btn"
              @click="deleteUser(row)"
              :disabled="row.username === 'admin'"
              title="删除"
            />
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <div class="pagination-total">共 {{ filteredUsers.length }} 条记录</div>
        <div class="pagination-right">
          <span class="pagination-info">{{ currentPage }} / {{ totalPages }} 页</span>
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="filteredUsers.length"
            layout="sizes, prev, pager, next, jumper"
            :pager-count="5"
          />
        </div>
      </div>
    </el-card>

    <!-- 新增/编辑用户对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      width="500px"
      append-to-body
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="用户代号" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户代号" />
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
            <el-option label="采购" value="purchaser" />
            <el-option label="生产" value="producer" />
            <el-option label="审核" value="reviewer" />
            <el-option label="业务" value="salesperson" />
            <el-option label="只读" value="readonly" />
          </el-select>
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>

        <el-form-item label="状态" prop="is_active" v-if="isEdit">
          <el-switch
            v-model="form.is_active"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="loading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog v-model="resetPasswordVisible" title="重置密码" width="400px">
      <el-form :model="resetPasswordForm" :rules="resetPasswordRules" ref="resetPasswordFormRef" label-width="80px">
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="resetPasswordForm.newPassword"
            type="password"
            placeholder="请输入新密码（至少6位）"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetPasswordVisible = false">取消</el-button>
        <el-button type="primary" @click="submitResetPassword" :loading="resetPasswordLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search, Grid, List, Key, EditPen, Delete } from '@element-plus/icons-vue';
import request from '../../utils/request';
import { formatDateTime } from '@/utils/format';

// 数据
const users = ref([]);
const loading = ref(false);

// 视图切换状态: 'card' | 'list'
const viewMode = ref('card');

// 筛选状态
const searchText = ref('');

// 分页状态
const currentPage = ref(1);
const pageSize = ref(10);

// 筛选后的用户列表
const filteredUsers = computed(() => {
  let result = users.value;
  
  // 搜索筛选：按用户代号或真实姓名
  if (searchText.value) {
    const search = searchText.value.toLowerCase();
    result = result.filter(user => 
      user.username.toLowerCase().includes(search) ||
      (user.real_name && user.real_name.toLowerCase().includes(search))
    );
  }
  
  return result;
});

// 总页数
const totalPages = computed(() => {
  return Math.ceil(filteredUsers.value.length / pageSize.value) || 1;
});

// 分页后的用户列表
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredUsers.value.slice(start, end);
});

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
  email: '',
  is_active: true
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

// 重置密码对话框
const resetPasswordVisible = ref(false);
const resetPasswordLoading = ref(false);
const resetPasswordFormRef = ref(null);
const resetPasswordUserId = ref(null);
const resetPasswordForm = reactive({
  newPassword: ''
});
const resetPasswordRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少 6 个字符', trigger: 'blur' }
  ]
};

// 角色颜色映射
const ROLE_COLORS = {
  admin: '#F56C6C',
  purchaser: '#E6A23C',
  producer: '#67C23A',
  reviewer: '#409EFF',
  salesperson: '#9B59B6',
  readonly: '#909399'
};

// 获取角色名称
const getRoleName = (role) => {
  const roleMap = {
    admin: '管理员',
    purchaser: '采购',
    producer: '生产',
    reviewer: '审核',
    salesperson: '业务',
    readonly: '只读'
  };
  return roleMap[role] || role;
};

// 获取角色颜色
const getRoleColor = (role) => {
  return ROLE_COLORS[role] || '#909399';
};

// 获取姓名首字母（支持中英文）
const getInitial = (name) => {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
};

// 获取状态样式类
const getStatusClass = (isActive) => {
  return isActive ? 'status-active' : 'status-inactive';
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
  form.is_active = row.is_active;
  dialogVisible.value = true;
};

// 重置密码
const resetPassword = (row) => {
  resetPasswordUserId.value = row.id;
  resetPasswordForm.newPassword = '';
  resetPasswordVisible.value = true;
};

// 提交重置密码
const submitResetPassword = async () => {
  if (!resetPasswordFormRef.value) return;

  await resetPasswordFormRef.value.validate(async (valid) => {
    if (!valid) return;

    resetPasswordLoading.value = true;
    try {
      const response = await request.post(`/auth/users/${resetPasswordUserId.value}/reset-password`, {
        newPassword: resetPasswordForm.newPassword
      });

      if (response.success) {
        ElMessage.success('密码重置成功');
        resetPasswordVisible.value = false;
      }
    } catch (error) {
      // 错误已在拦截器处理
    } finally {
      resetPasswordLoading.value = false;
    }
  });
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
          username: form.username,
          role: form.role,
          real_name: form.real_name,
          email: form.email,
          is_active: form.is_active
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
  form.is_active = true;
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
  /* padding 由 MainLayout 提供 */
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.card-header .title {
  font-size: 16px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.view-toggle {
  margin: 0 4px;
}

.filter-section {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

/* 卡片视图样式 */
.user-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 1199px) {
  .user-cards {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 991px) {
  .user-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 767px) {
  .user-cards {
    grid-template-columns: 1fr;
  }
}

.empty-tip {
  grid-column: 1 / -1;
  text-align: center;
  color: #909399;
  padding: 40px 0;
}

.user-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fff;
  transition: box-shadow 0.3s, border-color 0.3s;
}

.user-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.user-card .card-body {
  padding: 16px;
}

.user-header {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
  font-weight: 600;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.username {
  font-size: 14px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.real-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.email {
  font-size: 13px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

/* 操作按钮悬停效果 */
.card-actions .el-button {
  transition: transform 0.2s, box-shadow 0.2s;
}

.card-actions .el-button:hover:not(:disabled) {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 头像悬停效果 */
.avatar {
  transition: transform 0.2s;
}

.user-card:hover .avatar {
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
</style>
