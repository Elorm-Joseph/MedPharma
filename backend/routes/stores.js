const express = require('express');
const router = express.Router();
const Store = require('../models/Store');
const StockTake = require('../models/StockTake');
const Inventory = require('../models/Inventory');

// Create new store
router.post('/', async (req, res) => {
  try {
    const store = new Store(req.body);
    await store.save();
    res.status(201).json(store);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all stores
router.get('/', async (req, res) => {
  try {
    const stores = await Store.find()
      .populate('manager', 'firstName lastName')
      .populate('inventory.item');
    res.json(stores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get store by ID
router.get('/:id', async (req, res) => {
  try {
    const store = await Store.findById(req.params.id)
      .populate('manager', 'firstName lastName')
      .populate('inventory.item');
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    res.json(store);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update store inventory
router.put('/:id/inventory', async (req, res) => {
  try {
    const { itemId, quantity, minThreshold, maxThreshold, shelfLocation } = req.body;
    const store = await Store.findById(req.params.id);
    
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const inventoryIndex = store.inventory.findIndex(
      item => item.item.toString() === itemId
    );

    if (inventoryIndex > -1) {
      store.inventory[inventoryIndex] = {
        ...store.inventory[inventoryIndex],
        quantity,
        minThreshold,
        maxThreshold,
        shelfLocation
      };
    } else {
      store.inventory.push({
        item: itemId,
        quantity,
        minThreshold,
        maxThreshold,
        shelfLocation
      });
    }

    await store.save();
    res.json(store);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Start stock take
router.post('/:id/stocktake', async (req, res) => {
  try {
    const store = await Store.findById(req.params.id)
      .populate('inventory.item');
    
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const stockTake = new StockTake({
      store: store._id,
      startDate: new Date(),
      conductedBy: req.body.userId, // From auth middleware
      items: store.inventory.map(item => ({
        inventory: item.item._id,
        expectedQuantity: item.quantity
      }))
    });

    await stockTake.save();
    res.status(201).json(stockTake);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update stock take counts
router.put('/stocktake/:id', async (req, res) => {
  try {
    const { items } = req.body;
    const stockTake = await StockTake.findById(req.params.id);
    
    if (!stockTake) {
      return res.status(404).json({ error: 'Stock take not found' });
    }

    items.forEach(updateItem => {
      const item = stockTake.items.find(
        i => i.inventory.toString() === updateItem.inventoryId
      );
      if (item) {
        item.actualQuantity = updateItem.actualQuantity;
        item.notes = updateItem.notes;
        item.status = 'counted';
      }
    });

    await stockTake.save();
    res.json(stockTake);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Complete stock take
router.put('/stocktake/:id/complete', async (req, res) => {
  try {
    const stockTake = await StockTake.findById(req.params.id);
    
    if (!stockTake) {
      return res.status(404).json({ error: 'Stock take not found' });
    }

    stockTake.status = 'completed';
    stockTake.endDate = new Date();
    stockTake.verifiedBy = req.body.userId; // From auth middleware
    stockTake.verificationDate = new Date();
    
    // Update store inventory quantities
    const store = await Store.findById(stockTake.store);
    stockTake.items.forEach(item => {
      if (item.actualQuantity !== undefined) {
        const storeItem = store.inventory.find(
          i => i.item.toString() === item.inventory.toString()
        );
        if (storeItem) {
          storeItem.quantity = item.actualQuantity;
        }
      }
    });

    await Promise.all([
      stockTake.save(),
      store.save()
    ]);

    res.json(stockTake);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get store statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const stats = {
      totalItems: store.inventory.length,
      lowStockItems: store.inventory.filter(item => 
        item.quantity <= item.minThreshold
      ).length,
      overStockItems: store.inventory.filter(item => 
        item.quantity >= item.maxThreshold
      ).length,
      lastStockTake: store.lastStockTake
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
