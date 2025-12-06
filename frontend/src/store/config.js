/**
 * 系统配置 Store
 */
import { defineStore } from 'pinia'
import request from '@/utils/request'

export const useConfigStore = defineStore('config', {
  state: () => ({
    config: {
      overhead_rate: 0.2,
      vat_rate: 0.13,
      vat_rate_options: [0.13, 0.10], // 增值税率选项列表
      insurance_rate: 0.003,
      exchange_rate: 7.2,
      process_coefficient: 1.56, // 工价系数
      fob_shenzhen_exchange_rate: 7.1,
      fcl_20_freight_usd: 840,
      fcl_40_freight_usd: 940,
      profit_tiers: [0.05, 0.10, 0.25, 0.50]
    },
    loaded: false
  }),

  actions: {
    async loadConfig(forceReload = false) {
      if (this.loaded && !forceReload) return

      try {
        const response = await request.get('/config')
        if (response.success && response.data) {
          this.config = {
            ...this.config,
            ...response.data
          }
          this.loaded = true
        }
      } catch (error) {
        console.error('加载系统配置失败:', error)
      }
    },

    // 强制重新加载配置
    async reloadConfig() {
      this.loaded = false
      await this.loadConfig(true)
    },

    getProcessCoefficient() {
      return this.config.process_coefficient || 1.56
    }
  }
})
