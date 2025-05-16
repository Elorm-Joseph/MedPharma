const express = require('express');
const router = express.Router();
const Register = require('../models/Register');

// Get active register for current store
router.get('/active', async (req, res) => {
  try {
    const register = await Register.findOne({
      store: req.query.storeId,
      status: 'open'
    }).populate('currentOperator', 'firstName lastName');

    if (!register) {
      return res.status(404).json({ error: 'No active register found' });
    }

    res.json(register);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Open register
router.post('/open', async (req, res) => {
  try {
    const { storeId, userId, openingBalance, notes } = req.body;

    // Check if there's already an open register
    const existingRegister = await Register.findOne({
      store: storeId,
      status: 'open'
    });

    if (existingRegister) {
      return res.status(400).json({ error: 'A register is already open in this store' });
    }

    const register = new Register({
      store: storeId,
      currentOperator: userId,
      openingBalance,
      currentBalance: openingBalance,
      status: 'open',
      shiftLog: [{
        operator: userId,
        action: 'open',
        balance: openingBalance,
        notes
      }]
    });

    await register.save();
    res.status(201).json(register);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Close register
router.post('/:id/close', async (req, res) => {
  try {
    const { userId, cashCount, notes } = req.body;
    const register = await Register.findById(req.params.id);

    if (!register) {
      return res.status(404).json({ error: 'Register not found' });
    }

    if (register.status !== 'open') {
      return res.status(400).json({ error: 'Register is not open' });
    }

    // Calculate totals from cash count
    const totalCash = cashCount.notes.reduce((sum, note) => sum + (note.denomination * note.count), 0) +
                     cashCount.coins.reduce((sum, coin) => sum + (coin.denomination * coin.count), 0);

    // Calculate discrepancy
    const discrepancy = totalCash - register.currentBalance;

    register.status = 'closed';
    register.lastClosingBalance = totalCash;
    register.lastClosingTime = new Date();
    register.shiftLog.push({
      operator: userId,
      action: 'close',
      balance: totalCash,
      cashCount,
      discrepancy,
      notes
    });

    await register.save();
    res.json(register);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get register history
router.get('/history', async (req, res) => {
  try {
    const { storeId, startDate, endDate } = req.query;
    let query = { store: storeId };

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const registers = await Register.find(query)
      .populate('currentOperator', 'firstName lastName')
      .populate('shiftLog.operator', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json(registers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get register summary
router.get('/:id/summary', async (req, res) => {
  try {
    const register = await Register.findById(req.params.id);
    if (!register) {
      return res.status(404).json({ error: 'Register not found' });
    }

    // Calculate payment method totals
    const paymentTotals = register.transactions.reduce((totals, transaction) => {
      if (transaction.type === 'sale' && transaction.paymentMethod) {
        totals[transaction.paymentMethod] = (totals[transaction.paymentMethod] || 0) + transaction.amount;
      }
      return totals;
    }, {});

    const summary = {
      openingBalance: register.openingBalance,
      currentBalance: register.currentBalance,
      totalTransactions: register.transactions.length,
      paymentTotals,
      lastTransaction: register.transactions[register.transactions.length - 1]
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
