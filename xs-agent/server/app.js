const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const config = require('./config')

const authRoutes = require('./routes/auth')
const orderRoutes = require('./routes/orders')
const taskRoutes = require('./routes/tasks')
const companyRoutes = require('./routes/companies')
const reviewRoutes = require('./routes/reviews')
const matchRoutes = require('./routes/match')

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/auth', authRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/companies', companyRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/match', matchRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: '服务器内部错误', error: err.message })
})

mongoose.connect(config.mongoUri)
  .then(() => {
    console.log('MongoDB 连接成功')
    app.listen(config.port, () => {
      console.log(`服务器运行在 http://localhost:${config.port}`)
    })
  })
  .catch((err) => {
    console.error('MongoDB 连接失败:', err.message)
    process.exit(1)
  })

module.exports = app
