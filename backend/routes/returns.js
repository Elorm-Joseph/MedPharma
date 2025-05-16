const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Inventory = require('../models/Inventory');
const StockMovement = require('../models/StockMovement');

// Process a return/refund
router.post('/', async (req, res) => {
  try {
    const { saleId, items, reason } = req.body;

    // Find the sale
    const sale = await Sale.findById(saleId);
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    // Process each returned item
    for (const item of items) {
      const { inventoryItemId, quantity } = item;

      // Update inventory quantity
      const inventoryItem = await Inventory.findById(inventoryItemId);
      if (inventoryItem) {
        inventoryItem.quantity += quantity;
        await inventoryItem.save();
      }

      // Record stock movement for return
      const stockMovement = new StockMovement({
        inventoryItem: inventoryItemId,
        movementType: 'IN',
        quantity,
        notes: `Return processed for sale ${saleId}. Reason: ${reason}`
      });
      await stockMovement.save();
    }

    // Update sale record with return info
    sale.returns = sale.returns || [];
    sale.returns.push({ items, reason, date: new Date() });
    await sale.save();

    res.json({ message: 'Return processed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
