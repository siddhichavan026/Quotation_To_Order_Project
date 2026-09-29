import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../../services/orderService';
import StatusBadge from '../../components/StatusBadge';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    setError('');
    try {
      const data = await getMyOrders();
      setOrders(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>My Orders</h1>
      </div>

      {loading && <p className="text-muted">Loading orders...</p>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && (
        <div className="card">
          {orders.length === 0 ? (
            <p className="text-muted">You don't have any orders yet.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th className="text-right">Total Amount</th>
                    <th>Order Status</th>
                    <th>Payment Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.order_id}>
                      <td>#{order.order_id}</td>
                      <td className="text-right">₹{Number(order.total_amount).toFixed(2)}</td>
                      <td><StatusBadge status={order.status} /></td>
                      <td>
                        {order.payment ? (
                          <StatusBadge status={order.payment.payment_status} />
                        ) : (
                          <span className="badge badge-neutral">UNKNOWN</span>
                        )}
                      </td>
                      <td>
                        <Link to={`/customer/orders/${order.order_id}`} className="btn btn-ghost btn-sm">
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