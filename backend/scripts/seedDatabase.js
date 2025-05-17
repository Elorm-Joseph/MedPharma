const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Inventory = require('../models/Inventory');
const Supplier = require('../models/Supplier');
const PurchaseOrder = require('../models/PurchaseOrder');
const Sale = require('../models/Sale');
const GoodsReceipt = require('../models/GoodsReceipt');

// Sample Data
const inventoryData = [
  {
    name: 'Paracetamol 500mg',
    quantity: 1000,
    price: { amount: 5.00, currency: 'GHS' },
    batchNumber: 'PCM-2023-001',
    shelfLocation: 'A1-01',
    expiryDate: new Date('2024-12-31'),
    ndcCode: 'NDC-001',
    therapeuticCategory: 'Analgesics',
    reorderPoint: 200,
    maxStock: 2000,
    batchDetails: [{
      batchNumber: 'PCM-2023-001',
      quantity: 1000,
      expiryDate: new Date('2024-12-31'),
      manufacturingDate: new Date('2023-01-01')
    }]
  },
  {
    name: 'Amoxicillin 250mg',
    quantity: 500,
    price: { amount: 15.00, currency: 'GHS' },
    batchNumber: 'AMX-2023-001',
    shelfLocation: 'A2-01',
    expiryDate: new Date('2024-06-30'),
    ndcCode: 'NDC-002',
    therapeuticCategory: 'Antibiotics',
    reorderPoint: 100,
    maxStock: 1000,
    batchDetails: [{
      batchNumber: 'AMX-2023-001',
      quantity: 500,
      expiryDate: new Date('2024-06-30'),
      manufacturingDate: new Date('2023-01-15')
    }]
  },
  {
    name: 'Artemether/Lumefantrine 20/120mg',
    quantity: 300,
    price: { amount: 25.00, currency: 'GHS' },
    batchNumber: 'ART-2023-001',
    shelfLocation: 'B1-01',
    expiryDate: new Date('2024-09-30'),
    ndcCode: 'NDC-003',
    therapeuticCategory: 'Antimalarial',
    reorderPoint: 50,
    maxStock: 500,
    batchDetails: [{
      batchNumber: 'ART-2023-001',
      quantity: 300,
      expiryDate: new Date('2024-09-30'),
      manufacturingDate: new Date('2023-02-01')
    }]
  },
  {
    name: 'Metformin 500mg',
    quantity: 750,
    price: { amount: 20.00, currency: 'GHS' },
    batchNumber: 'MET-2023-001',
    shelfLocation: 'B2-01',
    expiryDate: new Date('2024-08-31'),
    ndcCode: 'NDC-004',
    therapeuticCategory: 'Diabetes',
    reorderPoint: 150,
    maxStock: 1000,
    batchDetails: [{
      batchNumber: 'MET-2023-001',
      quantity: 750,
      expiryDate: new Date('2024-08-31'),
      manufacturingDate: new Date('2023-02-15')
    }]
  },
  {
    name: 'Amlodipine 5mg',
    quantity: 400,
    price: { amount: 18.00, currency: 'GHS' },
    batchNumber: 'AML-2023-001',
    shelfLocation: 'C1-01',
    expiryDate: new Date('2024-10-31'),
    ndcCode: 'NDC-005',
    therapeuticCategory: 'Antihypertensive',
    reorderPoint: 80,
    maxStock: 800,
    batchDetails: [{
      batchNumber: 'AML-2023-001',
      quantity: 400,
      expiryDate: new Date('2024-10-31'),
      manufacturingDate: new Date('2023-03-01')
    }]
  }
];

