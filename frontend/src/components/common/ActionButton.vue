<template>
  <button 
    class="action-btn" 
    :class="[`action-btn--${type}`, { 'action-btn--disabled': disabled }]"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <span class="action-btn__icon" v-html="iconSvg"></span>
    <span class="action-btn__text"><slot /></span>
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: { 
    type: String, 
    default: 'default', 
    validator: v => ['download', 'import', 'export', 'delete', 'add', 'compare', 'profit', 'edit', 'default'].includes(v) 
  },
  disabled: { type: Boolean, default: false }
})

defineEmits(['click'])

const ICONS = {
  // 下载模板 (蓝色) - 云下载图标
  download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>`,
  
  // 导入Excel (金色) - 上传图标
  import: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>`,
  
  // 导出Excel (紫色) - 表格+导出箭头
  export: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
    <path d="M15 15l2 2 4-4" /> 
  </svg>`,
  
  // 批量删除 (红色) - 垃圾桶
  delete: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>`,
  
  // 新增 (绿色) - 加号
  add: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="16"/>
    <line x1="8" y1="12" x2="16" y2="12"/>
  </svg>`,

  // 对比模式 (蓝色) - 切换/对比箭头
  compare: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M7 16V4M7 4L3 8M7 4L11 8"/>
    <path d="M17 8V20M17 20L21 16M17 20L13 16"/>
  </svg>`,

  // 利润落点 (金黄色) - 趋势图表图标
  profit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>`,

  // 编辑 (蓝色) - 铅笔图标
  edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>`,
  
  default: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
  </svg>`
}

const iconSvg = computed(() => ICONS[props.type] || ICONS.default)
</script>

<style scoped>
/* 基础按钮样式 - 参考 css.txt */
.action-btn {
  cursor: pointer;
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 8px 10px; /* 图标状态下的紧凑内边距 */
  font-size: 14px;
  font-weight: 600;
  border-radius: 34px;
  background-color: transparent;
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  overflow: hidden;
  white-space: nowrap;
  
  /* 默认颜色变量，会被具体类型覆盖 */
  --btn-color: #606266;
  --btn-glow: rgba(0, 0, 0, 0.2);
  
  color: var(--btn-color);
  border: 2px solid var(--btn-color);
}

/* 背景扩散动画层 */
.action-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  margin: auto;
  width: 50px;
  height: 50px;
  border-radius: inherit;
  scale: 0;
  z-index: -1;
  background-color: var(--btn-color);
  transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
}

/* 悬浮状态 */
.action-btn:hover::before {
  scale: 4; /* 稍微加大一点确保覆盖长文本按钮 */
}

.action-btn:hover {
  color: #fff; /* 悬浮时字体变白 */
  scale: 1.05;
  box-shadow: 0 0 20px var(--btn-glow);
  border-color: var(--btn-color); /* 保持边框颜色，避免透明导致的视觉问题 */
  padding: 8px 20px; /* 悬浮时恢复完整内边距 */
}

/* 导入按钮特殊处理：悬浮时字体设为深色(如css.txt中示例由于金色背景文字需深色对比)，
   但其他按钮通常背景色较深，文字白色即可。
   css.txt 中: hover color: #212121。我们针对浅色背景(如金色)可以应用。
   download(白), export(白), add(白), delete(白)
   import(金色) -> 建议使用白色或深色。css.txt用的是#212121。我们给import单独设置 hover color
*/

/* 点击状态 */
.action-btn:active {
  scale: 1;
}

/* 图标和文字层级，确保在背景之上 */
.action-btn__icon { 
  display: flex; 
  align-items: center; 
  width: 18px; 
  height: 18px; 
  position: relative; 
  z-index: 1; 
}
.action-btn__icon svg { width: 100%; height: 100%; }
.action-btn__text { 
  position: relative; 
  z-index: 1;
  max-width: 0;
  opacity: 0;
  margin-left: 0;
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
}

/* 悬浮时展示文字 */
.action-btn:hover .action-btn__text {
  max-width: 150px; /* 给予足够宽度 */
  opacity: 1;
  margin-left: 6px;
}

/* ========== 类型特定样式 ========== */

/* 下载模板 - 蓝色 (#3b82f6) */
.action-btn--download {
  --btn-color: #3b82f6;
  --btn-glow: rgba(59, 130, 246, 0.4);
}

/* 对比模式 - 蓝色 (#3b82f6) - 复用蓝色系 */
.action-btn--compare {
  --btn-color: #3b82f6;
  --btn-glow: rgba(59, 130, 246, 0.4);
}

/* 导出Excel - 紫色 (#8b5cf6) */
.action-btn--export {
  --btn-color: #8b5cf6;
  --btn-glow: rgba(139, 92, 246, 0.4);
}

/* 新增 - 绿色 (#10b981) */
.action-btn--add {
  --btn-color: #10b981;
  --btn-glow: rgba(16, 185, 129, 0.4);
}

/* 导入Excel - 金色 (rgb(193, 163, 98)) - 特殊处理 hover 文字颜色 */
.action-btn--import {
  --btn-color: rgb(193, 163, 98);
  --btn-glow: rgba(193, 163, 98, 0.4);
}
.action-btn--import:hover {
  color: #212121; /* 金色背景下用深色文字 */
}

/* 批量删除 - 红色 (#ef4444) */
.action-btn--delete {
  --btn-color: #ef4444;
  --btn-glow: rgba(239, 68, 68, 0.4);
}

/* 利润落点 - 金黄色 (#f59e0b) */
.action-btn--profit {
  --btn-color: #f59e0b;
  --btn-glow: rgba(245, 158, 11, 0.4);
}

/* 编辑 - 蓝色 (#3b82f6) */
.action-btn--edit {
  --btn-color: #3b82f6;
  --btn-glow: rgba(59, 130, 246, 0.4);
}

/* 默认灰色 */
.action-btn--default {
  --btn-color: #606266;
  --btn-glow: rgba(96, 98, 102, 0.4);
}

/* 禁用状态 */
.action-btn--disabled {
  cursor: not-allowed;
  opacity: 0.5;
  filter: grayscale(100%);
}
.action-btn--disabled:hover { 
  scale: 1; 
  box-shadow: none;
  color: var(--btn-color); /* 恢复文字颜色 */
}
.action-btn--disabled:hover::before { 
  scale: 0; /* 禁用时不显示背景动画 */
}

/* 响应式：中等屏幕隐藏文字只显示图标 */
@media (max-width: 1024px) {
  .action-btn {
    padding: 8px 12px;
    gap: 0;
  }
  .action-btn__text {
    display: none;
  }
}

/* 响应式：小屏幕进一步缩小 */
@media (max-width: 640px) {
  .action-btn {
    padding: 6px 10px;
  }
  .action-btn__icon {
    width: 16px;
    height: 16px;
  }
}
</style>
