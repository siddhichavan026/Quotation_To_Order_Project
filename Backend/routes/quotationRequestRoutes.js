// routes/quotationRequestRoutes.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const quotationRequestController = require('../controllers/quotationRequestController');

// Only Customer can create a request
router.post('/', authMiddleware, roleMiddleware('CUSTOMER'), quotationRequestController.createRequest);

// Customer sees own requests, Admin sees all (handled inside the controller)
router.get('/', authMiddleware, quotationRequestController.getRequests);
router.get('/:id', authMiddleware, quotationRequestController.getRequestById);

module.exports = router;