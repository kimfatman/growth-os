const mongoose = require('mongoose')

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  license: { type: String, default: '' },
  city: { type: String, default: '' },
  rating: { type: Number, default: 0 },
  description: { type: String, default: '' },
  contactPhone: { type: String, default: '' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true })

module.exports = mongoose.model('Company', companySchema)
