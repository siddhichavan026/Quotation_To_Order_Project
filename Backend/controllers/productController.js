// controllers/productController.js
// Handles product catalog operations.
// Table used: products (product_id, name, description, price, tax_rate, stock_quantity, created_at)

const pool = require('../config/db');

// Validation helpers: reject non-numeric text, blanks, booleans and negatives
// (a plain "value < 0" check lets things like "abc" through, because
// comparing NaN with a number is always false).
function isNonNegativeNumber(value) {
  if (value === null || value === '' || typeof value === 'boolean') return false;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0;
}

function isNonNegativeInteger(value) {
  return isNonNegativeNumber(value) && Number.isInteger(Number(value));
}

// GET /api/products
// Any logged-in user (Customer or Admin) can view products.
async function getAllProducts(req, res) {
  try {
    const [products] = await pool.query('SELECT * FROM products ORDER BY product_id DESC');
    return res.status(200).json({ products });
  } catch (err) {
    console.error('getAllProducts error:', err);
    return res.status(500).json({ message: 'Failed to fetch products.' });
  }
}

// POST /api/products (ADMIN only)
async function createProduct(req, res) {
  try {
    const { name, description, price, tax_rate, stock_quantity } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ message: 'name and price are required.' });
    }
    if (!isNonNegativeNumber(price)) {
      return res.status(400).json({ message: 'price must be a number that is 0 or more.' });
    }

    const finalTaxRate = tax_rate !== undefined ? tax_rate : 0;
    const finalStock = stock_quantity !== undefined ? stock_quantity : 0;

    if (!isNonNegativeNumber(finalTaxRate)) {
      return res.status(400).json({ message: 'tax_rate must be a number that is 0 or more.' });
    }
    if (!isNonNegativeInteger(finalStock)) {
      return res.status(400).json({ message: 'stock_quantity must be a whole number that is 0 or more.' });
    }

    const [result] = await pool.query(
      'INSERT INTO products (name, description, price, tax_rate, stock_quantity) VALUES (?, ?, ?, ?, ?)',
      [name, description || null, Number(price), Number(finalTaxRate), Number(finalStock)]
    );

    return res.status(201).json({
      message: 'Product created successfully.',
      product: {
        product_id: result.insertId,
        name,
        description: description || null,
        price: Number(price),
        tax_rate: Number(finalTaxRate),
        stock_quantity: Number(finalStock)
      }
    });
  } catch (err) {
    console.error('createProduct error:', err);
    return res.status(500).json({ message: 'Failed to create product.' });
  }
}

// PUT /api/products/:id (ADMIN only)
async function updateProduct(req, res) {
  try {
    const { id } = req.params;

    const [existingRows] = await pool.query('SELECT * FROM products WHERE product_id = ?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    const current = existingRows[0];

    const { name, description, price, tax_rate, stock_quantity } = req.body;

    const updatedName = name !== undefined ? name : current.name;
    const updatedDescription = description !== undefined ? description : current.description;
    const updatedPrice = price !== undefined ? price : current.price;
    const updatedTaxRate = tax_rate !== undefined ? tax_rate : current.tax_rate;
    const updatedStock = stock_quantity !== undefined ? stock_quantity : current.stock_quantity;

    if (!isNonNegativeNumber(updatedPrice)) {
      return res.status(400).json({ message: 'price must be a number that is 0 or more.' });
    }
    if (!isNonNegativeNumber(updatedTaxRate)) {
      return res.status(400).json({ message: 'tax_rate must be a number that is 0 or more.' });
    }
    if (!isNonNegativeInteger(updatedStock)) {
      return res.status(400).json({ message: 'stock_quantity must be a whole number that is 0 or more.' });
    }

    await pool.query(
      'UPDATE products SET name = ?, description = ?, price = ?, tax_rate = ?, stock_quantity = ? WHERE product_id = ?',
      [updatedName, updatedDescription, Number(updatedPrice), Number(updatedTaxRate), Number(updatedStock), id]
    );

    return res.status(200).json({ message: 'Product updated successfully.' });
  } catch (err) {
    console.error('updateProduct error:', err);
    return res.status(500).json({ message: 'Failed to update product.' });
  }
}

// DELETE /api/products/:id (ADMIN only)
async function deleteProduct(req, res) {
  try {
    const { id } = req.params;

    const [existingRows] = await pool.query('SELECT product_id FROM products WHERE product_id = ?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    await pool.query('DELETE FROM products WHERE product_id = ?', [id]);
    return res.status(200).json({ message: 'Product deleted successfully.' });
  } catch (err) {
    console.error('deleteProduct error:', err);

    // This product is already referenced by a request/quotation/order (ON DELETE RESTRICT)
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(409).json({
        message: 'This product cannot be deleted because it is already used in a quotation request, quotation, or order.'
      });
    }

    return res.status(500).json({ message: 'Failed to delete product.' });
  }
}

module.exports = {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct
};