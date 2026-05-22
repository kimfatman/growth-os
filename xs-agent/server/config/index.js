require('dotenv').config()

module.exports = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/tax-agent',
  jwtSecret: process.env.JWT_SECRET || 'tax-agent-secret-key-2024',
  jwtExpire: process.env.JWT_EXPIRE || '7d'
}
