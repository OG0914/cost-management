<template>
  <div class="config-page">
    <!-- 页面头部 -->
    <div class="config-header">
      <div class="config-header-left">
        <h1 class="config-title">系统配置</h1>
        <span class="config-update-time" v-if="lastUpdateTime">更新于 {{ lastUpdateTime }}</span>
      </div>
      <el-button type="primary" @click="handleSave" :loading="saving" v-if="authStore.isAdmin">保存配置</el-button>
    </div>

    <el-form :model="configForm" :disabled="!authStore.isAdmin" class="config-form">
      <!-- 基础费率 -->
      <section class="config-section">
        <h2 class="config-section-title">基础费率</h2>
        <div class="config-grid config-grid-3">
          <div class="config-item">
            <label class="config-label">管销率</label>
            <div class="config-input-group">
              <el-input-number v-model="configForm.overhead_rate" :min="0" :max="1" :precision="2" :step="0.01" :controls="false" class="config-input" />
              <span class="config-suffix">{{ (configForm.overhead_rate * 100).toFixed(0) }}%</span>
            </div>
          </div>
          <div class="config-item">
            <label class="config-label">增值税率（默认）</label>
            <div class="config-input-group">
              <el-input-number v-model="configForm.vat_rate" :min="0" :max="1" :precision="2" :step="0.01" :controls="false" class="config-input" />
              <span class="config-suffix">{{ (configForm.vat_rate * 100).toFixed(0) }}%</span>
            </div>
          </div>
          <div class="config-item">
            <label class="config-label">保险率</label>
            <div class="config-input-group">
              <el-input-number v-model="configForm.insurance_rate" :min="0" :max="1" :precision="3" :step="0.001" :controls="false" class="config-input" />
              <span class="config-suffix">{{ (configForm.insurance_rate * 100).toFixed(1) }}%</span>
            </div>
          </div>
        </div>
        <!-- 增值税率选项 -->
        <div class="config-item config-item-full">
          <label class="config-label">增值税率选项</label>
          <div class="config-tags">
            <div v-for="(rate, index) in configForm.vat_rate_options" :key="index" class="config-tag">
              <el-input-number v-model="configForm.vat_rate_options[index]" :min="0" :max="1" :precision="2" :step="0.01" :controls="false" class="config-tag-input" />
              <span class="config-tag-suffix">{{ (rate * 100).toFixed(0) }}%</span>
              <button type="button" class="config-tag-remove" @click="removeVatRateOption(index)" v-if="configForm.vat_rate_options.length > 1 && authStore.isAdmin">&times;</button>
            </div>
            <button type="button" class="config-tag-add" @click="addVatRateOption" v-if="authStore.isAdmin">+ 添加</button>
          </div>
        </div>
      </section>

      <!-- 汇率系数 -->
      <section class="config-section">
        <h2 class="config-section-title">汇率与系数</h2>
        <div class="config-grid config-grid-3">
          <div class="config-item">
            <label class="config-label">汇率 CNY/USD</label>
            <div class="config-input-group">
              <el-input-number v-model="configForm.exchange_rate" :min="0" :precision="2" :controls="false" class="config-input" />
            </div>
          </div>
          <div class="config-item">
            <label class="config-label">工价系数</label>
            <div class="config-input-group">
              <el-input-number v-model="configForm.process_coefficient" :min="0" :precision="2" :controls="false" class="config-input" />
              <span class="config-hint">工序总价 = 小计 × 系数</span>
            </div>
          </div>
          <div class="config-item">
            <label class="config-label">FOB深圳汇率</label>
            <div class="config-input-group">
              <el-input-number v-model="configForm.fob_shenzhen_exchange_rate" :min="0" :precision="2" :controls="false" class="config-input" />
            </div>
          </div>
        </div>
      </section>

      <!-- 整柜运费 FCL -->
      <section class="config-section">
        <h2 class="config-section-title">整柜运费 FCL</h2>
        <div class="config-grid config-grid-2">
          <div class="config-item">
            <label class="config-label">20尺整柜</label>
            <div class="config-input-group">
              <el-input-number v-model="configForm.fcl_20_freight_usd" :min="0" :precision="0" :controls="false" class="config-input" />
              <span class="config-suffix">USD</span>
            </div>
          </div>
          <div class="config-item">
            <label class="config-label">40尺整柜</label>
            <div class="config-input-group">
              <el-input-number v-model="configForm.fcl_40_freight_usd" :min="0" :precision="0" :controls="false" class="config-input" />
              <span class="config-suffix">USD</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 散货运费 LCL -->
      <section class="config-section">
        <h2 class="config-section-title">散货运费 LCL</h2>
        <div class="config-grid config-grid-3">
          <div class="config-item">
            <label class="config-label">基础运费 1-3 CBM</label>
            <div class="config-input-group">
              <el-input-number v-model="configForm.lcl_base_freight_1_3" :min="0" :precision="0" :controls="false" class="config-input" />
              <span class="config-suffix">USD</span>
            </div>
          </div>
          <div class="config-item">
            <label class="config-label">基础运费 4-10 CBM</label>
            <div class="config-input-group">
              <el-input-number v-model="configForm.lcl_base_freight_4_10" :min="0" :precision="0" :controls="false" class="config-input" />
              <span class="config-suffix">USD</span>
            </div>
          </div>
          <div class="config-item">
            <label class="config-label">基础运费 11-15 CBM</label>
            <div class="config-input-group">
              <el-input-number v-model="configForm.lcl_base_freight_11_15" :min="0" :precision="0" :controls="false" class="config-input" />
              <span class="config-suffix">USD</span>
            </div>
          </div>
          <div class="config-item">
            <label class="config-label">操作费 Handling</label>
            <div class="config-input-group">
              <el-input-number v-model="configForm.lcl_handling_charge" :min="0" :precision="0" :controls="false" class="config-input" />
              <span class="config-suffix">USD</span>
            </div>
          </div>
          <div class="config-item">
            <label class="config-label">拼箱费 CFS/CBM</label>
            <div class="config-input-group">
              <el-input-number v-model="configForm.lcl_cfs_per_cbm" :min="0" :precision="0" :controls="false" class="config-input" />
              <span class="config-suffix">USD</span>
            </div>
          </div>
          <div class="config-item">
            <label class="config-label">文件费</label>
            <div class="config-input-group">
              <el-input-number v-model="configForm.lcl_document_fee" :min="0" :precision="0" :controls="false" class="config-input" />
              <span class="config-suffix">USD</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 利润区间 -->
      <section class="config-section">
        <h2 class="config-section-title">利润档位</h2>
        <div class="config-tags">
          <div v-for="(tier, index) in configForm.profit_tiers" :key="index" class="config-tag">
            <el-input-number v-model="configForm.profit_tiers[index]" :min="0" :max="1" :precision="2" :step="0.05" :controls="false" class="config-tag-input" />
            <span class="config-tag-suffix">{{ (tier * 100).toFixed(0) }}%</span>
            <button type="button" class="config-tag-remove" @click="removeProfitTier(index)" v-if="configForm.profit_tiers.length > 1 && authStore.isAdmin">&times;</button>
          </div>
          <button type="button" class="config-tag-add" @click="addProfitTier" v-if="authStore.isAdmin">+ 添加档位</button>
        </div>
      </section>
    </el-form>

    <!-- 底部提示 -->
    <div class="config-footer-note">
      配置修改后立即生效，仅影响新报价单，历史报价单保留原配置
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '../../store/auth';
import { useConfigStore } from '../../store/config';
import request from '../../utils/request';
import logger from '../../utils/logger';
import { formatDateTime } from '@/utils/format';

