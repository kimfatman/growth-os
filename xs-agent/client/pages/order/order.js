const { api } = require('../../utils/request')

Page({
  data: {
    isDetail: false,
    order: {},
    orders: [],
    orderType: 'published',
    loading: false,
    isMyOrder: false,
    isReceiver: false,
    statusMap: {
      pending: '待接单',
      accepted: '已接单',
      processing: '进行中',
      completed: '已完成',
      cancelled: '已取消'
    }
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ isDetail: true })
      this.loadOrderDetail(options.id)
    } else {
      this.loadMyOrders()
    }
  },

  onShow() {
    if (!this.data.isDetail) {
      this.loadMyOrders()
    }
  },

  async loadOrderDetail(id) {
    try {
      const res = await api.get(`/orders/${id}`)
      const order = this.processOrderData(res.order)
      const userInfo = wx.getStorageSync('userInfo')
      const isMyOrder = order.publisherId && order.publisherId._id === userInfo._id
      const isReceiver = order.receiverId && order.receiverId._id === userInfo._id
      this.setData({
        order,
        isMyOrder,
        isReceiver
      })
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  processOrderData(order) {
    if (!order) return order
    return {
      ...order,
      publisherName: order.publisherId ? order.publisherId.name : '未知',
      publisherPhone: order.publisherId ? order.publisherId.phone : '',
      receiverName: order.receiverId ? order.receiverId.name : '',
      receiverPhone: order.receiverId ? order.receiverId.phone : ''
    }
  },

  async loadMyOrders() {
    this.setData({ loading: true })
    try {
      const res = await api.get('/orders/my', { type: this.data.orderType })
      const orders = (res.orders || []).map(o => this.processOrderData(o))
      this.setData({ orders, loading: false })
    } catch (err) {
      this.setData({ loading: false })
    }
  },

  switchType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ orderType: type, orders: [] }, () => this.loadMyOrders())
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/order/order?id=${id}` })
  },

  async handleAccept() {
    wx.showModal({
      title: '确认接单',
      content: '确定要接这个订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.post(`/orders/${this.data.order._id}/accept`)
            wx.showToast({ title: '接单成功' })
            this.loadOrderDetail(this.data.order._id)
          } catch (err) {
            wx.showToast({ title: err.message || '接单失败', icon: 'none' })
          }
        }
      }
    })
  },

  async handleCancel() {
    wx.showModal({
      title: '取消订单',
      content: '确定要取消这个订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.post(`/orders/${this.data.order._id}/status`, { status: 'cancelled' })
            wx.showToast({ title: '已取消' })
            this.loadOrderDetail(this.data.order._id)
          } catch (err) {
            wx.showToast({ title: err.message || '取消失败', icon: 'none' })
          }
        }
      }
    })
  },

  async handleStartProcessing() {
    try {
      await api.post(`/orders/${this.data.order._id}/status`, { status: 'processing' })
      wx.showToast({ title: '已开始处理' })
      this.loadOrderDetail(this.data.order._id)
    } catch (err) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' })
    }
  },

  async handleComplete() {
    try {
      await api.post(`/orders/${this.data.order._id}/status`, { status: 'completed' })
      wx.showToast({ title: '已完成' })
      this.loadOrderDetail(this.data.order._id)
    } catch (err) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' })
    }
  },

  handleContact() {
    const { order } = this.data
    const userInfo = wx.getStorageSync('userInfo')
    const isPublisher = order.publisherId && order.publisherId._id === userInfo._id
    const phone = isPublisher ? order.receiverPhone : order.publisherPhone
    if (phone) {
      wx.makePhoneCall({ phoneNumber: phone })
    } else {
      wx.showToast({ title: '暂无联系方式', icon: 'none' })
    }
  },

  formatTime(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hour = date.getHours().toString().padStart(2, '0')
    const min = date.getMinutes().toString().padStart(2, '0')
    return `${month}-${day} ${hour}:${min}`
  }
})
