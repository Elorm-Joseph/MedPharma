const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');

// Get all suppliers
router.get('/', async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get supplier statistics
router.get('/stats', async (req, res) => {
  try {
    const totalSuppliers = await Supplier.countDocuments();
    const supplierStats = await Supplier.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$performance.rating' },
          totalOrders: { $sum: '$performance.totalOrders' },
          onTimeDelivery: { $sum: '$performance.onTimeDelivery' }
        }
      }
    ]);

    const stats = {
      totalSuppliers,
      averageRating: supplierStats[0]?.avgRating || 0,
      totalOrders: supplierStats[0]?.totalOrders || 0,
      onTimeDeliveryRate: supplierStats[0]?.onTimeDelivery 
        ? (supplierStats[0].onTimeDelivery / supplierStats[0].totalOrders * 100).toFixed(2)
        : 0
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get suppliers by category
router.get('/category/:category', async (req, res) => {
  try {
    const suppliers = await Supplier.find({ category: req.params.category });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search suppliers
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    const suppliers = await Supplier.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { contactPerson: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get specific supplier
router.get('/:id', getSupplier, (req, res) => {
  res.json(res.supplier);
});

// Create supplier
router.post('/', async (req, res) => {
  const supplier = new Supplier({
    name: req.body.name,
    contactPerson: req.body.contactPerson,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address,
    category: req.body.category,
    paymentTerms: req.body.paymentTerms,
    performance: req.body.performance || {
      rating: 0,
      totalOrders: 0,
      onTimeDelivery: 0
    }
  });

  try {
    const newSupplier = await supplier.save();
    res.status(201).json(newSupplier);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update supplier
router.patch('/:id', getSupplier, async (req, res) => {
  const allowedUpdates = [
    'name', 'contactPerson', 'email', 'phone', 'address',
    'category', 'paymentTerms', 'performance'
  ];

  allowedUpdates.forEach(update => {
    if (req.body[update] != null) {
      res.supplier[update] = req.body[update];
    }
  });

  try {
    const updatedSupplier = await res.supplier.save();
    res.json(updatedSupplier);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update supplier performance
router.patch('/:id/performance', getSupplier, async (req, res) => {
  try {
    const { rating, orderCompleted, onTime } = req.body;

    if (rating) {
      // Update rating as moving average
      const oldRating = res.supplier.performance.rating || 0;
      const totalOrders = res.supplier.performance.totalOrders || 0;
      const newRating = (oldRating * totalOrders + rating) / (totalOrders + 1);
      res.supplier.performance.rating = newRating;
    }

    if (orderCompleted) {
      res.supplier.performance.totalOrders = (res.supplier.performance.totalOrders || 0) + 1;
      if (onTime) {
        res.supplier.performance.onTimeDelivery = (res.supplier.performance.onTimeDelivery || 0) + 1;
      }
    }

    const updatedSupplier = await res.supplier.save();
    res.json(updatedSupplier);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete supplier
router.delete('/:id', getSupplier, async (req, res) => {
  try {
    await res.supplier.remove();
    res.json({ message: 'Supplier deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Middleware to get supplier by ID
async function getSupplier(req, res, next) {
  let supplier;
  try {
    supplier = await Supplier.findById(req.params.id);
    if (supplier == null) {
      return res.status(404).json({ message: 'Cannot find supplier' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }

  res.supplier = supplier;
  next();
}

module.exports = router;
