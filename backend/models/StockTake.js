const mongoose = require('mongoose');

const StockTakeSchema = new mongoose.Schema({
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'cancelled'],
    default: 'in_progress'
  },
  conductedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    inventory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true
    },
    expectedQuantity: {
      type: Number,
      required: true
    },
    actualQuantity: {
      type: Number
    },
    discrepancy: {
      type: Number
    },
    notes: String,
    status: {
      type: String,
      enum: ['pending', 'counted', 'verified'],
      default: 'pending'
    }
  }],
  summary: {
    totalItems: Number,
    itemsCounted: Number,
    itemsWithDiscrepancy: Number,
    totalDiscrepancy: Number
  },
  notes: String,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verificationDate: Date
}, { timestamps: true });

// Calculate discrepancy when actual quantity is set
StockTakeSchema.pre('save', function(next) {
  this.items.forEach(item => {
    if (item.actualQuantity !== undefined) {
      item.discrepancy = item.actualQuantity - item.expectedQuantity;
    }
  });

  if (this.status === 'completed') {
    let itemsCounted = 0;
    let itemsWithDiscrepancy = 0;
    let totalDiscrepancy = 0;

    this.items.forEach(item => {
      if (item.actualQuantity !== undefined) {
        itemsCounted++;
        if (item.discrepancy !== 0) {
          itemsWithDiscrepancy++;
          totalDiscrepancy += Math.abs(item.discrepancy);
        }
      }
    });

    this.summary = {
      totalItems: this.items.length,
      itemsCounted,
      itemsWithDiscrepancy,
      totalDiscrepancy
    };
  }

  next();
});

module.exports = mongoose.model('StockTake', StockTakeSchema);
