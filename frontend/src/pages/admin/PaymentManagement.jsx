// src/pages/admin/PaymentManagement.jsx
// Lists every payment record with its method and status. Admin can
// manually confirm an UNPAID payment (there is no payment gateway, so
// this is the only way a payment becomes FULLY_PAID).

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPayments, confirmPayment } from '../../services/paymentService';
import StatusBadge from '../../components/StatusBadge';

const PAYMENT_METHOD_LABELS = {
  CASH_ON_DELIVERY: 'Cash on Delivery',
  UPI: 'UPI',
  BANK_TRANSFER: 'Bank Transfer'
};

export default function PaymentManagement() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadPayments();
  }, []);

  async function loadPayments(quiet = false) {
    if (!quiet) {
      setLoading(true);
      setError('');
    }
    try {
      const data = await getPayments();
      setPayments(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payments.');
    } finally {
      if (!quiet) setLoading(false);
    }
  }

  async function handleConfirm(orderId) {
    setError('');
    setSuccess('');
    setConfirmingId(orderId);
    try {
      const data = await confirmPayment(orderId);
      setSuccess(data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm payment.');
    } finally {
      setConfirmingId(null);
      await loadPayments(true);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Payments</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      {loading && <p className="text-muted">Loading payments...</p>}

      {!loading && (
        <div className="card">
          {payments.length === 0 ? (
            <p className="text-muted">No payment records yet. They are created when an order is created.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th className="text-right">Order Total</th>
                    <th>Method</th>
                    <th>Payment Status</th>
                    <th>Confirmed On</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.payment_id}>
                      <td>
                        <Link to={`/admin/orders/${p.order_id}`}>#{p.order_id}</Link>
                      </td>
                      <td className="text-right">₹{Number(p.order_total_amount).toFixed(2)}</td>
                      <td>{PAYMENT_METHOD_LABELS[p.payment_method] || p.payment_method}</td>
                      <td><StatusBadge status={p.payment_status} /></td>
                      <td>{p.payment_date ? new Date(p.payment_date).toLocaleString() : '-'}</td>
                      <td>
                        {p.payment_status === 'UNPAID' && p.order_status !== 'CANCELLED' && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleConfirm(p.order_id)}
                            disabled={confirmingId === p.order_id}
                          >
                            {confirmingId === p.order_id ? 'Confirming...' : 'Confirm Payment'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}