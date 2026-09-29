
import { NavLink, Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function CustomerLayout() {
  return (
    <div>
      <Navbar />
      <nav className="customer-tabs">
        <NavLink
          to="/customer"
          end
          className={({ isActive }) => `tab-link ${isActive ? 'tab-link-active' : ''}`}
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/customer/products"
          className={({ isActive }) => `tab-link ${isActive ? 'tab-link-active' : ''}`}
        >
          Products
        </NavLink>
        <NavLink
          to="/customer/requests"
          className={({ isActive }) => `tab-link ${isActive ? 'tab-link-active' : ''}`}
        >
          My Requests
        </NavLink>
        <NavLink
          to="/customer/quotations"
          className={({ isActive }) => `tab-link ${isActive ? 'tab-link-active' : ''}`}
        >
          My Quotations
        </NavLink>
        <NavLink
          to="/customer/orders"
          className={({ isActive }) => `tab-link ${isActive ? 'tab-link-active' : ''}`}
        >
          My Orders
        </NavLink>
      </nav>
      <div className="page-content">
        <Outlet />
      </div>
    </div>
  );
}