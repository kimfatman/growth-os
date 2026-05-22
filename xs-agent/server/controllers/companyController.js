const Company = require('../models/Company')
const User = require('../models/User')

exports.createCompany = async (req, res) => {
  try {
    const { name, city, description, contactPhone } = req.body
    const company = await Company.create({ name, city, description, contactPhone, members: [req.user._id] })
    req.user.companyId = company._id
    req.user.role = 'company_admin'
    await req.user.save()
    res.status(201).json({ company })
  } catch (error) {
    res.status(500).json({ message: '创建公司失败', error: error.message })
  }
}

exports.getCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).populate('members', 'name phone avatar role tags')
    if (!company) {
      return res.status(404).json({ message: '公司不存在' })
    }
    res.json({ company })
  } catch (error) {
    res.status(500).json({ message: '获取公司信息失败', error: error.message })
  }
}

exports.getMyCompany = async (req, res) => {
  try {
    if (!req.user.companyId) {
      return res.status(400).json({ message: '您不属于任何公司' })
    }
    const company = await Company.findById(req.user.companyId).populate('members', 'name phone avatar role tags city')
    res.json({ company })
  } catch (error) {
    res.status(500).json({ message: '获取公司信息失败', error: error.message })
  }
}

exports.addMember = async (req, res) => {
  try {
    const { userId } = req.body
    const company = await Company.findById(req.user.companyId)
    if (!company) {
      return res.status(404).json({ message: '公司不存在' })
    }
    if (company.members.includes(userId)) {
      return res.status(400).json({ message: '该用户已是公司成员' })
    }
    company.members.push(userId)
    await company.save()
    await User.findByIdAndUpdate(userId, { companyId: company._id, role: 'staff' })
    res.json({ company })
  } catch (error) {
    res.status(500).json({ message: '添加成员失败', error: error.message })
  }
}

exports.removeMember = async (req, res) => {
  try {
    const { userId } = req.params
    const company = await Company.findById(req.user.companyId)
    if (!company) {
      return res.status(404).json({ message: '公司不存在' })
    }
    company.members = company.members.filter(m => m.toString() !== userId)
    await company.save()
    await User.findByIdAndUpdate(userId, { companyId: null, role: 'user' })
    res.json({ company })
  } catch (error) {
    res.status(500).json({ message: '移除成员失败', error: error.message })
  }
}

exports.getCompanyMembers = async (req, res) => {
  try {
    if (!req.user.companyId) {
      return res.status(400).json({ message: '您不属于任何公司' })
    }
    const members = await User.find({ companyId: req.user.companyId }).select('name phone avatar role tags city')
    res.json({ members })
  } catch (error) {
    res.status(500).json({ message: '获取成员列表失败', error: error.message })
  }
}
