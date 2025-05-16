const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const AlertLog = require('../models/AlertLog');

// Check for low stock and expired products and create alerts
router.get('/check', async (req, res) => {
  try {
    const lowStockThreshold = 50; // Example threshold
    const today = new Date();

    const lowStockItems = await Inventory.find({ quantity: { $lt: lowStockThreshold } });
    const expiredItems = await Inventory.find({ expiryDate: { $lt: today } });

    // Log alerts
    for (const item of lowStockItems) {
      await AlertLog.create({
        type: 'Low Stock',
        message: `Low stock alert for ${item.name}, quantity: ${item.quantity}`,
        date: new Date()
      });
    }

    for (const item of expiredItems) {
      await AlertLog.create({
        type: 'Expired Stock',
        message: `Expired stock alert for ${item.name}, expiry date: ${item.expiryDate.toISOString().split('T')[0]}`,
        date: new Date()
      });
    }

    res.json({
      lowStockItems,
      expiredItems,
      message: 'Alerts checked and logged'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
