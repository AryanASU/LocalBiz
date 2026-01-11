const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  name: { type: String, default: 'Anonymous' },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const BusinessSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: String,
  description: String,
  address: {
    street: String, city: String, state: String, zip: String, country: String
  },
  location: { // GeoJSON Point: [lon, lat]
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [lon, lat]
  },
  phone: String,
  website: String,
  createdAt: { type: Date, default: Date.now },

  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: false },

  // Social fields
  comments: { type: [CommentSchema], default: [] },
  likesCount: { type: Number, default: 0 },
  // store IPs that liked this business to prevent double-likes without auth (demo only)
  likedIps: { type: [String], default: [] }
});

BusinessSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Business', BusinessSchema);
