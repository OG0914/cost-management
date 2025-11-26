/**
 * 报价单状态管理
 */
import { defineStore } from 'pinia'
import request from '@/utils/request'

export const useQuotationStore = defineStore('quotation', {
  state: () => ({
    // 当前报价单
    currentQuotation: null,
    // 报价单列表
    quotations: [],
    // 分页信息
    pagination: {
      page: 1,
      pageSize: 20,
      total: 0
    },
    // 搜索条件
    searchParams: {
      customer_name: '',
      model_name: '',
      status: '',
      date_range: []
    },
    // 加载状态
    loading: false
  }),

  getters: {
    // 获取草稿状态的报价单数量
    draftCount: (state) => {
      return state.quotations.filter(q => q.status === 'draft').length
    },
    
    // 获取已提交状态的报价单数量
    submittedCount: (state) => {
      return state.quotations.filter(q => q.status === 'submitted').length
    },
    
    // 获取已审核状态的报价单数量
    approvedCount: (state) => {
      return state.quotations.filter(q => q.status === 'approved').length
    },
    
    // 获取已退回状态的报价单数量
    rejectedCount: (state) => {
      return state.quotations.filter(q => q.status === 'rejected').length
    },

    // 判断报价单是否可编辑
    canEdit: (state) => (quotation) => {
      return quotation && ['draft', 'rejected'].includes(quotation.status)
    },

    // 判断报价单是否可删除
    canDelete: (state) => (quotation, userRole) => {
      if (!quotation) return false
      // 管理员可以删除任何状态的报价单
      if (userRole === 'admin') return true
      // 普通用户只能删除草稿状态的报价单
      return quotation.status === 'draft'
    }
  },

  actions: {
    /**
     * 加载报价单列表
     */
    async fetchQuotations(params = {}) {
      this.loading = true
      try {
        const queryParams = {
          page: params.page || this.pagination.page,
          pageSize: params.pageSize || this.pagination.pageSize,
          customer_name: params.customer_name || this.searchParams.customer_name,
          model_name: params.model_name || this.searchParams.model_name,
          status: params.status || this.searchParams.status
        }

        // 添加日期范围参数
        if (params.date_range && params.date_range.length === 2) {
          queryParams.start_date = params.date_range[0]
          queryParams.end_date = params.date_range[1]
        } else if (this.searchParams.date_range && this.searchParams.date_range.length === 2) {
          queryParams.start_date = this.searchParams.date_range[0]
          queryParams.end_date = this.searchParams.date_range[1]
        }

        const response = await request.get('/cost/quotations', { params: queryParams })
        
        if (response.success) {
          this.quotations = response.data
          this.pagination = {
            page: response.pagination.page,
            pageSize: response.pagination.pageSize,
            total: response.pagination.total
          }
        }
        
        return response
      } catch (error) {
        console.error('加载报价单列表失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 获取报价单详情
     */
    async fetchQuotationDetail(id) {
      this.loading = true
      try {
        const response = await request.get(`/cost/quotations/${id}`)
        
        if (response.success) {
          this.currentQuotation = response.data.quotation
        }
        
        return response
      } catch (error) {
        console.error('获取报价单详情失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 创建报价单
     */
    async createQuotation(data) {
      this.loading = true
      try {
        const response = await request.post('/cost/quotations', data)
        
        if (response.success) {
          // 刷新列表
          await this.fetchQuotations()
        }
        
        return response
      } catch (error) {
        console.error('创建报价单失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 更新报价单
     */
    async updateQuotation(id, data) {
      this.loading = true
      try {
        const response = await request.put(`/cost/quotations/${id}`, data)
        
        if (response.success) {
          // 更新当前报价单
          if (this.currentQuotation && this.currentQuotation.id === id) {
            this.currentQuotation = response.data.quotation
          }
          // 刷新列表
          await this.fetchQuotations()
        }
        
        return response
      } catch (error) {
        console.error('更新报价单失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 提交报价单
     */
    async submitQuotation(id) {
      this.loading = true
      try {
        const response = await request.post(`/cost/quotations/${id}/submit`)
        
        if (response.success) {
          // 更新当前报价单状态
          if (this.currentQuotation && this.currentQuotation.id === id) {
            this.currentQuotation.status = 'submitted'
          }
          // 刷新列表
          await this.fetchQuotations()
        }
        
        return response
      } catch (error) {
        console.error('提交报价单失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 删除报价单
     */
    async deleteQuotation(id) {
      this.loading = true
      try {
        const response = await request.delete(`/cost/quotations/${id}`)
        
        if (response.success) {
          // 从列表中移除
          this.quotations = this.quotations.filter(q => q.id !== id)
          // 刷新列表
          await this.fetchQuotations()
        }
        
        return response
      } catch (error) {
        console.error('删除报价单失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 更新搜索条件
     */
    updateSearchParams(params) {
      this.searchParams = {
        ...this.searchParams,
        ...params
      }
    },

    /**
     * 重置搜索条件
     */
    resetSearchParams() {
      this.searchParams = {
        customer_name: '',
        model_name: '',
        status: '',
        date_range: []
      }
      this.pagination.page = 1
    },

    /**
     * 清空当前报价单
     */
    clearCurrentQuotation() {
      this.currentQuotation = null
    }
  }
})
