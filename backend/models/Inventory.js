const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  batchNumber: { type: String, required: true },
  shelfLocation: { type: String, required: true },
  expiryDate: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Inventory', InventorySchema);
