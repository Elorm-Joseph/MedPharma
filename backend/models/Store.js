const mongoose = require('mongoose');

const StoreSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  location: {
    type: String,
    required: true
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  inventory: [{
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory'
    },
    quantity: {
      type: Number,
      default: 0
    },
    minThreshold: {
      type: Number,
      default: 10
    },
    maxThreshold: {
      type: Number,
      default: 100
    },
    shelfLocation: String
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  lastStockTake: {
    date: Date,
    conductedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Store', StoreSchema);
