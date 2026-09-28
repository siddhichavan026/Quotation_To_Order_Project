// src/components/Navbar.jsx
// Shared top navbar used by both the Admin and Customer areas.
// Shows the logged-in user's name, role badge, and a logout button.

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="navbar">
      <div className="navbar-brand">Quotation to Order</div>
      <div className="navbar-user">
        <span className="navbar-username">{user?.name}</span>
        <span className="badge badge-role">{user?.role}</span>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}