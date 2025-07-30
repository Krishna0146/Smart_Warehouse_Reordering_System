const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection - Fixed deprecated options
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/warehouse_db')
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Connection event listeners
mongoose.connection.on('connected', () => {
  console.log('📦 MongoDB: ✅ Connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('📦 MongoDB: 🚨 Connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('📦 MongoDB: ⚠️  Disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('📦 MongoDB: 🔄 Reconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('🔄 MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error during graceful shutdown:', err);
    process.exit(1);
  }
});

// Product Schema
const productSchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  currentStock: { type: Number, required: true },
  averageDailySales: { type: Number, required: true },
  supplierLeadTime: { type: Number, required: true }, // in days
  minimumReorderQuantity: { type: Number, required: true },
  costPerUnit: { type: Number, required: true },
  criticality: { type: String, enum: ['high', 'medium', 'low'], required: true },
  lastUpdated: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);

// Helper Functions for Calculations
const calculateDaysOfStockRemaining = (currentStock, averageDailySales) => {
  if (averageDailySales === 0) return Infinity;
  return Math.floor(currentStock / averageDailySales);
};

const calculateSafetyStockThreshold = (supplierLeadTime, bufferDays = 5) => {
  return supplierLeadTime + bufferDays;
};

const calculateOptimalReorderQuantity = (averageDailySales, targetDays = 60, currentStock = 0) => {
  const targetStock = averageDailySales * targetDays;
  return Math.max(0, targetStock - currentStock);
};

const needsReorder = (daysRemaining, safetyThreshold) => {
  return daysRemaining <= safetyThreshold;
};

// Routes

// Health check endpoint - moved to top for easy access
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStatusText = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatusText[dbStatus] || 'unknown',
      readyState: dbStatus
    },
    server: {
      port: PORT,
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// GET all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ lastUpdated: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST new product
app.post('/api/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    const savedProduct = await product.save();
    console.log(`✅ New product created: ${savedProduct.name}`);
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).json({ message: error.message });
  }
});

// PUT update product
app.put('/api/products/:id', async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastUpdated: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    console.log(`📝 Product updated: ${updatedProduct.name}`);
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).json({ message: error.message });
  }
});

