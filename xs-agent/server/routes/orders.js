const express = require('express')
const router = express.Router()
const {
  createOrder, getOrders, getOrderById,
  acceptOrder, updateOrderStatus, getMyOrders
} = require('../controllers/orderController')
const { auth, authorize } = require('../middleware/auth')

router.post('/', auth, createOrder)
router.get('/', auth, getOrders)
router.get('/my', auth, getMyOrders)
router.get('/:id', auth, getOrderById)
router.post('/:id/accept', auth, acceptOrder)
router.post('/:id/status', auth, updateOrderStatus)

module.exports = router
