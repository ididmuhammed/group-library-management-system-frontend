import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageLoader from '../components/PageLoader';

export default function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <PageLoader />;

  if (status === 'guest') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
