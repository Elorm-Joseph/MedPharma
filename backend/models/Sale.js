const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  saleDate: { type: Date, required: true, default: Date.now },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true
    },
    quantity: { type: Number, required: true },
    price: {
      amount: { type: Number, required: true },
      currency: { type: String, default: 'GHS', enum: ['GHS'] }
    },
    discount: { type: Number, default: 0 }
  }],
  totalAmount: {
    amount: { type: Number, required: true },
    currency: { type: String, default: 'GHS', enum: ['GHS'] }
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cash', 'card', 'mobile_money', 'insurance']
  },
  insurance: {
    provider: String,
    policyNumber: String
  },
  cashier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  }
}, { timestamps: true });

module.exports = mongoose.model('Sale', SaleSchema);
