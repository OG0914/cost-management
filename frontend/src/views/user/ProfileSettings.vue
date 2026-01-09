<template>
  <div class="profile-settings">
    <el-card>
      <template #header>
        <span class="title">个人设置</span>
      </template>

      <div class="profile-content">
        <!-- 左侧：个人信息卡片 -->
        <div class="profile-card">
          <div class="card-body">
            <div class="user-header">
              <div
                class="avatar"
                :style="{ backgroundColor: getRoleColor(userInfo.role) }"
              >
                {{ getInitial(userInfo.real_name) }}
              </div>
              <div class="user-info">
                <div class="username">{{ userInfo.username }}</div>
                <div class="real-name">{{ userInfo.real_name || '-' }}</div>
                <el-tag
                  size="small"
                  :color="getRoleColor(userInfo.role)"
                  effect="dark"
                  style="border: none;"
                >
                  {{ getRoleName(userInfo.role) }}
                </el-tag>
              </div>
            </div>
            <div class="user-details">
              <div class="email">📧 {{ userInfo.email || '-' }}</div>
              <div class="status">
                <span class="status-active"></span>
                已启用
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：修改密码 -->
        <div class="password-section">
          <div class="section-header">修改密码</div>
          <div class="section-body">
            <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px">
              <el-form-item label="旧密码" prop="oldPassword">
                <el-input
                  v-model="passwordForm.oldPassword"
                  type="password"
                  placeholder="请输入旧密码"
                  show-password
                />
              </el-form-item>
              <el-form-item label="新密码" prop="newPassword">
                <el-input
                  v-model="passwordForm.newPassword"
                  type="password"
                  placeholder="请输入新密码（至少6位）"
                  show-password
                />
              </el-form-item>
              <el-form-item label="确认密码" prop="confirmPassword">
                <el-input
                  v-model="passwordForm.confirmPassword"
                  type="password"
                  placeholder="请再次输入新密码"
                  show-password
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleChangePassword" :loading="loading">
                  确认
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '../../utils/request';
import { useAuthStore } from '../../store/auth';

defineOptions({ name: 'ProfileSettings' })

const authStore = useAuthStore();
const loading = ref(false);
const passwordFormRef = ref(null);

// 用户信息
const userInfo = reactive({
  username: '',
  real_name: '',
  email: '',
  role: ''
});

// 密码表单
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 验证确认密码
const validateConfirmPassword = (rule, value, callback) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

// 密码表单验证规则
const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入旧密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
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

// 获取姓名首字母
const getInitial = (name) => {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
};

// 加载用户信息
const loadUserInfo = async () => {
  try {
    const response = await request.get('/auth/me');
    if (response.success) {
      userInfo.username = response.data.username;
      userInfo.real_name = response.data.real_name;
      userInfo.email = response.data.email;
      userInfo.role = response.data.role;
    }
  } catch (error) {
    ElMessage.error('加载用户信息失败');
  }
};

// 修改密码
const handleChangePassword = async () => {
  if (!passwordFormRef.value) return;

  await passwordFormRef.value.validate(async (valid) => {
    if (!valid) return;

    loading.value = true;
    try {
      const response = await request.post('/auth/change-password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });

      if (response.success) {
        ElMessage.success('密码修改成功');
        // 清空表单
        passwordForm.oldPassword = '';
        passwordForm.newPassword = '';
        passwordForm.confirmPassword = '';
        passwordFormRef.value.resetFields();
      }
    } catch (error) {
      // 错误已在拦截器处理
    } finally {
      loading.value = false;
    }
  });
};

onMounted(() => {
  loadUserInfo();
});
</script>

<style scoped>
.profile-settings {
  /* padding 由 MainLayout 提供 */
}

.title {
  font-size: 16px;
  font-weight: 600;
}

.profile-content {
  display: flex;
  gap: 24px;
  align-items: stretch;
}

/* 左侧卡片 */
.profile-card {
  width: 300px;
  flex-shrink: 0;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fff;
}

.profile-card .card-body {
  padding: 20px;
}

.user-header {
  display: flex;
  gap: 20px;
  margin-bottom: 50px;
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 24px;
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
}

.real-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 50px;
}

.email {
  font-size: 13px;
  color: #606266;
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

/* 右侧修改密码区域 */
.password-section {
  flex: 1;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.section-header {
  padding: 16px 20px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  border-bottom: 1px solid #ebeef5;
}

.section-body {
  padding: 24px 20px;
  flex: 1;
}

.section-body .el-form-item:last-child {
  margin-bottom: 0;
  margin-top: 8px;
}
</style>
