import { ref, watch } from 'vue'

export function usePagination(moduleName, defaultSize = 8) {
    // 如果提供了moduleName，则使用特定前缀存储，否则使用全局默认key
    // 建议所有调用都传入moduleName以实现独立记忆
    const storageKey = moduleName ? `app_page_size_${moduleName}` : 'app_page_size'

    const savedSize = localStorage.getItem(storageKey)
    const initialSize = savedSize ? parseInt(savedSize, 10) : defaultSize

    const pageSize = ref(initialSize)
    const currentPage = ref(1)
    const total = ref(0)

    watch(pageSize, (val) => {
        localStorage.setItem(storageKey, val.toString())
    })

    return {
        currentPage,
        pageSize,
        total
    }
}
