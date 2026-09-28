// routes/quotationRoutes.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const quotationController = require('../controllers/quotationController');

// Only Admin can create and send a quotation
router.post('/', authMiddleware, roleMiddleware('ADMIN'), quotationController.createQuotation);

// Customer sees own quotations, Admin sees all (handled inside the controller)
router.get('/', authMiddleware, quotationController.getQuotations);
router.get('/:id', authMiddleware, quotationController.getQuotationById);

// Only Customer can accept/reject their own quotation
router.patch('/:id/respond', authMiddleware, roleMiddleware('CUSTOMER'), quotationController.respondToQuotation);

module.exports = router;