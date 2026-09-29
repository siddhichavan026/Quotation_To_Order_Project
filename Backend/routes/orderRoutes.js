const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const orderController = require('../controllers/orderController');


router.post('/convert', authMiddleware, roleMiddleware('ADMIN'), orderController.convertToOrder);

router.get('/', authMiddleware, orderController.getOrders);
router.get('/:id', authMiddleware, orderController.getOrderById);

router.patch('/:id/status', authMiddleware, roleMiddleware('ADMIN'), orderController.updateOrderStatus);

module.exports = router;