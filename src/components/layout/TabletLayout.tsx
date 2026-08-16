import { Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { ErrorBoundary } from '../../ErrorBoundary';

export function TabletLayout() {
  const { signOut } = useAuthStore();
  const machineName = localStorage.getItem('assigned_machine_name') || 'Poste Machine Atelier';

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans select-none">
      {/* Top Header */}
      <header className="h-16 border-b border-zinc-200 bg-white flex items-center justify-between px-6 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-md shadow-blue-500/20">
            <span className="material-symbols-outlined text-[20px]">tablet</span>
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-zinc-900 flex items-center gap-2">
              <span>{machineName}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </h1>
            <p className="text-[11px] text-zinc-500 font-bold tracking-wider uppercase">Pupitre Atelier FactoryFlow</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-zinc-800">Poste Connecté</p>
            <p className="text-[10px] text-emerald-600 font-bold uppercase">Mode Atelier Sécurisé</p>
          </div>
          <button 
            onClick={signOut}
            title="Quitter le mode tablette"
            className="px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 text-xs font-bold text-zinc-700 transition-colors border border-zinc-200 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            <span>Déconnexion</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-50">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