const supplierData = [
  {
    name: 'Ernest Chemists Limited',
    contactPerson: 'Ernest Bediako',
    email: 'info@ernestchemists.com',
    phone: '0302777777',
    address: 'Industrial Area, Accra',
    category: 'pharmaceuticals',
    paymentTerms: 30,
    performance: { rating: 4.5, totalOrders: 50, onTimeDelivery: 45 }
  },
  {
    name: 'Kinapharma Limited',
    contactPerson: 'Michael Kina',
    email: 'info@kinapharma.com',
    phone: '0302666666',
    address: 'Spintex Road, Accra',
    category: 'local_manufacturer',
    paymentTerms: 45,
    performance: { rating: 4.8, totalOrders: 75, onTimeDelivery: 70 }
  },
  {
    name: 'Dannex Ayrton Starwin',
    contactPerson: 'Daniel Apeagyei',
    email: 'info@dannexayrton.com',
    phone: '0302555555',
    address: 'Osu, Accra',
    category: 'local_manufacturer',
    paymentTerms: 30,
    performance: { rating: 4.2, totalOrders: 40, onTimeDelivery: 35 }
  },
  {
    name: 'Tobinco Pharmaceuticals',
    contactPerson: 'Samuel Tobin',
    email: 'info@tobinco.com',
    phone: '0302444444',
    address: 'North Industrial Area, Accra',
    category: 'distributor',
    paymentTerms: 30,
    performance: { rating: 4.6, totalOrders: 60, onTimeDelivery: 55 }
  },
  {
    name: 'M&G Pharmaceuticals Ltd',
    contactPerson: 'George Mensah',
    email: 'info@mgpharma.com',
    phone: '0302333333',
    address: 'Tema Industrial Area',
    category: 'pharmaceuticals',
    paymentTerms: 30,
    performance: { rating: 4.3, totalOrders: 45, onTimeDelivery: 40 }
  }
];

// Seed Database Function
const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();

    // Clear existing data
    await Promise.all([
      Inventory.deleteMany({}),
      Supplier.deleteMany({}),
      PurchaseOrder.deleteMany({}),
      Sale.deleteMany({}),
      GoodsReceipt.deleteMany({})
    ]);

    console.log('Existing data cleared');

    // Insert new data
    const suppliers = await Supplier.insertMany(supplierData);
    console.log('Suppliers added');

    const inventory = await Inventory.insertMany(inventoryData);
    console.log('Inventory items added');

    // Create sample purchase orders
    const purchaseOrders = await PurchaseOrder.create([
      {
        supplier: suppliers[0]._id,
        orderDate: new Date(),
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'PENDING',
        items: [
          {
            inventoryItem: inventory[0]._id,
            quantity: 500,
            price: { amount: 4.50, currency: 'GHS' }
          },
          {
            inventoryItem: inventory[1]._id,
            quantity: 200,
            price: { amount: 14.00, currency: 'GHS' }
          }
        ],
        totalAmount: { amount: 5050.00, currency: 'GHS' }
      },
      {
        supplier: suppliers[1]._id,
        orderDate: new Date(),
        expectedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status: 'APPROVED',
        items: [
          {
            inventoryItem: inventory[2]._id,
            quantity: 300,
            price: { amount: 23.00, currency: 'GHS' }
          }
        ],
        totalAmount: { amount: 6900.00, currency: 'GHS' }
      }
    ]);
    console.log('Sample purchase orders created');

    // Create sample sales
    await Sale.create([
      {
        customerName: 'John Mensah',
        saleDate: new Date(),
        items: [
          {
            product: inventory[0]._id,
            quantity: 2,
            price: { amount: 5.00, currency: 'GHS' },
            discount: 0
          },
          {
            product: inventory[1]._id,
            quantity: 1,
            price: { amount: 15.00, currency: 'GHS' },
            discount: 0
          }
        ],
        totalAmount: { amount: 25.00, currency: 'GHS' },
        paymentMethod: 'cash'
      },
      {
        customerName: 'Sarah Addo',
        saleDate: new Date(),
        items: [
          {
            product: inventory[2]._id,
            quantity: 1,
            price: { amount: 25.00, currency: 'GHS' },
            discount: 0
          }
        ],
        totalAmount: { amount: 25.00, currency: 'GHS' },
        paymentMethod: 'insurance',
        insurance: {
          provider: 'NHIS',
          policyNumber: 'NHIS-2023-12345'
        }
      }
    ]);
    console.log('Sample sales created');

    // Create sample goods receipts
    await GoodsReceipt.create([
      {
        purchaseOrder: purchaseOrders[0]._id,
        receiptDate: new Date(),
        invoiceNumber: 'INV-2023-001',
        items: [
          {
            inventoryItem: inventory[0]._id,
            quantity: 500,
            batchNumber: 'PCM-2023-002',
            expiryDate: new Date('2024-12-31'),
            manufacturingDate: new Date('2023-06-01'),
            price: { amount: 4.50, currency: 'GHS' }
          }
        ],
        status: 'COMPLETED'
      }
    ]);
    console.log('Sample goods receipts created');

    console.log('Database seeded successfully');
    process.exit();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
