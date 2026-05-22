const Review = require('../models/Review')
const Order = require('../models/Order')
const User = require('../models/User')

exports.createReview = async (req, res) => {
  try {
    const { orderId, toUser, score, content } = req.body
    if (!orderId || !toUser || !score) {
      return res.status(400).json({ message: '订单ID、评价对象和分数为必填项' })
    }
    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).json({ message: '订单不存在' })
    }
    if (order.status !== 'completed') {
      return res.status(400).json({ message: '只能对已完成订单进行评价' })
    }
    const existing = await Review.findOne({ orderId, fromUser: req.user._id })
    if (existing) {
      return res.status(400).json({ message: '您已评价过此订单' })
    }
    const review = await Review.create({ orderId, fromUser: req.user._id, toUser, score, content })
    const reviews = await Review.find({ toUser })
    const avgScore = reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length
    await User.findByIdAndUpdate(toUser, { rating: Math.round(avgScore * 10) / 10 })
    res.status(201).json({ review })
  } catch (error) {
    res.status(500).json({ message: '评价失败', error: error.message })
  }
}

exports.getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ toUser: req.params.userId })
      .populate('fromUser', 'name avatar')
      .populate('orderId', 'title')
      .sort({ createdAt: -1 })
    res.json({ reviews })
  } catch (error) {
    res.status(500).json({ message: '获取评价失败', error: error.message })
  }
}
