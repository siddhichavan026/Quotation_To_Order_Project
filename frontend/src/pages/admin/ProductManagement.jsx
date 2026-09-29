import { useState, useEffect } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../services/productService';

const EMPTY_FORM = { name: '', description: '', price: '', tax_rate: '', stock_quantity: '' };

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null); // null = Add mode, product_id = Edit mode
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts(quiet = false) {
    if (!quiet) {
      setLoading(true);
      setError('');
    }
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products.');
    } finally {
      if (!quiet) setLoading(false);
    }
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function startEdit(product) {
    setEditingId(product.product_id);
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      tax_rate: product.tax_rate,
      stock_quantity: product.stock_quantity
    });
    setError('');
    setSuccess('');
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.name || form.price === '') {
      setError('Name and price are required.');
      return;
    }

    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      tax_rate: form.tax_rate === '' ? 0 : Number(form.tax_rate),
      stock_quantity: form.stock_quantity === '' ? 0 : Number(form.stock_quantity)
    };

    setSubmitting(true);
    try {
      if (editingId) {
        await updateProduct(editingId, payload);
        setSuccess('Product updated successfully.');
      } else {
        await createProduct(payload);
        setSuccess('Product created successfully.');
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      await loadProducts(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(product) {
    const confirmed = window.confirm(`Delete "${product.name}"? This cannot be undone.`);
    if (!confirmed) return;

    setError('');
    setSuccess('');
    try {
      await deleteProduct(product.product_id);
      setSuccess('Product deleted successfully.');
      await loadProducts(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete product.');
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Product Management</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card" style={{ marginBottom: 'var(--space-6)', maxWidth: 700 }}>
        <h2 style={{ marginBottom: 'var(--space-4)' }}>{editingId ? 'Edit Product' : 'Add Product'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Name</label>
            <input
              type="text"
              className="input"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={2}
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">Price (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={form.price}
                onChange={(e) => handleChange('price', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Tax Rate (%)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={form.tax_rate}
                onChange={(e) => handleChange('tax_rate', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="label">Stock Quantity</label>
              <input
                type="number"
                min="0"
                className="input"
                value={form.stock_quantity}
                onChange={(e) => handleChange('stock_quantity', e.target.value)}
              />
            </div>
          </div>

          <div className="btn-group mt-4">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editingId ? 'Update Product' : 'Add Product'}
            </button>
            {editingId && (
              <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 'var(--space-4)' }}>All Products</h2>
        {loading && <p className="text-muted">Loading products...</p>}
        {!loading && products.length === 0 && <p className="text-muted">No products yet.</p>}

        {!loading && products.length > 0 && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Tax Rate</th>
                  <th className="text-right">Stock</th>
                  <th>Availability</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const inStock = product.stock_quantity > 0;
                  return (
                    <tr key={product.product_id}>
                      <td>{product.name}</td>
                      <td className="text-right">₹{Number(product.price).toFixed(2)}</td>
                      <td className="text-right">{Number(product.tax_rate)}%</td>
                      <td className="text-right">{product.stock_quantity}</td>
                      <td>
                        <span className={`badge ${inStock ? 'badge-success' : 'badge-error'}`}>
                          {inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group">
                          <button className="btn btn-ghost btn-sm" onClick={() => startEdit(product)}>
                            Edit
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(product)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}