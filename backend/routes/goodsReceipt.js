const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const StockMovement = require('../models/StockMovement');

// Process goods receipt and update inventory
router.post('/', async (req, res) => {
  try {
    const { items, receiptDate, notes } = req.body;

    for (const item of items) {
      const { inventoryItemId, quantity, batchNumber, shelfLocation, expiryDate } = item;

      // Update or create inventory item
      let inventoryItem = await Inventory.findById(inventoryItemId);
      if (inventoryItem) {
        inventoryItem.quantity += quantity;
        inventoryItem.batchNumber = batchNumber || inventoryItem.batchNumber;
        inventoryItem.shelfLocation = shelfLocation || inventoryItem.shelfLocation;
        inventoryItem.expiryDate = expiryDate || inventoryItem.expiryDate;
        await inventoryItem.save();
      } else {
        inventoryItem = new Inventory({
          _id: inventoryItemId,
          quantity,
          batchNumber,
          shelfLocation,
          expiryDate
        });
        await inventoryItem.save();
      }

      // Record stock movement
      const stockMovement = new StockMovement({
        inventoryItem: inventoryItem._id,
        movementType: 'IN',
        quantity,
        date: receiptDate || new Date(),
        notes
      });
      await stockMovement.save();
    }

    res.status(201).json({ message: 'Goods receipt processed successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
