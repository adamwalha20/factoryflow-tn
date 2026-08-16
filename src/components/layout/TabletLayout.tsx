import { Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { ErrorBoundary } from '../../ErrorBoundary';

export function TabletLayout() {
  const { employee, signOut } = useAuthStore();
  const machineName = localStorage.getItem('assigned_machine_name') || 'Machine Non Assignée';

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans select-none">
      {/* Top Header */}
      <header className="h-16 border-b border-zinc-200 bg-white flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-primary rounded flex items-center justify-center font-bold text-sm text-white shadow-sm">
            M
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-zinc-900">{machineName}</h1>
            <p className="text-xs text-zinc-500 font-medium tracking-wider uppercase">Interface Production</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm font-bold text-zinc-900">{employee?.first_name} {employee?.last_name}</p>
            <p className="text-xs text-primary font-semibold">Opérateur</p>
          </div>
          <button 
            onClick={signOut}
            className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 text-sm font-semibold text-zinc-700 transition-colors border border-zinc-200 shadow-sm"
          >
            Déconnexion
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 bg-zinc-50">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
