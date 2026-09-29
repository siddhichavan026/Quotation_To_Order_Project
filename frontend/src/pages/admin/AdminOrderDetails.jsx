import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderById, updateOrderStatus } from '../../services/orderService';
import { confirmPayment } from '../../services/paymentService';
import StatusBadge from '../../components/StatusBadge';

const PAYMENT_METHOD_LABELS = {
  CASH_ON_DELIVERY: 'Cash on Delivery',
  UPI: 'UPI',
  BANK_TRANSFER: 'Bank Transfer'
};

export default function AdminOrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadOrder();
  }, [id]);

  async function loadOrder(quiet = false) {
    if (!quiet) {
      setLoading(true);
      setError('');
    }
    try {
      const data = await getOrderById(id);
      setOrder(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load this order.');
    } finally {
      if (!quiet) setLoading(false);
    }
  }

  async function handleStatusChange(status) {
    if (status === 'CANCELLED' && !window.confirm('Cancel this order? This cannot be undone.')) {
      return;
    }
    setError('');
    setSuccess('');
    setBusy(true);
    try {
      const data = await updateOrderStatus(id, status);
      setSuccess(data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status.');
    } finally {
      await loadOrder(true);
      setBusy(false);
    }
  }

  async function handleConfirmPayment() {
    setError('');
    setSuccess('');
    setBusy(true);
    try {
      const data = await confirmPayment(id);
      setSuccess(data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm payment.');
    } finally {
      await loadOrder(true);
      setBusy(false);
    }
  }

  const isPaid = order?.payment?.payment_status === 'FULLY_PAID';
  const isClosed = order && (order.status === 'COMPLETED' || order.status === 'CANCELLED');

  return (
    <div>
      <div className="page-header">
        <h1>Order #{id}</h1>
        <Link to="/admin/orders" className="btn btn-secondary">Back to List</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      {loading && <p className="text-muted">Loading...</p>}

      {!loading && order && (
        <>
          <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
            <p style={{ marginBottom: 'var(--space-2)' }}>
              <strong>Order Status:</strong> <StatusBadge status={order.status} />
            </p>
            <p className="text-muted">Customer ID: {order.customer_id}</p>
            <p className="text-muted">Created on {new Date(order.created_at).toLocaleString()}</p>

            {!isClosed && (
              <div className="btn-group mt-6">
                {order.status === 'CREATED' && (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleStatusChange('PROCESSING')}
                    disabled={busy}
                  >
                    Mark as Processing
                  </button>
                )}
                <button
                  className="btn btn-success"
                  onClick={() => handleStatusChange('COMPLETED')}
                  disabled={busy || !isPaid}
                  title={!isPaid ? 'Payment must be FULLY_PAID before completing the order' : ''}
                >
                  Mark as Completed
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleStatusChange('CANCELLED')}
                  disabled={busy}
                >
                  Cancel Order
                </button>
              </div>
            )}

            {!isClosed && !isPaid && (
              <p className="text-muted mt-4">
                "Mark as Completed" is disabled until the payment is confirmed as FULLY_PAID.
              </p>
            )}
          </div>

          <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>Payment</h2>
            {order.payment ? (
              <div>
                <p style={{ marginBottom: 'var(--space-2)' }}>
                  <strong>Method:</strong>{' '}
                  {PAYMENT_METHOD_LABELS[order.payment.payment_method] || order.payment.payment_method}
                </p>
                <p style={{ marginBottom: 'var(--space-2)' }}>
                  <strong>Status:</strong> <StatusBadge status={order.payment.payment_status} />
                </p>
                {isPaid && order.payment.payment_date && (
                  <p className="text-muted">
                    Confirmed on {new Date(order.payment.payment_date).toLocaleString()}
                  </p>
                )}
                {!isPaid && order.status !== 'CANCELLED' && (
                  <button
                    className="btn btn-success mt-4"
                    onClick={handleConfirmPayment}
                    disabled={busy}
                  >
                    Confirm Payment Received
                  </button>
                )}
              </div>
            ) : (
              <p className="text-muted">No payment record found.</p>
            )}
          </div>

          <div className="card">
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
        </>
      )}
    </div>
  );
}