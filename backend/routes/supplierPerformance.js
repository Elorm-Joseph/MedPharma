const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const PurchaseOrder = require('../models/PurchaseOrder');

// Get supplier performance report
router.get('/', async (req, res) => {
  try {
    // Example: Calculate total orders and average delivery time per supplier
    const suppliers = await Supplier.find();
    const performanceData = [];

    for (const supplier of suppliers) {
      const orders = await PurchaseOrder.find({ supplier: supplier._id });
      const totalOrders = orders.length;
      let totalDeliveryTime = 0;
      let receivedOrders = 0;

      orders.forEach(order => {
        if (order.status === 'Received' && order.expectedDeliveryDate && order.orderDate) {
          const deliveryTime = new Date(order.expectedDeliveryDate) - new Date(order.orderDate);
          totalDeliveryTime += deliveryTime;
          receivedOrders++;
        }
      });

      const avgDeliveryTime = receivedOrders > 0 ? totalDeliveryTime / receivedOrders : null;

      performanceData.push({
        supplier: supplier.name,
        totalOrders,
        avgDeliveryTime: avgDeliveryTime ? avgDeliveryTime / (1000 * 60 * 60 * 24) : 'N/A' // days
      });
    }

    res.json(performanceData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
