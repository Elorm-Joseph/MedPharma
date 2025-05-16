const express = require('express');
const router = express.Router();
const StockMovement = require('../models/StockMovement');

// Create a new stock movement
router.post('/', async (req, res) => {
  try {
    const stockMovement = new StockMovement(req.body);
    await stockMovement.save();
    res.status(201).json(stockMovement);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all stock movements
router.get('/', async (req, res) => {
  try {
    const stockMovements = await StockMovement.find().populate('inventoryItem');
    res.json(stockMovements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a stock movement by ID
router.get('/:id', async (req, res) => {
  try {
    const stockMovement = await StockMovement.findById(req.params.id).populate('inventoryItem');
    if (!stockMovement) {
      return res.status(404).json({ error: 'Stock movement not found' });
    }
    res.json(stockMovement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a stock movement by ID
router.put('/:id', async (req, res) => {
  try {
    const stockMovement = await StockMovement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!stockMovement) {
      return res.status(404).json({ error: 'Stock movement not found' });
    }
    res.json(stockMovement);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a stock movement by ID
router.delete('/:id', async (req, res) => {
  try {
    const stockMovement = await StockMovement.findByIdAndDelete(req.params.id);
    if (!stockMovement) {
      return res.status(404).json({ error: 'Stock movement not found' });
    }
    res.json({ message: 'Stock movement deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
