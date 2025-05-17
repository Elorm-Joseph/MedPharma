const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { 
    amount: { type: Number, required: true },
    currency: { type: String, default: 'GHS', enum: ['GHS'] }
  },
  batchNumber: { type: String, required: true },
  shelfLocation: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  ndcCode: { type: String },
  therapeuticCategory: { type: String },
  reorderPoint: { type: Number, default: 10 },
  maxStock: { type: Number },
  batchDetails: [{
    batchNumber: String,
    quantity: Number,
    expiryDate: Date,
    manufacturingDate: Date
  }]
}, { timestamps: true });

// Virtual for formatted price
InventorySchema.virtual('formattedPrice').get(function() {
  return `₵${this.price.amount.toFixed(2)}`;
});

// Index for improved search performance
InventorySchema.index({ name: 'text', ndcCode: 'text', therapeuticCategory: 'text' });

module.exports = mongoose.model('Inventory', InventorySchema);
