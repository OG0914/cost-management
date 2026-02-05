import { ref, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useConfigStore } from '@/store/config'

export function useCostForm() {
    const router = useRouter()
    const route = useRoute()
    const configStore = useConfigStore()
    const formRef = ref(null)

    // 核心表单数据
    const form = reactive({
        regulation_id: null, model_id: null, packaging_config_id: null,
        customer_name: '', customer_region: '', sales_type: 'domestic',
        shipping_method: '', port_type: 'fob_shenzhen', port: '',
        quantity: null, freight_total: null, include_freight_in_base: true,
        vat_rate: null, materials: [], processes: [], packaging: [], customFees: [],
        is_estimation: false, reference_standard_cost_id: null
    })

    // 界面状态
    const editMode = reactive({ materials: false, processes: false, packaging: false })
    const currentModelCategory = ref('')

    // 选项数据
    const regulations = ref([])
    const packagingConfigs = ref([])

    // 计算属性
    const isEditMode = computed(() => !!route.params.id)

    const vatRateOptions = computed(() => configStore.config.vat_rate_options || [0.13, 0.10])

    // 基础方法
    const resetForm = () => {
        Object.assign(form, {
            regulation_id: null, model_id: null, packaging_config_id: null,
            customer_name: '', customer_region: '', sales_type: 'domestic',
            shipping_method: '', port_type: 'fob_shenzhen', port: '',
            quantity: null, freight_total: null, include_freight_in_base: true,
            vat_rate: configStore.config.vat_rate || 0.13,
            materials: [], processes: [], packaging: [], customFees: []
        })
        // 注意：resetForm 还需要重置外部传递进来的引用（如 calculation），这需要在组件层处理 或通过回调
    }

    const validateForm = async () => {
        if (!formRef.value) return false
        try {
            await formRef.value.validate()
            return true
        } catch (e) {
            return e // 返回错误对象以便显示具体字段错误
        }
    }

    // 字段验证规则
    const rules = {
        regulation_id: [{ required: true, message: '请选择法规类别', trigger: 'change' }],
        packaging_config_id: [{ required: true, message: '请选择型号配置', trigger: 'change' }],
        customer_name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
        customer_region: [{ required: true, message: '请输入客户地区', trigger: 'blur' }],
        sales_type: [{ required: true, message: '请选择销售类型', trigger: 'change' }],
        quantity: [{ required: true, message: '请输入购买数量', trigger: 'blur' }],
        freight_total: [{ required: true, message: '请输入运费总价', trigger: 'blur' }]
    }

    return {
        form,
        formRef,
        rules,
        editMode,
        currentModelCategory,
        regulations,
        packagingConfigs,
        isEditMode,
        vatRateOptions,
        resetForm,
        validateForm
    }
}
