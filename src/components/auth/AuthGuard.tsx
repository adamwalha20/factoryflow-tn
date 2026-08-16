import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';

interface RoleGuardProps {
  allowedRoles: string[];
}

export function AuthGuard() {
  const { user, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { employee } = useAuthStore();

  if (!employee || !allowedRoles.includes(employee.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
