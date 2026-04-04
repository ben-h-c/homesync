import { Outlet, Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function AuthGuard({ requiredRole }) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
