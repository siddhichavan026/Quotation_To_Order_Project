// src/pages/customer/CreateQuotationRequest.jsx
// Lets the customer pick one or more IN-STOCK products with a
// quantity each, and submit them as a single quotation request.
// Out-of-stock products are excluded from the dropdown entirely, so
// they cannot be selected in the first place (backend still
// re-validates this too).

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '../../services/productService';
import { createQuotationRequest } from '../../services/quotationRequestService';

let nextRowId = 1;

// Products a given row may choose from: every in-stock product EXCEPT the ones
// already picked in OTHER rows. The row's own current choice stays in its list
// (so it still displays), and changing/removing a row frees that product again.
// This only affects this form - it never touches the catalog or stock.
function getOptionsForRow(availableProducts, rows, rowId) {
  const pickedElsewhere = rows
    .filter((r) => r.id !== rowId && r.product_id)
    .map((r) => String(r.product_id));
  return availableProducts.filter((p) => !pickedElsewhere.includes(String(p.product_id)));
}

export default function CreateQuotationRequest() {
  const [products, setProducts] = useState([]);
  const [rows, setRows] = useState([{ id: nextRowId++, product_id: '', quantity: 1 }]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoadingProducts(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products.');
    } finally {
      setLoadingProducts(false);
    }
  }

  const availableProducts = products.filter((p) => p.stock_quantity > 0);

  function addRow() {
    setRows((prev) => [...prev, { id: nextRowId++, product_id: '', quantity: 1 }]);
  }

  function removeRow(id) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function updateRow(id, field, value) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Basic frontend validation (backend validates again regardless)
    const items = rows
      .filter((r) => r.product_id)
      .map((r) => ({ product_id: Number(r.product_id), requested_quantity: Number(r.quantity) }));

    if (items.length === 0) {
      setError('Please select at least one product.');
      return;
    }
    if (items.some((item) => !item.requested_quantity || item.requested_quantity <= 0)) {
      setError('Quantity must be greater than 0 for every selected product.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await createQuotationRequest(items);
      setSuccess(`Quotation request #${data.request_id} submitted successfully.`);
      setRows([{ id: nextRowId++, product_id: '', quantity: 1 }]);
      setTimeout(() => navigate('/customer/requests'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit quotation request.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>New Quotation Request</h1>
      </div>

      <div className="card" style={{ maxWidth: 700 }}>
        {loadingProducts && <p className="text-muted">Loading products...</p>}

        {!loadingProducts && availableProducts.length === 0 && (
          <p className="text-muted">No products are currently in stock to request.</p>
        )}

        {!loadingProducts && availableProducts.length > 0 && (
          <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {rows.map((row) => (
              <div className="form-row" key={row.id}>
                <div className="form-group">
                  <label className="label">Product</label>
                  <select
                    className="input"
                    value={row.product_id}
                    onChange={(e) => updateRow(row.id, 'product_id', e.target.value)}
                    required
                  >
                    <option value="">Select a product</option>
                    {getOptionsForRow(availableProducts, rows, row.id).map((p) => (
                      <option key={p.product_id} value={p.product_id}>
                        {p.name} (In stock: {p.stock_quantity})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ maxWidth: 120 }}>
                  <label className="label">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={row.quantity}
                    onChange={(e) => updateRow(row.id, 'quantity', e.target.value)}
                    required
                  />
                </div>

                <button
                  type="button"
                  className="btn btn-ghost btn-sm form-row-remove"
                  onClick={() => removeRow(row.id)}
                  disabled={rows.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}

            <button
              type="button"
              className="btn btn-secondary btn-sm mt-4"
              onClick={addRow}
              disabled={rows.length >= availableProducts.length}
            >
              + Add Another Product
            </button>
            {rows.length >= availableProducts.length && (
              <p className="text-muted mt-4">All available products have been added to this request.</p>
            )}

            <div className="mt-6">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}