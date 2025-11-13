<template>
  <div class="system-config-container">
    <div class="card">
      <div class="card-header">
        <div class="header-left">
          <el-button @click="$router.back()" :icon="ArrowLeft">返回</el-button>
          <span class="header-title">系统配置管理</span>
        </div>
        <el-button type="primary" @click="handleSave" :loading="saving" v-if="authStore.isAdmin">
          <el-icon><Check /></el-icon>
          保存配置
        </el-button>
      </div>

      <div class="card-body">
        <el-form :model="configForm" label-width="150px" :disabled="!authStore.isAdmin">
          <!-- 管销率 -->
          <el-form-item label="管销率">
            <el-input-number
              v-model="configForm.overhead_rate"
              :min="0"
              :max="1"
              :step="0.01"
              :precision="2"
              style="width: 200px"
            />
            <span class="config-hint">（默认 0.2，即 20%）</span>
            
          </el-form-item>

          <!-- 增值税率 -->
          <el-form-item label="增值税率">
            <el-input-number
              v-model="configForm.vat_rate"
              :min="0"
              :max="1"
              :step="0.01"
              :precision="2"
              style="width: 200px"
            />
            <span class="config-hint">（默认 0.13，即 13%）</span>
            
          </el-form-item>

          <!-- 保险率 -->
          <el-form-item label="保险率">
            <el-input-number
              v-model="configForm.insurance_rate"
              :min="0"
              :max="1"
              :step="0.001"
              :precision="3"
              style="width: 200px"
            />
            <span class="config-hint">（默认 0.003，即 0.3%）</span>
            
          </el-form-item>

          <!-- 汇率 -->
          <el-form-item label="汇率（CNY/USD）">
            <el-input-number
              v-model="configForm.exchange_rate"
              :min="0.01"
              :step="0.1"
              :precision="2"
              style="width: 200px"
            />
            <span class="config-hint">（默认 7.2）</span>
            
          </el-form-item>

          <!-- FOB深圳运费汇率 -->
          <el-form-item label="FOB深圳运费汇率">
            <el-input-number
              v-model="configForm.fob_shenzhen_exchange_rate"
              :min="0.01"
              :step="0.1"
              :precision="2"
              style="width: 200px"
            />
            <span class="config-hint">（默认 7.1）</span>
            
          </el-form-item>

          <!-- 20尺整柜运费 -->
          <el-form-item label="20尺整柜运费（美金）">
            <el-input-number
              v-model="configForm.fcl_20_freight_usd"
              :min="0"
              :step="10"
              :precision="0"
              style="width: 200px"
            />
            <span class="config-hint">（默认 $840）</span>
            
          </el-form-item>

          <!-- 40尺整柜运费 -->
          <el-form-item label="40尺整柜运费（美金）">
            <el-input-number
              v-model="configForm.fcl_40_freight_usd"
              :min="0"
              :step="10"
              :precision="0"
              style="width: 200px"
            />
            <span class="config-hint">（默认 $940）</span>
            
          </el-form-item>

          <!-- 利润区间 -->
          <el-form-item label="利润区间">
            <div class="profit-tiers-container">
              <div v-for="(tier, index) in configForm.profit_tiers" :key="index" class="profit-tier-item">
                <el-input-number
                  v-model="configForm.profit_tiers[index]"
                  :min="0"
                  :step="0.01"
                  :precision="2"
                  style="width: 150px"
                />
                <span class="tier-percentage">{{ (tier * 100).toFixed(0) }}%</span>
                <el-button
                  type="danger"
                  size="small"
                  :icon="Delete"
                  circle
                  @click="removeProfitTier(index)"
                  v-if="configForm.profit_tiers.length > 1 && authStore.isAdmin"
                />
              </div>
              <el-button
                type="primary"
                size="small"
                @click="addProfitTier"
                v-if="authStore.isAdmin"
              >
                <el-icon><Plus /></el-icon>
                添加利润档位
              </el-button>
            </div>
            <div class="config-description">用于生成利润区间报价：报价 = 基础价 × (1 + 利润%)</div>
          </el-form-item>

          <!-- 最后更新时间 -->
          <el-form-item label="最后更新时间">
            <span class="update-time">{{ lastUpdateTime || '未更新' }}</span>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 配置说明 -->
    <div class="card" style="margin-top: 20px">
      <div class="card-header">
        <span>配置说明</span>
      </div>
      <div class="card-body">
        <el-alert
          title="重要提示"
          type="warning"
          :closable="false"
          show-icon
        >
          <ul class="config-notes">
            <li>配置参数的修改将立即生效，影响新创建的报价单</li>
            <li>已创建的历史报价单将保留创建时的配置参数</li>
            <li>管销率、增值税率、保险率的取值范围为 0 到 1 之间的小数</li>
            <li>汇率必须为正数，建议定期更新以反映实际汇率变化</li>
            <li>利润区间可以自定义添加或删除，至少保留一个档位</li>
          </ul>
        </el-alert>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Check, Plus, Delete, ArrowLeft } from '@element-plus/icons-vue';
