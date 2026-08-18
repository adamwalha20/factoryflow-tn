import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ErrorBoundary } from '../../ErrorBoundary';
import { AIChatWidget } from '../AIChatWidget';
import { initGlobalRealtimeSync } from '../../services/realtimeSync';
import { useTenantStore } from '../../store/tenantStore';

export function Layout() {
  const { currentOrg } = useTenantStore();

  useEffect(() => {
    const cleanup = initGlobalRealtimeSync(currentOrg?.id);
    return () => {
      if (cleanup) cleanup();
    };
  }, [currentOrg?.id]);
  return (
    <div className="bg-zinc-50 text-zinc-900 font-sans min-h-screen flex selection:bg-blue-100 selection:text-blue-900">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen w-full">
        <Header />
        <main className="flex-1 mt-14 p-6 lg:p-8 overflow-y-auto w-full">
          <div className="mx-auto max-w-7xl">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
        <AIChatWidget />
      </div>
    </div>
  );
}
