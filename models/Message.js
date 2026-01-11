// C:\LocalBiz\models\Message.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  from: { type: String, required: true }, // e.g. "Visitor", owner email, etc.
  text: { type: String, required: true, maxlength: 2000 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);
