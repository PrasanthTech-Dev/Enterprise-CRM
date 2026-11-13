import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';

export function RequireAuth() {
  const userId = useAppSelector((s) => s.auth.currentUserId);
  const location = useLocation();
  if (!userId) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}

export function PublicOnly() {
  const userId = useAppSelector((s) => s.auth.currentUserId);
  if (userId) return <Navigate to="/" replace />;
  return <Outlet />;
}
