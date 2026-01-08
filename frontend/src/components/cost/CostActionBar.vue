<template>
  <div class="cost-action-bar">
    <el-button @click="$emit('cancel')" size="large">取消</el-button>
    <div class="cost-action-right">
      <el-button type="info" @click="$emit('save-draft')" :loading="savingDraft" size="large">
        保存为草稿
      </el-button>
      <el-button type="primary" @click="$emit('submit')" :loading="submitting" size="large">
        提交审核
      </el-button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  savingDraft: { type: Boolean, default: false },
  submitting: { type: Boolean, default: false }
})

defineEmits(['cancel', 'save-draft', 'submit'])
</script>
