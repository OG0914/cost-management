import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useLayoutStore = defineStore('layout', () => {
    const portalCount = ref(0)

    // 使用计数器防止页面切换时的竞态条件
    const isHeaderPortalActive = computed(() => portalCount.value > 0)

    const setHeaderPortalActive = (active) => {
        if (active) {
            portalCount.value++
        } else {
            if (portalCount.value > 0) {
                portalCount.value--
            }
        }
    }

    return {
        isHeaderPortalActive,
        setHeaderPortalActive
    }
})
