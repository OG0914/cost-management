<template>
  <el-dialog v-model="visible" title="从其他配置复制包材" width="550px" append-to-body :close-on-click-modal="false">
    <el-form label-width="100px">
      <el-form-item label="源配置" required>
        <el-select v-model="copySourceConfigId" filterable placeholder="选择要复制的源配置" style="width: 100%" @change="handleCopySourceChange" :loading="copyConfigsLoading">
          <template #empty>
            <div style="padding: 10px; text-align: center; color: #909399;">{{ copyConfigsLoading ? '加载中...' : '暂无已配置包材的配置' }}</div>
          </template>
          <el-option v-for="c in configsWithMaterials" :key="c.id" :label="`${c.model_name} - ${c.config_name}`" :value="c.id">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>{{ c.model_name }} - {{ c.config_name }}</span>
              <el-tag size="small" type="success">{{ c.material_count }}项</el-tag>
            </div>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="包材预览" v-if="copySourcePreview.length > 0">
        <div class="source-preview">
          <el-tag v-for="item in copySourcePreview.slice(0, 5)" :key="item.id" size="small" style="margin: 2px">
            {{ item.material_name }}
          </el-tag>
          <el-tag v-if="copySourcePreview.length > 5" size="small" type="info">+{{ copySourcePreview.length - 5 }}项</el-tag>
        </div>
      </el-form-item>
      <el-form-item label="复制模式">
        <el-radio-group v-model="copyMode">
          <el-radio value="replace">
            <span>替换模式</span>
            <el-text type="info" size="small" style="margin-left: 4px">清空现有包材后复制</el-text>
          </el-radio>
          <el-radio value="merge">
            <span>合并模式</span>
            <el-text type="info" size="small" style="margin-left: 4px">保留现有，追加新包材</el-text>
          </el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="$emit('confirm')" :loading="copyLoading" :disabled="!copySourceConfigId">确认复制</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  visible: { type: Boolean, required: true },
  copySourceConfigId: { type: [Number, String], default: null },
  copyMode: { type: String, default: 'replace' },
  copyLoading: { type: Boolean, default: false },
  copyConfigsLoading: { type: Boolean, default: false },
  copySourcePreview: { type: Array, default: () => [] },
  configsWithMaterials: { type: Array, default: () => [] }
});

const emit = defineEmits(['update:visible', 'update:copySourceConfigId', 'update:copyMode', 'confirm', 'copy-source-change']);

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
});

const copySourceConfigId = computed({
  get: () => props.copySourceConfigId,
  set: (val) => emit('update:copySourceConfigId', val)
});

const copyMode = computed({
  get: () => props.copyMode,
  set: (val) => emit('update:copyMode', val)
});

const handleCopySourceChange = (val) => {
  emit('copy-source-change', val);
};
</script>

<style scoped>
.source-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
