<template>
  <div class="packaging-management">
    <!-- 页面表头 -->
    <CostPageHeader title="包材管理" :show-back="false">
      <template #actions>
        <div class="toolbar-wrapper">
          <el-button class="toolbar-toggle" :icon="showToolbar ? CaretRight : CaretLeft" circle @click="showToolbar = !showToolbar" :title="showToolbar ? '收起工具栏' : '展开工具栏'" />
          <transition name="toolbar-fade">
            <el-space v-if="showToolbar && (canEditConfig || canEditMaterial)">
              <ActionButton v-if="canEditMaterial" type="download" @click="handleDownloadTemplate">下载模板</ActionButton>
              <el-upload v-if="canEditMaterial" action="#" :auto-upload="false" :on-change="handleFileChange" :show-file-list="false" accept=".xlsx,.xls">
                <ActionButton type="import">导入Excel</ActionButton>
              </el-upload>
              <ActionButton v-if="canEditMaterial" type="export" @click="handleExport">导出Excel</ActionButton>
              <ActionButton v-if="canEditConfig" type="delete" :disabled="selectedConfigs.length === 0" @click="handleBatchDelete">批量删除</ActionButton>
            </el-space>
          </transition>
        </div>
      </template>
    </CostPageHeader>

    <el-card>

      <!-- 筛选栏 -->
      <div class="filter-bar">
        <!-- 产品类别筛选 -->
        <el-select
          v-model="selectedCategory"
          placeholder="选择产品类别"
          @change="onCategoryChange"
          clearable
          style="width: 150px; margin-right: 16px"
        >
          <el-option
            v-for="cat in categories"
            :key="cat"
            :label="cat"
            :value="cat"
          />
        </el-select>

        <el-select
          v-model="selectedModelId"
          placeholder="选择型号筛选"
          @change="loadPackagingConfigs"
          clearable
          filterable
          style="width: 300px; margin-right: 16px"
        >
          <el-option
            v-for="model in filteredModels"
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

        <!-- 视图切换按钮 -->
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
      </div>

      <!-- 卡片视图 -->
      <PackagingCardView
        v-if="viewMode === 'card'"
        :paginated-configs="paginatedConfigs"
        :loading="loading"
        :can-edit-config="canEditConfig"
        :can-edit-material="canEditMaterial"
        @view="viewMaterials"
        @edit="editConfig"
        @delete="deleteConfig"
      />

      <!-- 列表视图 -->
      <PackagingList
        v-if="viewMode === 'list'"
        :paginated-configs="paginatedConfigs"
        :loading="loading"
        :can-edit-config="canEditConfig"
        :can-edit-material="canEditMaterial"
        @view="viewMaterials"
        @edit="editConfig"
        @delete="deleteConfig"
        @selection-change="handleSelectionChange"
      />

      <!-- 分页 -->
      <CommonPagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="filteredByViewMode.length"
      />
    </el-card>

    <!-- 创建/编辑包装配置对话框 -->
    <PackagingFormDialog
      v-model:visible="dialogVisible"
      :form="form"
      :form-ref="formRef"
      :is-edit="isEdit"
      :loading="loading"
      :models="models"
      :query-materials="queryMaterials"
      :handle-select-material="handleSelectMaterial"
      :get-summaries="getSummaries"
      @update:form="Object.assign(form, $event)"
      @add-material="addMaterial"
      @remove-material="removeMaterial"
      @submit="submitForm"
      @open-copy-dialog="openMaterialCopyDialog"
    />

    <!-- 查看包材对话框 (已组件化) -->
    <ManagementDetailDialog
      v-model="materialDialogVisible"
      :config="currentConfig"
      :items="currentMaterials"
      type="packaging"
    />

    <!-- 一键复制包材弹窗 -->
    <PackagingCopyDialog
      v-model:visible="showMaterialCopyDialog"
      v-model:copy-source-config-id="copySourceConfigId"
      v-model:copy-mode="copyMode"
      :copy-loading="copyLoading"
      :copy-configs-loading="copyConfigsLoading"
      :copy-source-preview="copySourcePreview"
      :configs-with-materials="configsWithMaterials"
      @confirm="handleCopyMaterials"
      @copy-source-change="handleCopySourceChange"
    />
  </div>
</template>

<script setup>
import { CaretLeft, CaretRight, Grid, List } from '@element-plus/icons-vue';
import CostPageHeader from '@/components/cost/CostPageHeader.vue';
import CommonPagination from '@/components/common/CommonPagination.vue';
import ActionButton from '@/components/common/ActionButton.vue';
import ManagementDetailDialog from '@/components/management/ManagementDetailDialog.vue';
import PackagingList from './components/PackagingList.vue';
import PackagingCardView from './components/PackagingCardView.vue';
import PackagingFormDialog from './components/PackagingFormDialog.vue';
import PackagingCopyDialog from './components/PackagingCopyDialog.vue';
import { usePackagingManage } from './composables/usePackagingManage.js';

defineOptions({ name: 'PackagingManage' });

const {
  showToolbar,
  canEditConfig,
  canEditMaterial,
  packagingTypeOptions,
  models,
  categories,
  selectedConfigs,
  selectedCategory,
  selectedModelId,
  selectedPackagingType,
  loading,
  filteredModels,
  viewMode,
  currentPage,
  pageSize,
  filteredByViewMode,
  paginatedConfigs,
  dialogVisible,
  materialDialogVisible,
  isEdit,
  formRef,
  form,
  currentConfig,
  currentMaterials,
  showMaterialCopyDialog,
  copySourceConfigId,
  copyMode,
  copyLoading,
  copyConfigsLoading,
  copySourcePreview,
  configsWithMaterials,
  getSummaries,
  onCategoryChange,
  loadPackagingConfigs,
  queryMaterials,
  handleSelectMaterial,
  openMaterialCopyDialog,
  handleCopySourceChange,
  handleCopyMaterials,
  editConfig,
  viewMaterials,
  deleteConfig,
  handleBatchDelete,
  addMaterial,
  removeMaterial,
  submitForm,
  handleSelectionChange,
  handleFileChange,
  handleExport,
  handleDownloadTemplate
} = usePackagingManage();
</script>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.view-toggle {
  margin-left: auto;
}

/* 工具栏折叠 */
.toolbar-wrapper { display: flex; align-items: center; gap: 12px; }
.toolbar-toggle { flex-shrink: 0; }
/* Toolbar Fade Animation */
.toolbar-fade-enter-active, .toolbar-fade-leave-active { transition: opacity 0.3s, transform 0.3s; }
.toolbar-fade-enter-from, .toolbar-fade-leave-to { opacity: 0; transform: translateX(10px); }
</style>
