// server.js
// Entry point of the backend application.

require('dotenv').config();
const express = require('express');
const cors = require('cors');

// This also runs the MySQL connection check (see config/db.js)
require('./config/db');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const quotationRequestRoutes = require('./routes/quotationRequestRoutes');
const quotationRoutes = require('./routes/quotationRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Simple health check route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Quotation-to-Order backend is running.' });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Core business process routes
app.use('/api/products', productRoutes);
app.use('/api/quotation-requests', quotationRequestRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

// Basic 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});