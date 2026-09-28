// src/pages/customer/MyQuotationRequests.jsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyQuotationRequests } from '../../services/quotationRequestService';
import StatusBadge from '../../components/StatusBadge';

export default function MyQuotationRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    setError('');
    try {
      const data = await getMyQuotationRequests();
      setRequests(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load quotation requests.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>My Quotation Requests</h1>
        <Link to="/customer/requests/new" className="btn btn-primary">
          New Quotation Request
        </Link>
      </div>

      {loading && <p className="text-muted">Loading requests...</p>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && (
        <div className="card">
          {requests.length === 0 ? (
            <p className="text-muted">You haven't submitted any quotation requests yet.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Request #</th>
                    <th>Items</th>
                    <th>Submitted On</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.request_id}>
                      <td>#{request.request_id}</td>
                      <td>{request.items?.length || 0} product(s)</td>
                      <td>{new Date(request.created_at).toLocaleDateString()}</td>
                      <td><StatusBadge status={request.status} /></td>
                      <td>
                        <Link to={`/customer/requests/${request.request_id}`} className="btn btn-ghost btn-sm">
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
      )}
    </div>
  );
}