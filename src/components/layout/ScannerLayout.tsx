import { Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { ErrorBoundary } from '../../ErrorBoundary';

export function ScannerLayout() {
  const { employee, signOut } = useAuthStore();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans">
      <header className="h-14 border-b border-zinc-200 bg-white flex items-center justify-between px-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600">qr_code_scanner</span>
          <h1 className="font-semibold text-sm">Scanner</h1>
        </div>
        <button onClick={signOut} className="text-zinc-500 hover:text-zinc-800">
          <span className="material-symbols-outlined">logout</span>
        </button>
      </header>
      
      <main className="flex-1 overflow-y-auto pb-safe">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
