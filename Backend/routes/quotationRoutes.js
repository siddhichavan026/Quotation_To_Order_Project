const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const quotationController = require('../controllers/quotationController');

router.post('/', authMiddleware, roleMiddleware('ADMIN'), quotationController.createQuotation);

router.get('/', authMiddleware, quotationController.getQuotations);
router.get('/:id', authMiddleware, quotationController.getQuotationById);

router.patch('/:id/respond', authMiddleware, roleMiddleware('CUSTOMER'), quotationController.respondToQuotation);

module.exports = router;