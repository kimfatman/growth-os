const express = require('express')
const router = express.Router()
const {
  createCompany, getCompany, getMyCompany,
  addMember, removeMember, getCompanyMembers
} = require('../controllers/companyController')
const { auth, authorize } = require('../middleware/auth')

router.post('/', auth, createCompany)
router.get('/my', auth, getMyCompany)
router.get('/:id/members', auth, getCompanyMembers)
router.get('/:id', auth, getCompany)
router.post('/members', auth, authorize('admin', 'company_admin'), addMember)
router.delete('/members/:userId', auth, authorize('admin', 'company_admin'), removeMember)

module.exports = router
