<template>
  <div class="config-page">
    <!-- 页面头部 -->
    <div class="config-header">
      <div class="config-header-left">
        <h1 class="config-title">系统配置</h1>
        <span class="config-update-time" v-if="lastUpdateTime">更新于 {{ lastUpdateTime }}</span>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="config-tabs">
      <!-- 业务配置 Tab -->
      <el-tab-pane label="业务配置" name="business">
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
              <span class="config-suffix">CNY</span>
            </div>
          </div>
          <div class="config-item">
            <label class="config-label">基础运费 3-10 CBM</label>
            <div class="config-input-group">
              <el-input-number v-model="configForm.lcl_base_freight_3_10" :min="0" :precision="0" :controls="false" class="config-input" />
              <span class="config-suffix">CNY</span>
            </div>
          </div>
          <div class="config-item">
            <label class="config-label">基础运费 10-18 CBM</label>
            <div class="config-input-group">
              <el-input-number v-model="configForm.lcl_base_freight_10_18" :min="0" :precision="0" :controls="false" class="config-input" />
              <span class="config-suffix">CNY</span>
            </div>
          </div>
          <div class="config-item">
            <label class="config-label">基础运费 18-28 CBM</label>
            <div class="config-input-group">
              <el-input-number v-model="configForm.lcl_base_freight_18_28" :min="0" :precision="0" :controls="false" class="config-input" />
              <span class="config-suffix">CNY</span>
            </div>
          </div>
          <div class="config-item">
            <label class="config-label">基础运费 28-40 CBM</label>
            <div class="config-input-group">
              <el-input-number v-model="configForm.lcl_base_freight_28_40" :min="0" :precision="0" :controls="false" class="config-input" />
              <span class="config-suffix">CNY</span>
            </div>
          </div>
          <div class="config-item">
            <label class="config-label">基础运费 40-58 CBM</label>
            <div class="config-input-group">
              <el-input-number v-model="configForm.lcl_base_freight_40_58" :min="0" :precision="0" :controls="false" class="config-input" />
              <span class="config-suffix">CNY</span>
            </div>
          </div>
          <div class="config-item">
            <label class="config-label">操作费 Handling</label>
            <div class="config-input-group">
              <el-input-number v-model="configForm.lcl_handling_charge" :min="0" :precision="0" :controls="false" class="config-input" />
              <span class="config-suffix">CNY</span>
            </div>
          </div>
          <div class="config-item">
            <label class="config-label">拼箱费 CFS/CBM</label>
            <div class="config-input-group">
              <el-input-number v-model="configForm.lcl_cfs_per_cbm" :min="0" :precision="0" :controls="false" class="config-input" />
              <span class="config-suffix">CNY</span>
            </div>
          </div>
          <div class="config-item">
            <label class="config-label">文件费</label>
            <div class="config-input-group">
              <el-input-number v-model="configForm.lcl_document_fee" :min="0" :precision="0" :controls="false" class="config-input" />
              <span class="config-suffix">CNY</span>
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

    <!-- 底部操作 -->
    <div class="config-footer">
      <el-button type="primary" @click="handleSave" :loading="saving" v-if="authStore.isAdmin">保存业务配置</el-button>
      <span class="config-footer-note">配置修改后立即生效，仅影响新报价单</span>
    </div>
      </el-tab-pane>

      <!-- 基础数据配置 Tab -->
      <el-tab-pane label="基础数据配置" name="master">
        <section class="config-section">
          <h2 class="config-section-title">原料类别管理</h2>
          <p class="config-section-desc">设置原料的分类，用于原料管理中的筛选和分组</p>
          
          <el-table :data="materialCategories" border stripe size="small" style="width: 450px" empty-text="暂无类别，请点击下方按钮添加">
            <el-table-column label="类别名称" width="250">
              <template #default="{ row }">
                <el-input v-model="row.name" placeholder="请输入类别名称" :disabled="!authStore.isAdmin" />
              </template>
            </el-table-column>
            <el-table-column label="排序" width="120">
              <template #default="{ row }">
                <el-input-number v-model="row.sort" :min="1" :max="999" :controls="false" :disabled="!authStore.isAdmin" style="width: 100%" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template #default="{ $index }">
                <el-button type="danger" :icon="Delete" circle size="small" @click="removeCategory($index)" :disabled="!authStore.isAdmin" />
              </template>
            </el-table-column>
          </el-table>

          <div class="config-footer">
            <el-button type="primary" plain @click="showAddCategoryDialog" v-if="authStore.isAdmin">
              <el-icon><Plus /></el-icon> 新增类别
            </el-button>
            <el-button type="primary" @click="saveCategories" :loading="savingCategories" v-if="authStore.isAdmin">保存类别配置</el-button>
          </div>
        </section>

        <!-- 新增类别弹窗 -->
        <el-dialog v-model="categoryDialogVisible" title="新增类别" width="400px" :close-on-click-modal="false" append-to-body align-center>
          <el-form :model="newCategory" label-width="80px">
            <el-form-item label="类别名称" required>
              <el-input v-model="newCategory.name" placeholder="请输入类别名称" />
            </el-form-item>
            <el-form-item label="排序">
              <el-input-number v-model="newCategory.sort" :min="1" :max="999" :controls="false" style="width: 100%" />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="categoryDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="confirmAddCategory">确定</el-button>
          </template>
        </el-dialog>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { onBeforeRouteLeave } from 'vue-router';
