const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');

// Search inventory
router.get('/search', async (req, res) => {
  try {
    const { query, category, availability } = req.query;
    
    // Build search criteria
    let searchCriteria = {};
    
    if (query) {
      searchCriteria.name = { $regex: query, $options: 'i' };
    }
    
    if (category) {
      searchCriteria.category = category;
    }
    
    if (availability) {
      switch (availability) {
        case 'inStock':
          searchCriteria.quantity = { $gt: 10 };
          break;
        case 'lowStock':
          searchCriteria.quantity = { $gt: 0, $lte: 10 };
          break;
        case 'outOfStock':
          searchCriteria.quantity = { $lte: 0 };
          break;
      }
    }

    const items = await Inventory.find(searchCriteria)
      .sort({ name: 1 });

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get inventory item details
router.get('/:id', async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update inventory item stock
router.put('/:id/stock', async (req, res) => {
  try {
    const { quantity } = req.body;
    const item = await Inventory.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    item.quantity = quantity;
    await item.save();

    res.json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get inventory statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalItems = await Inventory.countDocuments();
    const lowStockItems = await Inventory.countDocuments({ quantity: { $gt: 0, $lte: 10 } });
    const outOfStockItems = await Inventory.countDocuments({ quantity: { $lte: 0 } });
    const expiringItems = await Inventory.countDocuments({
      expiryDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
      }
    });

    res.json({
      totalItems,
      lowStockItems,
      outOfStockItems,
      expiringItems
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