defineOptions({ name: 'SystemConfig' })

const authStore = useAuthStore();
const configStore = useConfigStore();

const configForm = reactive({
  overhead_rate: 0.2, vat_rate: 0.13, vat_rate_options: [0.13, 0.10],
  insurance_rate: 0.003, exchange_rate: 7.2,
  process_coefficient: 1.56, fob_shenzhen_exchange_rate: 7.1,
  fcl_20_freight_usd: 840, fcl_40_freight_usd: 940,
  lcl_base_freight_1_3: 800, lcl_base_freight_4_10: 1000, lcl_base_freight_11_15: 1500,
  lcl_handling_charge: 500, lcl_cfs_per_cbm: 170, lcl_document_fee: 500,
  profit_tiers: [0.05, 0.10, 0.25, 0.50]
});

const saving = ref(false);
const lastUpdateTime = ref('');

const loadConfig = async () => {
  try {
    const response = await request.get('/config');
    if (response.success && response.data) {
      Object.assign(configForm, response.data);
      const detailResponse = await request.get('/config/overhead_rate');
      if (detailResponse.success && detailResponse.data) {
        lastUpdateTime.value = formatDateTime(detailResponse.data.updated_at);
      }
    }
  } catch (error) {
    logger.error('加载配置失败:', error);
    ElMessage.error('加载配置失败');
  }
};