// DELETE product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    console.log(`🗑️ Product deleted: ${deletedProduct.name}`);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET reorder analysis
app.get('/api/reorder-analysis', async (req, res) => {
  try {
    const products = await Product.find();
    const analysis = products.map(product => {
      const daysRemaining = calculateDaysOfStockRemaining(
        product.currentStock,
        product.averageDailySales
      );
      const safetyThreshold = calculateSafetyStockThreshold(product.supplierLeadTime);
      const needsReorderFlag = needsReorder(daysRemaining, safetyThreshold);
      const optimalQuantity = needsReorderFlag 
        ? Math.max(
            calculateOptimalReorderQuantity(product.averageDailySales, 60, product.currentStock),
            product.minimumReorderQuantity
          )
        : 0;
      const estimatedCost = Math.round(optimalQuantity * product.costPerUnit * 100) / 100;

      return {
        ...product.toObject(),
        daysRemaining: daysRemaining === Infinity ? 'Unlimited' : daysRemaining,
        safetyThreshold,
        needsReorder: needsReorderFlag,
        optimalReorderQuantity: optimalQuantity,
        estimatedCost: estimatedCost
      };
    });

    // Sort by criticality and reorder priority
    const sorted = analysis.sort((a, b) => {
      const criticalityOrder = { high: 3, medium: 2, low: 1 };
      if (a.needsReorder && !b.needsReorder) return -1;
      if (!a.needsReorder && b.needsReorder) return 1;
      return criticalityOrder[b.criticality] - criticalityOrder[a.criticality];
    });

    console.log(`📊 Reorder analysis completed for ${products.length} products`);
    res.json(sorted);
  } catch (error) {
    console.error('Error in reorder analysis:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST simulate demand spike
app.post('/api/simulate-demand-spike', async (req, res) => {
  try {
    const { productId, spikeMultiplier, spikeDuration } = req.body;
    
    // Input validation
    if (!productId || !spikeMultiplier || !spikeDuration) {
      return res.status(400).json({ 
        message: 'Missing required fields: productId, spikeMultiplier, spikeDuration' 
      });
    }

    if (spikeMultiplier <= 0 || spikeDuration <= 0) {
      return res.status(400).json({ 
        message: 'spikeMultiplier and spikeDuration must be positive numbers' 
      });
    }
    
    const product = await Product.findOne({ productId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Calculate projected sales during spike period
    const normalDailySales = product.averageDailySales;
    const spikedDailySales = normalDailySales * spikeMultiplier;
    const totalSpikeConsumption = spikedDailySales * spikeDuration;
    
    // Calculate remaining stock after spike
    const stockAfterSpike = Math.max(0, product.currentStock - totalSpikeConsumption);
    
    // Calculate new average daily sales (weighted average over 30 days)
    const totalDays = 30;
    const normalPeriod = Math.max(0, totalDays - spikeDuration);
    const newAverageDailySales = spikeDuration >= totalDays 
      ? spikedDailySales 
      : (normalDailySales * normalPeriod + spikedDailySales * spikeDuration) / totalDays;

    // Calculate metrics with spike impact
    const daysRemaining = calculateDaysOfStockRemaining(stockAfterSpike, newAverageDailySales);
    const safetyThreshold = calculateSafetyStockThreshold(product.supplierLeadTime);
    const needsReorderFlag = needsReorder(daysRemaining, safetyThreshold);
    const optimalQuantity = needsReorderFlag 
      ? Math.max(
          calculateOptimalReorderQuantity(newAverageDailySales, 60, stockAfterSpike),
          product.minimumReorderQuantity
        )
      : 0;

    const simulation = {
      productName: product.name,
      original: {
        currentStock: product.currentStock,
        averageDailySales: Math.round(normalDailySales * 100) / 100,
        daysRemaining: calculateDaysOfStockRemaining(product.currentStock, normalDailySales)
      },
      afterSpike: {
        stockAfterSpike: Math.round(stockAfterSpike * 100) / 100,
        newAverageDailySales: Math.round(newAverageDailySales * 100) / 100,
        daysRemaining: daysRemaining === Infinity ? 'Unlimited' : daysRemaining,
        needsReorder: needsReorderFlag,
        optimalReorderQuantity: optimalQuantity,
        estimatedCost: Math.round(optimalQuantity * product.costPerUnit * 100) / 100
      },
      spikeDetails: {
        spikeMultiplier,
        spikeDuration,
        totalConsumptionDuringSpike: Math.round(totalSpikeConsumption * 100) / 100,
        stockDepletion: Math.round(((totalSpikeConsumption / product.currentStock) * 100) * 100) / 100
      }
    };

    console.log(`🔥 Demand spike simulation for ${product.name}: ${spikeMultiplier}x for ${spikeDuration} days`);
    res.json(simulation);
  } catch (error) {
    console.error('Error in demand spike simulation:', error);
    res.status(500).json({ message: error.message });
  }
});

// Seed database with sample data
app.post('/api/seed-data', async (req, res) => {
  try {
    // Clear existing data
    await Product.deleteMany({});
    
    const sampleProducts = [
  {
    productId: 'PROD-001',
    name: 'Wireless Bluetooth Headphones',
    currentStock: 45,
    averageDailySales: 3.2,
    supplierLeadTime: 7,
    minimumReorderQuantity: 50,
    costPerUnit: 2499,
    criticality: 'high'
  },
  {
    productId: 'PROD-002',
    name: 'USB-C Cable 6ft',
    currentStock: 120,
    averageDailySales: 8.5,
    supplierLeadTime: 3,
    minimumReorderQuantity: 100,
    costPerUnit: 1049,
    criticality: 'medium'
  },
  {
    productId: 'PROD-003',
    name: 'Smartphone Case - Clear',
    currentStock: 15,
    averageDailySales: 2.1,
    supplierLeadTime: 5,
    minimumReorderQuantity: 25,
    costPerUnit: 749,
    criticality: 'high'
  },
  {
    productId: 'PROD-004',
    name: 'Portable Power Bank 10000mAh',
    currentStock: 80,
    averageDailySales: 1.8,
    supplierLeadTime: 14,
    minimumReorderQuantity: 30,
    costPerUnit: 2099,
    criticality: 'medium'
  },
  {
    productId: 'PROD-005',
    name: 'Laptop Screen Protector',
    currentStock: 25,
    averageDailySales: 0.8,
    supplierLeadTime: 10,
    minimumReorderQuantity: 20,
    costPerUnit: 1349,
    criticality: 'low'
  },
  {
    productId: 'PROD-006',
    name: 'Wireless Mouse',
    currentStock: 35,
    averageDailySales: 2.5,
    supplierLeadTime: 8,
    minimumReorderQuantity: 40,
    costPerUnit: 1699,
    criticality: 'medium'
  },
  {
    productId: 'PROD-007',
    name: 'Gaming Keyboard - RGB',
    currentStock: 22,
    averageDailySales: 1.4,
    supplierLeadTime: 12,
    minimumReorderQuantity: 15,
    costPerUnit: 6799,
    criticality: 'high'
  },
  {
    productId: 'PROD-008',
    name: 'Webcam 1080p HD',
    currentStock: 65,
    averageDailySales: 2.8,
    supplierLeadTime: 6,
    minimumReorderQuantity: 35,
    costPerUnit: 3899,
    criticality: 'medium'
  },
  {
    productId: 'PROD-009',
    name: 'Bluetooth Speaker Portable',
    currentStock: 8,
    averageDailySales: 4.1,
    supplierLeadTime: 9,
    minimumReorderQuantity: 20,
    costPerUnit: 2949,
    criticality: 'high'
  },
  {
    productId: 'PROD-010',
    name: 'Phone Stand Adjustable',
    currentStock: 140,
    averageDailySales: 6.2,
    supplierLeadTime: 4,
    minimumReorderQuantity: 75,
    costPerUnit: 849,
    criticality: 'low'
  },
  {
    productId: 'PROD-011',
    name: 'Wireless Charging Pad',
    currentStock: 55,
    averageDailySales: 3.7,
    supplierLeadTime: 11,
    minimumReorderQuantity: 45,
    costPerUnit: 1949,
    criticality: 'medium'
  },
  {
    productId: 'PROD-012',
    name: 'HDMI Cable 10ft',
    currentStock: 95,
    averageDailySales: 2.3,
    supplierLeadTime: 5,
    minimumReorderQuantity: 60,
    costPerUnit: 1449,
    criticality: 'low'
  },
  {
    productId: 'PROD-013',
    name: 'Tablet Stylus Pen',
    currentStock: 18,
    averageDailySales: 1.9,
    supplierLeadTime: 15,
    minimumReorderQuantity: 25,
    costPerUnit: 2449,
    criticality: 'high'
  },
  {
    productId: 'PROD-014',
    name: 'Car Phone Mount',
    currentStock: 72,
    averageDailySales: 3.1,
    supplierLeadTime: 7,
    minimumReorderQuantity: 50,
    costPerUnit: 1299,
    criticality: 'medium'
  },
  {
    productId: 'PROD-015',
    name: 'Lightning Cable 3ft',
    currentStock: 160,
    averageDailySales: 12.4,
    supplierLeadTime: 2,
    minimumReorderQuantity: 120,
    costPerUnit: 749,
    criticality: 'medium'
  },
  {
    productId: 'PROD-016',
    name: 'Laptop Cooling Pad',
    currentStock: 31,
    averageDailySales: 1.2,
    supplierLeadTime: 18,
    minimumReorderQuantity: 20,
    costPerUnit: 2799,
    criticality: 'low'
  },
  {
    productId: 'PROD-017',
    name: 'Smart Watch Band - Silicone',
    currentStock: 12,
    averageDailySales: 5.8,
    supplierLeadTime: 6,
    minimumReorderQuantity: 30,
    costPerUnit: 999,
    criticality: 'high'
  },
  {
    productId: 'PROD-018',
    name: 'USB Hub 4-Port',
    currentStock: 44,
    averageDailySales: 2.6,
    supplierLeadTime: 8,
    minimumReorderQuantity: 35,
    costPerUnit: 1599,
    criticality: 'medium'
  },
  {
    productId: 'PROD-019',
    name: 'Noise Cancelling Earbuds',
    currentStock: 28,
    averageDailySales: 4.3,
    supplierLeadTime: 13,
    minimumReorderQuantity: 40,
    costPerUnit: 7649,
    criticality: 'high'
  },
  {
    productId: 'PROD-020',
    name: 'Memory Card 64GB',
    currentStock: 86,
    averageDailySales: 3.4,
    supplierLeadTime: 9,
    minimumReorderQuantity: 50,
    costPerUnit: 1699,
    criticality: 'medium'
  },
  {
    productId: 'PROD-021',
    name: 'Desk Lamp LED',
    currentStock: 19,
    averageDailySales: 1.1,
    supplierLeadTime: 21,
    minimumReorderQuantity: 15,
    costPerUnit: 3649,
    criticality: 'low'
  },
  {
    productId: 'PROD-022',
    name: 'Cable Organizer Set',
    currentStock: 103,
    averageDailySales: 4.7,
    supplierLeadTime: 4,
    minimumReorderQuantity: 80,
    costPerUnit: 679,
    criticality: 'low'
  },
  {
    productId: 'PROD-023',
    name: 'Portable Hard Drive 1TB',
    currentStock: 37,
    averageDailySales: 2.2,
    supplierLeadTime: 16,
    minimumReorderQuantity: 25,
    costPerUnit: 5599,
    criticality: 'medium'
  },
  {
    productId: 'PROD-024',
    name: 'Monitor Stand Adjustable',
    currentStock: 14,
    averageDailySales: 0.9,
    supplierLeadTime: 20,
    minimumReorderQuantity: 12,
    costPerUnit: 3299,
    criticality: 'high'
  },
  {
    productId: 'PROD-025',
    name: 'Bluetooth Adapter USB',
    currentStock: 67,
    averageDailySales: 1.6,
    supplierLeadTime: 7,
    minimumReorderQuantity: 40,
    costPerUnit: 1199,
    criticality: 'low'
  },
  {
    productId: 'PROD-026',
    name: 'Gaming Mouse Pad XXL',
    currentStock: 41,
    averageDailySales: 2.8,
    supplierLeadTime: 11,
    minimumReorderQuantity: 30,
    costPerUnit: 2199,
    criticality: 'medium'
  },
  {
    productId: 'PROD-027',
    name: 'Smartphone Gimbal Stabilizer',
    currentStock: 9,
    averageDailySales: 0.7,
    supplierLeadTime: 25,
    minimumReorderQuantity: 10,
    costPerUnit: 11049,
    criticality: 'high'
  },
  {
    productId: 'PROD-028',
    name: 'Wi-Fi Range Extender',
    currentStock: 52,
    averageDailySales: 1.3,
    supplierLeadTime: 14,
    minimumReorderQuantity: 20,
    costPerUnit: 4159,
    criticality: 'low'
  },
  {
    productId: 'PROD-029',
    name: 'Digital Photo Frame 10"',
    currentStock: 16,
    averageDailySales: 0.6,
    supplierLeadTime: 22,
    minimumReorderQuantity: 12,
    costPerUnit: 6709,
    criticality: 'low'
  },
  {
    productId: 'PROD-030',
    name: 'Ethernet Cable Cat6 25ft',
    currentStock: 78,
    averageDailySales: 2.1,
    supplierLeadTime: 6,
    minimumReorderQuantity: 50,
    costPerUnit: 1299,
    criticality: 'medium'
  },
  {
    productId: 'PROD-031',
    name: 'Wireless Earbuds - Sport',
    currentStock: 24,
    averageDailySales: 3.9,
    supplierLeadTime: 10,
    minimumReorderQuantity: 35,
    costPerUnit: 4839,
    criticality: 'high'
  },
  {
    productId: 'PROD-032',
    name: 'Laptop Backpack Water-Resistant',
    currentStock: 33,
    averageDailySales: 1.4,
    supplierLeadTime: 17,
    minimumReorderQuantity: 20,
    costPerUnit: 4249,
    criticality: 'medium'
  },
  {
    productId: 'PROD-033',
    name: 'Mechanical Keyboard Switch Tester',
    currentStock: 58,
    averageDailySales: 0.4,
    supplierLeadTime: 12,
    minimumReorderQuantity: 25,
    costPerUnit: 1099,
    criticality: 'low'
  },
  {
    productId: 'PROD-034',
    name: 'Smartphone Camera Lens Kit',
    currentStock: 21,
    averageDailySales: 1.7,
    supplierLeadTime: 19,
    minimumReorderQuantity: 18,
    costPerUnit: 3059,
    criticality: 'medium'
  },
  {
    productId: 'PROD-035',
    name: 'Tablet Keyboard Case',
    currentStock: 11,
    averageDailySales: 2.4,
    supplierLeadTime: 8,
    minimumReorderQuantity: 15,
    costPerUnit: 3649,
    criticality: 'high'
  },
  {
    productId: 'PROD-036',
    name: 'VR Headset Stand',
    currentStock: 47,
    averageDailySales: 0.8,
    supplierLeadTime: 15,
    minimumReorderQuantity: 20,
    costPerUnit: 2039,
    criticality: 'low'
  },
  {
    productId: 'PROD-037',
    name: 'Wireless Gaming Controller',
    currentStock: 29,
    averageDailySales: 2.7,
    supplierLeadTime: 11,
    minimumReorderQuantity: 25,
    costPerUnit: 5779,
    criticality: 'medium'
  },
  {
    productId: 'PROD-038',
    name: 'USB-C to HDMI Adapter',
    currentStock: 84,
    averageDailySales: 4.2,
    supplierLeadTime: 5,
    minimumReorderQuantity: 60,
    costPerUnit: 1449,
    criticality: 'medium'
  },
  {
    productId: 'PROD-039',
    name: 'Smart Home Security Camera',
    currentStock: 13,
    averageDailySales: 1.8,
    supplierLeadTime: 23,
    minimumReorderQuantity: 15,
    costPerUnit: 7649,
    criticality: 'high'
  },
  {
    productId: 'PROD-040',
    name: 'Portable SSD 500GB',
    currentStock: 36,
    averageDailySales: 1.5,
    supplierLeadTime: 18,
    minimumReorderQuantity: 20,
    costPerUnit: 6799,
    criticality: 'medium'
  }
];

    const createdProducts = await Product.insertMany(sampleProducts);
    console.log(`🌱 Seeded ${createdProducts.length} sample products`);
    res.status(201).json({ 
      message: 'Sample data created successfully', 
      count: createdProducts.length,
      products: createdProducts 
    });
  } catch (error) {
    console.error('Error seeding data:', error);
    res.status(500).json({ message: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler - must be last
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📦 MongoDB initial status: Connecting...`);
});