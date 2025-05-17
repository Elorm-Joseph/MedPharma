const mongoose = require('mongoose');

const GoodsReceiptSchema = new mongoose.Schema({
  purchaseOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder',
    required: true
  },
  receiptDate: { type: Date, required: true },
  invoiceNumber: { type: String, required: true },
  items: [{
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true
    },
    quantity: { type: Number, required: true },
    batchNumber: { type: String, required: true },
    expiryDate: { type: Date, required: true },
    manufacturingDate: { type: Date },
    price: {
      amount: { type: Number, required: true },
      currency: { type: String, default: 'GHS', enum: ['GHS'] }
    }
  }],
  notes: String,
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED'],
    default: 'PENDING'
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  }
}, { timestamps: true });

// Add index for invoice number search
GoodsReceiptSchema.index({ invoiceNumber: 1 });

module.exports = mongoose.model('GoodsReceipt', GoodsReceiptSchema);
