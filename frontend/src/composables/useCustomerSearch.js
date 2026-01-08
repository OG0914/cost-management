/**
 * 客户搜索 Composable
 */

import { ref } from 'vue'
import request from '@/utils/request'
import logger from '@/utils/logger'

export function useCustomerSearch() {
  const isNewCustomer = ref(true)
  const selectedCustomerId = ref(null)
  const customerOptions = ref([])
  const customerSearchLoading = ref(false)
  const customerSelectFocused = ref(false)

  const onCustomerTypeChange = (val, form) => {
    if (val) {
      selectedCustomerId.value = null
      customerOptions.value = []
      form.customer_name = ''
      form.customer_region = ''
    }
  }

  const searchCustomers = async (keyword) => {
    if (!keyword) {
      customerOptions.value = []
      return
    }
    customerSearchLoading.value = true
    try {
      const res = await request.get('/customers/search', { params: { keyword } })
      customerOptions.value = res.success ? res.data : []
    } catch (error) {
      logger.error('搜索客户失败:', error)
      customerOptions.value = []
    } finally {
      customerSearchLoading.value = false
    }
  }

  const onCustomerSelect = (customerId, form) => {
    if (!customerId) {
      form.customer_name = ''
      form.customer_region = ''
      return
    }
    const customer = customerOptions.value.find(c => c.id === customerId)
    if (customer) {
      form.customer_name = customer.name
      form.customer_region = customer.region || ''
    }
  }

  return {
    isNewCustomer,
    selectedCustomerId,
    customerOptions,
    customerSearchLoading,
    customerSelectFocused,
    onCustomerTypeChange,
    searchCustomers,
    onCustomerSelect
  }
}
