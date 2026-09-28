// src/pages/customer/QuotationDetails.jsx
// Shows full quotation details (items, prices, tax, total, validity)
// and lets the customer Accept or Reject it - only while it's still
// in SENT status and not expired. The backend is the final authority
// on this (auto-expires overdue quotations and rejects invalid
// transitions), so we always re-fetch after an action and show
// whatever the backend says.

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getQuotationById, respondToQuotation } from '../../services/quotationService';
import StatusBadge from '../../components/StatusBadge';

export default function QuotationDetails() {
  const { id } = useParams();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    loadQuotation();
  }, [id]);

  async function loadQuotation(quiet = false) {
    // quiet = true: refresh data after an action WITHOUT clearing the
    // success/error message the action just set, and without the spinner.
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

  async function handleRespond(decision) {
    setError('');
    setSuccess('');
    setResponding(true);
    try {
      await respondToQuotation(id, decision);
      setSuccess(`Quotation ${decision === 'ACCEPT' ? 'accepted' : 'rejected'} successfully.`);
      await loadQuotation(true); // refresh to show the new status (and catch auto-expiry)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to respond to this quotation.');
      await loadQuotation(true); // status may have changed to EXPIRED - refresh regardless
    } finally {
      setResponding(false);
    }
  }

  const canRespond = quotation && quotation.status === 'SENT';

  return (
    <div>
      <div className="page-header">
        <h1>Quotation #{id}</h1>
        <Link to="/customer/quotations" className="btn btn-secondary">Back to List</Link>
      </div>

      {loading && <p className="text-muted">Loading...</p>}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {!loading && quotation && (
        <div className="card">
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <p style={{ marginBottom: 'var(--space-2)' }}>
              <strong>Status:</strong> <StatusBadge status={quotation.status} />
            </p>
            <p className="text-muted">Valid until: {quotation.valid_until}</p>
            <p className="text-muted">Sent on: {new Date(quotation.sent_at).toLocaleString()}</p>
            {quotation.responded_at && (
              <p className="text-muted">
                Responded on: {new Date(quotation.responded_at).toLocaleString()}
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

          {canRespond && (
            <div className="mt-6" style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button
                className="btn btn-success"
                onClick={() => handleRespond('ACCEPT')}
                disabled={responding}
              >
                {responding ? 'Please wait...' : 'Accept Quotation'}
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleRespond('REJECT')}
                disabled={responding}
              >
                {responding ? 'Please wait...' : 'Reject Quotation'}
              </button>
            </div>
          )}

          {quotation.status === 'EXPIRED' && (
            <div className="alert alert-error mt-6">
              This quotation has expired and can no longer be accepted or rejected.
            </div>
          )}

          {quotation.status === 'ACCEPTED' && (
            <div className="alert alert-success mt-6">
              You accepted this quotation. The admin will convert it into an order shortly.
            </div>
          )}

          {quotation.status === 'REJECTED' && (
            <div className="alert alert-error mt-6">You rejected this quotation.</div>
          )}

          {quotation.status === 'CONVERTED' && (
            <div className="alert alert-success mt-6">
              This quotation has already been converted into an order. Check "My Orders" to view it.
            </div>
          )}
        </div>
      )}
    </div>
  );
}