<template>
  <el-dropdown
    trigger="click"
    popper-class="settings-dropdown"
    @visible-change="(visible) => isOpen = visible"
  >
    <div
      class="cursor-pointer p-2.5 rounded-lg hover:bg-slate-100 transition-all duration-200"
      :class="{ 'bg-slate-100': isOpen }"
    >
      <i class="ri-settings-3-line text-xl" :class="isOpen ? 'text-blue-600' : 'text-slate-500'"></i>
    </div>

    <template #dropdown>
      <el-dropdown-menu class="min-w-[160px]">
        <el-dropdown-item @click="goToSystemConfig">
          <div class="flex items-center gap-3 py-1">
            <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <i class="ri-computer-line text-blue-600"></i>
            </div>
            <div>
              <p class="text-sm font-medium text-slate-800">系统配置</p>
              <p class="text-xs text-slate-400">全局参数设置</p>
            </div>
          </div>
        </el-dropdown-item>

        <el-dropdown-item divided @click="goToProfileSettings">
          <div class="flex items-center gap-3 py-1">
            <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <i class="ri-user-settings-line text-emerald-600"></i>
            </div>
            <div>
              <p class="text-sm font-medium text-slate-800">个人设置</p>
              <p class="text-xs text-slate-400">账号与偏好</p>
            </div>
          </div>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isOpen = ref(false)

// 跳转到系统配置
const goToSystemConfig = () => {
  router.push('/config')
}

// 跳转到个人设置
const goToProfileSettings = () => {
  router.push('/profile')
}
</script>
