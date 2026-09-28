// src/pages/NotFound.jsx

import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="auth-page">
      <div className="card auth-card" style={{ textAlign: 'center' }}>
        <h1 className="auth-title">404</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-5)' }}>
          The page you're looking for doesn't exist.
        </p>
        <Link to="/" className="btn btn-primary btn-block">Go to Home</Link>
      </div>
    </div>
  );
}