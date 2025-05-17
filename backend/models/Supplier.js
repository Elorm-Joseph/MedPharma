const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactPerson: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['pharmaceuticals', 'medical_supplies', 'equipment', 'general', 'local_manufacturer', 'distributor', 'wholesaler']
  },
  paymentTerms: { type: Number, default: 30 },
  performance: {
    rating: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    onTimeDelivery: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Supplier', SupplierSchema);
