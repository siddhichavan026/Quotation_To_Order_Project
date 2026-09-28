// src/pages/Unauthorized.jsx
// Shown when a logged-in user tries to open a route that belongs to
// the other role (e.g. a Customer visiting an /admin/* URL directly).

import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="auth-page">
      <div className="card auth-card" style={{ textAlign: 'center' }}>
        <h1 className="auth-title">Access Denied</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-5)' }}>
          You do not have permission to view this page.
        </p>
        <Link to="/" className="btn btn-primary btn-block">Go to Home</Link>
      </div>
    </div>
  );
}