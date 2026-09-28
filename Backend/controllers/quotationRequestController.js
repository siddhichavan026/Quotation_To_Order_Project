// controllers/quotationRequestController.js
// Handles customer quotation requests (before any pricing exists).
// Tables used: quotation_requests, quotation_request_items, products

const pool = require('../config/db');

// POST /api/quotation-requests (CUSTOMER only)
// Body: { items: [ { product_id, requested_quantity }, ... ] }
async function createRequest(req, res) {
  const customer_id = req.user.user_id;
  const { items } = req.body;

  // 1. Basic validation (no DB needed yet)
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'items must be a non-empty array of { product_id, requested_quantity }.' });
  }

  for (const item of items) {
    if (!item.product_id || !item.requested_quantity) {
      return res.status(400).json({ message: 'Each item must include product_id and requested_quantity.' });
    }
    if (!Number.isInteger(Number(item.requested_quantity)) || Number(item.requested_quantity) <= 0) {
      return res.status(400).json({ message: 'requested_quantity must be a whole number greater than 0.' });
    }
    if (!Number.isInteger(Number(item.product_id))) {
      return res.status(400).json({ message: 'product_id must be a valid product id.' });
    }
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 2. Validate every product exists and is in stock (out-of-stock products cannot be requested)
    for (const item of items) {
      const [productRows] = await connection.query(
        'SELECT product_id, stock_quantity FROM products WHERE product_id = ?',
        [item.product_id]
      );

      if (productRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: `Product with id ${item.product_id} not found.` });
      }
      if (productRows[0].stock_quantity <= 0) {
        await connection.rollback();
        return res.status(400).json({ message: `Product with id ${item.product_id} is out of stock and cannot be requested.` });
      }
    }

    // 3. Create the request (stock is NOT reduced at this stage)
    const [requestResult] = await connection.query(
      'INSERT INTO quotation_requests (customer_id, status) VALUES (?, ?)',
      [customer_id, 'PENDING']
    );
    const request_id = requestResult.insertId;

    // 4. Insert each requested line item
    for (const item of items) {
      await connection.query(
        'INSERT INTO quotation_request_items (request_id, product_id, requested_quantity) VALUES (?, ?, ?)',
        [request_id, item.product_id, item.requested_quantity]
      );
    }

    await connection.commit();
    return res.status(201).json({ message: 'Quotation request created successfully.', request_id });

  } catch (err) {
    await connection.rollback();
    console.error('createRequest error:', err);
    return res.status(500).json({ message: 'Failed to create quotation request.' });
  } finally {
    connection.release();
  }
}

// Helper: attach line items to a list of requests
async function attachItems(requests) {
  for (const request of requests) {
    const [items] = await pool.query(
      `SELECT qri.request_item_id, qri.product_id, p.name AS product_name, qri.requested_quantity
       FROM quotation_request_items qri
       JOIN products p ON p.product_id = qri.product_id
       WHERE qri.request_id = ?`,
      [request.request_id]
    );
    request.items = items;
  }
  return requests;
}

// GET /api/quotation-requests
// CUSTOMERsees only their own requests, ADMIN sees all requests.
async function getRequests(req, res) {
  try {
    let requests;

    if (req.user.role === 'ADMIN') {
      [requests] = await pool.query('SELECT * FROM quotation_requests ORDER BY request_id DESC');
    } else {
      [requests] = await pool.query(
        'SELECT * FROM quotation_requests WHERE customer_id = ? ORDER BY request_id DESC',
        [req.user.user_id]
      );
    }

    await attachItems(requests);
    return res.status(200).json({ requests });
  } catch (err) {
    console.error('getRequests error:', err);
    return res.status(500).json({ message: 'Failed to fetch quotation requests.' });
  }
}

// GET /api/quotation-requests/:id
async function getRequestById(req, res) {
  try {
    const { id } = req.params;

    const [requestRows] = await pool.query('SELECT * FROM quotation_requests WHERE request_id = ?', [id]);
    if (requestRows.length === 0) {
      return res.status(404).json({ message: 'Quotation request not found.' });
    }

    const request = requestRows[0];

    // A customer can only view their own request
    if (req.user.role === 'CUSTOMER' && request.customer_id !== req.user.user_id) {
      return res.status(403).json({ message: 'You are not allowed to view this request.' });
    }

    await attachItems([request]);
    return res.status(200).json({ request });
  } catch (err) {
    console.error('getRequestById error:', err);
    return res.status(500).json({ message: 'Failed to fetch quotation request.' });
  }
}

module.exports = {
  createRequest,
  getRequests,
  getRequestById
};