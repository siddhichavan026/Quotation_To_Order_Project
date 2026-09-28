// src/pages/customer/OrderDetails.jsx
// Shows order items (with the prices locked in at quotation time),
// order status, and payment information. This is read-only for the
// customer - payment is confirmed manually by Admin, and there is no
// online payment gateway.

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderById } from '../../services/orderService';
import StatusBadge from '../../components/StatusBadge';

const PAYMENT_METHOD_LABELS = {
  CASH_ON_DELIVERY: 'Cash on Delivery',
  UPI: 'UPI',
  BANK_TRANSFER: 'Bank Transfer'
};

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOrder();
  }, [id]);

  async function loadOrder() {
    setLoading(true);
    setError('');
    try {
      const data = await getOrderById(id);
      setOrder(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load this order.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Order #{id}</h1>
        <Link to="/customer/orders" className="btn btn-secondary">Back to List</Link>
      </div>

      {loading && <p className="text-muted">Loading...</p>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && order && (
        <>
          <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
            <p style={{ marginBottom: 'var(--space-2)' }}>
              <strong>Order Status:</strong> <StatusBadge status={order.status} />
            </p>
            <p className="text-muted">
              Created on {new Date(order.created_at).toLocaleString()}
            </p>
          </div>

          <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>Order Items</h2>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Unit Price</th>
                    <th className="text-right">Tax Rate</th>
                    <th className="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.order_item_id}>
                      <td>{item.product_name}</td>
                      <td className="text-right">{item.quantity}</td>
                      <td className="text-right">₹{Number(item.unit_price).toFixed(2)}</td>
                      <td className="text-right">{Number(item.tax_rate)}%</td>
                      <td className="text-right">₹{Number(item.subtotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ textAlign: 'right', marginTop: 'var(--space-4)', fontSize: '16px', fontWeight: 600 }}>
              Total: ₹{Number(order.total_amount).toFixed(2)}
            </div>
          </div>

          <div className="card">
            <h2 style={{ marginBottom: 'var(--space-4)' }}>Payment Information</h2>
            {order.payment ? (
              <div>
                <p style={{ marginBottom: 'var(--space-2)' }}>
                  <strong>Method:</strong>{' '}
                  {PAYMENT_METHOD_LABELS[order.payment.payment_method] || order.payment.payment_method}
                </p>
                <p style={{ marginBottom: 'var(--space-2)' }}>
                  <strong>Status:</strong> <StatusBadge status={order.payment.payment_status} />
                </p>
                {order.payment.payment_status === 'FULLY_PAID' && order.payment.payment_date && (
                  <p className="text-muted">
                    Confirmed on {new Date(order.payment.payment_date).toLocaleString()}
                  </p>
                )}
                {order.payment.payment_status === 'UNPAID' && (
                  <p className="text-muted mt-4">
                    Payment is confirmed manually by the admin once received. There is no online
                    payment gateway - no action is needed from you here.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted">Payment information is not available.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}