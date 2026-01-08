/**
 * 自定义费用 Composable
 */

import { ref, reactive, computed } from 'vue'

export function useCustomFees(form, calculation) {
  const addFeeDialogVisible = ref(false)
  const feeFormRef = ref(null)
  const newFee = reactive({
    name: '',
    rate: null
  })

  const feeRules = {
    name: [{ required: true, message: '请输入费用项', trigger: 'blur' }],
    rate: [
      { required: true, message: '请输入费率', trigger: 'blur' },
      {
        validator: (rule, value, callback) => {
          const num = parseFloat(value)
          if (isNaN(num) || num < 0.0001 || num > 1) {
            callback(new Error('费率必须在0.0001到1之间'))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      }
    ]
  }

  const customFeeSummary = computed(() => {
    if (!calculation.value || !calculation.value.overheadPrice) {
      return 0
    }
    if (form.customFees.length === 0) {
      return calculation.value.overheadPrice
    }
    let result = calculation.value.overheadPrice
    for (const fee of form.customFees) {
      result = result * (1 + fee.rate)
    }
    return Math.round(result * 10000) / 10000
  })

  const customFeesWithValues = computed(() => {
    if (!calculation.value || !calculation.value.overheadPrice) {
      return []
    }
    let currentValue = calculation.value.overheadPrice
    return form.customFees.map((fee) => {
      currentValue = currentValue * (1 + fee.rate)
      return {
        ...fee,
        calculatedValue: Math.round(currentValue * 10000) / 10000
      }
    })
  })

  const showAddFeeDialog = () => {
    newFee.name = ''
    newFee.rate = null
    addFeeDialogVisible.value = true
  }

  const confirmAddFee = async (onCalculateCost) => {
    if (!feeFormRef.value) return

    try {
      await feeFormRef.value.validate()

      form.customFees.push({
        name: newFee.name,
        rate: newFee.rate,
        sortOrder: form.customFees.length
      })

      addFeeDialogVisible.value = false
      if (onCalculateCost) onCalculateCost()
    } catch (error) {
      // 验证失败
    }
  }

  const removeCustomFee = (index, onCalculateCost) => {
    form.customFees.splice(index, 1)
    form.customFees.forEach((fee, i) => {
      fee.sortOrder = i
    })
    if (onCalculateCost) onCalculateCost()
  }

  return {
    addFeeDialogVisible,
    feeFormRef,
    newFee,
    feeRules,
    customFeeSummary,
    customFeesWithValues,
    showAddFeeDialog,
    confirmAddFee,
    removeCustomFee
  }
}
