const mongoose = require('mongoose');

const OwnerSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Owner', OwnerSchema);
