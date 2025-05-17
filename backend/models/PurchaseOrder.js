const mongoose = require('mongoose');

const PurchaseOrderSchema = new mongoose.Schema({
  supplier: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  orderDate: { type: Date, required: true },
  expectedDeliveryDate: { type: Date, required: true },
  status: { 
    type: String, 
    required: true,
    enum: ['PENDING', 'APPROVED', 'RECEIVED', 'CANCELLED'],
    default: 'PENDING'
  },
  items: [{
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true
    },
    quantity: { type: Number, required: true },
    price: {
      amount: { type: Number, required: true },
      currency: { type: String, default: 'GHS', enum: ['GHS'] }
    }
  }],
  totalAmount: {
    amount: { type: Number, required: true },
    currency: { type: String, default: 'GHS', enum: ['GHS'] }
  }
}, { timestamps: true });

module.exports = mongoose.model('PurchaseOrder', PurchaseOrderSchema);
