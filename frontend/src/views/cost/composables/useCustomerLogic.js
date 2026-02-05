import { ref } from 'vue'
import { ElMessageBox } from 'element-plus'

export function useCustomerLogic({ form, searchCustomers, customerOptions }) {
    const isOtherSalespersonCustomer = ref(false)
    const selectedCustomerOwner = ref('')

    const handleCustomerSearch = async (queryString, cb) => {
        if (!queryString || queryString.length < 2) { cb([]); return }
        await searchCustomers(queryString)
        cb(customerOptions.value)
    }

    const handleCustomerAutoSelect = async (item, { selectedCustomerId, isNewCustomer }) => {
        // 检查是否为其他业务员的客户
        if (!item.is_mine && item.user_id) {
            try {
                await ElMessageBox.confirm(
                    `该客户「${item.name}」属于业务员「${item.salesperson_name}」，确定要为其创建报价吗？`,
                    '他人客户提示',
                    { confirmButtonText: '继续使用', cancelButtonText: '取消', type: 'warning' }
                )
            } catch { return }
            isOtherSalespersonCustomer.value = true
            selectedCustomerOwner.value = item.salesperson_name
        } else {
            isOtherSalespersonCustomer.value = false
            selectedCustomerOwner.value = ''
        }
        selectedCustomerId.value = item.id
        form.customer_name = item.name
        form.customer_region = item.region || ''
        isNewCustomer.value = false
    }

    const handleCustomerClear = ({ selectedCustomerId, isNewCustomer }) => {
        selectedCustomerId.value = null
        form.customer_region = ''
        isNewCustomer.value = true
        isOtherSalespersonCustomer.value = false
        selectedCustomerOwner.value = ''
    }

    return {
        isOtherSalespersonCustomer,
        selectedCustomerOwner,
        handleCustomerSearch,
        handleCustomerAutoSelect,
        handleCustomerClear
    }
}
