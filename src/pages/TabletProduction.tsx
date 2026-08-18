import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMesStore } from '../store/mesStore';
import { useProductionStore } from '../store/production';
import { useTenantStore } from '../store/tenantStore';
import { useStopsStore } from '../store/stops';
import { supabase } from '../lib/supabase';
import { enqueueOfflineEvent, processOfflineSync, getOfflineQueue } from '../utils/offlineQueue';
import toast from 'react-hot-toast';

export function TabletProduction() {
  const [searchParams] = useSearchParams();
  const { orders, articles, raw_materials, addProductionEntry, fetchInitialData: fetchMesData, setupRealtime: setupMesRealtime } = useMesStore();
  const { machines, operators, sessions, startSession, updateSessionStatus, fetchInitialData: fetchProdData, updateMachine } = useProductionStore();
  const { currentOrg, fetchTenantData } = useTenantStore();
  const { stops, fetchStops, declareStop, resolveStop } = useStopsStore();
  
  // Offline state
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingSyncCount, setPendingSyncCount] = useState(getOfflineQueue().length);

  // Local state for the tablet's assigned machine (persisted in localStorage)
  const [selectedMachineId, setSelectedMachineId] = useState<string>('');
  
  // Local state to simulate machine status on this tablet
  const [isConnected, setIsConnected] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  // Production counters (direct typing or quick carton increments)
  const [axesQty, setAxesQty] = useState<number>(0);
  const [scrapQty, setScrapQty] = useState<number>(0);

  // Machine Breakdown / Panne State
  const [isPanneModalOpen, setIsPanneModalOpen] = useState(false);
  const [panneReason, setPanneReason] = useState('Panne Mécanique');
  const [panneComment, setPanneComment] = useState('');
  const [isSubmittingPanne, setIsSubmittingPanne] = useState(false);

  // Selected OF, Active Team (up to 4 operators), and Raw Material for this session
  const [selectedOfId, setSelectedOfId] = useState<string>('');
  const [selectedOperatorIds, setSelectedOperatorIds] = useState<string[]>([]);
  const [selectedRawMaterialId, setSelectedRawMaterialId] = useState<string>('');
  const [rmSearch, setRmSearch] = useState('');
  const [showRmDropdown, setShowRmDropdown] = useState(false);
  const lastAutoSelectedOfId = React.useRef<string | null>(null);
  
  // Carton Capacity (Colisage / Pieces per carton) - dynamic per OF
  const [cartonCapacity, setCartonCapacity] = useState<number>(36);
  
  const [rollNumberInput, setRollNumberInput] = useState<string>('');
  
  // QC Form States
  const [qcMetrage, setQcMetrage] = useState<string>('');
  const [qcPoids, setQcPoids] = useState<string>('');

  // Production Submit Lock & Cooldown States
  const [isSubmittingProduction, setIsSubmittingProduction] = useState<boolean>(false);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  // Operator PIN Pad Modal State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinTargetOperator, setPinTargetOperator] = useState<any | null>(null);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  useEffect(() => {
    const orgParam = searchParams.get('org');
    const machineParam = searchParams.get('machine');

    if (orgParam && orgParam !== localStorage.getItem('active_org_id')) {
      localStorage.setItem('active_org_id', orgParam);
      fetchTenantData(orgParam);
      fetchMesData();
      fetchProdData();
    } else {
      fetchTenantData();
    }

    if (machineParam) {
      setSelectedMachineId(machineParam);
      localStorage.setItem('tablet_machine_id', machineParam);
    }
  }, [searchParams, fetchTenantData, fetchMesData, fetchProdData]);

  useEffect(() => {
    // Initial fetch
    fetchMesData();
    fetchProdData();
    fetchStops();
    if (setupMesRealtime) setupMesRealtime();
    
    const savedMachineId = localStorage.getItem('tablet_machine_id');
    if (savedMachineId) {
      setSelectedMachineId(savedMachineId);
    }

    // Load active team (up to 4 workers)
    const savedTeam = localStorage.getItem('tablet_operator_ids');
    if (savedTeam) {
      try {
        const parsed = JSON.parse(savedTeam);
        if (Array.isArray(parsed)) setSelectedOperatorIds(parsed);
      } catch {}
    } else {
      const legacyOp = localStorage.getItem('tablet_operator_id');
      if (legacyOp) setSelectedOperatorIds([legacyOp]);
    }

    // Supabase Realtime subscription for stops and machine status changes
    const realtimeChannel = supabase.channel('tablet_realtime_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'machine_stops' }, () => {
        fetchStops();
        fetchProdData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'machines' }, () => {
        fetchProdData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'production_sessions' }, () => {
        fetchProdData();
      })
      .subscribe();

    const handleOnline = () => {
      setIsOnline(true);
      processOfflineSync().then(() => setPendingSyncCount(getOfflineQueue().length));
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleFocus = () => {
      fetchMesData();
      fetchProdData();
      fetchStops();
      setPendingSyncCount(getOfflineQueue().length);
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') handleFocus();
    });

    return () => {
      supabase.removeChannel(realtimeChannel);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchMesData, fetchProdData, fetchStops, setupMesRealtime]);

  const handleMachineSelect = (id: string) => {
    setSelectedMachineId(id);
    localStorage.setItem('tablet_machine_id', id);
  };

  // Sync active session if another tablet or admin started it
  useEffect(() => {
    if (isConnected && selectedMachineId) {
      const currentActive = sessions.find(s => s.machine_id === selectedMachineId && s.status === 'En cours');
      if (currentActive) {
        setActiveSessionId(currentActive.id);
        if (currentActive.operator_id && selectedOperatorIds.length === 0) {
          setSelectedOperatorIds([currentActive.operator_id]);
        }
        const inProgressOf = orders.find(o => o.machine_id === selectedMachineId && o.status === 'In Production');
        if (inProgressOf && !selectedOfId) setSelectedOfId(inProgressOf.id);
      } else {
        setActiveSessionId(null);
      }
    }
  }, [sessions, isConnected, selectedMachineId, selectedOperatorIds.length]);

  // Auto-select raw material and sync carton capacity when an OF is selected
  useEffect(() => {
    if (selectedOfId && articles.length > 0 && raw_materials.length > 0) {
      if (lastAutoSelectedOfId.current !== selectedOfId) {
        const order = orders.find(o => o.id === selectedOfId);
        if (order) {
          const article = articles.find(a => a.id === order.article_id);
          if (article) {
            const matchingRm = raw_materials.find(rm => rm.category === 'Jumbo Roll' && rm.reference === article.reference);
            if (matchingRm) {
              setSelectedRawMaterialId(matchingRm.id);
              setRmSearch(matchingRm.reference);
            } else {
              setSelectedRawMaterialId('');
              setRmSearch('');
            }
            lastAutoSelectedOfId.current = selectedOfId;
          }

          // Initialize carton capacity for this OF
          const savedColisage = localStorage.getItem(`of_colisage_${selectedOfId}`);
          const parsedOrderColisage = order.colisage ? parseInt(String(order.colisage).replace(/[^0-9]/g, '')) : null;

          if (savedColisage) {
            setCartonCapacity(parseInt(savedColisage) || 36);
          } else if (parsedOrderColisage && parsedOrderColisage > 0) {
            setCartonCapacity(parsedOrderColisage);
            localStorage.setItem(`of_colisage_${selectedOfId}`, String(parsedOrderColisage));
          } else {
            setCartonCapacity(36);
          }
        }
      }
    } else if (!selectedOfId) {
      setSelectedRawMaterialId('');
      setRmSearch('');
      lastAutoSelectedOfId.current = null;
    }
  }, [selectedOfId, orders, articles, raw_materials]);

  const handleUpdateCartonCapacity = (newCapacity: number) => {
    const valid = Math.max(1, newCapacity || 1);
    setCartonCapacity(valid);
    if (selectedOfId) {
      localStorage.setItem(`of_colisage_${selectedOfId}`, String(valid));
    }
  };

  const handleConnect = async () => {
    if (!selectedMachineId) {
      toast.error('Veuillez sélectionner une machine d\'abord');
      return;
    }
    try {
      await updateMachine(selectedMachineId, { status: 'Active' });
      setIsConnected(true);
      toast.success('Machine Connectée et Démarrée');
    } catch (err: any) {
      toast.error('Erreur: ' + err.message);
    }
  };

  const handleDisconnect = async () => {
    try {
      if (activeSessionId) {
        await updateSessionStatus(activeSessionId, 'Terminé', new Date().toISOString());
      }
      if (selectedMachineId) {
        await updateMachine(selectedMachineId, { status: 'Inactif' });
      }
      setIsConnected(false);
      setActiveSessionId(null);
      setSelectedOfId('');
      toast.success('Machine Arrêtée et Session Terminée');
    } catch (err: any) {
      toast.error('Erreur: ' + err.message);
    }
  };

  const currentMachine = machines.find(m => m.id === selectedMachineId);
  const currentOrder = orders.find(o => o.id === selectedOfId);
  const currentArticle = articles.find(a => a.id === currentOrder?.article_id);
  
  // Filter to ONLY include shopfloor operators (excluding admins, owners, managers)
  const isShopfloorOperator = (role: string) => {
    const r = (role || '').toLowerCase();
    const isManagerOrAdmin = r.includes('admin') || r.includes('owner') || r.includes('manager') || r.includes('directeur');
    return !isManagerOrAdmin;
  };

  const activeFilteredOperators = operators.filter(o => isShopfloorOperator(o.role || ''));

  // Up to 4 active workers currently on machine
  const activeWorkers = activeFilteredOperators.filter(o => selectedOperatorIds.includes(o.id));

  // Auto-sanitize team selection so stale/foreign IDs are never counted
  useEffect(() => {
    if (activeFilteredOperators.length > 0) {
      setSelectedOperatorIds(prev => {
        const validIds = prev.filter(id => activeFilteredOperators.some(o => o.id === id));
        if (validIds.length !== prev.length) {
          localStorage.setItem('tablet_operator_ids', JSON.stringify(validIds));
          return validIds;
        }
        return prev;
      });
    }
  }, [activeFilteredOperators]);

  // PIN Pad Logic
  const handleOpenPinModal = (operator?: any) => {
    if (operator) {
      setPinTargetOperator(operator);
    } else {
      setPinTargetOperator(null);
    }
    setPinInput('');
    setPinError('');
    setIsPinModalOpen(true);
  };

  const handlePinDigit = (digit: string) => {
    if (pinInput.length < 6) {
      const nextPin = pinInput + digit;
      setPinInput(nextPin);
      setPinError('');
      if (nextPin.length === 4 && pinTargetOperator) {
        verifyPin(nextPin, pinTargetOperator);
      }
    }
  };

  const handlePinBackspace = () => {
    setPinInput(prev => prev.slice(0, -1));
    setPinError('');
  };

  const handlePinClear = () => {
    setPinInput('');
    setPinError('');
  };

  const verifyPin = (pinToTest: string, operator: any) => {
    const expectedPin = operator.pin_code || '1111';
    const isValid = pinToTest === expectedPin || pinToTest === '0000' || pinToTest === '1234' || pinToTest === '1111';

    if (isValid) {
      // 1. Clean current IDs so only active valid operators in this factory are kept
      const currentValidIds = selectedOperatorIds.filter(id => activeFilteredOperators.some(o => o.id === id));
      
      // 2. Add new operator ID if not already present
      const nextTeam = currentValidIds.includes(operator.id)
        ? currentValidIds
        : [...currentValidIds, operator.id].slice(0, 4);

      setSelectedOperatorIds(nextTeam);
      localStorage.setItem('tablet_operator_ids', JSON.stringify(nextTeam));
      setIsPinModalOpen(false);
      setPinInput('');
      setPinTargetOperator(null);
      toast.success(`Ouvrier ajouté à la machine : ${operator.name} (Équipe ${nextTeam.length}/4) 👋`);
    } else {
      setPinError('Code PIN incorrect. Veuillez réessayer.');
      setPinInput('');
    }
  };

  const handleRemoveWorker = (opId: string) => {
    const nextTeam = selectedOperatorIds.filter(id => id !== opId);
    setSelectedOperatorIds(nextTeam);
    localStorage.setItem('tablet_operator_ids', JSON.stringify(nextTeam));
    toast('Ouvrier retiré de la machine', { icon: '👋' });
  };

  const handleStartOrder = async () => {
    if (!selectedOfId) return toast.error('Sélectionnez un OF.');
    if (selectedOperatorIds.length === 0) return toast.error('Ajoutez au moins 1 ouvrier sur la machine.');
    if (!currentArticle) return;

    try {
      const newSession = await startSession({
        machine_id: selectedMachineId,
        article_id: currentArticle.id,
        operator_id: selectedOperatorIds[0],
        operator_ids: selectedOperatorIds
      } as any);
      setActiveSessionId(newSession.id);
      toast.success(`Ordre démarré avec ${selectedOperatorIds.length} ouvrier(s) ! (${cartonCapacity} pcs / carton)`);
    } catch(err: any) {
      toast.error("Erreur: " + err.message);
    }
  };

  const handleEndSession = async () => {
    if (!activeSessionId) return;
    try {
      await updateSessionStatus(activeSessionId, 'Terminé', new Date().toISOString());
      setActiveSessionId(null);
      setSelectedOfId('');
      setAxesQty(0);
      setScrapQty(0);
      setRollNumberInput('');
      setQcMetrage('');
      setQcPoids('');
      toast.success('Session de production terminée avec succès !');
    } catch (err: any) {
      toast.error('Erreur lors de la clôture: ' + err.message);
    }
  };

  // Active Stop on current machine
  const activeMachineStop = stops.find(s => s.machine_id === selectedMachineId && (!s.end_time || s.status === 'En cours'));

  const handleDeclarePanne = async () => {
    if (!selectedMachineId) {
      toast.error('Aucune machine sélectionnée.');
      return;
    }
    setIsSubmittingPanne(true);
    try {
      await declareStop({
        machine_id: selectedMachineId,
        operator_id: selectedOperatorIds[0] || null,
        reason: panneReason,
        comments: panneComment.trim() || undefined,
        status: 'En cours'
      });

      // Broadcast instant alarm to Mechanic Dashboard across tabs and windows
      try {
        const alarmData = {
          machine_id: selectedMachineId,
          machine_name: currentMachine?.name || 'Machine',
          reason: panneReason,
          comments: panneComment.trim(),
          timestamp: Date.now()
        };
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('factoryflow_panne_channel');
          bc.postMessage(alarmData);
          bc.close();
        }
        localStorage.setItem('factoryflow_panne_broadcast', JSON.stringify(alarmData));
      } catch {}

      toast.success(`Arrêt / Panne (${panneReason}) déclaré ! Équipe de maintenance alertée.`);
      setIsPanneModalOpen(false);
      setPanneComment('');
      fetchProdData();
      fetchStops();
    } catch (err: any) {
      toast.error('Erreur déclaration panne : ' + err.message);
    } finally {
      setIsSubmittingPanne(false);
    }
  };

  const handleResolvePanne = async (stopId: string) => {
    try {
      await resolveStop(stopId);
      toast.success('Panne résolue ! Machine remise en service.');
      fetchProdData();
      fetchStops();
    } catch (err: any) {
      toast.error('Erreur reprise : ' + err.message);
    }
  };

  const startCooldownTimer = (seconds = 3) => {
    setCooldownSeconds(seconds);
    const interval = setInterval(() => {
      setCooldownSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async () => {
    if (isSubmittingProduction || cooldownSeconds > 0) return;
    if (!selectedOfId) return toast.error('Veuillez sélectionner un OF.');
    if (selectedOperatorIds.length === 0) return toast.error('Veuillez ajouter au moins 1 ouvrier sur la machine.');
    if (axesQty === 0 && scrapQty === 0) return toast.error('Indiquez la quantité de pièces ou rebuts.');

    setIsSubmittingProduction(true);

    const capacity = Math.max(1, cartonCapacity || 36);
    const numberOfFullCartons = Math.floor(axesQty / capacity);
    const remainder = axesQty % capacity;
    const totalCartons = numberOfFullCartons + (remainder > 0 ? 1 : 0);

    const orgId = currentOrg?.id || (typeof localStorage !== 'undefined' ? localStorage.getItem('active_org_id') : null) || '00000000-0000-0000-0000-000000000000';

    const entryPayload = {
      organization_id: orgId,
      of_id: selectedOfId,
      machine_id: selectedMachineId,
      operator_id: selectedOperatorIds[0] || null,
      operator_ids: selectedOperatorIds,
      raw_material_id: selectedRawMaterialId || null,
      roll_number: rollNumberInput || null,
      good_quantity: axesQty,
      scrap_quantity: scrapQty,
      axes_quantity: axesQty,
      cartons_quantity: totalCartons,
      pieces_per_carton: capacity,
      carton_capacity: capacity,
      qc_metrage: qcMetrage ? parseFloat(qcMetrage) : null,
      qc_poids: qcPoids ? parseFloat(qcPoids) : null,
      is_conforme: true,
      jumbo_roll_quantity: 0,
      comments: `Colisage: ${capacity} pcs/carton | Équipe: ${selectedOperatorIds.length} ouvriers`
    };

    try {
      await (supabase as any).from('manufacturing_orders').update({ colisage: `${capacity}` }).eq('id', selectedOfId);
    } catch {}

    if (!isOnline) {
      enqueueOfflineEvent('PRODUCTION_ENTRY', entryPayload);
      setPendingSyncCount(getOfflineQueue().length);
      toast.success(`Mode Hors-ligne : enregistré localement (${totalCartons} cartons).`);
      setAxesQty(0);
      setScrapQty(0);
      setRollNumberInput('');
      setQcMetrage('');
      setQcPoids('');
      setIsSubmittingProduction(false);
      startCooldownTimer(3);
      return;
    }

    try {
      await addProductionEntry(entryPayload, true); 
      setAxesQty(0);
      setScrapQty(0);
      setRollNumberInput('');
      setQcMetrage('');
      setQcPoids('');
      toast.success(`Production Enregistrée (${totalCartons} cartons générés) 🎉`);
      startCooldownTimer(3);
    } catch (err: any) {
      console.error('Production save error:', err);
      const isNetworkError = !navigator.onLine || err?.message?.includes('fetch') || err?.message?.includes('network') || err?.message?.includes('Failed to fetch');
      if (isNetworkError) {
        enqueueOfflineEvent('PRODUCTION_ENTRY', entryPayload);
        setPendingSyncCount(getOfflineQueue().length);
        toast('Réseau instable : sauvegardé localement pour synchronisation', { icon: '📦' });
        setAxesQty(0);
        setScrapQty(0);
        startCooldownTimer(3);
      } else {
        toast.error('Erreur enregistrement : ' + (err?.message || 'Erreur inconnue'));
      }
    } finally {
      setIsSubmittingProduction(false);
    }
  };

  if (!selectedMachineId) {
    return (
      <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto p-4 sm:p-6 font-sans">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 border border-blue-100 shadow-sm">
          <span className="material-symbols-outlined text-[36px]">tablet</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2 text-center">Poste Tablette Atelier</h1>
        <p className="text-sm text-gray-500 mb-8 text-center max-w-md">
          Sélectionnez la machine physique à laquelle cet écran est assigné ({currentOrg?.name || 'Votre Usine'}).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          {machines.map(m => (
            <button
              key={m.id}
              onClick={() => handleMachineSelect(m.id)}
              className="p-6 bg-white border-2 border-gray-200 rounded-3xl hover:border-blue-500 hover:shadow-xl transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">precision_manufacturing</span>
                </span>
                {m.code && (
                  <span className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                    {m.code}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-black text-gray-900 group-hover:text-blue-600 transition-colors uppercase">{m.name}</h3>
              <p className="text-xs font-medium text-gray-400 mt-1">Département : {(m as any).department || 'Atelier'}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col max-w-[1400px] mx-auto p-2 sm:p-4 gap-4 sm:gap-6 select-none font-sans overflow-x-hidden">
      
      {/* Top Bar: Machine & Active Team Info */}
      <div className="glass-panel p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left rounded-3xl shadow-sm border border-zinc-200">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
          <button 
            onClick={() => !isConnected && handleMachineSelect('')} 
            disabled={isConnected}
            title={isConnected ? "Arrêtez la machine d'abord pour changer" : "Changer de machine"}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex shrink-0 items-center justify-center transition-all ${
              isConnected 
                ? 'bg-zinc-100 text-zinc-300 cursor-not-allowed' 
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 shadow-sm'
            }`}
          >
            <span className="material-symbols-outlined text-2xl sm:text-3xl">settings</span>
          </button>
          <div className="flex flex-col items-center sm:items-start">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
              <h1 className="text-2xl sm:text-4xl font-black text-zinc-900 tracking-wider uppercase">{currentMachine?.name}</h1>
              {currentMachine?.code && (
                <span className="text-xs sm:text-sm font-bold text-zinc-600 bg-zinc-100 px-3 py-1 rounded-xl border border-zinc-200">
                  {currentMachine.code}
                </span>
              )}
            </div>
            <p className="text-zinc-500 text-xs sm:text-sm font-medium mt-1 flex items-center gap-2">
              Statut: {isConnected ? <span className="text-green-600 font-bold">CONNECTÉE</span> : <span className="text-red-500 font-bold">ARRÊTÉE</span>}
              <span className="text-zinc-300">|</span>
              {isOnline ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  En ligne
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                  Hors-ligne ({pendingSyncCount} en attente)
                </span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {pendingSyncCount > 0 && (
            <button
              onClick={async () => {
                await processOfflineSync();
                setPendingSyncCount(getOfflineQueue().length);
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">sync</span>
              Sync ({pendingSyncCount})
            </button>
          )}

          {/* 🚨 Declare Panne / Arrêt Button */}
          <button
            type="button"
            onClick={() => setIsPanneModalOpen(true)}
            className="px-5 py-3 sm:px-6 sm:py-3.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-2xl font-black text-sm sm:text-base transition-all flex items-center gap-2 shadow-lg shadow-rose-600/20 active:scale-95"
          >
            <span className="material-symbols-outlined text-xl sm:text-2xl animate-pulse">warning</span>
            <span>Déclarer Panne</span>
          </button>

          {isConnected && (
            <button 
              onClick={handleDisconnect}
              className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-2xl font-bold text-lg sm:text-xl transition-colors flex justify-center items-center gap-2 sm:gap-3 shadow-sm"
            >
              <span className="material-symbols-outlined text-2xl sm:text-3xl">power_settings_new</span>
              ARRÊTER
            </button>
          )}
        </div>
      </div>

      {/* ⚠️ LIVE BREAKDOWN / PANNE ALERT BANNER */}
      {activeMachineStop && (
        <div className="bg-gradient-to-r from-rose-950 via-red-900 to-rose-900 border-2 border-rose-500 rounded-3xl p-4 sm:p-6 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-14 h-14 rounded-2xl bg-rose-600/30 flex items-center justify-center text-amber-300 shrink-0 border border-rose-400/40">
              <span className="material-symbols-outlined text-[36px]">car_crash</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
                <span className="bg-rose-500 text-white text-xs font-black uppercase px-3 py-1 rounded-full shadow-sm">
                  MACHINE EN PANNE
                </span>
                <span className="text-xs text-rose-200 font-mono">
                  Déclarée à {new Date(activeMachineStop.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                {activeMachineStop.reason} {activeMachineStop.comments ? `— "${activeMachineStop.comments}"` : ''}
              </h2>
              <p className="text-xs text-rose-300 font-medium">L'équipe de maintenance et la supervision ont été notifiées.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleResolvePanne(activeMachineStop.id)}
            className="w-full md:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-base rounded-2xl shadow-xl shadow-emerald-500/30 transition-transform active:scale-95 flex items-center justify-center gap-2 shrink-0"
          >
            <span className="material-symbols-outlined text-[24px]">check_circle</span>
            <span>Panne Résolue / Reprendre</span>
          </button>
        </div>
      )}

      {/* Main Content */}
      {!isConnected ? (
        <div className="flex-1 flex items-center justify-center p-2">
          <button 
            onClick={handleConnect}
            className="w-full max-w-2xl py-12 sm:py-24 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded-3xl sm:rounded-[3rem] shadow-2xl flex flex-col items-center justify-center gap-4 sm:gap-6 text-white transition-transform active:scale-95"
          >
            <span className="material-symbols-outlined text-[60px] sm:text-[100px]">play_circle</span>
            <span className="text-3xl sm:text-6xl font-black uppercase tracking-widest">Démarrer Machine</span>
          </button>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-12 gap-4 sm:gap-6">
          
          {/* Configuration Sidebar */}
          <div className="col-span-12 lg:col-span-4 xl:col-span-3 glass-panel p-4 sm:p-6 flex flex-col gap-4 sm:gap-6 rounded-3xl border border-zinc-200 shadow-sm">
            
            {/* 👷 Multi-Worker Team (Up to 4 Operators) with PIN Pad */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Équipe Machine ({activeWorkers.length}/4 Ouvriers)
                </h2>
                {activeWorkers.length < 4 && (
                  <button 
                    onClick={() => handleOpenPinModal()}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">person_add</span>
                    <span>+ Ouvrier</span>
                  </button>
                )}
              </div>

              {activeWorkers.length > 0 ? (
                <div className="space-y-2">
                  {activeWorkers.map(w => (
                    <div key={w.id} className="p-3 bg-emerald-50/80 border border-emerald-300 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                          {w.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <h4 className="font-bold text-xs text-zinc-900 truncate">{w.name}</h4>
                          <p className="text-[10px] text-emerald-700 font-semibold">PIN Vérifié • Actif</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRemoveWorker(w.id)}
                        className="p-1 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Retirer cet ouvrier"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>
                  ))}

                  {activeWorkers.length < 4 && (
                    <button
                      onClick={() => handleOpenPinModal()}
                      className="w-full py-2.5 bg-zinc-50 hover:bg-blue-50 border border-dashed border-zinc-300 hover:border-blue-400 rounded-xl text-xs font-bold text-zinc-600 hover:text-blue-700 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      <span>Ajouter un co-ouvrier (Max 4)</span>
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => handleOpenPinModal()}
                  className="w-full p-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[22px]">pin</span>
                  <span>Ajouter Ouvrier (Code PIN)</span>
                </button>
              )}
            </div>

            {/* Order Selector */}
            <div className="border-t border-zinc-100 pt-4 sm:pt-6">
              <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Ordre de Fabrication (OF)</h2>
              <select 
                value={selectedOfId} 
                disabled={Boolean(activeSessionId)}
                onChange={(e) => setSelectedOfId(e.target.value)}
                className={`w-full p-3 sm:p-4 rounded-2xl border-2 text-zinc-900 text-base sm:text-lg font-bold appearance-none focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all ${
                  activeSessionId ? 'bg-zinc-100 border-zinc-200 cursor-not-allowed opacity-90' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <option value="">Sélectionner OF</option>
                {[...orders]
                  .filter(o => ['In Production', 'En Production', 'En cours'].includes(o.status))
                  .filter(o => o.machine_id === selectedMachineId)
                  .sort((a, b) => {
                    const weight = { 'Haute': 3, 'Moyenne': 2, 'Basse': 1 };
                    return (weight[b.priority || 'Moyenne'] || 0) - (weight[a.priority || 'Moyenne'] || 0);
                  })
                  .map(o => {
                    const emoji = o.priority === 'Haute' ? '🔴' : o.priority === 'Basse' ? '⚪' : '🟡';
                    return <option key={o.id} value={o.id}>{emoji} {o.of_number} ({o.priority || 'Moyenne'})</option>;
                  })}
              </select>
            </div>

            {/* Raw Material Selector */}
            <div className="border-t border-zinc-100 pt-4 sm:pt-6">
              <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Bobine Mère (Jumbo Roll)</h2>
              <div className="flex flex-col gap-2.5">
                <div className="relative">
                  <input
                    type="text"
                    value={rmSearch}
                    disabled={Boolean(activeSessionId)}
                    onChange={(e) => {
                      setRmSearch(e.target.value);
                      setShowRmDropdown(true);
                      setSelectedRawMaterialId('');
                    }}
                    onFocus={() => !activeSessionId && setShowRmDropdown(true)}
                    onBlur={() => setTimeout(() => setShowRmDropdown(false), 200)}
                    placeholder="Sélectionner Bobine (Optionnel)..."
                    className={`w-full p-3.5 rounded-2xl border-2 text-zinc-900 text-sm font-bold focus:outline-none focus:border-blue-600 transition-all placeholder:font-normal placeholder:text-zinc-400 ${
                      activeSessionId ? 'bg-zinc-100 border-zinc-200 cursor-not-allowed' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  />
                  {showRmDropdown && !activeSessionId && (
                    <ul className="absolute z-10 w-full mt-2 bg-white border-2 border-zinc-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                      {raw_materials
                        .filter(rm => rm.category === 'Jumbo Roll')
                        .filter(rm => rm.reference?.toLowerCase().includes(rmSearch.toLowerCase()))
                        .map(rm => (
                          <li 
                            key={rm.id}
                            onMouseDown={() => {
                              setSelectedRawMaterialId(rm.id);
                              setRmSearch(rm.reference);
                              setShowRmDropdown(false);
                            }}
                            className="p-3 hover:bg-zinc-100 cursor-pointer text-sm font-bold text-zinc-900 border-b border-zinc-100 last:border-0"
                          >
                            {rm.reference}
                          </li>
                        ))
                      }
                    </ul>
                  )}
                </div>
                
                <input
                  type="text"
                  placeholder="Saisir le N° de Bobine..."
                  value={rollNumberInput}
                  onChange={(e) => setRollNumberInput(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-white border-2 border-zinc-200 text-zinc-900 text-sm font-bold focus:outline-none focus:border-blue-600 transition-all placeholder:font-normal placeholder:text-zinc-400"
                />
              </div>
            </div>

            {currentOrder && currentArticle && (
              <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-200 flex-1 flex flex-col relative">
                <div className="absolute top-3.5 right-3.5">
                  <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full border ${
                    currentOrder.priority === 'Haute' ? 'bg-red-100 text-red-700 border-red-200' :
                    currentOrder.priority === 'Basse' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                    'bg-yellow-100 text-yellow-700 border-yellow-200'
                  }`}>
                    {currentOrder.priority || 'Moyenne'}
                  </span>
                </div>

                <p className="text-[11px] text-blue-700 font-bold uppercase mb-1">Article en Fabrication</p>
                <p className="text-xl font-black text-zinc-900 mb-1 pr-10">{currentArticle.reference}</p>
                <p className="text-xs text-zinc-600 font-medium mb-3">{currentArticle.designation}</p>

                {/* Dynamic Carton Capacity Indicator */}
                <div className="mt-auto p-3 bg-white rounded-xl border border-blue-200 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-700">Colisage Carton :</span>
                    <span className="font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {cartonCapacity} pcs / carton
                    </span>
                  </div>
                  <div className="flex gap-1 pt-1">
                    {[24, 36, 48, 72].map(preset => (
                      <button
                        key={preset}
                        onClick={() => handleUpdateCartonCapacity(preset)}
                        className={`flex-1 py-1 rounded text-[11px] font-bold transition-colors ${
                          cartonCapacity === preset ? 'bg-blue-600 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Exact Same Place: Launch Session OR End Session Button */}
            {!activeSessionId ? (
              <button 
                onClick={handleStartOrder}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-base uppercase tracking-wider shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[24px]">play_circle</span>
                <span>Lancer la Production</span>
              </button>
            ) : (
              <button 
                onClick={handleEndSession}
                className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-base uppercase tracking-wider shadow-lg shadow-rose-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[24px]">stop_circle</span>
                <span>Terminer la Session</span>
              </button>
            )}

          </div>

          {/* Main Production Controls - Visible ONLY when a session is active */}
          <div className="col-span-12 lg:col-span-8 xl:col-span-9 flex flex-col gap-4 sm:gap-6">
            
            {!activeSessionId ? (
              /* Waiting State when session is not started */
              <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-zinc-200 shadow-sm bg-white flex flex-col items-center justify-center text-center space-y-6 flex-1 min-h-[460px]">
                <div className="w-20 h-20 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-inner">
                  <span className="material-symbols-outlined text-[44px]">pending_actions</span>
                </div>
                <div className="max-w-md space-y-2">
                  <h3 className="text-2xl font-black text-zinc-900">Session de Production en Attente</h3>
                  <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                    Veuillez sélectionner un <strong className="text-zinc-700">Ordre de Fabrication (OF)</strong> dans la barre latérale, puis cliquez sur le bouton vert <strong className="text-emerald-600">"Lancer la Production"</strong> pour débloquer la saisie des pièces et des cartons.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-zinc-500 bg-zinc-50 px-4 py-3 rounded-2xl border border-zinc-200">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> 1. Ouvrier(s) connecté(s)</span>
                  <span className="text-zinc-300">→</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> 2. Sélection OF</span>
                  <span className="text-zinc-300">→</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-600"></span> 3. Lancer la Production</span>
                </div>
              </div>
            ) : (
              /* Active Session Controls */
              <>
                {/* Quantity Inputs & Increment Panels */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  
                  {/* Conforming Rolls (Direct Input + Whole Cartons) */}
                  <div className="glass-panel p-6 sm:p-8 flex flex-col justify-between rounded-3xl border border-zinc-200 shadow-sm bg-white">
                    <div className="text-center space-y-2">
                      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                        Pièces / Rouleaux Conformes
                      </h3>
                      
                      {/* Direct tactile numeric input */}
                      <div className="flex items-center justify-center py-2">
                        <input
                          type="number"
                          min="0"
                          value={axesQty === 0 ? '' : axesQty}
                          onChange={(e) => setAxesQty(Math.max(0, parseInt(e.target.value) || 0))}
                          placeholder="0"
                          className="text-5xl sm:text-7xl font-black text-zinc-900 tracking-tight text-center w-full max-w-xs py-3 bg-zinc-50 focus:bg-white border-2 border-zinc-200 focus:border-blue-600 rounded-3xl outline-none transition-all shadow-inner"
                        />
                      </div>

                      <p className="text-xs font-bold text-emerald-600">
                        ≈ {Math.floor(axesQty / Math.max(1, cartonCapacity))} carton(s) complet(s) {axesQty % Math.max(1, cartonCapacity) > 0 ? `+ ${axesQty % Math.max(1, cartonCapacity)} pcs restantes` : ''}
                      </p>
                    </div>
                    
                    {/* Quick Add Buttons by Whole Cartons */}
                    <div className="space-y-2 mt-6 pt-4 border-t border-zinc-100">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 text-center">
                        Ajout Rapide par Cartons
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <button 
                          onClick={() => setAxesQty(prev => prev + cartonCapacity)} 
                          className="py-3.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-2xl font-black text-sm sm:text-base transition-all active:scale-95 flex flex-col items-center shadow-xs"
                        >
                          <span>+1 Carton</span>
                          <span className="text-[10px] font-semibold text-blue-500">(+{cartonCapacity} pcs)</span>
                        </button>
                        <button 
                          onClick={() => setAxesQty(prev => prev + (cartonCapacity * 5))} 
                          className="py-3.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-2xl font-black text-sm sm:text-base transition-all active:scale-95 flex flex-col items-center shadow-xs"
                        >
                          <span>+5 Cartons</span>
                          <span className="text-[10px] font-semibold text-blue-500">(+{cartonCapacity * 5} pcs)</span>
                        </button>
                        <button 
                          onClick={() => setAxesQty(prev => prev + (cartonCapacity * 10))} 
                          className="py-3.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-2xl font-black text-sm sm:text-base transition-all active:scale-95 flex flex-col items-center shadow-xs"
                        >
                          <span>+10 Cartons</span>
                          <span className="text-[10px] font-semibold text-blue-500">(+{cartonCapacity * 10} pcs)</span>
                        </button>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <button 
                          onClick={() => setAxesQty(0)} 
                          className="text-xs font-bold text-zinc-400 hover:text-red-500 transition-colors"
                        >
                          Réinitialiser (0)
                        </button>
                        <span className="text-[11px] text-zinc-400 font-medium">Ou tapez le chiffre exact ci-dessus</span>
                      </div>
                    </div>
                  </div>

                  {/* Scrap Rolls (Direct Input + Quick Rebuts) */}
                  <div className="glass-panel p-6 sm:p-8 flex flex-col justify-between rounded-3xl border border-zinc-200 shadow-sm bg-white">
                    <div className="text-center space-y-2">
                      <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest">
                        Rebuts & Déchets (Unités)
                      </h3>
                      
                      {/* Direct tactile numeric input */}
                      <div className="flex items-center justify-center py-2">
                        <input
                          type="number"
                          min="0"
                          value={scrapQty === 0 ? '' : scrapQty}
                          onChange={(e) => setScrapQty(Math.max(0, parseInt(e.target.value) || 0))}
                          placeholder="0"
                          className="text-5xl sm:text-7xl font-black text-red-600 tracking-tight text-center w-full max-w-xs py-3 bg-red-50/50 focus:bg-white border-2 border-red-200 focus:border-red-500 rounded-3xl outline-none transition-all shadow-inner"
                        />
                      </div>

                      <p className="text-xs font-bold text-red-400">Non conforme / Perte matière</p>
                    </div>
                    
                    {/* Quick Scrap Buttons */}
                    <div className="space-y-2 mt-6 pt-4 border-t border-zinc-100">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-red-400 text-center">
                        Ajout Rapide Rebuts
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <button 
                          onClick={() => setScrapQty(prev => prev + 1)} 
                          className="py-3.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-2xl font-black text-sm sm:text-base transition-all active:scale-95"
                        >
                          +1 Rebut
                        </button>
                        <button 
                          onClick={() => setScrapQty(prev => prev + 5)} 
                          className="py-3.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-2xl font-black text-sm sm:text-base transition-all active:scale-95"
                        >
                          +5 Rebuts
                        </button>
                        <button 
                          onClick={() => setScrapQty(prev => prev + 10)} 
                          className="py-3.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-2xl font-black text-sm sm:text-base transition-all active:scale-95"
                        >
                          +10 Rebuts
                        </button>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <button 
                          onClick={() => setScrapQty(0)} 
                          className="text-xs font-bold text-zinc-400 hover:text-red-500 transition-colors"
                        >
                          Effacer Rebuts (0)
                        </button>
                        <span className="text-[11px] text-zinc-400 font-medium">Ou tapez le chiffre exact ci-dessus</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Quality Inspection & Validation */}
                <div className="glass-panel p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-4 bg-white">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Contrôle Qualité Échantillon (Optionnel)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-600 mb-1">Métrage mesuré (m)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Ex: 50.2"
                        value={qcMetrage}
                        onChange={(e) => setQcMetrage(e.target.value)}
                        className="w-full p-3 rounded-xl bg-zinc-50 border border-zinc-200 font-bold text-zinc-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-600 mb-1">Poids mesuré (g)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Ex: 145.5"
                        value={qcPoids}
                        onChange={(e) => setQcPoids(e.target.value)}
                        className="w-full p-3 rounded-xl bg-zinc-50 border border-zinc-200 font-bold text-zinc-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Validation & Submit Button with Cooldown Protection */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmittingProduction || cooldownSeconds > 0 || (axesQty === 0 && scrapQty === 0)}
                  className="w-full py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-3xl font-black text-xl sm:text-2xl uppercase tracking-wider shadow-xl shadow-blue-500/20 active:scale-98 transition-all flex items-center justify-center gap-3 disabled:cursor-not-allowed"
                >
                  {isSubmittingProduction ? (
                    <>
                      <span className="material-symbols-outlined text-[32px] animate-spin">refresh</span>
                      <span>Génération des Cartons en cours...</span>
                    </>
                  ) : cooldownSeconds > 0 ? (
                    <>
                      <span className="material-symbols-outlined text-[32px] text-emerald-300">check_circle</span>
                      <span>Cartons Générés ! (Attente {cooldownSeconds}s)</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[32px]">inventory_2</span>
                      <span>Valider & Générer Cartons ({Math.ceil(axesQty / Math.max(1, cartonCapacity))} ctn)</span>
                    </>
                  )}
                </button>
              </>
            )}

          </div>
        </div>
      )}

      {/* 🔢 Interactive Touch PIN Keypad Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-slate-800 space-y-6 text-center">
            
            {/* Step 1: Pick Operator from list */}
            {!pinTargetOperator ? (
              <div className="space-y-4">
                <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/20">
                  <span className="material-symbols-outlined text-[28px]">group_add</span>
                </div>
                <h2 className="text-xl font-black">Ajouter un Ouvrier sur la Machine</h2>
                <p className="text-xs text-slate-400">Touchez un profil pour entrer le code PIN (Équipe max : 4 ouvriers).</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pt-2">
                  {activeFilteredOperators.map(op => {
                    const isAlreadyInTeam = selectedOperatorIds.includes(op.id);
                    return (
                      <button
                        key={op.id}
                        disabled={isAlreadyInTeam}
                        onClick={() => handleOpenPinModal(op)}
                        className={`p-4 rounded-2xl flex items-center gap-3 transition-all text-left border ${
                          isAlreadyInTeam 
                            ? 'bg-slate-800/40 border-slate-800 opacity-50 cursor-not-allowed'
                            : 'bg-slate-800 hover:bg-blue-600/30 border-slate-700 hover:border-blue-500'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md">
                          {op.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="font-bold text-sm text-white truncate">{op.name}</h4>
                          <p className="text-[10px] text-slate-400 uppercase">
                            {isAlreadyInTeam ? '✓ Déjà en poste' : 'Opérateur'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setIsPinModalOpen(false)}
                  className="w-full py-2.5 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider"
                >
                  Annuler
                </button>
              </div>
            ) : (
              /* Step 2: Touch PIN Pad */
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2.5 text-left">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                      {pinTargetOperator.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-white">{pinTargetOperator.name}</h3>
                      <p className="text-[10px] text-blue-400">Entrez votre code PIN (4 chiffres)</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setPinTargetOperator(null)}
                    className="text-xs text-slate-400 hover:text-white bg-slate-800 px-2.5 py-1 rounded-lg"
                  >
                    Changer
                  </button>
                </div>

                {/* PIN Dots Display */}
                <div className="py-2">
                  <div className="flex justify-center gap-3">
                    {[0, 1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className={`w-4 h-4 rounded-full transition-all duration-150 ${
                          pinInput.length > idx 
                            ? 'bg-blue-500 scale-125 shadow-lg shadow-blue-500/50' 
                            : 'bg-slate-800 border border-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  {pinError && (
                    <p className="text-xs font-bold text-rose-400 mt-3 animate-bounce">{pinError}</p>
                  )}
                </div>

                {/* Touch Numeric Keypad */}
                <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                    <button
                      key={num}
                      onClick={() => handlePinDigit(num)}
                      className="h-14 bg-slate-800 hover:bg-slate-700 active:bg-blue-600 rounded-2xl text-2xl font-black text-white shadow-sm active:scale-95 transition-all flex items-center justify-center"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    onClick={handlePinClear}
                    className="h-14 bg-slate-800/60 hover:bg-slate-800 text-slate-400 rounded-2xl text-xs font-black uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center"
                  >
                    C
                  </button>
                  <button
                    onClick={() => handlePinDigit('0')}
                    className="h-14 bg-slate-800 hover:bg-slate-700 active:bg-blue-600 rounded-2xl text-2xl font-black text-white shadow-sm active:scale-95 transition-all flex items-center justify-center"
                  >
                    0
                  </button>
                  <button
                    onClick={handlePinBackspace}
                    className="h-14 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl active:scale-95 transition-all flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[24px]">backspace</span>
                  </button>
                </div>

                <div className="pt-2 flex justify-between items-center text-xs text-slate-500">
                  <span>PIN par défaut : <strong className="text-slate-400">1111 / 1234 / 0000</strong></span>
                  <button
                    onClick={() => setIsPinModalOpen(false)}
                    className="font-bold text-slate-400 hover:text-white"
                  >
                    Fermer
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* 🚨 TOUCH-FRIENDLY PANNE / BREAKDOWN MODAL */}
      {isPanneModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl space-y-6 text-white text-center">
            
            <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/30">
              <span className="material-symbols-outlined text-[36px]">car_crash</span>
            </div>
            
            <div>
              <h2 className="text-2xl font-black">Déclaration d'Arrêt / Panne Machine</h2>
              <p className="text-xs text-slate-400 mt-1">
                Sélectionnez le motif pour alerter l'équipe de maintenance ({currentMachine?.name}).
              </p>
            </div>

            {/* Quick Reason Buttons */}
            <div className="grid grid-cols-2 gap-3 text-left">
              {[
                { reason: 'Panne Mécanique', icon: 'settings' },
                { reason: 'Panne Électrique', icon: 'electric_bolt' },
                { reason: 'Rupture Matière', icon: 'inventory_2' },
                { reason: 'Changement Série', icon: 'sync' },
                { reason: 'Nettoyage & Graissage', icon: 'cleaning_services' },
                { reason: 'Autre Arrêt Imprévu', icon: 'help' }
              ].map((item) => (
                <button
                  key={item.reason}
                  type="button"
                  onClick={() => setPanneReason(item.reason)}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center gap-3 ${
                    panneReason === item.reason
                      ? 'bg-rose-600/30 border-rose-500 text-white shadow-lg ring-1 ring-rose-500'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <span className="material-symbols-outlined text-[24px] text-rose-400">{item.icon}</span>
                  <span className="text-xs font-bold">{item.reason}</span>
                </button>
              ))}
            </div>

            {/* Comment Area */}
            <div>
              <label className="block text-left text-xs font-bold text-slate-400 uppercase mb-1.5">
                Commentaire / Précision (Optionnel)
              </label>
              <textarea
                rows={2}
                value={panneComment}
                onChange={(e) => setPanneComment(e.target.value)}
                placeholder="Ex: Bruit anormal au niveau du rouleau presseur droit..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 transition-all"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPanneModalOpen(false)}
                className="w-1/3 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isSubmittingPanne}
                onClick={handleDeclarePanne}
                className="w-2/3 py-3.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                <span>{isSubmittingPanne ? 'Envoi...' : 'Déclarer & Alerter'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
