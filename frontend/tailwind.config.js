/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 字体配置
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      // 颜色配置
      colors: {
        // 主色调 - Primary Blue
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',  // 主要按钮色
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // 灰色系 - Slate
        slate: {
          50: '#f8fafc',   // 页面背景
          100: '#f1f5f9',  // 卡片边框
          200: '#e2e8f0',  // 分割线
          300: '#cbd5e1',
          400: '#94a3b8',  // 次要文字/图标
          500: '#64748b',  // 正文
          600: '#475569',
          700: '#334155',  // 标题
          800: '#1e293b',  // 强调文字
          850: '#1e293b',  // 深色背景
          900: '#0f172a',
        },
      },
    },
  },
  plugins: [],
}
