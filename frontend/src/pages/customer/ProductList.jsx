// src/pages/customer/ProductList.jsx
// Read-only product catalog. Shows price, tax rate, and stock
// availability. Out-of-stock products are clearly marked here; the
// actual restriction on requesting them is enforced on the
// "Create Quotation Request" screen and, ultimately, by the backend.

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../../services/productService';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    setError('');
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Products</h1>
        <Link to="/customer/requests/new" className="btn btn-primary">
          New Quotation Request
        </Link>
      </div>

      {loading && <p className="text-muted">Loading products...</p>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && (
        <div className="card">
          {products.length === 0 ? (
            <p className="text-muted">No products available yet.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Tax Rate</th>
                    <th className="text-right">Stock</th>
                    <th>Availability</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const inStock = product.stock_quantity > 0;
                    return (
                      <tr key={product.product_id}>
                        <td>{product.name}</td>
                        <td>{product.description || '-'}</td>
                        <td className="text-right">₹{Number(product.price).toFixed(2)}</td>
                        <td className="text-right">{Number(product.tax_rate)}%</td>
                        <td className="text-right">{product.stock_quantity}</td>
                        <td>
                          <span className={`badge ${inStock ? 'badge-success' : 'badge-error'}`}>
                            {inStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}