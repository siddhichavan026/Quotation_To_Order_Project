const pool = require('../config/db');


async function confirmPayment(req, res) {
  const { orderId } = req.params;
  const admin_id = req.user.user_id;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [orderRows] = await connection.query('SELECT * FROM orders WHERE order_id = ? FOR UPDATE', [orderId]);
    if (orderRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Order not found.' });
    }
    const order = orderRows[0];

    const [paymentRows] = await connection.query('SELECT * FROM payments WHERE order_id = ? FOR UPDATE', [orderId]);
    if (paymentRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Payment record not found for this order.' });
    }
    const payment = paymentRows[0];

    if (payment.payment_status === 'FULLY_PAID') {
      await connection.rollback();
      return res.status(400).json({ message: 'This payment has already been marked as fully paid.' });
    }

    // amount_paid is set to the order's total_amount, since partial payments are not supported
    await connection.query(
      `UPDATE payments
       SET payment_status = 'FULLY_PAID', amount_paid = ?, payment_date = NOW(), recorded_by = ?
       WHERE order_id = ?`,
      [order.total_amount, admin_id, orderId]
    );

    await connection.commit();
    return res.status(200).json({ message: 'Payment confirmed successfully. Order is now FULLY_PAID.' });

  } catch (err) {
    await connection.rollback();
    console.error('confirmPayment error:', err);
    return res.status(500).json({ message: 'Failed to confirm payment.' });
  } finally {
    connection.release();
  }
}

// GET /api/payments
// ADMIN sees all payment records, CUSTOMER sees only payments for their own orders.
async function getPayments(req, res) {
  try {
    let payments;

    if (req.user.role === 'ADMIN') {
      [payments] = await pool.query(
        `SELECT p.*, o.customer_id, o.total_amount AS order_total_amount, o.status AS order_status
         FROM payments p
         JOIN orders o ON o.order_id = p.order_id
         ORDER BY p.payment_id DESC`
      );
    } else {
      [payments] = await pool.query(
        `SELECT p.*, o.customer_id, o.total_amount AS order_total_amount, o.status AS order_status
         FROM payments p
         JOIN orders o ON o.order_id = p.order_id
         WHERE o.customer_id = ?
         ORDER BY p.payment_id DESC`,
        [req.user.user_id]
      );
    }

    return res.status(200).json({ payments });
  } catch (err) {
    console.error('getPayments error:', err);
    return res.status(500).json({ message: 'Failed to fetch payments.' });
  }
}

// GET /api/payments/:orderId
async function getPaymentByOrder(req, res) {
  try {
    const { orderId } = req.params;

    const [orderRows] = await pool.query('SELECT * FROM orders WHERE order_id = ?', [orderId]);
    if (orderRows.length === 0) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    const order = orderRows[0];

    if (req.user.role === 'CUSTOMER' && order.customer_id !== req.user.user_id) {
      return res.status(403).json({ message: 'You are not allowed to view this payment.' });
    }

    const [paymentRows] = await pool.query('SELECT * FROM payments WHERE order_id = ?', [orderId]);
    if (paymentRows.length === 0) {
      return res.status(404).json({ message: 'Payment record not found.' });
    }

    return res.status(200).json({ payment: paymentRows[0] });
  } catch (err) {
    console.error('getPaymentByOrder error:', err);
    return res.status(500).json({ message: 'Failed to fetch payment.' });
  }
}

module.exports = {
  confirmPayment,
  getPayments,
  getPaymentByOrder
};