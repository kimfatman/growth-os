const { api } = require('../../utils/request')

Page({
  data: {
    title: '',
    description: '',
    price: '',
    industry: '',
    city: '',
    contactPhone: '',
    submitting: false,
    showSuccess: false,
    industries: ['代理记账', '税务筹划', '工商注册', '审计验资', '知识产权', '高新认定', '财务外包', '其他'],
    cities: ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '重庆', '天津', '苏州', '西安', '长沙', '郑州', '其他']
  },

  onTitleInput(e) { this.setData({ title: e.detail.value }) },
  onDescInput(e) { this.setData({ description: e.detail.value }) },
  onPriceInput(e) { this.setData({ price: e.detail.value }) },
  onContactInput(e) { this.setData({ contactPhone: e.detail.value }) },
  onIndustryChange(e) { this.setData({ industry: this.data.industries[e.detail.value] }) },
  onCityChange(e) { this.setData({ city: this.data.cities[e.detail.value] }) },

  async handleSubmit() {
    const { title, price, industry } = this.data
    if (!title || !price || !industry) {
      wx.showToast({ title: '请填写必填项', icon: 'none' })
      return
    }
    if (isNaN(Number(price)) || Number(price) <= 0) {
      wx.showToast({ title: '请输入有效金额', icon: 'none' })
      return
    }

    this.setData({ submitting: true })
    try {
      const orderData = {
        title: this.data.title,
        description: this.data.description,
        price: Number(this.data.price),
        industry: this.data.industry,
        city: this.data.city,
        contactPhone: this.data.contactPhone
      }
      await api.post('/orders', orderData)
      this.setData({ showSuccess: true, submitting: false })
    } catch (err) {
      wx.showToast({ title: err.message || '发布失败', icon: 'none' })
      this.setData({ submitting: false })
    }
  },

  goToOrders() {
    wx.switchTab({ url: '/pages/order/order' })
  }
})
