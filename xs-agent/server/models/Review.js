const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score: { type: Number, required: true, min: 1, max: 5 },
  content: { type: String, default: '' }
}, { timestamps: true })

module.exports = mongoose.model('Review', reviewSchema)
