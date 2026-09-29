const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const quotationRequestController = require('../controllers/quotationRequestController');

router.post('/', authMiddleware, roleMiddleware('CUSTOMER'), quotationRequestController.createRequest);

router.get('/', authMiddleware, quotationRequestController.getRequests);
router.get('/:id', authMiddleware, quotationRequestController.getRequestById);

module.exports = router;