const handleSave = async () => {
  if (!authStore.isAdmin) { ElMessage.warning('只有管理员可以修改配置'); return; }
  if (configForm.overhead_rate < 0 || configForm.overhead_rate > 1) { ElMessage.error('管销率必须在 0 到 1 之间'); return; }
  if (configForm.vat_rate < 0 || configForm.vat_rate > 1) { ElMessage.error('增值税率必须在 0 到 1 之间'); return; }
  if (configForm.insurance_rate < 0 || configForm.insurance_rate > 1) { ElMessage.error('保险率必须在 0 到 1 之间'); return; }
  if (configForm.exchange_rate <= 0) { ElMessage.error('汇率必须大于 0'); return; }
  if (configForm.process_coefficient <= 0) { ElMessage.error('工价系数必须大于 0'); return; }
  if (configForm.profit_tiers.length === 0) { ElMessage.error('至少需要一个利润档位'); return; }
  if (!configForm.vat_rate_options || configForm.vat_rate_options.length === 0) { ElMessage.error('至少需要一个增值税率选项'); return; }
  for (const rate of configForm.vat_rate_options) {
    if (rate < 0 || rate > 1) { ElMessage.error('增值税率选项必须在 0 到 1 之间'); return; }
  }

  saving.value = true;
  try {
    const response = await request.post('/config/batch', { configs: configForm });
    if (response.success) { 
      ElMessage.success('配置保存成功'); 
      await loadConfig(); 
      // 刷新全局配置缓存，确保其他页面能获取最新配置
      await configStore.reloadConfig();
    }
  } catch (error) {
    logger.error('保存配置失败:', error);
    ElMessage.error(error.message || '保存配置失败');
  } finally { saving.value = false; }
};

const addProfitTier = () => { configForm.profit_tiers.push(0.05); };
const removeProfitTier = (index) => {
  if (configForm.profit_tiers.length <= 1) { ElMessage.warning('至少需要保留一个利润档位'); return; }
  configForm.profit_tiers.splice(index, 1);
};

const addVatRateOption = () => { configForm.vat_rate_options.push(0.05); };
const removeVatRateOption = (index) => {
  if (configForm.vat_rate_options.length <= 1) { ElMessage.warning('至少需要保留一个增值税率选项'); return; }
  configForm.vat_rate_options.splice(index, 1);
};

onMounted(() => { loadConfig(); });
</script>

<style scoped>
.config-page { max-width: 1200px; }

/* 页面头部 */
.config-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.config-header-left { display: flex; align-items: baseline; gap: 12px; }
.config-title { font-size: 20px; font-weight: 600; color: #1e293b; margin: 0; }
.config-update-time { font-size: 12px; color: #94a3b8; }

/* 表单 */
.config-form { display: flex; flex-direction: column; gap: 20px; }

/* 分组区块 */
.config-section { background: #fff; border-radius: 8px; padding: 20px; border: 1px solid #e2e8f0; }
.config-section-title { font-size: 14px; font-weight: 600; color: #475569; margin: 0 0 16px 0; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9; }

/* 网格布局 */
.config-grid { display: grid; gap: 16px; }
.config-grid-2 { grid-template-columns: repeat(2, 1fr); }
.config-grid-3 { grid-template-columns: repeat(3, 1fr); }

/* 配置项 */
.config-item { display: flex; flex-direction: column; gap: 6px; }
.config-item-full { margin-top: 16px; padding-top: 16px; border-top: 1px solid #f1f5f9; }
.config-label { font-size: 13px; color: #64748b; font-weight: 500; }

/* 输入框组 */
.config-input-group { display: flex; align-items: center; gap: 8px; }
.config-input { width: 100%; }
.config-input :deep(.el-input__wrapper) { padding: 4px 11px; }
.config-suffix { font-size: 13px; color: #94a3b8; min-width: 40px; }
.config-hint { font-size: 11px; color: #94a3b8; white-space: nowrap; }

/* 标签式选择器（增值税率选项、利润档位） */
.config-tags { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.config-tag { display: flex; align-items: center; gap: 6px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; }
.config-tag-input { width: 70px; }
.config-tag-input :deep(.el-input__wrapper) { padding: 2px 8px; background: #fff; }
.config-tag-suffix { font-size: 12px; color: #64748b; font-weight: 500; }
.config-tag-remove { width: 18px; height: 18px; border: none; background: #fee2e2; color: #dc2626; border-radius: 50%; cursor: pointer; font-size: 14px; line-height: 1; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
.config-tag-remove:hover { background: #fecaca; }
.config-tag-add { border: 1px dashed #cbd5e1; background: transparent; color: #64748b; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; transition: all 0.2s; }
.config-tag-add:hover { border-color: #3b82f6; color: #3b82f6; }

/* 底部提示 */
.config-footer-note { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 16px; }

/* 响应式 */
@media (max-width: 768px) {
  .config-grid-2, .config-grid-3 { grid-template-columns: 1fr; }
}
</style>
