const jwt = require('jsonwebtoken')
const config = require('../config')
const User = require('../models/User')

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: '未登录，请先登录' })
    }
    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, config.jwtSecret)
    const user = await User.findById(decoded.id)
    if (!user) {
      return res.status(401).json({ message: '用户不存在' })
    }
    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ message: 'token 无效或已过期' })
  }
}

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: '无权限执行此操作' })
    }
    next()
  }
}

module.exports = { auth, authorize }
