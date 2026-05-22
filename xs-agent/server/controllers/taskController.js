const Task = require('../models/Task')
const Order = require('../models/Order')

exports.createTask = async (req, res) => {
  try {
    const { orderId, assigneeId, title, description, deadline } = req.body
    if (!orderId || !assigneeId || !title) {
      return res.status(400).json({ message: '订单ID、负责人和任务标题为必填项' })
    }
    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).json({ message: '订单不存在' })
    }
    const task = await Task.create({
      orderId, assigneeId, assignerId: req.user._id,
      title, description, deadline
    })
    res.status(201).json({ task })
  } catch (error) {
    res.status(500).json({ message: '创建任务失败', error: error.message })
  }
}

exports.getTasks = async (req, res) => {
  try {
    const { orderId, status } = req.query
    const query = {}
    if (orderId) query.orderId = orderId
    if (status) query.status = status
    if (req.user.role === 'staff') {
      query.assigneeId = req.user._id
    }
    const tasks = await Task.find(query)
      .populate('assigneeId', 'name avatar')
      .populate('assignerId', 'name avatar')
      .populate('orderId', 'title price')
      .sort({ createdAt: -1 })
    res.json({ tasks })
  } catch (error) {
    res.status(500).json({ message: '获取任务列表失败', error: error.message })
  }
}

exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ['processing', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: '无效的状态' })
    }
    const task = await Task.findById(req.params.id)
    if (!task) {
      return res.status(404).json({ message: '任务不存在' })
    }
    const isAssignee = task.assigneeId.toString() === req.user._id.toString()
    const isAssigner = task.assignerId.toString() === req.user._id.toString()
    if (!isAssignee && !isAssigner && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权修改此任务' })
    }
    task.status = status
    await task.save()
    res.json({ task })
  } catch (error) {
    res.status(500).json({ message: '更新任务状态失败', error: error.message })
  }
}

exports.getCompanyTasks = async (req, res) => {
  try {
    if (!req.user.companyId) {
      return res.status(400).json({ message: '您不属于任何公司' })
    }
    const tasks = await Task.find()
      .populate({
        path: 'assigneeId',
        match: { companyId: req.user.companyId },
        select: 'name avatar'
      })
      .populate('assignerId', 'name avatar')
      .populate('orderId', 'title price')
      .sort({ createdAt: -1 })
    const filtered = tasks.filter(t => t.assigneeId != null)
    res.json({ tasks: filtered })
  } catch (error) {
    res.status(500).json({ message: '获取公司任务失败', error: error.message })
  }
}
