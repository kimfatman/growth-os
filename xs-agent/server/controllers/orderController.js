const Order = require('../models/Order')
const User = require('../models/User')

exports.createOrder = async (req, res) => {
  try {
    const { title, description, price, industry, city, contactPhone, tags } = req.body
    if (!title || !price || !industry) {
      return res.status(400).json({ message: '标题、价格和行业为必填项' })
    }
    const order = await Order.create({
      title, description, price, industry, city,
      contactPhone: contactPhone || req.user.phone,
      tags, publisherId: req.user._id
    })
    res.status(201).json({ order })
  } catch (error) {
    res.status(500).json({ message: '发布订单失败', error: error.message })
  }
}

exports.getOrders = async (req, res) => {
  try {
    const { status, industry, city, minPrice, maxPrice, search, page = 1, limit = 20 } = req.query
    const query = {}
    if (status) query.status = status
    if (industry) query.industry = industry
    if (city) query.city = city
    if (minPrice || maxPrice) {
      query.price = {}
      if (minPrice) query.price.$gte = Number(minPrice)
      if (maxPrice) query.price.$lte = Number(maxPrice)
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }
    const skip = (Number(page) - 1) * Number(limit)
    const orders = await Order.find(query)
      .populate('publisherId', 'name companyId city avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
    const total = await Order.countDocuments(query)
    res.json({ orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) })
  } catch (error) {
    res.status(500).json({ message: '获取订单列表失败', error: error.message })
  }
}

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('publisherId', 'name companyId city avatar phone')
      .populate('receiverId', 'name companyId city avatar phone')
    if (!order) {
      return res.status(404).json({ message: '订单不存在' })
    }
    res.json({ order })
  } catch (error) {
    res.status(500).json({ message: '获取订单详情失败', error: error.message })
  }
}

exports.acceptOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) {
      return res.status(404).json({ message: '订单不存在' })
    }
    if (order.status !== 'pending') {
      return res.status(400).json({ message: '该订单已被接单' })
    }
    if (order.publisherId.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: '不能接自己的订单' })
    }
    order.receiverId = req.user._id
    order.status = 'accepted'
    await order.save()
    await User.findByIdAndUpdate(req.user._id, { $inc: { orderCount: 1 } })
    res.json({ order })
  } catch (error) {
    res.status(500).json({ message: '接单失败', error: error.message })
  }
}

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ['processing', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: '无效的状态' })
    }
    const order = await Order.findById(req.params.id)
    if (!order) {
      return res.status(404).json({ message: '订单不存在' })
    }
    const isPublisher = order.publisherId.toString() === req.user._id.toString()
    const isReceiver = order.receiverId && order.receiverId.toString() === req.user._id.toString()
    if (!isPublisher && !isReceiver) {
      return res.status(403).json({ message: '无权修改此订单状态' })
    }
    if (status === 'cancelled' && !isPublisher) {
      return res.status(403).json({ message: '只有发布者才能取消订单' })
    }
    order.status = status
    await order.save()
    res.json({ order })
  } catch (error) {
    res.status(500).json({ message: '更新状态失败', error: error.message })
  }
}

exports.getMyOrders = async (req, res) => {
  try {
    const { type = 'published' } = req.query
    let query = {}
    if (type === 'published') {
      query.publisherId = req.user._id
    } else {
      query.receiverId = req.user._id
    }
    const orders = await Order.find(query)
      .populate('publisherId', 'name companyId avatar')
      .populate('receiverId', 'name companyId avatar')
      .sort({ createdAt: -1 })
    res.json({ orders })
  } catch (error) {
    res.status(500).json({ message: '获取订单失败', error: error.message })
  }
}
