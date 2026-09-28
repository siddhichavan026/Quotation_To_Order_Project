// routes/orderRoutes.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const orderController = require('../controllers/orderController');

// Only Admin can convert an accepted quotation into an order
router.post('/convert', authMiddleware, roleMiddleware('ADMIN'), orderController.convertToOrder);

// Customer sees own orders, Admin sees all (handled inside the controller)
router.get('/', authMiddleware, orderController.getOrders);
router.get('/:id', authMiddleware, orderController.getOrderById);

// Only Admin can update order status (e.g. mark PROCESSING or COMPLETED)
router.patch('/:id/status', authMiddleware, roleMiddleware('ADMIN'), orderController.updateOrderStatus);

module.exports = router;