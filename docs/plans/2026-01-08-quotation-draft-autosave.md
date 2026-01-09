# 报价单草稿自动保存 实施计划

**目标：** 实现报价单草稿自动保存功能，用户离开页面时提示保存草稿，下次新增时提示恢复

**架构：** 使用 localStorage 存储草稿数据，创建 useQuotationDraft composable 封装所有草稿逻辑，在 CostAdd.vue 中集成

**技术栈：** Vue 3 Composition API, localStorage, Element Plus MessageBox

---

## 任务 1: 创建 useQuotationDraft Composable

**文件：**
- 创建: `frontend/src/composables/useQuotationDraft.js`
- 修改: `frontend/src/composables/index.js`

**步骤1: 创建 useQuotationDraft.js**

```javascript
/**
 * 报价单草稿管理 Composable
 * 处理草稿的保存、恢复、清除和自动保存
 */

import { ref, onUnmounted } from 'vue'
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
      if (isExpired(draft.savedAt)) {
        clearDraft()
        return false
      }
      return true
    } catch {
      return false
    }
  }

  const getDraftInfo = () => {
    try {
      const raw = localStorage.getItem(getDraftKey())
      if (!raw) return null
      const draft = JSON.parse(raw)
      if (isExpired(draft.savedAt)) {
        clearDraft()
        return null
      }
      return {
        savedAt: draft.savedAt,
        modelCategory: draft.modelCategory || '',
        customerName: draft.form?.customer_name || '',
        hasData: !!(draft.form?.materials?.length || draft.form?.processes?.length || draft.form?.packaging?.length)
      }
    } catch {
      return null
    }
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
      if (isExpired(draft.savedAt)) {
        clearDraft()
        return null
      }
      return draft
    } catch {
      return null
    }
  }

  const clearDraft = () => {
    try {
      localStorage.removeItem(getDraftKey())
      return true
    } catch {
      return false
    }
  }

  const startAutoSave = (getFormData, interval = 30000) => {
    stopAutoSave()
    autoSaveTimer = setInterval(() => {
      const { form, extras, hasData } = getFormData()
      if (hasData) {
        saveDraft(form, extras)
      }
    }, interval)
  }

  const stopAutoSave = () => {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
      autoSaveTimer = null
    }
  }

  onUnmounted(() => {
    stopAutoSave()
  })

  return {
    hasDraft,
    getDraftInfo,
    saveDraft,
    loadDraft,
    clearDraft,
    startAutoSave,
    stopAutoSave
  }
}
```

**步骤2: 更新 composables/index.js**

在 `frontend/src/composables/index.js` 末尾添加：

```javascript
export { useQuotationDraft } from './useQuotationDraft'
```

**步骤3: 提交**

```bash
git add frontend/src/composables/useQuotationDraft.js frontend/src/composables/index.js
git commit -m "feat(composables): add useQuotationDraft for draft autosave"
```

---

## 任务 2: 修改 CostAdd.vue - 引入草稿功能

**文件：**
- 修改: `frontend/src/views/cost/CostAdd.vue`

**步骤1: 添加 import 和初始化**

在 import 区域添加：
```javascript
import { useQuotationDraft } from '@/composables'
import { ElMessageBox } from 'element-plus'
```

在 Composables 初始化区域添加：
```javascript
const { hasDraft, getDraftInfo, saveDraft, loadDraft, clearDraft, startAutoSave, stopAutoSave } = useQuotationDraft()
```

**步骤2: 添加草稿恢复提示函数**

在 `fillStandardCostData` 函数后添加：

```javascript
const formatDraftTime = (isoString) => {
  const date = new Date(isoString)
  return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const checkAndRestoreDraft = async () => {
  if (route.params.id || route.query.copyFrom || route.query.copyFromStandardCost) return false
  
  const draftInfo = getDraftInfo()
  if (!draftInfo || !draftInfo.hasData) return false

  try {
    const action = await ElMessageBox.confirm(
      `保存时间：${formatDraftTime(draftInfo.savedAt)}${draftInfo.modelCategory ? `\n产品类别：${draftInfo.modelCategory}` : ''}${draftInfo.customerName ? `\n客户：${draftInfo.customerName}` : ''}`,
      '检测到未完成的报价草稿',
      {
        distinguishCancelAndClose: true,
        confirmButtonText: '继续编辑',
        cancelButtonText: '新建报价',
        type: 'info'
      }
    )
    if (action === 'confirm') {
      return await restoreDraft()
    }
    return false
  } catch (action) {
    if (action === 'cancel') {
      clearDraft()
    }
    return false
  }
}

const restoreDraft = async () => {
  const draft = loadDraft()
  if (!draft) return false

  try {
    if (draft.modelCategory) currentModelCategory.value = draft.modelCategory
    
    Object.assign(form, draft.form)
    
    if (draft.quantityUnit) quantityUnit.value = draft.quantityUnit
    if (draft.quantityInput) quantityInput.value = draft.quantityInput
    if (draft.domesticCbmPrice) domesticCbmPrice.value = draft.domesticCbmPrice
    if (draft.customProfitTiers) customProfitTiers.value = draft.customProfitTiers
    if (draft.editMode) Object.assign(editMode, draft.editMode)

    await nextTick()
    handleCalculateCost()
    ElMessage.success('草稿已恢复')
    return true
  } catch (error) {
    logger.error('恢复草稿失败:', error)
    ElMessage.error('恢复草稿失败')
    return false
  }
}

const getFormDataForDraft = () => ({
  form,
  extras: {
    modelCategory: currentModelCategory.value,
    quantityUnit: quantityUnit.value,
    quantityInput: quantityInput.value,
    domesticCbmPrice: domesticCbmPrice.value,
    customProfitTiers: customProfitTiers.value,
    editMode
  },
  hasData: hasFormData.value
})

const promptSaveDraft = async () => {
  try {
    await ElMessageBox.confirm(
      '是否保存为草稿以便下次继续？',
      '您有未保存的报价数据',
      {
        distinguishCancelAndClose: true,
        confirmButtonText: '保存草稿',
        cancelButtonText: '放弃',
        type: 'warning'
      }
    )
    const { form: f, extras } = getFormDataForDraft()
    saveDraft(f, extras)
    ElMessage.success('草稿已保存')
    return true
  } catch (action) {
    if (action === 'cancel') {
      clearDraft()
    }
    return action === 'cancel'
  }
}
```

