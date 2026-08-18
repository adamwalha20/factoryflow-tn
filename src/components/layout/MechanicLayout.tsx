import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { useTenantStore } from '../../store/tenantStore';
import { setupPushNotifications } from '../../utils/pushNotifications';

export function MechanicLayout() {
  const { employee, signOut } = useAuthStore();
  const { currentOrg } = useTenantStore();
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Professional Industrial Bar */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 ring-1 ring-blue-500/30">
            <span className="material-symbols-outlined text-[24px]">construction</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Espace Maintenance & Mécanique
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                CANAL DIRECT
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {currentOrg?.name || 'FactoryFlow Industrial Plant'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Déconnexion</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
