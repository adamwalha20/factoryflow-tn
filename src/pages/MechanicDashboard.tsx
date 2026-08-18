import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStopsStore, MachineStop } from '../store/stops';
import { useProductionStore } from '../store/production';
import { useTenantStore } from '../store/tenantStore';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export function MechanicDashboard() {
  const [searchParams] = useSearchParams();
  const { stops, fetchStops, resolveStop, loading } = useStopsStore();
  const { machines, fetchInitialData } = useProductionStore();
  const { fetchTenantData } = useTenantStore();
  
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });

  // Local ticker to smoothly refresh elapsed time display without hitting DB
  const [, setClockTick] = useState(0);

  // Filter for all active stops
  const activeStops = stops.filter(stop => !stop.end_time && stop.status !== 'Résolu');

  // Synthesized Industrial Alarm Sound (Web Audio API)
  const playIndustrialAlarm = useCallback(() => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = new AudioCtxClass();
      
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + start);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + start);
        osc.stop(audioCtx.currentTime + start + duration);
      };

      // 3-tone high urgency industrial alarm sequence
      playTone(880, 0, 0.25);
      playTone(1100, 0.3, 0.25);
      playTone(880, 0.6, 0.25);
      playTone(1320, 0.9, 0.5);
    } catch (e) {
      console.warn('Audio alarm playback blocked or failed:', e);
    }
  }, []);

  // Trigger Notification when a new breakdown occurs
  const triggerPanneNotification = useCallback((stopData: MachineStop) => {
    // 1. Play Sound
    playIndustrialAlarm();

    const machine = machines.find(m => m.id === stopData.machine_id);
    const title = "🚨 ALERTE PANNE MACHINE";
    const body = `${machine?.name || 'Machine Atelier'} : ${stopData.reason}${stopData.comments ? ` — "${stopData.comments}"` : ''}`;

    // 2. In-App Pop-up Toast
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-slate-900 text-white border-2 border-rose-500 shadow-2xl rounded-2xl pointer-events-auto flex overflow-hidden`}>
        <div className="p-4 flex items-center gap-3.5 flex-1">
          <div className="w-12 h-12 rounded-xl bg-rose-600/30 border border-rose-500 flex items-center justify-center text-rose-400 shrink-0">
            <span className="material-symbols-outlined text-[28px] animate-pulse">car_crash</span>
          </div>
          <div>
            <p className="text-xs font-black text-rose-400 uppercase tracking-wider">{title}</p>
            <p className="text-sm font-bold text-white mt-0.5">{body}</p>
          </div>
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="px-4 border-l border-slate-800 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-colors"
        >
          OK
        </button>
      </div>
    ), { duration: 8000, position: 'top-center' });

    // 3. Desktop / OS Web Notification with Vibration
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body,
          icon: '/favicon.ico',
          requireInteraction: true
        });
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      } catch {}

      if ('vibrate' in navigator) {
        navigator.vibrate([300, 150, 300, 150, 500]);
      }
    }
  }, [machines, playIndustrialAlarm]);

  // Request Notification Permissions
  const handleRequestNotificationPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        toast.success('Notifications de bureau activées avec succès !');
        playIndustrialAlarm();
      } else {
        toast.error('Autorisation des notifications refusée.');
      }
    }
  };

  // Setup Initial Fetch and Supabase Realtime Channels (No 2s Polling!)
  useEffect(() => {
    const orgParam = searchParams.get('org');
    if (orgParam && orgParam !== localStorage.getItem('active_org_id')) {
      localStorage.setItem('active_org_id', orgParam);
      fetchTenantData(orgParam);
    }
    
    // Initial fetch from DB
    fetchStops();
    fetchInitialData();

    // Supabase Realtime WebSocket Connection
    const channel = supabase.channel('mechanic_realtime_stops')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'machine_stops' 
      }, async (payload: any) => {
        console.log('Realtime panne update received directly from DB:', payload);
        await fetchStops();
        await fetchInitialData();

        // If a new stop is inserted or set to in-progress
        if (payload.eventType === 'INSERT') {
          triggerPanneNotification(payload.new as MachineStop);
        } else if (payload.eventType === 'UPDATE' && !payload.new?.end_time && payload.new?.status === 'En cours') {
          triggerPanneNotification(payload.new as MachineStop);
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'machines'
      }, async () => {
        await fetchInitialData();
      })
      .subscribe();

    // Local 10-second timer strictly for updating elapsed time counters in the UI
    const clockInterval = setInterval(() => {
      setClockTick(prev => prev + 1);
    }, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(clockInterval);
    };
  }, [fetchStops, fetchInitialData, fetchTenantData, searchParams, triggerPanneNotification]);

  const getMachine = (id: string | null) => machines.find(m => m.id === id);

  const formatDuration = (start: string) => {
    if (!start) return '-';
    const diffMs = Math.max(0, new Date().getTime() - new Date(start).getTime());
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  const handleResolve = async (id: string) => {
    try {
      await resolveStop(id);
      await fetchStops();
      await fetchInitialData();
      toast.success('Panne résolue ! Machine remise en service.');
    } catch (err: any) {
      toast.error('Erreur lors de la résolution: ' + (err?.message || 'Inconnue'));
    }
  };

  if (loading && stops.length === 0) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <span className="material-symbols-outlined animate-spin text-5xl text-blue-600">refresh</span>
        <p className="text-sm font-bold text-gray-500">Chargement de l'espace mécanicien...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6 font-sans">
      
      {/* Header & Realtime Telemetry Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-[32px]">engineering</span>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Tableau de Bord Mécanicien</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                TEMPS RÉEL ACTIF
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Supervision directe des pannes et interventions machine sans rafraîchissement
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {notificationPermission !== 'granted' && (
            <button
              onClick={handleRequestNotificationPermission}
              className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-sm animate-bounce"
            >
              <span className="material-symbols-outlined text-[18px] text-amber-600">notifications_active</span>
              <span>Activer Notifications & Son</span>
            </button>
          )}

          <button
            onClick={playIndustrialAlarm}
            title="Tester l'alarme sonore"
            className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">volume_up</span>
            <span>Test Alarme</span>
          </button>

          <div className={`px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 border shadow-sm ${
            activeStops.length > 0 
              ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse' 
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}>
            <span className="material-symbols-outlined text-[18px]">
              {activeStops.length > 0 ? 'warning' : 'verified'}
            </span>
            <span>{activeStops.length} Panne{activeStops.length !== 1 ? 's' : ''} en cours</span>
          </div>
        </div>
      </div>

      {/* Main Breakdown List */}
      {activeStops.length === 0 ? (
        <div className="bg-gradient-to-br from-emerald-50/50 to-white border-2 border-emerald-200/60 rounded-3xl p-16 text-center space-y-4 shadow-sm">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <span className="material-symbols-outlined text-[48px]">check_circle</span>
          </div>
          <h3 className="text-2xl font-black text-gray-900">Toutes les machines sont opérationnelles</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Aucun arrêt ou panne machine en cours. Dès qu'un opérateur signale une anomalie depuis sa tablette, cette page se mettra à jour en direct avec alerte sonore.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeStops.map(stop => {
            const machine = getMachine(stop.machine_id);
            const isElec = stop.reason?.toLowerCase().includes('électrique');
            const isMaint = stop.reason?.toLowerCase().includes('maintenance') || stop.reason?.toLowerCase().includes('graissage');
            const isMat = stop.reason?.toLowerCase().includes('matière');
            
            return (
              <div 
                key={stop.id} 
                className="bg-white border-2 border-rose-400 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all relative overflow-hidden flex flex-col justify-between group"
              >
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 animate-pulse" />

                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-[24px] ${
                          isElec ? 'text-amber-500' : isMaint ? 'text-blue-500' : isMat ? 'text-indigo-500' : 'text-rose-600'
                        }`}>
                          {isElec ? 'electric_bolt' : isMaint ? 'engineering' : isMat ? 'inventory_2' : 'car_crash'}
                        </span>
                        <h3 className="font-black text-xl text-gray-900">{machine?.name || 'Machine Inconnue'}</h3>
                      </div>
                      {machine?.code && (
                        <span className="inline-block mt-1 px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold border border-gray-200 font-mono">
                          {machine.code}
                        </span>
                      )}
                    </div>

                    <div className="bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                      EN COURS
                    </div>
                  </div>

                  <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 mb-4">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">Motif de l'arrêt</p>
                    <p className="text-lg font-black text-rose-900">{stop.reason}</p>
                    {stop.comments && (
                      <p className="text-xs text-gray-700 italic mt-2 bg-white/80 p-2.5 rounded-xl border border-rose-100">
                        💬 "{stop.comments}"
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-200 text-center mb-6">
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Heure d'arrêt</p>
                      <p className="font-mono font-bold text-gray-800 text-base mt-0.5">
                        {stop.start_time ? new Date(stop.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Durée écoulée</p>
                      <p className="font-mono font-black text-rose-600 text-base mt-0.5 animate-pulse">
                        {formatDuration(stop.start_time)}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleResolve(stop.id)}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-2xl font-black text-base transition-all shadow-lg shadow-emerald-600/20 active:scale-98 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[22px]">check_circle</span>
                  <span>Marquer comme Résolu</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
