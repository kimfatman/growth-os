const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  industry: { type: String, required: true },
  city: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'processing', 'completed', 'cancelled'],
    default: 'pending'
  },
  publisherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  contactPhone: { type: String, default: '' },
  tags: [{ type: String }]
}, { timestamps: true })

module.exports = mongoose.model('Order', orderSchema)
