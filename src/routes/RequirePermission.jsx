import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wrap nested routes that need one specific permission, e.g.:
 *   <Route element={<RequirePermission permission="USER_READ" />}>
 *     <Route path="/admin/users" element={<AdminUsersPage />} />
 *   </Route>
 */
export default function RequirePermission({ permission }) {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}
