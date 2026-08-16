import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStopsStore } from '../store/stops';
import { useProductionStore } from '../store/production';
import { useTenantStore } from '../store/tenantStore';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export function MechanicDashboard() {
  const [searchParams] = useSearchParams();
  const { stops, fetchStops, resolveStop, loading } = useStopsStore();
  const { machines, fetchInitialData } = useProductionStore();
  const { fetchTenantData } = useTenantStore();
  const previousActiveStopsCount = useRef<number>(-1);

  // Filter for all active stops
  const activeStops = stops.filter(stop => !stop.end_time);

  useEffect(() => {
    const orgParam = searchParams.get('org');
    if (orgParam && orgParam !== localStorage.getItem('active_org_id')) {
      localStorage.setItem('active_org_id', orgParam);
      fetchTenantData(orgParam);
    }
    fetchStops();
    fetchInitialData();

    // 1. Real-time listener
    const channel = supabase.channel('mechanic_stops')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'machine_stops' }, () => {
        fetchStops();
      })
      .subscribe();

    // 2. Fallback polling every 2 seconds
    const interval = setInterval(() => {
      fetchStops();
      fetchInitialData();
    }, 2000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchStops, fetchInitialData]);

  // Handle local notifications
  useEffect(() => {
    // Check if new stops were added
    if (previousActiveStopsCount.current !== -1 && activeStops.length > previousActiveStopsCount.current) {
      // Find the newest stop
      const newStop = activeStops[0];
      const machine = machines.find(m => m.id === newStop?.machine_id);
      
      const title = "🚨 Nouvelle intervention requise!";
      const body = `Machine: ${machine?.name || 'Inconnue'} - Motif: ${newStop?.reason}`;
      
      // 1. Play audible alarm siren
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.type = 'sawtooth';
        const t = audioCtx.currentTime;
        const duration = 6; // 6 seconds of siren
        
        // Set volume
        gainNode.gain.setValueAtTime(0.15, t);
        
        // Create sweeping siren effect (up and down)
        for (let i = 0; i < duration; i++) {
          oscillator.frequency.setValueAtTime(600, t + i);
          oscillator.frequency.linearRampToValueAtTime(1200, t + i + 0.5);
          oscillator.frequency.linearRampToValueAtTime(600, t + i + 1);
        }
        
        // Fade out at the very end
        gainNode.gain.linearRampToValueAtTime(0, t + duration);
        
        oscillator.start(t);
        oscillator.stop(t + duration);
      } catch (e) {
        console.error('Beep failed', e);
      }

      // 2. Show in-app Toast (Messenger style)
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <div className="h-12 w-12 rounded-full bg-error flex items-center justify-center shadow-inner">
                  <span className="material-symbols-outlined text-white text-2xl">build</span>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-base font-bold text-gray-900">{title}</p>
                <p className="mt-1 text-sm text-gray-600 font-medium">{body}</p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-100 bg-gray-50">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-sm font-bold text-primary hover:text-primary-dark hover:bg-gray-100 focus:outline-none transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      ), { duration: 10000, position: 'top-center' });

      // 3. Try OS Notification
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          try {
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, {
                  body: body,
                  vibrate: [200, 100, 200, 100, 200, 100, 200],
                  requireInteraction: true
                } as any).catch(() => new Notification(title, { body, requireInteraction: true }));
              });
            } else {
              new Notification(title, { body, requireInteraction: true });
            }
          } catch (e) {
            new Notification(title, { body, requireInteraction: true });
          }
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission();
        }
      }
    }
    
    previousActiveStopsCount.current = activeStops.length;
  }, [activeStops, machines]);

  const getMachine = (id: string | null) => machines.find(m => m.id === id);

  const formatDuration = (start: string) => {
    const diffMs = new Date().getTime() - new Date(start).getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  const handleResolve = async (id: string) => {
    try {
      await resolveStop(id);
      toast.success('Problème résolu avec succès !');
    } catch (err) {
      toast.error('Erreur lors de la résolution');
    }
  };

  if (loading && activeStops.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">refresh</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord Mécanicien</h1>
          <p className="text-sm text-gray-500 mt-1">Gérez les interventions et réparations machine</p>
        </div>
      </div>

      {activeStops.length > 0 && (
          <div className="flex justify-end mb-4">
          <div className="bg-error-container text-on-error-container px-4 py-2 rounded-lg font-bold">
            {activeStops.length} Alerte{activeStops.length !== 1 ? 's' : ''}
          </div>
          </div>
        )}

      {activeStops.length === 0 ? (
        <div className="bg-success-container/30 border-2 border-success/20 rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-[64px] text-success mb-4">check_circle</span>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucune panne en cours</h3>
          <p className="text-gray-600 text-lg">Toutes les machines sont opérationnelles.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeStops.map(stop => {
            const machine = getMachine(stop.machine_id);
            const isElec = stop.reason === 'Coupure électrique';
            const isMaint = stop.reason === 'Maintenance';
            
            return (
              <div key={stop.id} className="bg-surface border-2 border-error/20 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col">
                <div className="absolute top-0 left-0 w-2 h-full bg-error"></div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`material-symbols-outlined ${isElec ? 'text-orange-500' : isMaint ? 'text-blue-500' : 'text-error'}`}>
                        {isElec ? 'bolt' : isMaint ? 'engineering' : 'build'}
                      </span>
                      <h3 className="font-bold text-xl text-gray-900">{machine?.name || 'Machine Inconnue'}</h3>
                    </div>
                    {machine?.code && (
                      <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-sm font-semibold border border-gray-200">
                        {machine.code}
                      </span>
                    )}
                  </div>
                  <div className="bg-error-container text-on-error-container px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-error"></span>
                    En cours
                  </div>
                </div>

                <div className="space-y-4 mb-8 flex-1">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Motif de l'arrêt</p>
                    <p className="text-xl font-bold text-gray-800">{stop.reason}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant">
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Heure d'arrêt</p>
                      <p className="font-semibold text-gray-700 text-lg">
                        {stop.start_time ? new Date(stop.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Durée</p>
                      <p className="font-semibold text-error text-lg">{formatDuration(stop.start_time || '')}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleResolve(stop.id)}
                  className="w-full bg-success text-on-success py-4 rounded-xl font-bold text-lg hover:bg-success/90 transition-colors shadow-sm flex items-center justify-center gap-2 mt-auto"
                >
                  <span className="material-symbols-outlined">build_circle</span>
                  Marquer comme résolu
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
