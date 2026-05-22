const express = require('express')
const router = express.Router()
const { matchOrders, recommendUsers } = require('../controllers/matchController')
const { auth } = require('../middleware/auth')

router.get('/orders', auth, matchOrders)
router.get('/users/:orderId', auth, recommendUsers)

module.exports = router