import { Plus, Delete } from '@element-plus/icons-vue';
import { useAuthStore } from '../../store/auth';
import { useConfigStore } from '../../store/config';
import request from '../../utils/request';
import logger from '../../utils/logger';
import { formatDateTime } from '@/utils/format';

defineOptions({ name: 'SystemConfig' })

const authStore = useAuthStore();
const configStore = useConfigStore();

const activeTab = ref('business');

const configForm = reactive({
  overhead_rate: 0.2, vat_rate: 0.13, vat_rate_options: [0.13, 0.10],
  insurance_rate: 0.003, exchange_rate: 7.2,
  process_coefficient: 1.56, fob_shenzhen_exchange_rate: 7.1,
  fcl_20_freight_usd: 840, fcl_40_freight_usd: 940,
  lcl_base_freight_1_3: 800, lcl_base_freight_3_10: 1000, lcl_base_freight_10_18: 1500,
  lcl_base_freight_18_28: 2000, lcl_base_freight_28_40: 2500, lcl_base_freight_40_58: 3000,
  lcl_handling_charge: 500, lcl_cfs_per_cbm: 170, lcl_document_fee: 500,
  profit_tiers: [0.05, 0.10, 0.25, 0.50]
});

const saving = ref(false);
const lastUpdateTime = ref('');

// 原料类别
const materialCategories = ref([]);
const savingCategories = ref(false);
const categoryDialogVisible = ref(false);
const newCategory = reactive({ name: '', sort: 1 });

// 追踪未保存修改
const hasUnsavedChanges = ref(false);
const originalConfig = ref(null);
const originalCategories = ref(null);

const loadConfig = async () => {
  try {
    const response = await request.get('/config');
    if (response.success && response.data) {
      Object.assign(configForm, response.data);
      // 加载原料类别
      if (response.data.material_categories) {
        materialCategories.value = [...response.data.material_categories].sort((a, b) => a.sort - b.sort);
      }
      const detailResponse = await request.get('/config/overhead_rate');
      if (detailResponse.success && detailResponse.data) {
        lastUpdateTime.value = formatDateTime(detailResponse.data.updated_at);
      }
      // 保存原始值用于比较
      originalConfig.value = JSON.stringify(configForm);
      originalCategories.value = JSON.stringify(materialCategories.value);
      hasUnsavedChanges.value = false;
    }
  } catch (error) {
    logger.error('加载配置失败:', error);
    ElMessage.error('加载配置失败');
  }
};

