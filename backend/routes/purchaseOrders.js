const express = require('express');
const router = express.Router();
const PurchaseOrder = require('../models/PurchaseOrder');
const Supplier = require('../models/Supplier');

// Get all purchase orders
router.get('/', async (req, res) => {
  try {
    const purchaseOrders = await PurchaseOrder.find()
      .populate('supplier')
      .populate('items.inventoryItem');
    res.json(purchaseOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get purchase orders by status
router.get('/status/:status', async (req, res) => {
  try {
    const purchaseOrders = await PurchaseOrder.find({ status: req.params.status.toUpperCase() })
      .populate('supplier')
      .populate('items.inventoryItem');
    res.json(purchaseOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get purchase orders by supplier
router.get('/supplier/:supplierId', async (req, res) => {
  try {
    const purchaseOrders = await PurchaseOrder.find({ supplier: req.params.supplierId })
      .populate('supplier')
      .populate('items.inventoryItem');
    res.json(purchaseOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get specific purchase order
router.get('/:id', getPurchaseOrder, (req, res) => {
  res.json(res.purchaseOrder);
});

// Create purchase order
router.post('/', async (req, res) => {
  const purchaseOrder = new PurchaseOrder({
    supplier: req.body.supplier,
    orderDate: req.body.orderDate || new Date(),
    expectedDeliveryDate: req.body.expectedDeliveryDate,
    status: 'PENDING',
    items: req.body.items,
    totalAmount: req.body.totalAmount
  });

  try {
    const newPurchaseOrder = await purchaseOrder.save();
    
    // Update supplier's total orders
    await Supplier.findByIdAndUpdate(req.body.supplier, {
      $inc: { 'performance.totalOrders': 1 }
    });

    const populatedOrder = await PurchaseOrder.findById(newPurchaseOrder._id)
      .populate('supplier')
      .populate('items.inventoryItem');
    
    res.status(201).json(populatedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update purchase order status
router.patch('/:id/status', getPurchaseOrder, async (req, res) => {
  const allowedStatuses = ['PENDING', 'APPROVED', 'RECEIVED', 'CANCELLED'];
  
  if (!allowedStatuses.includes(req.body.status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    res.purchaseOrder.status = req.body.status;
    
    // If order is received, update supplier performance
    if (req.body.status === 'RECEIVED') {
      const deliveryDate = new Date();
      const onTime = deliveryDate <= res.purchaseOrder.expectedDeliveryDate;
      
      await Supplier.findByIdAndUpdate(res.purchaseOrder.supplier, {
        $inc: { 'performance.onTimeDelivery': onTime ? 1 : 0 }
      });
    }

    const updatedOrder = await res.purchaseOrder.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update purchase order
router.patch('/:id', getPurchaseOrder, async (req, res) => {
  const allowedUpdates = [
    'expectedDeliveryDate',
    'items',
    'totalAmount'
  ];

  // Only allow updates if order is still pending
  if (res.purchaseOrder.status !== 'PENDING') {
    return res.status(400).json({ 
      message: 'Cannot modify purchase order after it has been approved or received' 
    });
  }

  allowedUpdates.forEach(update => {
    if (req.body[update] != null) {
      res.purchaseOrder[update] = req.body[update];
    }
  });

  try {
    const updatedOrder = await res.purchaseOrder.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete purchase order
router.delete('/:id', getPurchaseOrder, async (req, res) => {
  // Only allow deletion if order is still pending
  if (res.purchaseOrder.status !== 'PENDING') {
    return res.status(400).json({ 
      message: 'Cannot delete purchase order after it has been approved or received' 
    });
  }

  try {
    await res.purchaseOrder.remove();
    
    // Decrement supplier's total orders
    await Supplier.findByIdAndUpdate(res.purchaseOrder.supplier, {
      $inc: { 'performance.totalOrders': -1 }
    });

    res.json({ message: 'Purchase order deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get purchase order statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await PurchaseOrder.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount.amount' },
          averageOrderValue: { $avg: '$totalAmount.amount' },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] }
          },
          approvedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'APPROVED'] }, 1, 0] }
          },
          receivedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'RECEIVED'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json(stats[0] || {
      totalOrders: 0,
      totalAmount: 0,
      averageOrderValue: 0,
      pendingOrders: 0,
      approvedOrders: 0,
      receivedOrders: 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Middleware to get purchase order by ID
async function getPurchaseOrder(req, res, next) {
  let purchaseOrder;
  try {
    purchaseOrder = await PurchaseOrder.findById(req.params.id)
      .populate('supplier')
      .populate('items.inventoryItem');
    if (purchaseOrder == null) {
      return res.status(404).json({ message: 'Cannot find purchase order' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }

  res.purchaseOrder = purchaseOrder;
  next();
}

module.exports = router;
