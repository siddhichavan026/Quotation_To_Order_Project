// controllers/orderController.js
// Handles converting an accepted quotation into an order,
// viewing orders, updating order status and cancelling orders.
// Tables used: orders, order_items, quotations, quotation_items, products, payments

const pool = require('../config/db');

const VALID_PAYMENT_METHODS = [
  'CASH_ON_DELIVERY',
  'UPI',
  'BANK_TRANSFER'
];

// POST /api/orders/convert (ADMIN only)
// Body: { quotation_id, payment_method }
async function convertToOrder(req, res) {
  const admin_id = req.user.user_id;
  const { quotation_id, payment_method } = req.body;

  if (!quotation_id) {
    return res.status(400).json({
      message: 'quotation_id is required.'
    });
  }

  const finalPaymentMethod = payment_method || 'CASH_ON_DELIVERY';

  if (!VALID_PAYMENT_METHODS.includes(finalPaymentMethod)) {
    return res.status(400).json({
      message:
        'payment_method must be CASH_ON_DELIVERY, UPI, or BANK_TRANSFER.'
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Lock and validate quotation
    const [quotationRows] = await connection.query(
      'SELECT * FROM quotations WHERE quotation_id = ? FOR UPDATE',
      [quotation_id]
    );

    if (quotationRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        message: 'Quotation not found.'
      });
    }

    const quotation = quotationRows[0];

    if (quotation.status !== 'ACCEPTED') {
      await connection.rollback();
      return res.status(400).json({
        message: `Only an accepted quotation can be converted into an order. Current status: ${quotation.status}.`
      });
    }

    // 2. Check if quotation is already converted
    const [existingOrders] = await connection.query(
      'SELECT order_id FROM orders WHERE quotation_id = ?',
      [quotation_id]
    );

    if (existingOrders.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        message: 'This quotation has already been converted into an order.'
      });
    }

    // Get quotation items
    const [quotationItems] = await connection.query(
      'SELECT * FROM quotation_items WHERE quotation_id = ?',
      [quotation_id]
    );

    // 3. Calculate required quantity for each product
    const requiredByProduct = {};

    for (const item of quotationItems) {
      requiredByProduct[item.product_id] =
        (requiredByProduct[item.product_id] || 0) + item.quantity;
    }

    // 4. Check current stock
    const insufficientItems = [];

    for (const productId of Object.keys(requiredByProduct)) {
      const [productRows] = await connection.query(
        `SELECT product_id, name, stock_quantity
         FROM products
         WHERE product_id = ?
         FOR UPDATE`,
        [productId]
      );

      const product = productRows[0];
      const required = requiredByProduct[productId];

      if (!product || product.stock_quantity < required) {
        insufficientItems.push({
          product_id: Number(productId),
          product_name: product ? product.name : 'Unknown',
          required,
          available: product ? product.stock_quantity : 0
        });
      }
    }

    // If stock is insufficient, do not create order
    // and do not reduce stock.
    if (insufficientItems.length > 0) {
      await connection.rollback();

      return res.status(400).json({
        message: 'Order cannot be created due to insufficient stock.',
        insufficient_items: insufficientItems
      });
    }

    // 5. Create order
    const [orderResult] = await connection.query(
      `INSERT INTO orders
       (quotation_id, customer_id, admin_id, status, total_amount)
       VALUES (?, ?, ?, 'CREATED', ?)`,
      [
        quotation_id,
        quotation.customer_id,
        admin_id,
        quotation.total_amount
      ]
    );

    const order_id = orderResult.insertId;

    // 6. Copy quotation items into order items
    // and reduce stock.
    for (const item of quotationItems) {
      await connection.query(
        `INSERT INTO order_items
         (order_id, product_id, quantity, unit_price, tax_rate, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          order_id,
          item.product_id,
          item.quantity,
          item.unit_price,
          item.tax_rate,
          item.subtotal
        ]
      );

      await connection.query(
        `UPDATE products
         SET stock_quantity = stock_quantity - ?
         WHERE product_id = ?`,
        [item.quantity, item.product_id]
      );
    }

    // 7. Mark quotation as converted
    await connection.query(
      'UPDATE quotations SET status = ? WHERE quotation_id = ?',
      ['CONVERTED', quotation_id]
    );

    // 8. Create initial payment record
    // Payment always starts as UNPAID.
    await connection.query(
      `INSERT INTO payments
       (order_id, payment_method, payment_status)
       VALUES (?, ?, 'UNPAID')`,
      [order_id, finalPaymentMethod]
    );

    await connection.commit();

    return res.status(201).json({
      message: 'Order created successfully.',
      order_id
    });

  } catch (err) {
    await connection.rollback();

    console.error('convertToOrder error:', err);

    return res.status(500).json({
      message: 'Failed to convert quotation into order.'
    });

  } finally {
    connection.release();
  }
}


// Helper function:
// Attach order items and payment information.
async function attachDetails(orders) {
  for (const order of orders) {

    const [items] = await pool.query(
      `SELECT
         oi.order_item_id,
         oi.product_id,
         p.name AS product_name,
         oi.quantity,
         oi.unit_price,
         oi.tax_rate,
         oi.subtotal
       FROM order_items oi
       JOIN products p
         ON p.product_id = oi.product_id
       WHERE oi.order_id = ?`,
      [order.order_id]
    );

    order.items = items;

    const [paymentRows] = await pool.query(
      `SELECT
         payment_id,
         payment_method,
         payment_status,
         amount_paid,
         payment_date
       FROM payments
       WHERE order_id = ?`,
      [order.order_id]
    );

    order.payment = paymentRows[0] || null;
  }

  return orders;
}


// GET /api/orders
// CUSTOMER → only own orders
// ADMIN → all orders
async function getOrders(req, res) {
  try {
    let orders;

    if (req.user.role === 'ADMIN') {

      [orders] = await pool.query(
        'SELECT * FROM orders ORDER BY order_id DESC'
      );

    } else {

      [orders] = await pool.query(
        `SELECT *
         FROM orders
         WHERE customer_id = ?
         ORDER BY order_id DESC`,
        [req.user.user_id]
      );
    }

    await attachDetails(orders);

    return res.status(200).json({
      orders
    });

  } catch (err) {

    console.error('getOrders error:', err);

    return res.status(500).json({
      message: 'Failed to fetch orders.'
    });
  }
}


// GET /api/orders/:id
async function getOrderById(req, res) {
  try {
    const { id } = req.params;

    const [orderRows] = await pool.query(
      'SELECT * FROM orders WHERE order_id = ?',
      [id]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({
        message: 'Order not found.'
      });
    }

    const order = orderRows[0];

    // Customer can only see own order.
    if (
      req.user.role === 'CUSTOMER' &&
      order.customer_id !== req.user.user_id
    ) {
      return res.status(403).json({
        message: 'You are not allowed to view this order.'
      });
    }

    await attachDetails([order]);

    return res.status(200).json({
      order
    });

  } catch (err) {

    console.error('getOrderById error:', err);

    return res.status(500).json({
      message: 'Failed to fetch order.'
    });
  }
}


const ORDER_STATUSES = [
  'CREATED',
  'PROCESSING',
  'COMPLETED',
  'CANCELLED'
];


// PATCH /api/orders/:id/status (ADMIN only)
// Body:
// {
//   "status": "PROCESSING"
// }
//
// or
//
// {
//   "status": "COMPLETED"
// }
//
// or
//
// {
//   "status": "CANCELLED"
// }
//
// Business rules:
// 1. COMPLETED requires FULLY_PAID.
// 2. COMPLETED cannot be changed.
// 3. CANCELLED cannot be changed.
// 4. When an order is CANCELLED, its quantities are
//    added back to product stock.
async function updateOrderStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !ORDER_STATUSES.includes(status)) {
    return res.status(400).json({
      message:
        'status must be one of CREATED, PROCESSING, COMPLETED, CANCELLED.'
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Lock the order row
    const [orderRows] = await connection.query(
      'SELECT * FROM orders WHERE order_id = ? FOR UPDATE',
      [id]
    );

    if (orderRows.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: 'Order not found.'
      });
    }

    const order = orderRows[0];

    // 2. Completed and cancelled orders cannot be changed
    if ( order.status === 'COMPLETED' ||
      order.status === 'CANCELLED'
    ) {
      await connection.rollback();

      return res.status(400).json({
        message:
          `Order is already ${order.status} and cannot be changed.`
      });
    }

    if (status === 'CANCELLED') {
    const [paymentRows] = await connection.query(
      'SELECT payment_status FROM payments WHERE order_id = ?',
      [id]
    );

    if (paymentRows.length > 0 && paymentRows[0].payment_status === 'FULLY_PAID') {
      await connection.rollback();
      return res.status(400).json({
        message: 'A fully paid order cannot be cancelled.'
      });
    }
  }

    
    if (status === order.status) {
      await connection.rollback();

      return res.status(400).json({
        message:
          `Order is already ${order.status}.`
      });
    }

   
    if (status === 'CREATED') {
      await connection.rollback();

      return res.status(400).json({
        message:
          'An order cannot be moved back to CREATED.'
      });
    }

    if (status === 'COMPLETED') {

      const [paymentRows] = await connection.query(
        `SELECT payment_status
         FROM payments
         WHERE order_id = ?`,
        [id]
      );

      if (
        paymentRows.length === 0 ||
        paymentRows[0].payment_status !== 'FULLY_PAID'
      ) {
        await connection.rollback();

        return res.status(400).json({
          message:
            'Order can only be marked COMPLETED after payment is FULLY_PAID.'
        });
      }
    }

   
    if (status === 'CANCELLED') {

      const [orderItems] = await connection.query(
        `SELECT product_id, quantity
         FROM order_items
         WHERE order_id = ?
         FOR UPDATE`,
        [id]
      );

      for (const item of orderItems) {

        await connection.query(
          `UPDATE products
           SET stock_quantity = stock_quantity + ?
           WHERE product_id = ?`,
          [item.quantity, item.product_id]
        );
      }
    }

    // 7. Update order status
    await connection.query(
      'UPDATE orders SET status = ? WHERE order_id = ?',
      [status, id]
    );

    await connection.commit();

    return res.status(200).json({
      message:
        `Order status updated to ${status}.`
    });

  } catch (err) {

    await connection.rollback();

    console.error('updateOrderStatus error:', err);

    return res.status(500).json({
      message: 'Failed to update order status.'
    });

  } finally {
    connection.release();
  }
}


module.exports = {
  convertToOrder,
  getOrders,
  getOrderById,
  updateOrderStatus
};