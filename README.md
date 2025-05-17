# Pharmacy Management System

## Database Setup

1. Install MongoDB if not already installed:
   - Download from [MongoDB Website](https://www.mongodb.com/try/download/community)
   - Follow installation instructions for your operating system

2. Start MongoDB service:
   ```bash
   # Windows
   net start MongoDB

   # Linux/Mac
   sudo service mongod start
   ```

3. Install project dependencies:
   ```bash
   npm install mongoose dotenv
   ```

4. Seed the database with sample data:
   ```bash
   node backend/scripts/seedDatabase.js
   ```

## Sample Data Included

### Inventory Items
- Common medications used in Ghana
- Prices in Ghanaian Cedis (GHS)
- Batch tracking and expiry dates
- Stock levels and reorder points

### Suppliers
- Major Ghanaian pharmaceutical companies
- Local manufacturers
- Distributors and wholesalers
- Performance metrics

### Transactions
- Purchase orders
- Sales records with multiple payment methods
- Goods receipts with batch tracking
- NHIS insurance integration

## Database Collections

### 1. Inventory
```javascript
{
  name: String,
  quantity: Number,
  price: {
    amount: Number,
    currency: String (GHS)
  },
  batchNumber: String,
  shelfLocation: String,
  expiryDate: Date,
  ndcCode: String,
  therapeuticCategory: String,
  reorderPoint: Number,
  maxStock: Number,
  batchDetails: [{
    batchNumber: String,
    quantity: Number,
    expiryDate: Date,
    manufacturingDate: Date
  }]
}
```

### 2. Suppliers
```javascript
{
  name: String,
  contactPerson: String,
  email: String,
  phone: String,
  address: String,
  category: String,
  paymentTerms: Number,
  performance: {
    rating: Number,
    totalOrders: Number,
    onTimeDelivery: Number
  }
}
```

### 3. Purchase Orders
```javascript
{
  supplier: ObjectId,
  orderDate: Date,
  expectedDeliveryDate: Date,
  status: String,
  items: [{
    inventoryItem: ObjectId,
    quantity: Number,
    price: {
      amount: Number,
      currency: String
    }
  }],
  totalAmount: {
    amount: Number,
    currency: String
  }
}
```

### 4. Sales
```javascript
{
  customerName: String,
  saleDate: Date,
  items: [{
    product: ObjectId,
    quantity: Number,
    price: {
      amount: Number,
      currency: String
    },
    discount: Number
  }],
  totalAmount: {
    amount: Number,
    currency: String
  },
  paymentMethod: String,
  insurance: {
    provider: String,
    policyNumber: String
  }
}
```

### 5. Goods Receipt
```javascript
{
  purchaseOrder: ObjectId,
  receiptDate: Date,
  invoiceNumber: String,
  items: [{
    inventoryItem: ObjectId,
    quantity: Number,
    batchNumber: String,
    expiryDate: Date,
    manufacturingDate: Date,
    price: {
      amount: Number,
      currency: String
    }
  }],
  status: String
}
```

## API Routes

### Inventory Management
```
GET    /api/inventory          - List all inventory items
POST   /api/inventory          - Add new inventory item
GET    /api/inventory/:id      - Get specific item
PUT    /api/inventory/:id      - Update item
DELETE /api/inventory/:id      - Delete item
GET    /api/inventory/search   - Search inventory
GET    /api/inventory/low      - Get low stock items
```

### Supplier Management
```
GET    /api/suppliers          - List all suppliers
POST   /api/suppliers          - Add new supplier
GET    /api/suppliers/:id      - Get specific supplier
PUT    /api/suppliers/:id      - Update supplier
DELETE /api/suppliers/:id      - Delete supplier
GET    /api/suppliers/stats    - Get supplier statistics
```

### Purchase Orders
```
GET    /api/purchaseOrders          - List all orders
POST   /api/purchaseOrders          - Create new order
GET    /api/purchaseOrders/:id      - Get specific order
PUT    /api/purchaseOrders/:id      - Update order
PUT    /api/purchaseOrders/:id/status - Update order status
```

### Sales Management
```
GET    /api/sales             - List all sales
POST   /api/sales             - Record new sale
GET    /api/sales/:id         - Get specific sale
GET    /api/sales/daily       - Get daily sales report
GET    /api/sales/monthly     - Get monthly sales report
```

### Goods Receipt
```
GET    /api/goodsReceipt          - List all receipts
POST   /api/goodsReceipt          - Record new receipt
GET    /api/goodsReceipt/:id      - Get specific receipt
PUT    /api/goodsReceipt/:id      - Update receipt
```

## Environment Variables

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/pharmacy_db
PORT=5000
NODE_ENV=development
```

## Running the Application

1. Start MongoDB service
2. Install dependencies: `npm install`
3. Seed the database: `node backend/scripts/seedDatabase.js`
4. Start the server: `npm start`

## Testing the API

You can test the API endpoints using tools like Postman or curl:

```bash
# Get all inventory items
curl http://localhost:5000/api/inventory

# Add new supplier
curl -X POST http://localhost:5000/api/suppliers \
  -H "Content-Type: application/json" \
  -d '{"name":"New Supplier","email":"supplier@example.com"}'
