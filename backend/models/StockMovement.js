const mongoose = require('mongoose');

const StockMovementSchema = new mongoose.Schema({
  inventoryItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
  movementType: { type: String, enum: ['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER'], required: true },
  quantity: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  notes: { type: String },
  fromLocation: { type: String },
  toLocation: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('StockMovement', StockMovementSchema);
