const mongoose = require('mongoose');

const PrescriptionSchema = new mongoose.Schema({
  patient: {
    name: { type: String, required: true },
    age: { type: Number },
    gender: { type: String },
    contact: { type: String },
    address: { type: String }
  },
  doctor: {
    name: { type: String, required: true },
    contact: { type: String },
    hospital: { type: String }
  },
  medications: [{
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    quantity: { type: Number, required: true },
    instructions: { type: String }
  }],
  prescriptionDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['pending', 'dispensed', 'partially_dispensed', 'cancelled'],
    default: 'pending'
  },
  dispensedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dispensedDate: { type: Date },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Prescription', PrescriptionSchema);