**步骤3: 修改 onMounted**

替换现有 `onMounted` 为：

```javascript
onMounted(async () => {
  await configStore.loadConfig()
  await loadSystemConfig()
  regulations.value = await loadRegulations()
  packagingConfigs.value = await loadPackagingConfigs()
  await loadAllMaterials()
  await loadMaterialCoefficients(currentModelCategory.value)
  form.vat_rate = configStore.config.vat_rate || 0.13

  if (route.query.model_category) {
    currentModelCategory.value = route.query.model_category
    if (materialCoefficientsCache.value[route.query.model_category]) {
      materialCoefficient.value = materialCoefficientsCache.value[route.query.model_category]
    }
  }

  if (route.params.id) {
    const data = await loadQuotationData(route.params.id)
    if (data) await fillQuotationData(data, false)
  } else if (route.query.copyFromStandardCost) {
    const data = await loadStandardCostData(route.query.copyFromStandardCost)
    if (data) await fillStandardCostData(data)
  } else if (route.query.copyFrom) {
    const data = await loadQuotationData(route.query.copyFrom)
    if (data) await fillQuotationData(data, true)
  } else {
    const restored = await checkAndRestoreDraft()
    if (!restored) {
      startAutoSave(getFormDataForDraft, 30000)
    } else {
      startAutoSave(getFormDataForDraft, 30000)
    }
  }
  
  if (!route.params.id) {
    startAutoSave(getFormDataForDraft, 30000)
  }
})
```

**步骤4: 修改 onBeforeRouteLeave**

替换现有 `onBeforeRouteLeave` 为：

```javascript
onBeforeRouteLeave(async (to, from, next) => {
  stopAutoSave()
  
  if (isSaved.value || !hasFormData.value || route.params.id) {
    next()
    return
  }

  try {
    await ElMessageBox.confirm(
      '是否保存为草稿以便下次继续？',
      '您有未保存的报价数据',
      {
        distinguishCancelAndClose: true,
        confirmButtonText: '保存草稿',
        cancelButtonText: '放弃',
        type: 'warning'
      }
    )
    const { form: f, extras } = getFormDataForDraft()
    saveDraft(f, extras)
    ElMessage.success('草稿已保存')
    next()
  } catch (action) {
    if (action === 'cancel') {
      clearDraft()
      next()
    } else {
      next(false)
    }
  }
})
```

**步骤5: 修改保存/提交成功后清除草稿**

在 `handleSaveDraft` 函数中，`if (res) router.push('/cost/records')` 之前添加：
```javascript
clearDraft()
stopAutoSave()
```

在 `handleSubmitQuotation` 函数中，`if (res) router.push('/cost/records')` 之前添加：
```javascript
clearDraft()
stopAutoSave()
```

**步骤6: 提交**

```bash
git add frontend/src/views/cost/CostAdd.vue
git commit -m "feat(CostAdd): integrate draft autosave functionality"
```

---

## 任务 3: 验证构建

**步骤1: 运行构建验证**

```bash
npm run build --prefix frontend
```

预期: 构建成功，无错误

**步骤2: 提交所有更改**

```bash
git add -A
git commit -m "feat: implement quotation draft autosave feature

- Add useQuotationDraft composable for draft management
- Auto-save draft every 30 seconds
- Prompt to restore draft on new quotation page
- Prompt to save draft when leaving page
- Clear draft after successful save/submit
- Draft expires after 7 days
- User-isolated drafts (by user ID)"
```

---

## 测试清单

1. **新增报价 → 填写数据 → 刷新页面** → 应提示恢复草稿
2. **新增报价 → 填写数据 → 点击返回** → 应提示保存草稿
3. **恢复草稿 → 继续编辑 → 保存成功** → 草稿应被清除
4. **恢复草稿 → 选择新建** → 草稿应被清除
5. **编辑模式进入** → 不应提示恢复草稿
6. **不同用户** → 草稿应隔离
7. **草稿超过7天** → 应自动清除
