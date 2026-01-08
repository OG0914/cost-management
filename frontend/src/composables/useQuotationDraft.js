/**
 * 报价单草稿管理 Composable - 处理草稿的保存、恢复、清除和自动保存
 */

import { onUnmounted } from 'vue'
import { useAuthStore } from '@/store/auth'

const DRAFT_KEY = 'quotation_draft'
const DRAFT_EXPIRY_DAYS = 7

export function useQuotationDraft() {
  const authStore = useAuthStore()
  let autoSaveTimer = null

  const getCurrentUserId = () => authStore.user?.id || 0
  const getDraftKey = () => `${DRAFT_KEY}_${getCurrentUserId()}`

  const isExpired = (savedAt) => {
    if (!savedAt) return true
    const savedDate = new Date(savedAt)
    const now = new Date()
    const diffDays = (now - savedDate) / (1000 * 60 * 60 * 24)
    return diffDays > DRAFT_EXPIRY_DAYS
  }

  const hasDraft = () => {
    try {
      const raw = localStorage.getItem(getDraftKey())
      if (!raw) return false
      const draft = JSON.parse(raw)
      if (isExpired(draft.savedAt)) { clearDraft(); return false }
      return true
    } catch { return false }
  }

  const getDraftInfo = () => {
    try {
      const raw = localStorage.getItem(getDraftKey())
      if (!raw) return null
      const draft = JSON.parse(raw)
      if (isExpired(draft.savedAt)) { clearDraft(); return null }
      return {
        savedAt: draft.savedAt,
        modelCategory: draft.modelCategory || '',
        customerName: draft.form?.customer_name || '',
        hasData: !!(draft.form?.materials?.length || draft.form?.processes?.length || draft.form?.packaging?.length)
      }
    } catch { return null }
  }

  const saveDraft = (form, extras = {}) => {
    try {
      const draft = {
        userId: getCurrentUserId(),
        savedAt: new Date().toISOString(),
        modelCategory: extras.modelCategory || '',
        form: JSON.parse(JSON.stringify(form)),
        quantityUnit: extras.quantityUnit || 'pcs',
        quantityInput: extras.quantityInput || null,
        domesticCbmPrice: extras.domesticCbmPrice || null,
        customProfitTiers: extras.customProfitTiers || [],
        editMode: extras.editMode || {}
      }
      localStorage.setItem(getDraftKey(), JSON.stringify(draft))
      return true
    } catch (error) {
      console.error('保存草稿失败:', error)
      return false
    }
  }

  const loadDraft = () => {
    try {
      const raw = localStorage.getItem(getDraftKey())
      if (!raw) return null
      const draft = JSON.parse(raw)
      if (isExpired(draft.savedAt)) { clearDraft(); return null }
      return draft
    } catch { return null }
  }

  const clearDraft = () => {
    try { localStorage.removeItem(getDraftKey()); return true }
    catch { return false }
  }

  const startAutoSave = (getFormData, interval = 30000) => {
    stopAutoSave()
    autoSaveTimer = setInterval(() => {
      const { form, extras, hasData } = getFormData()
      if (hasData) saveDraft(form, extras)
    }, interval)
  }

  const stopAutoSave = () => {
    if (autoSaveTimer) { clearInterval(autoSaveTimer); autoSaveTimer = null }
  }

  onUnmounted(() => { stopAutoSave() })

  return { hasDraft, getDraftInfo, saveDraft, loadDraft, clearDraft, startAutoSave, stopAutoSave }
}
