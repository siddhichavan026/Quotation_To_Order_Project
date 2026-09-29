import { NavLink, Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function AdminLayout() {
  return (
    <div>
      <Navbar />
      <nav className="admin-tabs">
        <NavLink
          to="/admin"
          end
          className={({ isActive }) => `tab-link ${isActive ? 'tab-link-active' : ''}`}
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/admin/products"
          className={({ isActive }) => `tab-link ${isActive ? 'tab-link-active' : ''}`}
        >
          Products
        </NavLink>
        <NavLink
          to="/admin/requests"
          className={({ isActive }) => `tab-link ${isActive ? 'tab-link-active' : ''}`}
        >
          Quotation Requests
        </NavLink>
        <NavLink
          to="/admin/quotations"
          className={({ isActive }) => `tab-link ${isActive ? 'tab-link-active' : ''}`}
        >
          Quotations
        </NavLink>
        <NavLink
          to="/admin/orders"
          className={({ isActive }) => `tab-link ${isActive ? 'tab-link-active' : ''}`}
        >
          Orders
        </NavLink>
        <NavLink
          to="/admin/payments"
          className={({ isActive }) => `tab-link ${isActive ? 'tab-link-active' : ''}`}
        >
          Payments
        </NavLink>
      </nav>
      <div className="page-content">
        <Outlet />
      </div>
    </div>
  );
}