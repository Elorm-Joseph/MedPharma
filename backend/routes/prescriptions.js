const express = require('express');
const router = express.Router();
const Prescription = require('../models/Prescription');
const Inventory = require('../models/Inventory');

// Create new prescription
router.post('/', async (req, res) => {
  try {
    const prescription = new Prescription(req.body);
    await prescription.save();
    res.status(201).json(prescription);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all prescriptions with filters
router.get('/', async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }

    if (startDate && endDate) {
      query.prescriptionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const prescriptions = await Prescription.find(query)
      .populate('medications.medicine')
      .populate('dispensedBy')
      .sort({ prescriptionDate: -1 });

    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get prescription by ID
router.get('/:id', async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('medications.medicine')
      .populate('dispensedBy');

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    res.json(prescription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update prescription status and dispense medications
router.put('/:id/dispense', async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    // Check if already dispensed
    if (prescription.status === 'dispensed') {
      return res.status(400).json({ error: 'Prescription already dispensed' });
    }

    // Update inventory for each medication
    let allMedicationsAvailable = true;
    const inventoryUpdates = [];

    for (const med of prescription.medications) {
      const inventory = await Inventory.findById(med.medicine);
      if (!inventory || inventory.quantity < med.quantity) {
        allMedicationsAvailable = false;
        break;
      }
      inventoryUpdates.push({
        inventory,
        quantityToReduce: med.quantity
      });
    }

    if (!allMedicationsAvailable) {
      prescription.status = 'partially_dispensed';
    } else {
      // Update inventory quantities
      for (const update of inventoryUpdates) {
        update.inventory.quantity -= update.quantityToReduce;
        await update.inventory.save();
      }
      prescription.status = 'dispensed';
    }

    prescription.dispensedBy = req.body.userId; // From auth middleware
    prescription.dispensedDate = new Date();
    await prescription.save();

    res.json(prescription);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Cancel prescription
router.put('/:id/cancel', async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    if (prescription.status === 'dispensed') {
      return res.status(400).json({ error: 'Cannot cancel dispensed prescription' });
    }

    prescription.status = 'cancelled';
    prescription.notes = req.body.notes || prescription.notes;
    await prescription.save();

    res.json(prescription);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get prescription statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const stats = {
      total: await Prescription.countDocuments(),
      pending: await Prescription.countDocuments({ status: 'pending' }),
      dispensedToday: await Prescription.countDocuments({
        status: 'dispensed',
        dispensedDate: { $gte: startOfDay, $lte: endOfDay }
      }),
      cancelled: await Prescription.countDocuments({ status: 'cancelled' })
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
