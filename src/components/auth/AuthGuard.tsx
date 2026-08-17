import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { useTenantStore } from '../../store/tenantStore';

interface RoleGuardProps {
  allowedRoles: string[];
}

export function AuthGuard() {
  const { user, employee, isLoading } = useAuthStore();
  const { currentOrg, fetchTenantData } = useTenantStore();
  const location = useLocation();

  useEffect(() => {
    if (user && !currentOrg) {
      fetchTenantData();
    }
  }, [user, currentOrg, fetchTenantData]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is Administrator and organization onboarding is incomplete, redirect to /onboarding
  if (
    employee?.role === 'Administrator' && 
    currentOrg && 
    currentOrg.onboarding_completed === false && 
    !location.pathname.startsWith('/onboarding')
  ) {
    return <Navigate to="/onboarding" replace />;
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
