<template>
  <div class="system-config-container">
    <div class="card">
      <div class="card-header">
        <div class="header-left">
          <el-button @click="$router.back()" :icon="ArrowLeft">返回</el-button>
          <span class="header-title">参数配置管理</span>
        </div>
        <el-button type="primary" @click="handleSave" :loading="saving" v-if="authStore.isAdmin">
          <el-icon><Check /></el-icon>
          保存配置
        </el-button>
      </div>

      <div class="card-body">
        <el-form :model="configForm" label-width="230px" :disabled="!authStore.isAdmin">
          <el-form-item label="管销率">
            <el-input v-model.number="configForm.overhead_rate" style="width: 200px" />
          </el-form-item>
          <el-form-item label="增值税率（默认）">
            <el-input v-model.number="configForm.vat_rate" style="width: 200px" />
          </el-form-item>
          <el-form-item label="增值税率选项">
            <div class="vat-rate-options-container">
              <div v-for="(rate, index) in configForm.vat_rate_options" :key="index" class="vat-rate-option-item">
                <el-input-number 
                  v-model="configForm.vat_rate_options[index]" 
                  :min="0" 
                  :max="1" 
                  :precision="2" 
                  :step="0.01"
                  :controls="false"
                  style="width: 150px" 
                />
                <span class="rate-percentage">{{ (rate * 100).toFixed(0) }}%</span>
                <el-button type="danger" size="small" :icon="Delete" circle @click="removeVatRateOption(index)" v-if="configForm.vat_rate_options.length > 1 && authStore.isAdmin" />
              </div>
              <el-button type="primary" size="small" @click="addVatRateOption" v-if="authStore.isAdmin">
                <el-icon><Plus /></el-icon>添加税率选项
              </el-button>
            </div>
            <div class="config-description">报价单中可选择的增值税率列表，输入小数（如 0.13 表示 13%）</div>
          </el-form-item>
          <el-form-item label="保险率">
            <el-input v-model.number="configForm.insurance_rate" style="width: 200px" />
          </el-form-item>
          <el-form-item label="汇率 （CNY/USD）">
            <el-input v-model.number="configForm.exchange_rate" style="width: 200px" />
          </el-form-item>
          <el-form-item label="工价系数">
            <el-input v-model.number="configForm.process_coefficient" style="width: 200px" />
          </el-form-item>
          <el-form-item label="FOB深圳运费汇率（CNY/USD）">
            <el-input v-model.number="configForm.fob_shenzhen_exchange_rate" style="width: 200px" />
          </el-form-item>

          <el-divider content-position="left">整柜FCL运费配置</el-divider>
          <el-form-item label="20尺整柜运费（美金）">
            <el-input v-model.number="configForm.fcl_20_freight_usd" style="width: 200px" />
          </el-form-item>
          <el-form-item label="40尺整柜运费（美金）">
            <el-input v-model.number="configForm.fcl_40_freight_usd" style="width: 200px" />
          </el-form-item>

          <el-divider content-position="left">散货LCL运费配置</el-divider>
          <el-form-item label="散货基础运费 1-3 CBM">
            <el-input v-model.number="configForm.lcl_base_freight_1_3" style="width: 200px" />
          </el-form-item>
          <el-form-item label="散货基础运费 4-10 CBM">
            <el-input v-model.number="configForm.lcl_base_freight_4_10" style="width: 200px" />
          </el-form-item>
          <el-form-item label="散货基础运费 11-15 CBM">
            <el-input v-model.number="configForm.lcl_base_freight_11_15" style="width: 200px" />
          </el-form-item>
          <el-form-item label="散货操作费 Handling charge">
            <el-input v-model.number="configForm.lcl_handling_charge" style="width: 200px" />
          </el-form-item>
          <el-form-item label="散货拼箱费（CFS） 每CBM">
            <el-input v-model.number="configForm.lcl_cfs_per_cbm" style="width: 200px" />
          </el-form-item>
          <el-form-item label="散货文件费">
            <el-input v-model.number="configForm.lcl_document_fee" style="width: 200px" />
          </el-form-item>

          <el-divider content-position="left">利润区间配置</el-divider>
          <el-form-item label="利润区间">
            <div class="profit-tiers-container">
              <div v-for="(tier, index) in configForm.profit_tiers" :key="index" class="profit-tier-item">
                <el-input v-model.number="configForm.profit_tiers[index]" style="width: 150px" />
                <span class="tier-percentage">{{ (tier * 100).toFixed(0) }}%</span>
                <el-button type="danger" size="small" :icon="Delete" circle @click="removeProfitTier(index)" v-if="configForm.profit_tiers.length > 1 && authStore.isAdmin" />
              </div>
              <el-button type="primary" size="small" @click="addProfitTier" v-if="authStore.isAdmin">
                <el-icon><Plus /></el-icon>添加利润档位
              </el-button>
            </div>
            <div class="config-description">用于生成利润区间报价：报价 = 基础价 × (1 + 利润%)</div>
          </el-form-item>
          <el-form-item label="最后更新时间">
            <span class="update-time">{{ lastUpdateTime || '未更新' }}</span>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <div class="card" style="margin-top: 20px">
      <div class="card-header"><span>配置说明</span></div>
      <div class="card-body">
        <el-alert title="重要提示" type="warning" :closable="false" show-icon>
          <ul class="config-notes">
            <li>配置参数的修改将立即生效，影响新创建的报价单</li>
            <li>已创建的历史报价单将保留创建时的配置参数</li>
            <li>管销率、增值税率、保险率的取值范围为 0 到 1 之间的小数</li>
            <li>汇率和工价系数必须为正数，建议定期更新以反映实际成本变化</li>
            <li>工价系数用于计算工序总价：工序总价 = 工序小计 × 工价系数</li>
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
import { useAuthStore } from '../../store/auth';
import { useConfigStore } from '../../store/config';
import request from '../../utils/request';
import { formatDateTime } from '@/utils/format';

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
    console.error('加载配置失败:', error);
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
    console.error('保存配置失败:', error);
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
.system-config-container { /* padding 由 MainLayout 提供 */ }
.card { background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
.card-header { padding: 16px 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; font-weight: 600; font-size: 16px; }
.header-left { display: flex; align-items: center; gap: 16px; }
.header-title { font-weight: 600; font-size: 16px; }
.card-body { padding: 24px 20px; }
.config-description { margin-top: 8px; color: #9ca3af; font-size: 13px; line-height: 1.5; }
.profit-tiers-container { display: flex; flex-direction: column; gap: 12px; }
.profit-tier-item { display: flex; align-items: center; gap: 12px; }
.tier-percentage { min-width: 50px; color: #6b7280; font-weight: 500; }
.vat-rate-options-container { display: flex; flex-direction: column; gap: 12px; }
.vat-rate-option-item { display: flex; align-items: center; gap: 12px; }
.rate-percentage { min-width: 50px; color: #6b7280; font-weight: 500; }
.update-time { color: #6b7280; font-size: 14px; }
.config-notes { margin: 0; padding-left: 20px; line-height: 1.8; }
.config-notes li { margin-bottom: 8px; }
</style>
