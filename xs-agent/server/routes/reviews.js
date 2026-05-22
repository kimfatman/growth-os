const express = require('express')
const router = express.Router()
const { createReview, getUserReviews } = require('../controllers/reviewController')
const { auth } = require('../middleware/auth')

router.post('/', auth, createReview)
router.get('/user/:userId', auth, getUserReviews)

module.exports = router