// 监听配置变化
const checkChanges = () => {
  if (!originalConfig.value) return;
  const configChanged = JSON.stringify(configForm) !== originalConfig.value;
  const categoriesChanged = JSON.stringify(materialCategories.value) !== originalCategories.value;
  hasUnsavedChanges.value = configChanged || categoriesChanged;
};
watch(() => configForm, checkChanges, { deep: true });
watch(materialCategories, checkChanges, { deep: true });

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
      // 更新原始值，标记为已保存
      originalConfig.value = JSON.stringify(configForm);
      hasUnsavedChanges.value = false;
      await loadConfig(); 
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

// 原料类别管理
const showAddCategoryDialog = () => {
  const maxSort = materialCategories.value.length > 0 ? Math.max(...materialCategories.value.map(c => c.sort)) : 0;
  newCategory.name = '';
  newCategory.sort = maxSort + 1;
  categoryDialogVisible.value = true;
};

const confirmAddCategory = () => {
  if (!newCategory.name || !newCategory.name.trim()) { ElMessage.warning('请输入类别名称'); return; }
  const exists = materialCategories.value.some(c => c.name === newCategory.name.trim());
  if (exists) { ElMessage.warning('该类别已存在'); return; }
  materialCategories.value.push({ name: newCategory.name.trim(), sort: newCategory.sort });
  materialCategories.value.sort((a, b) => a.sort - b.sort);
  categoryDialogVisible.value = false;
  ElMessage.success('类别已添加，请点击"保存类别配置"保存');
};

const removeCategory = (index) => {
  materialCategories.value.splice(index, 1);
};

const saveCategories = async () => {
  // 校验
  const validCategories = materialCategories.value.filter(c => c.name && c.name.trim());
  if (validCategories.length === 0) { ElMessage.error('请至少添加一个有效的类别'); return; }
  
  // 检查重复名称
  const names = validCategories.map(c => c.name.trim());
  if (new Set(names).size !== names.length) { ElMessage.error('类别名称不能重复'); return; }

  savingCategories.value = true;
  try {
    const sorted = validCategories.map(c => ({ name: c.name.trim(), sort: c.sort })).sort((a, b) => a.sort - b.sort);
    await request.put('/config/material_categories', { value: JSON.stringify(sorted) });
    ElMessage.success('类别配置保存成功');
    // 更新原始值，标记为已保存
    originalCategories.value = JSON.stringify(materialCategories.value);
    hasUnsavedChanges.value = false;
    await configStore.reloadConfig();
  } catch (error) {
    logger.error('保存类别失败:', error);
    ElMessage.error('保存类别配置失败');
  } finally { savingCategories.value = false; }
};

onMounted(() => { loadConfig(); });

// 离开页面前提醒保存
onBeforeRouteLeave(async (to, from, next) => {
  if (hasUnsavedChanges.value) {
    try {
      await ElMessageBox.confirm('您有未保存的修改，确定要离开吗？', '提示', { type: 'warning', confirmButtonText: '离开', cancelButtonText: '留下' });
      next();
    } catch { next(false); }
  } else { next(); }
});

// 浏览器关闭/刷新时提醒
const handleBeforeUnload = (e) => {
  if (hasUnsavedChanges.value) { e.preventDefault(); e.returnValue = ''; }
};
onMounted(() => { window.addEventListener('beforeunload', handleBeforeUnload); });
onBeforeUnmount(() => { window.removeEventListener('beforeunload', handleBeforeUnload); });
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
.config-grid-4 { grid-template-columns: repeat(4, 1fr); }

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

/* 底部操作区 */
.config-footer { display: flex; align-items: center; gap: 16px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
.config-footer-note { font-size: 12px; color: #94a3b8; }

/* 响应式 */
@media (max-width: 768px) {
  .config-grid-2, .config-grid-3, .config-grid-4 { grid-template-columns: 1fr; }
}

/* Tabs样式 */
.config-tabs { margin-top: -8px; }
.config-tabs :deep(.el-tabs__header) { margin-bottom: 20px; }

/* 分组描述 */
.config-section-desc { font-size: 13px; color: #94a3b8; margin: -8px 0 16px 0; }
</style>
