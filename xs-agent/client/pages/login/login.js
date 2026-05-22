const { api } = require('../../utils/request')

Page({
  data: {
    activeTab: 'login',
    loading: false,
    phone: '',
    password: '',
    name: '',
    city: '',
    businessTypes: ''
  },

  switchTab(e) {
    const { tab } = e.currentTarget.dataset
    this.setData({
      activeTab: tab,
      phone: '',
      password: '',
      name: '',
      city: '',
      businessTypes: ''
    })
  },

  onPhoneInput(e) { this.setData({ phone: e.detail.value }) },
  onPasswordInput(e) { this.setData({ password: e.detail.value }) },
  onNameInput(e) { this.setData({ name: e.detail.value }) },
  onCityInput(e) { this.setData({ city: e.detail.value }) },
  onBusinessTypesInput(e) { this.setData({ businessTypes: e.detail.value }) },

  async handleLogin() {
    const { phone, password } = this.data
    if (!phone || !password) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }
    this.setData({ loading: true })
    try {
      const res = await api.post('/auth/login', { phone, password })
      wx.setStorageSync('token', res.token)
      wx.setStorageSync('userInfo', res.user)
      wx.switchTab({ url: '/pages/home/home' })
    } catch (err) {
      wx.showToast({ title: err.message || '登录失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  async handleRegister() {
    const { name, phone, password, city, businessTypes } = this.data
    if (!name || !phone || !password) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }
    if (password.length < 6) {
      wx.showToast({ title: '密码至少6位', icon: 'none' })
      return
    }
    this.setData({ loading: true })
    try {
      const types = businessTypes.split(',').map(t => t.trim()).filter(Boolean)
      const res = await api.post('/auth/register', { name, phone, password, city, businessTypes: types })
      wx.setStorageSync('token', res.token)
      wx.setStorageSync('userInfo', res.user)
      wx.switchTab({ url: '/pages/home/home' })
    } catch (err) {
      wx.showToast({ title: err.message || '注册失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  }
})
