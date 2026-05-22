const { api } = require('../../utils/request')

Page({
  data: {
    company: null,
    showCreateForm: false,
    submitting: false,
    taskSubmitting: false,
    tasks: [],
    form: {
      name: '',
      city: '',
      description: '',
      contactPhone: ''
    },
    taskForm: {
      orderId: '',
      assigneeId: '',
      title: '',
      description: ''
    },
    roleMap: {
      admin: '管理员',
      company_admin: '管理员',
      staff: '员工',
      user: '用户'
    },
    taskStatusMap: {
      pending: '待处理',
      processing: '进行中',
      completed: '已完成',
      cancelled: '已取消'
    }
  },

  onShow() {
    this.loadCompany()
    this.loadTasks()
  },

  async loadCompany() {
    try {
      const res = await api.get('/companies/my')
      this.setData({ company: res.company, showCreateForm: false })
    } catch (err) {
      this.setData({ company: null })
    }
  },

  async loadTasks() {
    try {
      const res = await api.get('/tasks/company')
      this.setData({ tasks: res.tasks || [] })
    } catch (err) {
      // silently fail
    }
  },

  showCreate() {
    this.setData({ showCreateForm: true, form: { name: '', city: '', description: '', contactPhone: '' } })
  },

  hideCreate() {
    this.setData({ showCreateForm: false })
  },

  onFormInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`form.${field}`]: e.detail.value })
  },

  onTaskInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`taskForm.${field}`]: e.detail.value })
  },

  async handleCreateCompany() {
    if (!this.data.form.name) {
      wx.showToast({ title: '请输入公司名称', icon: 'none' })
      return
    }
    this.setData({ submitting: true })
    try {
      await api.post('/companies', this.data.form)
      wx.showToast({ title: '创建成功' })
      this.loadCompany()
    } catch (err) {
      wx.showToast({ title: err.message || '创建失败', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  },

  async handleCreateTask() {
    const { orderId, assigneeId, title } = this.data.taskForm
    if (!orderId || !assigneeId || !title) {
      wx.showToast({ title: '请填写必填项', icon: 'none' })
      return
    }
    this.setData({ taskSubmitting: true })
    try {
      await api.post('/tasks', this.data.taskForm)
      wx.showToast({ title: '派单成功' })
      this.setData({
        taskForm: { orderId: '', assigneeId: '', title: '', description: '' }
      })
      this.loadTasks()
    } catch (err) {
      wx.showToast({ title: err.message || '派单失败', icon: 'none' })
    } finally {
      this.setData({ taskSubmitting: false })
    }
  }
})
