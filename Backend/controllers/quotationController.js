
const pool = require('../config/db');

// Convert a DATE value to a "YYYY-MM-DD" string (using the server's local date).
function toDateString(value) {
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(value).slice(0, 10);
}


function isPastValidity(quotation) {
  return toDateString(quotation.valid_until) < toDateString(new Date());
}

async function createQuotation(req, res) {
  const admin_id = req.user.user_id;
  const { request_id, valid_until } = req.body;

  if (!request_id || !valid_until) {
    return res.status(400).json({ message: 'request_id and valid_until are required.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [requestRows] = await connection.query(
      'SELECT * FROM quotation_requests WHERE request_id = ? FOR UPDATE',
      [request_id]
    );
    if (requestRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Quotation request not found.' });
    }
    const request = requestRows[0];

    if (request.status !== 'PENDING') {
      await connection.rollback();
      return res.status(400).json({ message: 'A quotation has already been created for this request.' });
    }

    const [requestItems] = await connection.query(
      'SELECT * FROM quotation_request_items WHERE request_id = ?',
      [request_id]
    );
    if (requestItems.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'This request has no items.' });
    }

  
    let total_amount = 0;
    const quotationItemsData = [];

    for (const item of requestItems) {
      const [productRows] = await connection.query('SELECT * FROM products WHERE product_id = ?', [item.product_id]);
      if (productRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: `Product with id ${item.product_id} no longer exists.` });
      }

      const product = productRows[0];
      const quantity = item.requested_quantity;
      const unit_price = Number(product.price);
      const tax_rate = Number(product.tax_rate);

      const lineBase = quantity * unit_price;
      const lineTax = lineBase * (tax_rate / 100);
      const subtotal = lineBase + lineTax;

      total_amount += subtotal;
      quotationItemsData.push({ product_id: item.product_id, quantity, unit_price, tax_rate, subtotal });
    }

    const [quotationResult] = await connection.query(
      `INSERT INTO quotations (request_id, customer_id, admin_id, status, valid_until, total_amount, sent_at)
       VALUES (?, ?, ?, 'SENT', ?, ?, NOW())`,
      [request_id, request.customer_id, admin_id, valid_until, total_amount.toFixed(2)]
    );
    const quotation_id = quotationResult.insertId;

    for (const qi of quotationItemsData) {
      await connection.query(
        `INSERT INTO quotation_items (quotation_id, product_id, quantity, unit_price, tax_rate, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [quotation_id, qi.product_id, qi.quantity, qi.unit_price, qi.tax_rate, qi.subtotal.toFixed(2)]
      );
    }

    
    await connection.query('UPDATE quotation_requests SET status = ? WHERE request_id = ?', ['CONVERTED', request_id]);

    await connection.commit();
    return res.status(201).json({
      message: 'Quotation created and sent successfully.',
      quotation_id,
      total_amount: total_amount.toFixed(2)
    });

  } catch (err) {
    await connection.rollback();
    console.error('createQuotation error:', err);
    return res.status(500).json({ message: 'Failed to create quotation.' });
  } finally {
    connection.release();
  }
}

// Helper: attach line items to a list of quotations
async function attachItems(quotations) {
  for (const quotation of quotations) {
    const [items] = await pool.query(
      `SELECT qi.quotation_item_id, qi.product_id, p.name AS product_name, qi.quantity, qi.unit_price, qi.tax_rate, qi.subtotal
       FROM quotation_items qi
       JOIN products p ON p.product_id = qi.product_id
       WHERE qi.quotation_id = ?`,
      [quotation.quotation_id]
    );
    quotation.items = items;
  }
  return quotations;
}

async function getQuotations(req, res) {
  try {
    let quotations;

    if (req.user.role === 'ADMIN') {
      [quotations] = await pool.query('SELECT * FROM quotations ORDER BY quotation_id DESC');
    } else {
      [quotations] = await pool.query(
        'SELECT * FROM quotations WHERE customer_id = ? ORDER BY quotation_id DESC',
        [req.user.user_id]
      );
    }

    for (const quotation of quotations) {
      if (quotation.status === 'SENT' && isPastValidity(quotation)) {
        await pool.query('UPDATE quotations SET status = ? WHERE quotation_id = ?', ['EXPIRED', quotation.quotation_id]);
        quotation.status = 'EXPIRED';
      }
    }

    await attachItems(quotations);
    return res.status(200).json({ quotations });
  } catch (err) {
    console.error('getQuotations error:', err);
    return res.status(500).json({ message: 'Failed to fetch quotations.' });
  }
}

// GET /api/quotations/:id
async function getQuotationById(req, res) {
  try {
    const { id } = req.params;

    const [quotationRows] = await pool.query('SELECT * FROM quotations WHERE quotation_id = ?', [id]);
    if (quotationRows.length === 0) {
      return res.status(404).json({ message: 'Quotation not found.' });
    }
    const quotation = quotationRows[0];

    if (req.user.role === 'CUSTOMER' && quotation.customer_id !== req.user.user_id) {
      return res.status(403).json({ message: 'You are not allowed to view this quotation.' });
    }

    if (quotation.status === 'SENT' && isPastValidity(quotation)) {
      await pool.query('UPDATE quotations SET status = ? WHERE quotation_id = ?', ['EXPIRED', id]);
      quotation.status = 'EXPIRED';
    }

    await attachItems([quotation]);
    return res.status(200).json({ quotation });
  } catch (err) {
    console.error('getQuotationById error:', err);
    return res.status(500).json({ message: 'Failed to fetch quotation.' });
  }
}

async function respondToQuotation(req, res) {
  const { id } = req.params;
  const { decision } = req.body;
  const customer_id = req.user.user_id;

  if (!decision || !['ACCEPT', 'REJECT'].includes(decision)) {
    return res.status(400).json({ message: "decision must be 'ACCEPT' or 'REJECT'." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [quotationRows] = await connection.query('SELECT * FROM quotations WHERE quotation_id = ? FOR UPDATE', [id]);
    if (quotationRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Quotation not found.' });
    }
    const quotation = quotationRows[0];

    if (quotation.customer_id !== customer_id) {
      await connection.rollback();
      return res.status(403).json({ message: 'You are not allowed to respond to this quotation.' });
    }

    if (quotation.status === 'SENT' && isPastValidity(quotation)) {
      await connection.query('UPDATE quotations SET status = ? WHERE quotation_id = ?', ['EXPIRED', id]);
      await connection.commit();
      return res.status(400).json({ message: 'This quotation has expired and can no longer be accepted or rejected.' });
    }

    if (quotation.status !== 'SENT') {
      await connection.rollback();
      return res.status(400).json({ message: `This quotation cannot be responded to. Current status: ${quotation.status}.` });
    }

    const newStatus = decision === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED';
    await connection.query(
      'UPDATE quotations SET status = ?, responded_at = NOW() WHERE quotation_id = ?',
      [newStatus, id]
    );

    await connection.commit();
    return res.status(200).json({ message: `Quotation ${newStatus.toLowerCase()} successfully.` });

  } catch (err) {
    await connection.rollback();
    console.error('respondToQuotation error:', err);
    return res.status(500).json({ message: 'Failed to respond to quotation.' });
  } finally {
    connection.release();
  }
}

module.exports = {
  createQuotation,
  getQuotations,
  getQuotationById,
  respondToQuotation
};