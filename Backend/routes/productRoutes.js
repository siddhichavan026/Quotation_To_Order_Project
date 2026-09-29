const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const productController = require('../controllers/productController');

router.get('/', authMiddleware, productController.getAllProducts);


router.post('/', authMiddleware, roleMiddleware('ADMIN'), productController.createProduct);
router.put('/:id', authMiddleware, roleMiddleware('ADMIN'), productController.updateProduct);
router.delete('/:id', authMiddleware, roleMiddleware('ADMIN'), productController.deleteProduct);

module.exports = router;