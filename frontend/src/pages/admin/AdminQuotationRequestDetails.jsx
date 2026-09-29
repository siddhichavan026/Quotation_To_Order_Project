import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getQuotationRequestById } from '../../services/quotationRequestService';
import StatusBadge from '../../components/StatusBadge';

export default function AdminQuotationRequestDetails() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRequest();
  }, [id]);

  async function loadRequest() {
    setLoading(true);
    setError('');
    try {
      const data = await getQuotationRequestById(id);
      setRequest(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load this quotation request.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Quotation Request #{id}</h1>
        <Link to="/admin/requests" className="btn btn-secondary">Back to List</Link>
      </div>

      {loading && <p className="text-muted">Loading...</p>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && request && (
        <div className="card">
          <p style={{ marginBottom: 'var(--space-2)' }}>
            <strong>Customer ID:</strong> {request.customer_id}
          </p>
          <p style={{ marginBottom: 'var(--space-4)' }}>
            <strong>Status:</strong> <StatusBadge status={request.status} />
          </p>
          <p className="text-muted" style={{ marginBottom: 'var(--space-5)' }}>
            Submitted on {new Date(request.created_at).toLocaleString()}
          </p>

          <h2 style={{ marginBottom: 'var(--space-4)' }}>Requested Items</h2>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="text-right">Requested Quantity</th>
                </tr>
              </thead>
              <tbody>
                {request.items.map((item) => (
                  <tr key={item.request_item_id}>
                    <td>{item.product_name}</td>
                    <td className="text-right">{item.requested_quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {request.status === 'PENDING' && (
            <div className="mt-6">
              <Link to={`/admin/requests/${id}/create-quotation`} className="btn btn-primary">
                Create & Send Quotation
              </Link>
            </div>
          )}

          {request.status === 'CONVERTED' && (
            <div className="alert alert-success mt-6">
              A quotation has already been created for this request.
            </div>
          )}
        </div>
      )}
    </div>
  );
}