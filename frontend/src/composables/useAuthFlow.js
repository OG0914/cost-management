import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../store/auth'

export function useAuthFlow() {
    const router = useRouter()
    const authStore = useAuthStore()

    const loading = ref(false)
    const showPassword = ref(false)
    const loginForm = reactive({ username: '', password: '' })

    const handleLogin = async () => {
        if (!loginForm.username) return ElMessage.warning('请输入用户名')
        if (!loginForm.password) return ElMessage.warning('请输入密码')
        if (loginForm.password.length < 6) return ElMessage.warning('密码长度不能少于6位')

        loading.value = true
        try {
            await authStore.login(loginForm.username, loginForm.password)
            ElMessage.success('登录成功')
            router.push('/dashboard')
        } catch (error) {
            ElMessage.error(error.message || '登录失败')
        } finally {
            loading.value = false
        }
    }

    return {
        loading,
        showPassword,
        loginForm,
        handleLogin
    }
}
