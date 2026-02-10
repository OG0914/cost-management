import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import { formatNumber } from '@/utils/format'
import logger from '@/utils/logger'

export function useCostCompare() {
  const router = useRouter()
  const route = useRoute()
  const loading = ref(false)

  const goBack = () => {
    router.back()
  }

  // 对比数据
  const compareData = reactive({
    quotations: [],
    items: {},
    calculations: {}
  })

  // 获取状态类型
  const getStatusType = (status) => {
    const typeMap = {
      draft: 'info',
      submitted: 'warning',
      approved: 'success',
      rejected: 'danger'
    }
    return typeMap[status] || 'info'
  }

  // 获取状态文本
  const getStatusText = (status) => {
    const textMap = {
      draft: '草稿',
      submitted: '已提交',
      approved: '已审核',
      rejected: '已退回'
    }
    return textMap[status] || status
  }

  // 获取所有利润档位（系统+自定义）
  const getAllProfitTiers = (quotation) => {
    const systemTiers = compareData.calculations[quotation.id]?.profitTiers || []

    // 解析自定义利润档位
    let customTiers = []
    if (quotation.custom_profit_tiers) {
      try {
        customTiers = JSON.parse(quotation.custom_profit_tiers).map(tier => ({
          ...tier,
          isCustom: true
        }))
      } catch (e) {
        logger.error('解析自定义利润档位失败:', e)
      }
    }

    // 合并并排序
    const allTiers = [
      ...systemTiers.map(t => ({ ...t, isCustom: false })),
      ...customTiers
    ]
    allTiers.sort((a, b) => a.profitRate - b.profitRate)

    return allTiers
  }

  // 加载对比数据
  const loadCompareData = async () => {
    const ids = route.query.ids
    if (!ids) {
      ElMessage.error('缺少报价单ID参数')
      router.push('/cost/records')
      return
    }

    const idArray = ids.split(',').map(id => parseInt(id))

    if (idArray.length < 2) {
      ElMessage.error('至少需要2个报价单进行对比')
      router.push('/cost/records')
      return
    }

    if (idArray.length > 4) {
      ElMessage.error('最多只能对比4个报价单')
      router.push('/cost/records')
      return
    }

    loading.value = true

    try {
      // 并发加载所有报价单详情
      const promises = idArray.map(id => request.get(`/cost/quotations/${id}`))
      const results = await Promise.all(promises)

      // 检查是否所有请求都成功
      const failedRequests = results.filter(res => !res.success)
      if (failedRequests.length > 0) {
        ElMessage.error('部分报价单加载失败')
        return
      }

      // 提取数据
      compareData.quotations = results.map(res => res.data.quotation)
      results.forEach(res => {
        const quotationId = res.data.quotation.id
        compareData.items[quotationId] = res.data.items
        compareData.calculations[quotationId] = res.data.calculation
      })

      // 验证是否为同一型号
      const firstQuotation = compareData.quotations[0]
      const allSameModel = compareData.quotations.every(
        q => q.model_id === firstQuotation.model_id
      )

      if (!allSameModel) {
        ElMessage.warning('提示：您选择的报价单不是同一型号，对比结果可能不准确')
      }

      const allSameCustomer = compareData.quotations.every(
        q => q.customer_name === firstQuotation.customer_name
      )

      if (!allSameCustomer) {
        ElMessage.info('提示：您选择的报价单来自不同客户')
      }

    } catch (error) {
      logger.error('加载对比数据失败:', error)
      ElMessage.error('加载对比数据失败')
    } finally {
      loading.value = false
    }
  }

  // 打印（只打印对比概览）
  const handlePrint = () => {
    // 获取对比概览元素
    const overviewCard = document.querySelector('.overview-card')
    if (!overviewCard) {
      ElMessage.warning('未找到对比概览内容')
      return
    }

    // 创建打印窗口
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      ElMessage.error('无法打开打印窗口，请检查浏览器设置')
      return
    }

    // 克隆内容并移除操作按钮
    const clonedCard = overviewCard.cloneNode(true)
    const actionsDiv = clonedCard.querySelector('.overview-actions')
    if (actionsDiv) {
      actionsDiv.remove()
    }

    // 构建打印内容 - 使用简化的样式
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>报价单对比 - ${new Date().toLocaleDateString()}</title>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Inter', 'Noto Sans SC', 'Microsoft YaHei', 'PingFang SC', sans-serif;
            padding: 20px;
            font-size: 14px;
            line-height: 1.6;
            color: #303133;
          }

          h1 {
            text-align: center;
            margin-bottom: 20px;
            font-size: 24px;
            color: #303133;
          }

          h4 {
            margin-bottom: 10px;
            font-size: 16px;
            color: #303133;
          }

          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #303133;
            margin-bottom: 15px;
          }

          .config-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-top: 15px;
          }

          .config-item {
            background: white;
            border: 2px solid #e4e7ed;
            border-radius: 8px;
            padding: 15px;
            page-break-inside: avoid;
          }

          .config-number {
            font-size: 12px;
            color: #909399;
            margin-bottom: 8px;
          }

          .config-details {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .config-name {
            font-size: 18px;
            color: #409eff;
            margin-bottom: 2px;
            font-weight: bold;
          }

          .config-subtitle {
            font-size: 14px;
            color: #606266;
            margin-bottom: 8px;
          }

          .config-spec,
          .config-quantity {
            font-size: 13px;
            color: #606266;
          }

          .config-price {
            font-size: 14px;
            color: #303133;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid #e4e7ed;
          }

          .price-value {
            font-size: 16px;
            font-weight: bold;
            color: #e6a23c;
            margin-left: 5px;
          }

          .config-profit {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #e4e7ed;
          }

          .profit-title {
            font-size: 12px;
            color: #909399;
            margin-bottom: 8px;
          }

          .profit-list {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .profit-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 13px;
            padding: 4px 0;
          }

          .profit-item.custom-tier {
            background-color: #fef0e6;
            padding: 4px 8px;
            border-radius: 4px;
            margin: 2px 0;
          }

          .profit-rate {
            color: #606266;
          }

          .profit-item.custom-tier .profit-rate {
            color: #E6A23C;
            font-weight: 600;
          }

          .profit-price {
            color: #67c23a;
            font-weight: 500;
          }

          .profit-item.custom-tier .profit-price {
            color: #E6A23C;
          }

          @media print {
            body {
              padding: 10px;
            }

            .config-item {
              page-break-inside: avoid;
              break-inside: avoid;
            }

            @page {
              margin: 1cm;
            }
          }
        </style>
      </head>
      <body>
        <h1>报价单对比分析</h1>
        ${clonedCard.innerHTML}
      </body>
      </html>
    `)

    printWindow.document.close()

    // 等待内容加载完成后打印
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }

  // 导出报告
  const handleExport = () => {
    ElMessage.info('导出功能开发中...')
    // TODO: 实现导出Excel功能
  }

  onMounted(() => {
    loadCompareData()
  })

  return {
    loading,
    compareData,
    goBack,
    getStatusType,
    getStatusText,
    getAllProfitTiers,
    handlePrint,
    handleExport,
    formatNumber
  }
}
