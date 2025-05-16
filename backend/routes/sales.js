const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Inventory = require('../models/Inventory');
const Register = require('../models/Register');

// Create a new sale
router.post('/', async (req, res) => {
  try {
    const { store, cashier, items, customer, prescription, paymentMethod, registerId } = req.body;

    // Calculate subtotal, tax, discount, total
    let subtotal = 0;
    let tax = 0;
    let discount = 0;

    for (const item of items) {
      subtotal += item.unitPrice * item.quantity;
      discount += item.discount || 0;
    }

    tax = subtotal * 0.12; // Assuming 12% tax rate
    const total = subtotal + tax - discount;

    // Create sale document
    const sale = new Sale({
      store,
      cashier,
      items,
      customer,
      prescription,
      subtotal,
      tax,
      discount,
      total,
      paymentMethod,
      paymentStatus: 'completed',
      register: registerId
    });

    await sale.save();

    // Update inventory quantities
    for (const item of items) {
      const inventoryItem = await Inventory.findById(item.product);
      if (inventoryItem) {
        inventoryItem.quantity -= item.quantity;
        await inventoryItem.save();
      }
    }

    // Update register transactions
    const register = await Register.findById(registerId);
    if (register) {
      register.transactions.push({
        type: 'sale',
        amount: total,
        paymentMethod,
        reference: sale._id,
        referenceModel: 'Sale',
        timestamp: new Date()
      });
      register.currentBalance += total;
      await register.save();
    }

    res.status(201).json(sale);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get sales with optional filters
router.get('/', async (req, res) => {
  try {
    const { store, startDate, endDate, cashier } = req.query;
    let query = {};

    if (store) query.store = store;
    if (cashier) query.cashier = cashier;
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const sales = await Sale.find(query)
      .populate('store')
      .populate('cashier', 'firstName lastName')
      .populate('items.product')
      .populate('customer')
      .populate('prescription')
      .sort({ createdAt: -1 });

    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get today's sales stats
router.get('/stats/today', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const sales = await Sale.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      paymentStatus: 'completed'
    });

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalSales = sales.length;

    res.json({ totalRevenue, totalSales });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
