const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Customer = require('../models/Customer');

// Generate sales receipt
router.get('/receipt/:saleId', async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.saleId)
      .populate('customer')
      .populate('items.product');

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    const receipt = {
      receiptNumber: `RCP-${sale._id.toString().slice(-6)}`,
      date: sale.date,
      customer: sale.customer,
      items: sale.items,
      subtotal: sale.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      tax: sale.tax || 0,
      discount: sale.discount || 0,
      total: sale.total,
      paymentMethod: sale.paymentMethod
    };

    res.json(receipt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate monthly report
router.get('/monthly', async (req, res) => {
  try {
    const { month, year } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const sales = await Sale.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).populate('customer').populate('items.product');

    const report = {
      period: `${startDate.toLocaleString('default', { month: 'long' })} ${year}`,
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum, sale) => sum + sale.total, 0),
      totalTax: sales.reduce((sum, sale) => sum + (sale.tax || 0), 0),
      totalDiscount: sales.reduce((sum, sale) => sum + (sale.discount || 0), 0),
      salesByDay: {},
      topSellingProducts: {},
      paymentMethods: {}
    };

    // Process sales data
    sales.forEach(sale => {
      // Sales by day
      const day = sale.date.getDate();
      report.salesByDay[day] = (report.salesByDay[day] || 0) + sale.total;

      // Top selling products
      sale.items.forEach(item => {
        const productName = item.product.name;
        if (!report.topSellingProducts[productName]) {
          report.topSellingProducts[productName] = {
            quantity: 0,
            revenue: 0
          };
        }
        report.topSellingProducts[productName].quantity += item.quantity;
        report.topSellingProducts[productName].revenue += item.price * item.quantity;
      });

      // Payment methods
      report.paymentMethods[sale.paymentMethod] = 
        (report.paymentMethods[sale.paymentMethod] || 0) + sale.total;
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate yearly report
router.get('/yearly', async (req, res) => {
  try {
    const { year } = req.query;
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const sales = await Sale.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).populate('customer').populate('items.product');

    const report = {
      year: year,
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum, sale) => sum + sale.total, 0),
      totalTax: sales.reduce((sum, sale) => sum + (sale.tax || 0), 0),
      totalDiscount: sales.reduce((sum, sale) => sum + (sale.discount || 0), 0),
      salesByMonth: {},
      topSellingProducts: {},
      customerStats: {},
      quarterlyRevenue: {
        Q1: 0, Q2: 0, Q3: 0, Q4: 0
      }
    };

    // Process sales data
    sales.forEach(sale => {
      const month = sale.date.getMonth();
      const quarter = Math.floor(month / 3) + 1;

      // Sales by month
      report.salesByMonth[month] = (report.salesByMonth[month] || 0) + sale.total;

      // Quarterly revenue
      report.quarterlyRevenue[`Q${quarter}`] += sale.total;

      // Top selling products
      sale.items.forEach(item => {
        const productName = item.product.name;
        if (!report.topSellingProducts[productName]) {
          report.topSellingProducts[productName] = {
            quantity: 0,
            revenue: 0
          };
        }
        report.topSellingProducts[productName].quantity += item.quantity;
        report.topSellingProducts[productName].revenue += item.price * item.quantity;
      });

      // Customer statistics
      const customerId = sale.customer._id.toString();
      if (!report.customerStats[customerId]) {
        report.customerStats[customerId] = {
          name: `${sale.customer.firstName} ${sale.customer.lastName}`,
          purchases: 0,
          totalSpent: 0
        };
      }
      report.customerStats[customerId].purchases++;
      report.customerStats[customerId].totalSpent += sale.total;
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
