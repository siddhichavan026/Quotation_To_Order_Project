import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getQuotationRequestById } from '../../services/quotationRequestService';
import { getProducts } from '../../services/productService';
import { createQuotation } from '../../services/quotationService';

export default function CreateQuotation() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [products, setProducts] = useState([]);
  const [validUntil, setValidUntil] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [requestData, productsData] = await Promise.all([
        getQuotationRequestById(id),
        getProducts()
      ]);
      setRequest(requestData);
      setProducts(productsData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load request details.');
    } finally {
      setLoading(false);
    }
  }

  // Build a preview of each line item using the CURRENT product price/tax
  const preview = useMemo(() => {
    if (!request || products.length === 0) return { items: [], total: 0 };

    const items = request.items.map((reqItem) => {
      const product = products.find((p) => p.product_id === reqItem.product_id);
      const unitPrice = product ? Number(product.price) : 0;
      const taxRate = product ? Number(product.tax_rate) : 0;
      const quantity = reqItem.requested_quantity;
      const base = quantity * unitPrice;
      const subtotal = base + base * (taxRate / 100);
      return {
        product_name: reqItem.product_name,
        quantity,
        unitPrice,
        taxRate,
        subtotal
      };
    });

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    return { items, total };
  }, [request, products]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!validUntil) {
      setError('Please select a valid-until date.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await createQuotation(Number(id), validUntil);
      navigate(`/admin/quotations/${data.quotation_id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create quotation.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Create Quotation for Request #{id}</h1>
        <Link to={`/admin/requests/${id}`} className="btn btn-secondary">Back to Request</Link>
      </div>

      {loading && <p className="text-muted">Loading...</p>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && request && request.status !== 'PENDING' && (
        <div className="alert alert-error">
          This request is no longer PENDING (current status: {request.status}) and cannot be quoted.
        </div>
      )}

      {!loading && request && request.status === 'PENDING' && (
        <div className="card">
          <h2 style={{ marginBottom: 'var(--space-4)' }}>Preview (current prices)</h2>
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
                {preview.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.product_name}</td>
                    <td className="text-right">{item.quantity}</td>
                    <td className="text-right">₹{item.unitPrice.toFixed(2)}</td>
                    <td className="text-right">{item.taxRate}%</td>
                    <td className="text-right">₹{item.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ textAlign: 'right', marginTop: 'var(--space-4)', fontSize: '16px', fontWeight: 600 }}>
            Preview Total: ₹{preview.total.toFixed(2)}
          </div>

          <form onSubmit={handleSubmit} className="mt-6">
            <div className="form-group" style={{ maxWidth: 260 }}>
              <label className="label">Valid Until</label>
              <input
                type="date"
                className="input"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary mt-4" disabled={submitting}>
              {submitting ? 'Sending...' : 'Create & Send Quotation'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}