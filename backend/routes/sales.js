const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Inventory = require('../models/Inventory');

// Get all sales
router.get('/', async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate('items.product')
      .sort({ saleDate: -1 });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get sales statistics
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await Sale.aggregate([
      {
        $facet: {
          'today': [
            { $match: { saleDate: { $gte: today } } },
            { $group: {
              _id: null,
              totalSales: { $sum: 1 },
              totalRevenue: { $sum: '$totalAmount.amount' }
            }}
          ],
          'total': [
            { $group: {
              _id: null,
              totalSales: { $sum: 1 },
              totalRevenue: { $sum: '$totalAmount.amount' }
            }}
          ],
          'byPaymentMethod': [
            { $group: {
              _id: '$paymentMethod',
              count: { $sum: 1 },
              total: { $sum: '$totalAmount.amount' }
            }}
          ],
          'byInsurance': [
            { $match: { paymentMethod: 'insurance' } },
            { $group: {
              _id: '$insurance.provider',
              count: { $sum: 1 },
              total: { $sum: '$totalAmount.amount' }
            }}
          ]
        }
      }
    ]);

    res.json({
      today: stats[0].today[0] || { totalSales: 0, totalRevenue: 0 },
      total: stats[0].total[0] || { totalSales: 0, totalRevenue: 0 },
      byPaymentMethod: stats[0].byPaymentMethod,
      byInsurance: stats[0].byInsurance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get daily sales report
router.get('/daily', async (req, res) => {
  try {
    const { date } = req.query;
    const startDate = date ? new Date(date) : new Date();
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    const sales = await Sale.find({
      saleDate: {
        $gte: startDate,
        $lt: endDate
      }
    }).populate('items.product');

    const summary = {
      date: startDate,
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum, sale) => sum + sale.totalAmount.amount, 0),
      byPaymentMethod: {},
      byInsurance: {}
    };

    sales.forEach(sale => {
      // Group by payment method
      if (!summary.byPaymentMethod[sale.paymentMethod]) {
        summary.byPaymentMethod[sale.paymentMethod] = {
          count: 0,
          total: 0
        };
      }
      summary.byPaymentMethod[sale.paymentMethod].count++;
      summary.byPaymentMethod[sale.paymentMethod].total += sale.totalAmount.amount;

      // Group by insurance provider if applicable
      if (sale.paymentMethod === 'insurance' && sale.insurance?.provider) {
        if (!summary.byInsurance[sale.insurance.provider]) {
          summary.byInsurance[sale.insurance.provider] = {
            count: 0,
            total: 0
          };
        }
        summary.byInsurance[sale.insurance.provider].count++;
        summary.byInsurance[sale.insurance.provider].total += sale.totalAmount.amount;
      }
    });

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get monthly sales report
router.get('/monthly', async (req, res) => {
  try {
    const { month, year } = req.query;
    const startDate = new Date(year || new Date().getFullYear(), month ? month - 1 : new Date().getMonth(), 1);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    const sales = await Sale.aggregate([
      {
        $match: {
          saleDate: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: { $dayOfMonth: '$saleDate' },
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount.amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      month: startDate.getMonth() + 1,
      year: startDate.getFullYear(),
      dailySales: sales
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Record new sale
router.post('/', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Verify stock availability and update inventory
    for (const item of req.body.items) {
      const inventoryItem = await Inventory.findById(item.product).session(session);
      if (!inventoryItem) {
        throw new Error(`Product ${item.product} not found`);
      }
      if (inventoryItem.quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${inventoryItem.name}`);
      }
      
      // Update inventory quantity
      await Inventory.findByIdAndUpdate(
        item.product,
        { $inc: { quantity: -item.quantity } },
        { session }
      );
    }

    // Create sale record
    const sale = new Sale({
      customerName: req.body.customerName,
      saleDate: req.body.saleDate || new Date(),
      items: req.body.items,
      totalAmount: req.body.totalAmount,
      paymentMethod: req.body.paymentMethod,
      insurance: req.body.insurance,
      cashier: req.body.cashier,
      store: req.body.store
    });

    const newSale = await sale.save({ session });
    await session.commitTransaction();

    const populatedSale = await Sale.findById(newSale._id)
      .populate('items.product');
    
    res.status(201).json(populatedSale);
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
});

// Get specific sale
router.get('/:id', getSale, (req, res) => {
  res.json(res.sale);
});

// Void sale
router.patch('/:id/void', getSale, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Restore inventory quantities
    for (const item of res.sale.items) {
      await Inventory.findByIdAndUpdate(
        item.product,
        { $inc: { quantity: item.quantity } },
        { session }
      );
    }

    res.sale.status = 'VOID';
    await res.sale.save({ session });
    
    await session.commitTransaction();
    res.json(res.sale);
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
});

// Middleware to get sale by ID
async function getSale(req, res, next) {
  let sale;
  try {
    sale = await Sale.findById(req.params.id)
      .populate('items.product');
    if (sale == null) {
      return res.status(404).json({ message: 'Cannot find sale' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }

  res.sale = sale;
  next();
}

module.exports = router;
