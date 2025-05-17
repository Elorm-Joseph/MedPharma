const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const GoodsReceipt = require('../models/GoodsReceipt');
const PurchaseOrder = require('../models/PurchaseOrder');
const Inventory = require('../models/Inventory');
const Supplier = require('../models/Supplier');

// Get all goods receipts
router.get('/', async (req, res) => {
  try {
    const receipts = await GoodsReceipt.find()
      .populate('purchaseOrder')
      .populate('items.inventoryItem')
      .sort({ receiptDate: -1 });
    res.json(receipts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get receipts by status
router.get('/status/:status', async (req, res) => {
  try {
    const receipts = await GoodsReceipt.find({ status: req.params.status.toUpperCase() })
      .populate('purchaseOrder')
      .populate('items.inventoryItem');
    res.json(receipts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get specific receipt
router.get('/:id', getGoodsReceipt, (req, res) => {
  res.json(res.goodsReceipt);
});

// Create goods receipt
router.post('/', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Verify purchase order exists and is approved
    const purchaseOrder = await PurchaseOrder.findById(req.body.purchaseOrder)
      .session(session);
    
    if (!purchaseOrder) {
      throw new Error('Purchase order not found');
    }
    if (purchaseOrder.status !== 'APPROVED') {
      throw new Error('Purchase order must be approved before receiving goods');
    }

    // Create goods receipt
    const goodsReceipt = new GoodsReceipt({
      purchaseOrder: req.body.purchaseOrder,
      receiptDate: req.body.receiptDate || new Date(),
      invoiceNumber: req.body.invoiceNumber,
      items: req.body.items,
      notes: req.body.notes,
      receivedBy: req.body.receivedBy,
      store: req.body.store
    });

    // Update inventory quantities and batch details
    for (const item of req.body.items) {
      const inventory = await Inventory.findById(item.inventoryItem).session(session);
      if (!inventory) {
        throw new Error(`Inventory item ${item.inventoryItem} not found`);
      }

      // Add new batch details
      inventory.batchDetails.push({
        batchNumber: item.batchNumber,
        quantity: item.quantity,
        expiryDate: item.expiryDate,
        manufacturingDate: item.manufacturingDate
      });

      // Update total quantity
      inventory.quantity += item.quantity;

      await inventory.save({ session });
    }

    // Update purchase order status
    purchaseOrder.status = 'RECEIVED';
    await purchaseOrder.save({ session });

    // Update supplier performance
    const onTime = new Date() <= purchaseOrder.expectedDeliveryDate;
    await Supplier.findByIdAndUpdate(
      purchaseOrder.supplier,
      { $inc: { 'performance.onTimeDelivery': onTime ? 1 : 0 } },
      { session }
    );

    const newReceipt = await goodsReceipt.save({ session });
    await session.commitTransaction();

    const populatedReceipt = await GoodsReceipt.findById(newReceipt._id)
      .populate('purchaseOrder')
      .populate('items.inventoryItem');
    
    res.status(201).json(populatedReceipt);
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
});

// Update receipt status
router.patch('/:id/status', getGoodsReceipt, async (req, res) => {
  if (!['PENDING', 'COMPLETED'].includes(req.body.status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    res.goodsReceipt.status = req.body.status;
    const updatedReceipt = await res.goodsReceipt.save();
    res.json(updatedReceipt);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get receipt statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await GoodsReceipt.aggregate([
      {
        $facet: {
          'today': [
            { $match: { receiptDate: { $gte: today } } },
            { $group: {
              _id: null,
              count: { $sum: 1 },
              totalItems: { $sum: { $size: '$items' } }
            }}
          ],
          'status': [
            { $group: {
              _id: '$status',
              count: { $sum: 1 }
            }}
          ],
          'itemsReceived': [
            { $unwind: '$items' },
            { $group: {
              _id: null,
              total: { $sum: '$items.quantity' }
            }}
          ]
        }
      }
    ]);

    res.json({
      today: stats[0].today[0] || { count: 0, totalItems: 0 },
      byStatus: stats[0].status,
      totalItemsReceived: stats[0].itemsReceived[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Middleware to get goods receipt by ID
async function getGoodsReceipt(req, res, next) {
  let goodsReceipt;
  try {
    goodsReceipt = await GoodsReceipt.findById(req.params.id)
      .populate('purchaseOrder')
      .populate('items.inventoryItem');
    if (goodsReceipt == null) {
      return res.status(404).json({ message: 'Cannot find goods receipt' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }

  res.goodsReceipt = goodsReceipt;
  next();
}

module.exports = router;
