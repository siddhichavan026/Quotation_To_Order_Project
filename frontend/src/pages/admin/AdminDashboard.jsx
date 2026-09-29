import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../../services/productService';
import { getQuotationRequests } from '../../services/quotationRequestService';
import { getQuotations } from '../../services/quotationService';
import { getOrders } from '../../services/orderService';
import { getPayments } from '../../services/paymentService';
import StatusBadge from '../../components/StatusBadge';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError('');
    try {
      const [productsData, requestsData, quotationsData, ordersData, paymentsData] = await Promise.all([
        getProducts(),
        getQuotationRequests(),
        getQuotations(),
        getOrders(),
        getPayments()
      ]);
      setProducts(productsData);
      setRequests(requestsData);
      setQuotations(quotationsData);
      setOrders(ordersData);
      setPayments(paymentsData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <p className="text-muted">Loading dashboard...</p>;
  }
  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  const outOfStockProducts = products.filter((p) => p.stock_quantity <= 0);
  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const sentQuotations = quotations.filter((q) => q.status === 'SENT');
  const acceptedQuotations = quotations.filter((q) => q.status === 'ACCEPTED');
  const activeOrders = orders.filter((o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
  const unpaidPayments = payments.filter((p) => p.payment_status === 'UNPAID');

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-6)' }}>Admin Dashboard</h1>

      <div className="stat-grid">
        <div className="card stat-card">
          <p className="stat-label">Total Products</p>
          <p className="stat-value">{products.length}</p>
        </div>
        <div className="card stat-card">
          <p className="stat-label">Out of Stock</p>
          <p className="stat-value">{outOfStockProducts.length}</p>
        </div>
        <div className="card stat-card">
          <p className="stat-label">Requests Needing Quotation</p>
          <p className="stat-value">{pendingRequests.length}</p>
        </div>
        <div className="card stat-card">
          <p className="stat-label">Quotations Awaiting Customer</p>
          <p className="stat-value">{sentQuotations.length}</p>
        </div>
        <div className="card stat-card">
          <p className="stat-label">Accepted, Ready to Convert</p>
          <p className="stat-value">{acceptedQuotations.length}</p>
        </div>
        <div className="card stat-card">
          <p className="stat-label">Active Orders</p>
          <p className="stat-value">{activeOrders.length}</p>
        </div>
        <div className="card stat-card">
          <p className="stat-label">Unpaid Payments</p>
          <p className="stat-value">{unpaidPayments.length}</p>
        </div>
      </div>

      <div className="card mt-6">
        <h2 style={{ marginBottom: 'var(--space-4)' }}>Requests Needing a Quotation</h2>
        {pendingRequests.length === 0 ? (
          <p className="text-muted">No pending requests right now.</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Request #</th>
                  <th>Submitted On</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((r) => (
                  <tr key={r.request_id}>
                    <td>#{r.request_id}</td>
                    <td>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>
                      <Link to={`/admin/requests/${r.request_id}`} className="btn btn-ghost btn-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card mt-6">
        <h2 style={{ marginBottom: 'var(--space-4)' }}>Accepted Quotations Ready to Convert</h2>
        {acceptedQuotations.length === 0 ? (
          <p className="text-muted">No accepted quotations waiting for conversion.</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Quotation #</th>
                  <th className="text-right">Total Amount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {acceptedQuotations.map((q) => (
                  <tr key={q.quotation_id}>
                    <td>#{q.quotation_id}</td>
                    <td className="text-right">₹{Number(q.total_amount).toFixed(2)}</td>
                    <td><StatusBadge status={q.status} /></td>
                    <td>
                      <Link to={`/admin/quotations/${q.quotation_id}`} className="btn btn-ghost btn-sm">
                        View
                      </Link>
                    </td>
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