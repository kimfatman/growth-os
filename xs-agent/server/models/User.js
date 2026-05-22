const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  avatar: { type: String, default: '' },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
  role: {
    type: String,
    enum: ['admin', 'company_admin', 'staff', 'user'],
    default: 'user'
  },
  tags: [{ type: String }],
  city: { type: String, default: '' },
  businessTypes: [{ type: String }],
  rating: { type: Number, default: 0 },
  orderCount: { type: Number, default: 0 }
}, { timestamps: true })

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  return obj
}

module.exports = mongoose.model('User', userSchema)
