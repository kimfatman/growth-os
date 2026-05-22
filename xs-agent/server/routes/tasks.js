const express = require('express')
const router = express.Router()
const { createTask, getTasks, updateTaskStatus, getCompanyTasks } = require('../controllers/taskController')
const { auth } = require('../middleware/auth')

router.post('/', auth, createTask)
router.get('/', auth, getTasks)
router.get('/company', auth, getCompanyTasks)
router.post('/:id/status', auth, updateTaskStatus)

module.exports = router
