const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled'],
    default: 'pending'
  },
  deadline: { type: Date, default: null }
}, { timestamps: true })

module.exports = mongoose.model('Task', taskSchema)
