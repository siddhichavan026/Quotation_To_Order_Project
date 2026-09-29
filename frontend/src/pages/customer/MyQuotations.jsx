import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyQuotations } from '../../services/quotationService';
import StatusBadge from '../../components/StatusBadge';

export default function MyQuotations() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadQuotations();
  }, []);

  async function loadQuotations() {
    setLoading(true);
    setError('');
    try {
      const data = await getMyQuotations();
      setQuotations(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load quotations.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>My Quotations</h1>
      </div>

      {loading && <p className="text-muted">Loading quotations...</p>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && (
        <div className="card">
          {quotations.length === 0 ? (
            <p className="text-muted">You haven't received any quotations yet.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Quotation #</th>
                    <th className="text-right">Total Amount</th>
                    <th>Valid Until</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {quotations.map((q) => (
                    <tr key={q.quotation_id}>
                      <td>#{q.quotation_id}</td>
                      <td className="text-right">₹{Number(q.total_amount).toFixed(2)}</td>
                      <td>{q.valid_until}</td>
                      <td><StatusBadge status={q.status} /></td>
                      <td>
                        <Link to={`/customer/quotations/${q.quotation_id}`} className="btn btn-ghost btn-sm">
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