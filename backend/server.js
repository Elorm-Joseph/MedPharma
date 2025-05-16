// Backend entry point

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const purchaseOrdersRouter = require('./routes/purchaseOrders');

// Middleware
app.use(express.json());

// Routes

app.use('/api/purchaseOrders', purchaseOrdersRouter);
const stockMovementsRouter = require('./routes/stockMovements');

app.use('/api/stockMovements', stockMovementsRouter);
const goodsReceiptRouter = require('./routes/goodsReceipt');
app.use('/api/goodsReceipt', goodsReceiptRouter);

const supplierPerformanceRouter = require('./routes/supplierPerformance');
app.use('/api/supplierPerformance', supplierPerformanceRouter);

const alertsRouter = require('./routes/alerts');
app.use('/api/alerts', alertsRouter);

const returnsRouter = require('./routes/returns');
app.use('/api/returns', returnsRouter);

const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

const reportsRouter = require('./routes/reports');
app.use('/api/reports', reportsRouter);

const inventoryRouter = require('./routes/inventory');
app.use('/api/inventory', inventoryRouter);

const prescriptionsRouter = require('./routes/prescriptions');
app.use('/api/prescriptions', prescriptionsRouter);

const storesRouter = require('./routes/stores');
app.use('/api/stores', storesRouter);

const registersRouter = require('./routes/registers');
app.use('/api/registers', registersRouter);

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pharmacy';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

module.exports = app;
