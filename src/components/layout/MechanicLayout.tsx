import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { setupPushNotifications } from '../../utils/pushNotifications';

export function MechanicLayout() {
  const { employee, signOut } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (employee) {
      setupPushNotifications(employee.id, employee.role);
    }
  }, [employee]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest flex flex-col">
      <header className="bg-surface border-b border-outline-variant px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary">
            <span className="material-symbols-outlined">build</span>
          </div>
          <div>
            <h1 className="font-headline-sm text-headline-sm text-on-surface">Espace Mécanicien</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant font-medium">
              {employee?.first_name} {employee?.last_name}
            </p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-error hover:bg-error-container hover:text-on-error-container rounded-lg font-label-md text-label-md transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="hidden sm:inline">Déconnexion</span>
        </button>
      </header>

      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
