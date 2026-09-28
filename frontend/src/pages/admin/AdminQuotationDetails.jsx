// src/pages/admin/AdminQuotationDetails.jsx
// Shows a quotation's items, total, and status. Only an ACCEPTED
// quotation can be converted into an order. The backend performs the
// real stock check at conversion time, so if stock is insufficient the
// backend's error (with the list of short products) is shown here.

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getQuotationById } from '../../services/quotationService';
import { convertToOrder } from '../../services/orderService';
import StatusBadge from '../../components/StatusBadge';

export default function AdminQuotationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quotation, setQuotation] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH_ON_DELIVERY');
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState('');
  const [insufficientItems, setInsufficientItems] = useState([]);

  useEffect(() => {
    loadQuotation();
  }, [id]);

  async function loadQuotation(quiet = false) {
    if (!quiet) {
      setLoading(true);
      setError('');
    }
    try {
      const data = await getQuotationById(id);
      setQuotation(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load this quotation.');
    } finally {
      if (!quiet) setLoading(false);
    }
  }

  async function handleConvert() {
    setError('');
    setInsufficientItems([]);
    setConverting(true);
    try {
      const data = await convertToOrder(Number(id), paymentMethod);
      navigate(`/admin/orders/${data.order_id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to convert quotation into an order.');
      // Backend returns which products are short when stock is insufficient
      setInsufficientItems(err.response?.data?.insufficient_items || []);
      await loadQuotation(true);
    } finally {
      setConverting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Quotation #{id}</h1>
        <Link to="/admin/quotations" className="btn btn-secondary">Back to List</Link>
      </div>

      {loading && <p className="text-muted">Loading...</p>}
      {error && <div className="alert alert-error">{error}</div>}

      {insufficientItems.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <h3 style={{ marginBottom: 'var(--space-3)' }}>Insufficient Stock</h3>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="text-right">Required</th>
                  <th className="text-right">Available</th>
                </tr>
              </thead>
              <tbody>
                {insufficientItems.map((item) => (
                  <tr key={item.product_id}>
                    <td>{item.product_name}</td>
                    <td className="text-right">{item.required}</td>
                    <td className="text-right">{item.available}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && quotation && (
        <div className="card">
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <p style={{ marginBottom: 'var(--space-2)' }}>
              <strong>Status:</strong> <StatusBadge status={quotation.status} />
            </p>
            <p className="text-muted">Customer ID: {quotation.customer_id}</p>
            <p className="text-muted">Valid until: {quotation.valid_until}</p>
            <p className="text-muted">Sent on: {new Date(quotation.sent_at).toLocaleString()}</p>
            {quotation.responded_at && (
              <p className="text-muted">
                Customer responded on: {new Date(quotation.responded_at).toLocaleString()}
              </p>
            )}
          </div>

          <h2 style={{ marginBottom: 'var(--space-4)' }}>Items</h2>
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
                {quotation.items.map((item) => (
                  <tr key={item.quotation_item_id}>
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
            Total: ₹{Number(quotation.total_amount).toFixed(2)}
          </div>

          {/* Only an ACCEPTED quotation can be converted */}
          {quotation.status === 'ACCEPTED' && (
            <div className="mt-6">
              <div className="form-group" style={{ maxWidth: 260 }}>
                <label className="label">Payment Method</label>
                <select
                  className="input"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>
              <button className="btn btn-primary" onClick={handleConvert} disabled={converting}>
                {converting ? 'Converting...' : 'Convert to Order'}
              </button>
            </div>
          )}

          {quotation.status === 'SENT' && (
            <div className="alert alert-success mt-6">Waiting for the customer to accept or reject.</div>
          )}
          {quotation.status === 'REJECTED' && (
            <div className="alert alert-error mt-6">The customer rejected this quotation.</div>
          )}
          {quotation.status === 'EXPIRED' && (
            <div className="alert alert-error mt-6">This quotation expired before the customer responded.</div>
          )}
          {quotation.status === 'CONVERTED' && (
            <div className="alert alert-success mt-6">
              This quotation has already been converted into an order. See the Orders tab.
            </div>
          )}
        </div>
      )}
    </div>
  );
}