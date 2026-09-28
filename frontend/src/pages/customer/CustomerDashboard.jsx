// src/pages/customer/CustomerDashboard.jsx
// Landing page after Customer login. Pulls a lightweight summary from
// the three list endpoints we already have (no new backend work) and
// highlights quotations that need the customer's attention.
//
// Rendered inside <CustomerLayout>, so it does NOT include its own
// Navbar/page wrapper - just the page's own content.

import { useState, useEffect } from 'react';
import { getMyQuotationRequests } from '../../services/quotationRequestService';
import { getMyQuotations } from '../../services/quotationService';
import { getMyOrders } from '../../services/orderService';
import StatusBadge from '../../components/StatusBadge';

export default function CustomerDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requests, setRequests] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError('');
    try {
      // Run all three requests in parallel - faster than one after another
      const [requestsData, quotationsData, ordersData] = await Promise.all([
        getMyQuotationRequests(),
        getMyQuotations(),
        getMyOrders()
      ]);
      setRequests(requestsData);
      setQuotations(quotationsData);
      setOrders(ordersData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <p style={{ color: 'var(--color-text-secondary)' }}>Loading dashboard...</p>;
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  const awaitingResponse = quotations.filter((q) => q.status === 'SENT');
  const activeOrders = orders.filter((o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-6)' }}>Dashboard</h1>

      <div className="stat-grid">
        <div className="card stat-card">
          <p className="stat-label">Quotation Requests</p>
          <p className="stat-value">{requests.length}</p>
        </div>
        <div className="card stat-card">
          <p className="stat-label">Awaiting Your Response</p>
          <p className="stat-value">{awaitingResponse.length}</p>
        </div>
        <div className="card stat-card">
          <p className="stat-label">Total Orders</p>
          <p className="stat-value">{orders.length}</p>
        </div>
        <div className="card stat-card">
          <p className="stat-label">Active Orders</p>
          <p className="stat-value">{activeOrders.length}</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 'var(--space-6)' }}>
        <h2 style={{ marginBottom: 'var(--space-4)' }}>Quotations Awaiting Your Response</h2>

        {awaitingResponse.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)' }}>
            No quotations are currently waiting for your response.
          </p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Quotation #</th>
                  <th>Total Amount</th>
                  <th>Valid Until</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {awaitingResponse.map((q) => (
                  <tr key={q.quotation_id}>
                    <td>#{q.quotation_id}</td>
                    <td>₹{Number(q.total_amount).toFixed(2)}</td>
                    <td>{q.valid_until}</td>
                    <td><StatusBadge status={q.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}