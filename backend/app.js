const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const path = require('path');

// Import routes
const inventoryRoutes = require('./routes/inventory');
const supplierRoutes = require('./routes/suppliers');
const purchaseOrderRoutes = require('./routes/purchaseOrders');
const salesRoutes = require('./routes/sales');
const goodsReceiptRoutes = require('./routes/goodsReceipt');

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/inventory', inventoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchaseOrders', purchaseOrderRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/goodsReceipt', goodsReceiptRoutes);

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`MongoDB URI: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmacy_db'}`);
});

module.exports = app;
