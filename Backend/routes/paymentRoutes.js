
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const paymentController = require('../controllers/paymentController');

router.patch('/:orderId/confirm', authMiddleware, roleMiddleware('ADMIN'), paymentController.confirmPayment);

router.get('/', authMiddleware, paymentController.getPayments);
router.get('/:orderId', authMiddleware, paymentController.getPaymentByOrder);

module.exports = router;