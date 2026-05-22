const { api } = require('../../utils/request')

Page({
  data: {
    orders: [],
    loading: false,
    search: '',
    currentIndustry: '',
    currentCity: '',
    currentPrice: '',
    industries: ['全部行业', '代理记账', '税务筹划', '工商注册', '审计验资', '知识产权', '高新认定', '财务外包', '其他'],
    cities: ['全部城市', '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '重庆', '天津', '苏州', '西安', '长沙', '郑州', '其他'],
    priceRanges: ['金额范围', '0-1000', '1000-5000', '5000-10000', '10000-50000', '50000以上'],
    page: 1,
    hasMore: true,
    statusMap: {
      pending: '待接单',
      accepted: '已接单',
      processing: '进行中',
      completed: '已完成',
      cancelled: '已取消'
    }
  },

  onLoad() {
    this.loadOrders()
  },

  onShow() {
    this.loadOrders()
  },

  async loadOrders() {
    this.setData({ loading: true })
    try {
      const params = { page: this.data.page, limit: 20 }
      if (this.data.search) params.search = this.data.search
      if (this.data.currentIndustry) params.industry = this.data.currentIndustry
      if (this.data.currentCity) params.city = this.data.currentCity
      if (this.data.currentPrice) {
        const prices = this.data.currentPrice.replace('以上', '').split('-')
        if (prices.length === 2) {
          params.minPrice = prices[0]
          params.maxPrice = prices[1]
        } else if (this.data.currentPrice.includes('以上')) {
          params.minPrice = prices[0]
        }
      }

      const res = await api.get('/orders', params)
      const orders = (res.orders || []).map(o => ({
        ...o,
        publisherName: o.publisherId ? o.publisherId.name : '未知'
      }))

      this.setData({
        orders: this.data.page === 1 ? orders : [...this.data.orders, ...orders],
        hasMore: this.data.page < res.pages,
        loading: false
      })
    } catch (err) {
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  onSearchInput(e) {
    this.setData({ search: e.detail.value })
  },

  handleSearch() {
    this.setData({ page: 1, orders: [] })
    this.loadOrders()
  },

  onIndustryChange(e) {
    const val = this.data.industries[e.detail.value]
    this.setData({ currentIndustry: val === '全部行业' ? '' : val, page: 1, orders: [] })
    this.loadOrders()
  },

  onCityChange(e) {
    const val = this.data.cities[e.detail.value]
    this.setData({ currentCity: val === '全部城市' ? '' : val, page: 1, orders: [] })
    this.loadOrders()
  },

  onPriceChange(e) {
    const val = this.data.priceRanges[e.detail.value]
    this.setData({ currentPrice: val === '金额范围' ? '' : val, page: 1, orders: [] })
    this.loadOrders()
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/order/order?id=${id}` })
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 }, () => this.loadOrders())
    }
  },

  formatTime(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now - date
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${month}-${day}`
  }
})
