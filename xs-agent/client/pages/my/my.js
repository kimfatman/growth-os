const { api } = require('../../utils/request')

Page({
  data: {
    userInfo: {},
    isDark: false,
    roleMap: {
      admin: '管理员',
      company_admin: '公司管理',
      staff: '员工',
      user: '用户'
    }
  },

  onShow() {
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }
    this.loadProfile()
    const isDark = wx.getStorageSync('isDark') || false
    this.setData({ isDark })
    if (isDark) {
      wx.setStorageSync('isDark', true)
    }
  },

  async loadProfile() {
    try {
      const res = await api.get('/auth/profile')
      const user = res.user
      wx.setStorageSync('userInfo', user)
      this.setData({ userInfo: user })
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  toggleTheme(e) {
    const isDark = e.detail ? e.detail.value : !this.data.isDark
    this.setData({ isDark })
    wx.setStorageSync('isDark', isDark)
    if (isDark) {
      wx.setNavigationBarColor({
        frontColor: '#ffffff',
        backgroundColor: '#1c1c1e'
      })
    } else {
      wx.setNavigationBarColor({
        frontColor: '#000000',
        backgroundColor: '#ffffff'
      })
    }
  },

  goToCompany() {
    wx.navigateTo({ url: '/pages/company/company' })
  },

  goToMyOrders() {
    wx.switchTab({ url: '/pages/order/order' })
  },

  handleLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')
          wx.redirectTo({ url: '/pages/login/login' })
        }
      }
    })
  }
})