import { useAuthStore } from '@/store/auth';
import request from '@/utils/request';

const authStore = useAuthStore();

// 配置表单
const configForm = reactive({
  overhead_rate: 0.2,
  vat_rate: 0.13,
  insurance_rate: 0.003,
  exchange_rate: 7.2,
  fob_shenzhen_exchange_rate: 7.1,
  fcl_20_freight_usd: 840,
  fcl_40_freight_usd: 940,
  profit_tiers: [0.05, 0.10, 0.25, 0.50]
});

const saving = ref(false);
const lastUpdateTime = ref('');

// 加载配置
const loadConfig = async () => {
  try {
    const response = await request.get('/config');
    if (response.success && response.data) {
      Object.assign(configForm, response.data);
      
      // 获取最后更新时间（从任意一个配置项获取）
      const detailResponse = await request.get('/config/overhead_rate');
      if (detailResponse.success && detailResponse.data) {
        lastUpdateTime.value = detailResponse.data.updated_at;
      }
    }
  } catch (error) {
    console.error('加载配置失败:', error);
    ElMessage.error('加载配置失败');
  }
};

// 保存配置
const handleSave = async () => {
  if (!authStore.isAdmin) {
    ElMessage.warning('只有管理员可以修改配置');
    return;
  }

  // 验证配置值
  if (configForm.overhead_rate < 0 || configForm.overhead_rate > 1) {
    ElMessage.error('管销率必须在 0 到 1 之间');
    return;
  }
  if (configForm.vat_rate < 0 || configForm.vat_rate > 1) {
    ElMessage.error('增值税率必须在 0 到 1 之间');
    return;
  }
  if (configForm.insurance_rate < 0 || configForm.insurance_rate > 1) {
    ElMessage.error('保险率必须在 0 到 1 之间');
    return;
  }
  if (configForm.exchange_rate <= 0) {
    ElMessage.error('汇率必须大于 0');
    return;
  }
  if (configForm.profit_tiers.length === 0) {
    ElMessage.error('至少需要一个利润档位');
    return;
  }

  saving.value = true;
  try {
    const response = await request.post('/config/batch', {
      configs: configForm
    });

    if (response.success) {
      ElMessage.success('配置保存成功');
      await loadConfig(); // 重新加载配置以更新时间
    }
  } catch (error) {
    console.error('保存配置失败:', error);
    ElMessage.error(error.message || '保存配置失败');
  } finally {
    saving.value = false;
  }
};

// 添加利润档位
const addProfitTier = () => {
  configForm.profit_tiers.push(0.05);
};

// 删除利润档位
const removeProfitTier = (index) => {
  if (configForm.profit_tiers.length <= 1) {
    ElMessage.warning('至少需要保留一个利润档位');
    return;
  }
  configForm.profit_tiers.splice(index, 1);
};

onMounted(() => {
  loadConfig();
});
</script>

<style scoped>
.system-config-container {
  padding: 20px;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-title {
  font-weight: 600;
  font-size: 16px;
}

.card-body {
  padding: 24px 20px;
}

.config-hint {
  margin-left: 12px;
  color: #6b7280;
  font-size: 14px;
}

.config-description {
  margin-top: 8px;
  color: #9ca3af;
  font-size: 13px;
  line-height: 1.5;
}

.profit-tiers-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.profit-tier-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tier-percentage {
  min-width: 50px;
  color: #6b7280;
  font-weight: 500;
}

.update-time {
  color: #6b7280;
  font-size: 14px;
}

.config-notes {
  margin: 0;
  padding-left: 20px;
  line-height: 1.8;
}

.config-notes li {
  margin-bottom: 8px;
}
</style>
