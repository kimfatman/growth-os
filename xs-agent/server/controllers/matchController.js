const User = require('../models/User')
const Order = require('../models/Order')

exports.matchOrders = async (req, res) => {
  try {
    const userId = req.user._id
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: '用户不存在' })
    }
    const userTags = user.tags || []
    const userCity = user.city || ''
    const userBusinessTypes = user.businessTypes || []

    const pendingOrders = await Order.find({ status: 'pending' })
      .populate('publisherId', 'name companyId city avatar tags businessTypes')
      .sort({ createdAt: -1 })

    const scored = pendingOrders.map(order => {
      let score = 0
      const orderTags = order.tags || []
      const orderIndustry = order.industry || ''
      const orderCity = order.city || ''

      const commonTags = orderTags.filter(t => userTags.includes(t))
      score += commonTags.length * 3

      if (orderIndustry && userBusinessTypes.includes(orderIndustry)) {
        score += 5
      }

      if (orderCity && userCity && orderCity === userCity) {
        score += 2
      }

      if (order.publisherId && order.publisherId.city && userCity && order.publisherId.city === userCity) {
        score += 1
      }

      return {
        order,
        matchScore: score
      }
    })

    scored.sort((a, b) => b.matchScore - a.matchScore)
    const matched = scored.slice(0, 50)

    res.json({ matches: matched })
  } catch (error) {
    res.status(500).json({ message: '匹配失败', error: error.message })
  }
}

exports.recommendUsers = async (req, res) => {
  try {
    const { orderId } = req.params
    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).json({ message: '订单不存在' })
    }

    const orderIndustry = order.industry || ''
    const orderCity = order.city || ''
    const orderTags = order.tags || []

    const potentialUsers = await User.find({
      _id: { $ne: order.publisherId },
      role: { $in: ['company_admin', 'staff', 'user'] }
    }).select('name avatar city tags businessTypes rating orderCount companyId')

    const scored = potentialUsers.map(user => {
      let score = 0
      const userTags = user.tags || []
      const userBusinessTypes = user.businessTypes || []
      const userCity = user.city || ''

      const commonTags = orderTags.filter(t => userTags.includes(t))
      score += commonTags.length * 3

      if (orderIndustry && userBusinessTypes.includes(orderIndustry)) {
        score += 5
      }

      if (orderCity && userCity && orderCity === userCity) {
        score += 2
      }

      score += Math.min(user.rating || 0, 5)

      return {
        user,
        matchScore: score
      }
    })

    scored.sort((a, b) => b.matchScore - a.matchScore)
    const recommended = scored.slice(0, 20)

    res.json({ recommendations: recommended })
  } catch (error) {
    res.status(500).json({ message: '推荐失败', error: error.message })
  }
}
