<template>
  <div class="excel-upload">
    <el-upload
      :action="uploadUrl"
      :headers="uploadHeaders"
      :data="uploadData"
      :before-upload="handleBeforeUpload"
      :on-success="handleSuccess"
      :on-error="handleError"
      :show-file-list="showFileList"
      :accept="accept"
      :auto-upload="autoUpload"
      :disabled="loading"
    >
      <el-button :type="buttonType" :size="buttonSize" :icon="Upload" :loading="loading">
        {{ buttonText }}
      </el-button>
      <template #tip v-if="showTip">
        <div class="el-upload__tip">
          {{ tipText }}
        </div>
      </template>
    </el-upload>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Upload } from '@element-plus/icons-vue';
import { getToken } from '../utils/auth';

const props = defineProps({
  // 上传 API 地址
  uploadUrl: {
    type: String,
    required: true
  },
  // 额外的上传数据
  uploadData: {
    type: Object,
    default: () => ({})
  },
  // 按钮文字
  buttonText: {
    type: String,
    default: '导入 Excel'
  },
  // 按钮类型
  buttonType: {
    type: String,
    default: 'primary'
  },
  // 按钮大小
  buttonSize: {
    type: String,
    default: 'default'
  },
  // 是否显示文件列表
  showFileList: {
    type: Boolean,
    default: false
  },
  // 是否显示提示
  showTip: {
    type: Boolean,
    default: true
  },
  // 提示文字
  tipText: {
    type: String,
    default: '只能上传 .xlsx 或 .xls 文件，且不超过 10MB'
  },
  // 接受的文件类型
  accept: {
    type: String,
    default: '.xlsx,.xls'
  },
  // 是否自动上传
  autoUpload: {
    type: Boolean,
    default: true
  },
  // 文件大小限制（MB）
  maxSize: {
    type: Number,
    default: 10
  },
  // 上传前的回调
  beforeUpload: {
    type: Function,
    default: null
  },
  // 上传成功的回调
  onSuccess: {
    type: Function,
    default: null
  },
  // 上传失败的回调
  onError: {
    type: Function,
    default: null
  }
});

const emit = defineEmits(['success', 'error']);

const loading = ref(false);

// 上传请求头（包含 token）
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${getToken()}`
}));

// 上传前的钩子
const handleBeforeUpload = (file) => {
  // 检查文件类型
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                  file.type === 'application/vnd.ms-excel' ||
                  file.name.endsWith('.xlsx') ||
                  file.name.endsWith('.xls');
  
  if (!isExcel) {
    ElMessage.error('只能上传 Excel 文件！');
    return false;
  }

  // 检查文件大小
  const isLtMaxSize = file.size / 1024 / 1024 < props.maxSize;
  if (!isLtMaxSize) {
    ElMessage.error(`文件大小不能超过 ${props.maxSize}MB！`);
    return false;
  }

  // 自定义上传前回调
  if (props.beforeUpload) {
    const result = props.beforeUpload(file);
    if (result === false) {
      return false;
    }
  }

  loading.value = true;
  return true;
};

// 上传成功
const handleSuccess = (response, file) => {
  loading.value = false;

  if (response.success) {
    ElMessage.success(response.message || '导入成功');
    
    // 触发成功事件
    emit('success', response.data);
    
    // 自定义成功回调
    if (props.onSuccess) {
      props.onSuccess(response, file);
    }
  } else {
    ElMessage.error(response.message || '导入失败');
    emit('error', response);
  }
};

// 上传失败
const handleError = (error, file) => {
  loading.value = false;
  
  console.error('上传失败:', error);
  ElMessage.error('上传失败，请重试');
  
  // 触发失败事件
  emit('error', error);
  
  // 自定义失败回调
  if (props.onError) {
    props.onError(error, file);
  }
};
</script>

<style scoped>
.excel-upload {
  display: inline-block;
}
</style>
