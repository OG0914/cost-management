<template>
  <el-button 
    :type="type" 
    :size="size" 
    :icon="Download" 
    @click="handleExport"
    :loading="loading"
  >
    {{ buttonText }}
  </el-button>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Download } from '@element-plus/icons-vue';
import request from '../utils/request';
import logger from '../utils/logger';

const props = defineProps({
  // 导出 API 地址
  apiUrl: {
    type: String,
    required: true
  },
  // 导出参数
  params: {
    type: Object,
    default: () => ({})
  },
  // 文件名
  filename: {
    type: String,
    default: 'export'
  },
  // 按钮文字
  buttonText: {
    type: String,
    default: '导出 Excel'
  },
  // 按钮类型
  type: {
    type: String,
    default: 'primary'
  },
  // 按钮大小
  size: {
    type: String,
    default: 'default'
  },
  // 导出前的回调
  beforeExport: {
    type: Function,
    default: null
  },
  // 导出后的回调
  afterExport: {
    type: Function,
    default: null
  }
});

const loading = ref(false);

// 处理导出
const handleExport = async () => {
  // 导出前回调
  if (props.beforeExport) {
    const result = await props.beforeExport();
    if (result === false) {
      return; // 取消导出
    }
  }

  loading.value = true;

  try {
    // 发送导出请求
    const response = await request.get(props.apiUrl, {
      params: props.params,
      responseType: 'blob' // 重要：设置响应类型为 blob
    });

    // 创建下载链接
    const blob = new Blob([response], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // 设置文件名
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    link.download = `${props.filename}_${timestamp}.xlsx`;
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    
    // 清理
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    ElMessage.success('导出成功');

    // 导出后回调
    if (props.afterExport) {
      props.afterExport();
    }

  } catch (error) {
    logger.error('导出失败:', error);
    ElMessage.error('导出失败，请重试');
  } finally {
    loading.value = false;
  }
};

// 暴露方法供父组件调用
defineExpose({
  handleExport
});
</script>
