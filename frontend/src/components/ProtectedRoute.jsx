// src/components/ProtectedRoute.jsx
// A route "guard". Wrap any set of routes with this and pass
// allowedRoles to restrict them to ADMIN, CUSTOMER, or both.
//
// Usage (see App.jsx):
//   <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
//     <Route path="/admin/*" element={<AdminDashboard />} />
//   </Route>

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();

  // Wait until we've checked localStorage before deciding anything
  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }

  // Not logged in at all -> go to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Logged in, but wrong role for this section -> go to unauthorized page
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Allowed - render whatever child route was requested
  return <Outlet />;
}