const jwt = require('jsonwebtoken')
const User = require('../models/User')
const config = require('../config')

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwtSecret, { expiresIn: config.jwtExpire })
}

exports.register = async (req, res) => {
  try {
    const { name, phone, password, city, tags, businessTypes } = req.body
    const existing = await User.findOne({ phone })
    if (existing) {
      return res.status(400).json({ message: '该手机号已注册' })
    }
    const user = await User.create({ name, phone, password, city, tags, businessTypes })
    const token = generateToken(user._id)
    res.status(201).json({ token, user })
  } catch (error) {
    res.status(500).json({ message: '注册失败', error: error.message })
  }
}

exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body
    const user = await User.findOne({ phone })
    if (!user) {
      return res.status(400).json({ message: '手机号未注册' })
    }
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(400).json({ message: '密码错误' })
    }
    const token = generateToken(user._id)
    res.json({ token, user })
  } catch (error) {
    res.status(500).json({ message: '登录失败', error: error.message })
  }
}

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('companyId')
    res.json({ user })
  } catch (error) {
    res.status(500).json({ message: '获取用户信息失败', error: error.message })
  }
}

exports.updateProfile = async (req, res) => {
  try {
    const { name, city, tags, businessTypes, avatar } = req.body
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { name, city, tags, businessTypes, avatar } },
      { new: true }
    )
    res.json({ user })
  } catch (error) {
    res.status(500).json({ message: '更新失败', error: error.message })
  }
}
