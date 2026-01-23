import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import 'element-plus/dist/index.css'
import 'remixicon/fonts/remixicon.css'
import router from './router'
import App from './App.vue'
import './styles/tailwind.css'
import './styles/index.css'
import './styles/dialog.css'
import './styles/cost-form.css'
import './styles/message-overrides.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(ElementPlus, { locale: zhCn })

app.mount('#app')
