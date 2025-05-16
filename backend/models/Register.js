const mongoose = require('mongoose');

const RegisterSchema = new mongoose.Schema({
  registerNumber: {
    type: String,
    required: true,
    unique: true
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'suspended'],
    default: 'closed'
  },
  currentOperator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  openingBalance: {
    type: Number,
    required: true,
    default: 0
  },
  currentBalance: {
    type: Number,
    required: true,
    default: 0
  },
  transactions: [{
    type: {
      type: String,
      enum: ['sale', 'refund', 'cash_in', 'cash_out', 'adjustment'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'mobile_money', 'insurance']
    },
    reference: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'transactions.referenceModel'
    },
    referenceModel: {
      type: String,
      enum: ['Sale', 'Refund']
    },
    notes: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  shiftLog: [{
    operator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    action: {
      type: String,
      enum: ['open', 'close', 'suspend'],
      required: true
    },
    balance: {
      type: Number,
      required: true
    },
    cashCount: {
      notes: [{
        denomination: Number,
        count: Number,
        total: Number
      }],
      coins: [{
        denomination: Number,
        count: Number,
        total: Number
      }],
      total: Number
    },
    cardPayments: {
      type: Number,
      default: 0
    },
    mobileMoneyPayments: {
      type: Number,
      default: 0
    },
    insurancePayments: {
      type: Number,
      default: 0
    },
    discrepancy: {
      type: Number,
      default: 0
    },
    notes: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  lastClosingBalance: {
    type: Number,
    default: 0
  },
  lastClosingTime: Date
}, {
  timestamps: true
});

// Generate register number before saving
RegisterSchema.pre('save', async function(next) {
  if (this.isNew) {
    const store = await mongoose.model('Store').findById(this.store);
    const count = await mongoose.model('Register').countDocuments({ store: this.store });
    this.registerNumber = `${store.name.substring(0, 3).toUpperCase()}-R${(count + 1).toString().padStart(3, '0')}`;
  }
  next();
});

// Update current balance when transactions are added
RegisterSchema.pre('save', function(next) {
  if (this.isModified('transactions')) {
    const lastTransaction = this.transactions[this.transactions.length - 1];
    if (lastTransaction) {
      if (['sale', 'cash_in'].includes(lastTransaction.type)) {
        this.currentBalance += lastTransaction.amount;
      } else if (['refund', 'cash_out'].includes(lastTransaction.type)) {
        this.currentBalance -= lastTransaction.amount;
      }
    }
  }
  next();
});

module.exports = mongoose.model('Register', RegisterSchema);
