// routes/paymentRoutes.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const paymentController = require('../controllers/paymentController');

// Only Admin can manually confirm a payment
router.patch('/:orderId/confirm', authMiddleware, roleMiddleware('ADMIN'), paymentController.confirmPayment);

// Customer sees own payments, Admin sees all (handled inside the controller)
router.get('/', authMiddleware, paymentController.getPayments);
router.get('/:orderId', authMiddleware, paymentController.getPaymentByOrder);

module.exports = router;