// src/App.jsx
// Defines every route in the app and which ones are protected.

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ROLES } from './utils/roles';

import ProtectedRoute from './components/ProtectedRoute';
import CustomerLayout from './components/CustomerLayout';
import AdminLayout from './components/AdminLayout';

import Login from './pages/Login';
import Register from './pages/Register';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';

import AdminDashboard from './pages/admin/AdminDashboard';
import ProductManagement from './pages/admin/ProductManagement';
import QuotationRequestManagement from './pages/admin/QuotationRequestManagement';
import AdminQuotationRequestDetails from './pages/admin/AdminQuotationRequestDetails';
import CreateQuotation from './pages/admin/CreateQuotation';
import QuotationManagement from './pages/admin/QuotationManagement';
import AdminQuotationDetails from './pages/admin/AdminQuotationDetails';
import OrderManagement from './pages/admin/OrderManagement';
import AdminOrderDetails from './pages/admin/AdminOrderDetails';
import PaymentManagement from './pages/admin/PaymentManagement';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import ProductList from './pages/customer/ProductList';
import CreateQuotationRequest from './pages/customer/CreateQuotationRequest';
import MyQuotationRequests from './pages/customer/MyQuotationRequests';
import QuotationRequestDetails from './pages/customer/QuotationRequestDetails';
import MyQuotations from './pages/customer/MyQuotations';
import QuotationDetails from './pages/customer/QuotationDetails';
import MyOrders from './pages/customer/MyOrders';
import OrderDetails from './pages/customer/OrderDetails';

// Decides where "/" should send an already-known user
function HomeRedirect() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={user.role === ROLES.ADMIN ? '/admin' : '/customer'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />

      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Admin-only routes */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<ProductManagement />} />
          <Route path="requests" element={<QuotationRequestManagement />} />
          <Route path="requests/:id" element={<AdminQuotationRequestDetails />} />
          <Route path="requests/:id/create-quotation" element={<CreateQuotation />} />
          <Route path="quotations" element={<QuotationManagement />} />
          <Route path="quotations/:id" element={<AdminQuotationDetails />} />
          <Route path="orders" element={<OrderManagement />} />
          <Route path="orders/:id" element={<AdminOrderDetails />} />
          <Route path="payments" element={<PaymentManagement />} />
        </Route>
      </Route>

      {/* Customer-only routes */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.CUSTOMER]} />}>
        <Route path="/customer" element={<CustomerLayout />}>
          <Route index element={<CustomerDashboard />} />
          <Route path="products" element={<ProductList />} />
          <Route path="requests" element={<MyQuotationRequests />} />
          <Route path="requests/new" element={<CreateQuotationRequest />} />
          <Route path="requests/:id" element={<QuotationRequestDetails />} />
          <Route path="quotations" element={<MyQuotations />} />
          <Route path="quotations/:id" element={<QuotationDetails />} />
          <Route path="orders" element={<MyOrders />} />
          <Route path="orders/:id" element={<OrderDetails />} />
        </Route>
      </Route>

      {/* Fallback for unknown URLs */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}