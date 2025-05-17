const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');

// Get all inventory items
router.get('/', async (req, res) => {
  try {
    const inventory = await Inventory.find();
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get low stock items
router.get('/low-stock', async (req, res) => {
  try {
    const lowStock = await Inventory.find({
      $expr: {
        $lte: ['$quantity', '$reorderPoint']
      }
    });
    res.json(lowStock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search inventory
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    const inventory = await Inventory.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { ndcCode: { $regex: query, $options: 'i' } },
        { therapeuticCategory: { $regex: query, $options: 'i' } }
      ]
    });
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get specific inventory item
router.get('/:id', getInventoryItem, (req, res) => {
  res.json(res.inventoryItem);
});

// Create inventory item
router.post('/', async (req, res) => {
  const inventory = new Inventory({
    name: req.body.name,
    quantity: req.body.quantity,
    price: req.body.price,
    batchNumber: req.body.batchNumber,
    shelfLocation: req.body.shelfLocation,
    expiryDate: req.body.expiryDate,
    ndcCode: req.body.ndcCode,
    therapeuticCategory: req.body.therapeuticCategory,
    reorderPoint: req.body.reorderPoint,
    maxStock: req.body.maxStock,
    batchDetails: req.body.batchDetails
  });

  try {
    const newInventory = await inventory.save();
    res.status(201).json(newInventory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update inventory item
router.patch('/:id', getInventoryItem, async (req, res) => {
  if (req.body.name != null) {
    res.inventoryItem.name = req.body.name;
  }
  if (req.body.quantity != null) {
    res.inventoryItem.quantity = req.body.quantity;
  }
  if (req.body.price != null) {
    res.inventoryItem.price = req.body.price;
  }
  if (req.body.batchNumber != null) {
    res.inventoryItem.batchNumber = req.body.batchNumber;
  }
  if (req.body.shelfLocation != null) {
    res.inventoryItem.shelfLocation = req.body.shelfLocation;
  }
  if (req.body.expiryDate != null) {
    res.inventoryItem.expiryDate = req.body.expiryDate;
  }
  if (req.body.ndcCode != null) {
    res.inventoryItem.ndcCode = req.body.ndcCode;
  }
  if (req.body.therapeuticCategory != null) {
    res.inventoryItem.therapeuticCategory = req.body.therapeuticCategory;
  }
  if (req.body.reorderPoint != null) {
    res.inventoryItem.reorderPoint = req.body.reorderPoint;
  }
  if (req.body.maxStock != null) {
    res.inventoryItem.maxStock = req.body.maxStock;
  }
  if (req.body.batchDetails != null) {
    res.inventoryItem.batchDetails = req.body.batchDetails;
  }

  try {
    const updatedInventory = await res.inventoryItem.save();
    res.json(updatedInventory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete inventory item
router.delete('/:id', getInventoryItem, async (req, res) => {
  try {
    await res.inventoryItem.remove();
    res.json({ message: 'Inventory item deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Middleware to get inventory item by ID
async function getInventoryItem(req, res, next) {
  let inventoryItem;
  try {
    inventoryItem = await Inventory.findById(req.params.id);
    if (inventoryItem == null) {
      return res.status(404).json({ message: 'Cannot find inventory item' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }

  res.inventoryItem = inventoryItem;
  next();
}

module.exports = router;
