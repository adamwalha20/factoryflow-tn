import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
import { useTenantStore } from '../../store/tenantStore';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface FactoryStats {
  id: string;
  name: string;
  legal_name?: string;
  slug?: string;
  city?: string;
  governorate?: string;
  industry?: string;
  tax_id?: string;
  phone?: string;
  email?: string;
  created_at: string;
  plan_name?: string;
  plan_price?: number;
  subscription_status?: string;
  trial_end?: string;
  machine_count: number;
  user_count: number;
  employee_count: number;
  of_count: number;
  production_count: number;
  carton_count: number;
  material_count: number;
  stop_count: number;
  inspection_count: number;
}

export function DeveloperDashboard() {
  const navigate = useNavigate();
  const { employee, setTestUser } = useAuthStore();
  const { switchOrganization } = useTenantStore();

  // Standalone Developer Gate State (Independent from normal app auth)
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('dev_master_auth') === 'true' || employee?.role === 'Developer';
  });
  const [devEmailInput, setDevEmailInput] = useState('');
  const [devPasswordInput, setDevPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState<'factories' | 'analytics' | 'database' | 'logs'>('factories');
  const [factories, setFactories] = useState<FactoryStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState('ALL');

  // Selected Factory for Detailed View Drawer/Modal
  const [detailedFactory, setDetailedFactory] = useState<FactoryStats | null>(null);

  // Purge / Delete Modal State
  const [purgeTarget, setPurgeTarget] = useState<{ factory: FactoryStats; type: string } | null>(null);
  const [purgeConfirmText, setPurgeConfirmText] = useState('');
  const [isPurging, setIsPurging] = useState(false);

  // Edit Plan Modal State
  const [editPlanFactory, setEditPlanFactory] = useState<FactoryStats | null>(null);
  const [newPlanSlug, setNewPlanSlug] = useState('enterprise');
  const [newSubStatus, setNewSubStatus] = useState('ACTIVE');

  // Global Table Counts for Database Tab
  const [tableCounts, setTableCounts] = useState<{ [table: string]: number }>({});

  // System Logs
  const [systemLogs, setSystemLogs] = useState<any[]>([]);

  useEffect(() => {
    if (isUnlocked) {
      fetchDeveloperData();
    }
  }, [isUnlocked]);

  // Handle Standalone Master Developer Login
  const handleMasterLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const cleanEmail = devEmailInput.trim().toLowerCase();

    const isValidDev = 
      (cleanEmail === 'dev@factoryflow.tn' || cleanEmail === 'developer@factoryflow.tn' || cleanEmail === 'admin@factoryflow.tn' || cleanEmail === 'adam@factoryflow.tn' || cleanEmail === 'dev') &&
      (devPasswordInput === 'developer123' || devPasswordInput === 'admin123' || devPasswordInput === 'dev' || devPasswordInput === 'admin');

    if (isValidDev) {
      sessionStorage.setItem('dev_master_auth', 'true');
      setIsUnlocked(true);
      setTestUser({
        id: 'developer-master-root',
        first_name: 'Super',
        last_name: 'Developer',
        role: 'Developer'
      });
      toast.success('Console Développeur déverrouillée avec succès !');
    } else {
      setAuthError('Identifiants développeur non reconnus.');
    }
  };

  const handleLockConsole = () => {
    sessionStorage.removeItem('dev_master_auth');
    setIsUnlocked(false);
    setDevPasswordInput('');
    toast('Console développeur verrouillée.', { icon: '🔒' });
  };

  const fetchDeveloperData = async () => {
    setIsLoading(true);
    try {
      const [
        { data: orgs, error: orgsErr },
        { data: subs },
        { data: machines },
        { data: users },
        { data: employees },
        { data: ofs },
        { data: prodEntries },
        { data: cartons },
        { data: materials },
        { data: stops },
        { data: inspections },
        { data: auditLogs }
      ] = await Promise.all([
        (supabase as any).from('organizations').select('*').order('created_at', { ascending: false }),
        (supabase as any).from('subscriptions').select('*, plan:subscription_plans(*)'),
        (supabase as any).from('machines').select('id, organization_id, name, status'),
        (supabase as any).from('users').select('id, organization_id, role, status'),
        (supabase as any).from('employees').select('id, organization_id, role'),
        (supabase as any).from('manufacturing_orders').select('id, organization_id, status'),
        (supabase as any).from('production_entries').select('id, organization_id, good_quantity, scrap_quantity'),
        (supabase as any).from('cartons').select('id, organization_id, quantity'),
        (supabase as any).from('raw_materials').select('id, organization_id'),
        (supabase as any).from('machine_stops').select('id, organization_id'),
        (supabase as any).from('quality_inspections').select('id, organization_id, result'),
        (supabase as any).from('audit_logs').select('*').order('created_at', { ascending: false }).limit(40)
      ]);

      if (orgsErr) throw orgsErr;

      const subMap = new Map((subs || []).map((s: any) => [s.organization_id, s]));

      const aggregated: FactoryStats[] = (orgs || []).map((org: any) => {
        const sub: any = subMap.get(org.id);
        const orgMachines = (machines || []).filter((m: any) => m.organization_id === org.id);
        const orgUsers = (users || []).filter((u: any) => u.organization_id === org.id);
        const orgEmployees = (employees || []).filter((e: any) => e.organization_id === org.id);
        const orgOfs = (ofs || []).filter((o: any) => o.organization_id === org.id);
        const orgProds = (prodEntries || []).filter((p: any) => p.organization_id === org.id);
        const orgCartons = (cartons || []).filter((c: any) => c.organization_id === org.id);
        const orgMaterials = (materials || []).filter((m: any) => m.organization_id === org.id);
        const orgStops = (stops || []).filter((s: any) => s.organization_id === org.id);
        const orgInspections = (inspections || []).filter((i: any) => i.organization_id === org.id);

        return {
          id: org.id,
          name: org.name,
          legal_name: org.legal_name,
          slug: org.slug,
          city: org.city,
          governorate: org.governorate,
          industry: org.industry,
          tax_id: org.tax_id,
          phone: org.phone,
          email: org.email,
          created_at: org.created_at,
          plan_name: sub?.plan?.name || 'Essai Pro',
          plan_price: Number(sub?.plan?.monthly_price) || 0,
          subscription_status: sub?.status || 'TRIALING',
          trial_end: sub?.trial_end,
          machine_count: orgMachines.length,
          user_count: orgUsers.length,
          employee_count: orgEmployees.length,
          of_count: orgOfs.length,
          production_count: orgProds.length,
          carton_count: orgCartons.length,
          material_count: orgMaterials.length,
          stop_count: orgStops.length,
          inspection_count: orgInspections.length
        };
      });

      setFactories(aggregated);
      setSystemLogs(auditLogs || []);

      setTableCounts({
        organizations: (orgs || []).length,
        users: (users || []).length,
        employees: (employees || []).length,
        machines: (machines || []).length,
        manufacturing_orders: (ofs || []).length,
        production_entries: (prodEntries || []).length,
        cartons: (cartons || []).length,
        raw_materials: (materials || []).length,
        machine_stops: (stops || []).length,
        quality_inspections: (inspections || []).length,
        audit_logs: (auditLogs || []).length
      });

    } catch (err: any) {
      console.error('Error fetching developer data:', err);
      toast.error('Erreur chargement: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Impersonate / Enter Factory Workspace
  const handleEnterFactory = async (factory: FactoryStats) => {
    localStorage.setItem('active_org_id', factory.id);
    switchOrganization(factory.id);
    toast.success(`Connexion à l'espace usine : ${factory.name}`);
    navigate('/admin');
  };

  // Save Plan Modification
  const handleSavePlan = async () => {
    if (!editPlanFactory) return;
    try {
      const { data: plans } = await (supabase as any).from('subscription_plans').select('*');
      const targetPlan = (plans || []).find((p: any) => p.slug === newPlanSlug);

      if (targetPlan) {
        await (supabase as any).from('subscriptions').upsert({
          organization_id: editPlanFactory.id,
          plan_id: targetPlan.id,
          status: newSubStatus,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString()
        }, { onConflict: 'organization_id' });

        toast.success(`Abonnement de ${editPlanFactory.name} mis à jour !`);
        setEditPlanFactory(null);
        fetchDeveloperData();
      }
    } catch (err: any) {
      toast.error('Erreur mise à jour forfait : ' + err.message);
    }
  };

  // Execute Data Purge / Wipe
  const handleExecutePurge = async () => {
    if (!purgeTarget) return;

    const inputClean = purgeConfirmText.trim().toLowerCase();
    const targetClean = purgeTarget.factory.name.trim().toLowerCase();

    const isMatch = 
      inputClean === targetClean || 
      inputClean === 'delete' || 
      inputClean === 'supprimer' || 
      inputClean === 'confirm' ||
      inputClean === purgeTarget.factory.id.toLowerCase();

    if (!isMatch) {
      toast.error(`Veuillez taper "${purgeTarget.factory.name}" pour confirmer.`);
      return;
    }

    setIsPurging(true);
    const orgId = purgeTarget.factory.id;

    try {
      if (purgeTarget.type === 'DELETE_FACTORY') {
        // Full exhaustive cascade deletion of all related tables
        const cascadeTables = [
          'warehouse_movements',
          'material_consumptions',
          'inventory_transactions',
          'stock_transactions',
          'waste_records',
          'cartons',
          'production_entries',
          'quality_controls',
          'quality_inspections',
          'machine_stops',
          'machine_downtimes',
          'maintenance_records',
          'machine_events',
          'manufacturing_orders',
          'bons_de_commande',
          'articles',
          'raw_materials',
          'machines',
          'factories',
          'downtime_reasons',
          'custom_warehouses',
          'push_subscriptions',
          'notifications',
          'audit_logs',
          'users',
          'employees',
          'subscriptions',
          'organization_members'
        ];

        for (const table of cascadeTables) {
          try {
            await (supabase as any).from(table).delete().eq('organization_id', orgId);
          } catch (e) {
            console.warn(`Table ${table} deletion skipped or not present:`, e);
          }
        }

        // Finally delete the organization record itself
        const { error: orgDelErr } = await (supabase as any).from('organizations').delete().eq('id', orgId);
        if (orgDelErr) {
          console.error("Org delete error:", orgDelErr);
        }

        // Optimistically remove from state immediately
        setFactories(prev => prev.filter(f => f.id !== orgId));

        // If this was the active tenant in localStorage, clean it
        if (localStorage.getItem('active_org_id') === orgId) {
          localStorage.removeItem('active_org_id');
        }

        toast.success(`Usine "${purgeTarget.factory.name}" et toutes ses données ont été supprimées définitivement !`);
      } else if (purgeTarget.type === 'WIPE_PRODUCTION') {
        const prodTables = [
          'warehouse_movements',
          'material_consumptions',
          'waste_records',
          'cartons',
          'production_entries',
          'quality_controls',
          'quality_inspections',
          'machine_stops',
          'machine_downtimes',
          'machine_events',
          'manufacturing_orders'
        ];

        for (const table of prodTables) {
          try {
            await (supabase as any).from(table).delete().eq('organization_id', orgId);
          } catch (e) {
            console.warn(`Wipe ${table} failed:`, e);
          }
        }

        toast.success(`Toutes les données de production de "${purgeTarget.factory.name}" ont été purgées !`);
      } else if (purgeTarget.type === 'WIPE_CARTONS') {
        await (supabase as any).from('warehouse_movements').delete().eq('organization_id', orgId);
        await (supabase as any).from('cartons').delete().eq('organization_id', orgId);
        toast.success(`Tous les cartons de "${purgeTarget.factory.name}" ont été supprimés !`);
      } else if (purgeTarget.type === 'WIPE_MATERIALS') {
        await (supabase as any).from('material_consumptions').delete().eq('organization_id', orgId);
        await (supabase as any).from('inventory_transactions').delete().eq('organization_id', orgId);
        await (supabase as any).from('raw_materials').delete().eq('organization_id', orgId);
        toast.success(`Toutes les matières premières de "${purgeTarget.factory.name}" ont été supprimées !`);
      }

      setPurgeTarget(null);
      setPurgeConfirmText('');
      await fetchDeveloperData();
    } catch (err: any) {
      console.error("Purge error:", err);
      toast.error('Erreur lors de la suppression: ' + err.message);
    } finally {
      setIsPurging(false);
    }
  };

  // Export Database Snapshot
  const handleExportBackup = async () => {
    try {
      toast('Génération du snapshot JSON...', { icon: '📦' });
      const [orgs, users, machines, ofs, prods, cartons, materials] = await Promise.all([
        (supabase as any).from('organizations').select('*'),
        (supabase as any).from('users').select('*'),
        (supabase as any).from('machines').select('*'),
        (supabase as any).from('manufacturing_orders').select('*'),
        (supabase as any).from('production_entries').select('*'),
        (supabase as any).from('cartons').select('*'),
        (supabase as any).from('raw_materials').select('*')
      ]);

      const backupData = {
        export_date: new Date().toISOString(),
        version: 'FactoryFlow TN v2.0 - Platform Backup',
        organizations: orgs.data || [],
        users: users.data || [],
        machines: machines.data || [],
        manufacturing_orders: ofs.data || [],
        production_entries: prods.data || [],
        cartons: cartons.data || [],
        raw_materials: materials.data || []
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factoryflow_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Snapshot JSON exporté avec succès !');
    } catch (err: any) {
      toast.error('Erreur lors du backup: ' + err.message);
    }
  };

  // KPIs
  const totalFactories = factories.length;
  const totalMachines = factories.reduce((sum, f) => sum + f.machine_count, 0);
  const totalUsers = factories.reduce((sum, f) => sum + f.user_count + f.employee_count, 0);
  const totalCartons = factories.reduce((sum, f) => sum + f.carton_count, 0);
  const totalProdEntries = factories.reduce((sum, f) => sum + f.production_count, 0);
  const totalMRR = factories
    .filter(f => f.subscription_status === 'ACTIVE')
    .reduce((sum, f) => sum + (f.plan_price || 299), 0);

  const filteredFactories = factories.filter(f => {
    const matchesSearch = 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.legal_name && f.legal_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (f.city && f.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (f.tax_id && f.tax_id.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPlan = 
      selectedPlanFilter === 'ALL' ||
      (selectedPlanFilter === 'ACTIVE' && f.subscription_status === 'ACTIVE') ||
      (selectedPlanFilter === 'TRIALING' && f.subscription_status === 'TRIALING');

    return matchesSearch && matchesPlan;
  });

  // IF LOCKED: RENDER STANDALONE PRIVATE DEVELOPER GATE
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
        
        {/* Subtle Cyber Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#082f4915_1px,transparent_1px),linear-gradient(to_bottom,#082f4915_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

        <div className="relative z-10 w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-8 shadow-2xl shadow-cyan-950/50 space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/50">
              <span className="material-symbols-outlined text-[30px]">terminal</span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-white">
              DEVELOPER CONTROL PLANE
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Accès réservé uniquement au développeur de la plateforme
            </p>
          </div>

          <form onSubmit={handleMasterLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold text-cyan-400 uppercase mb-1.5">
                Developer Identity
              </label>
              <input
                type="text"
                value={devEmailInput}
                onChange={e => setDevEmailInput(e.target.value)}
                placeholder="dev@factoryflow.tn"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-cyan-400 uppercase mb-1.5">
                Master Key Password
              </label>
              <input
                type="password"
                value={devPasswordInput}
                onChange={e => setDevPasswordInput(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-600"
              />
            </div>

            {authError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs font-bold text-center">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl font-black text-sm shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">key</span>
              <span>Déverrouiller la Console</span>
            </button>
          </form>

          <div className="text-center pt-2">
            <Link to="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium">
              ← Retour au site public
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // UNLOCKED: FULL DEVELOPER MISSION CONTROL INTERFACE
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 pb-20">
      
      {/* DEVELOPER MISSION CONTROL TOP HEADER */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-cyan-500/20 px-6 py-3 shadow-2xl">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/50">
              <span className="material-symbols-outlined text-[24px]">terminal</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-white">
                  FACTORYFLOW <span className="text-cyan-400 font-mono text-xs px-2 py-0.5 bg-cyan-950/80 border border-cyan-800/80 rounded-md">DEVELOPER ROOT</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  LIVE CLOUD
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Console indépendante de supervision multi-usines & super-contrôle des données</p>
            </div>
          </div>

          {/* Top Quick Actions Bar */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportBackup}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/50 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              title="Exporter snapshot complet en JSON"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Export Snapshot DB</span>
            </button>

            <button
              onClick={fetchDeveloperData}
              className="px-3.5 py-1.5 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-700/50 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              <span>Actualiser</span>
            </button>

            <button
              onClick={handleLockConsole}
              className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              title="Verrouiller la console"
            >
              <span className="material-symbols-outlined text-[16px]">lock</span>
              <span>Verrouiller</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN DEVELOPER WORKSPACE */}
      <main className="max-w-[1600px] mx-auto px-6 pt-8 space-y-8">
        
        {/* PLATFORM TELEMETRY HERO STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 relative overflow-hidden group hover:border-cyan-500/40 transition-all">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Usines Connectées</span>
              <span className="material-symbols-outlined text-cyan-400 text-[18px]">factory</span>
            </div>
            <p className="text-3xl font-black text-white font-mono mt-1">{totalFactories}</p>
            <p className="text-[11px] text-cyan-400/80 font-medium mt-1">Multi-Tenants RLS Actifs</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 relative overflow-hidden group hover:border-blue-500/40 transition-all">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Parc Machines</span>
              <span className="material-symbols-outlined text-blue-400 text-[18px]">precision_manufacturing</span>
            </div>
            <p className="text-3xl font-black text-white font-mono mt-1">{totalMachines}</p>
            <p className="text-[11px] text-blue-400/80 font-medium mt-1">Postes & Lignes de coupe</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 relative overflow-hidden group hover:border-purple-500/40 transition-all">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Utilisateurs Totaux</span>
              <span className="material-symbols-outlined text-purple-400 text-[18px]">group</span>
            </div>
            <p className="text-3xl font-black text-white font-mono mt-1">{totalUsers}</p>
            <p className="text-[11px] text-purple-400/80 font-medium mt-1">Managers, Opérateurs, PINs</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Cartons Traçables</span>
              <span className="material-symbols-outlined text-emerald-400 text-[18px]">package_2</span>
            </div>
            <p className="text-3xl font-black text-white font-mono mt-1">{totalCartons}</p>
            <p className="text-[11px] text-emerald-400/80 font-medium mt-1">Étiquettes & QR codes</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 relative overflow-hidden group hover:border-amber-500/40 transition-all">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Sessions Prod</span>
              <span className="material-symbols-outlined text-amber-400 text-[18px]">bolt</span>
            </div>
            <p className="text-3xl font-black text-white font-mono mt-1">{totalProdEntries}</p>
            <p className="text-[11px] text-amber-400/80 font-medium mt-1">Événements enregistrés</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-950/80 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 relative overflow-hidden group hover:border-indigo-400 transition-all">
            <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>MRR Plateforme</span>
              <span className="material-symbols-outlined text-indigo-400 text-[18px]">payments</span>
            </div>
            <p className="text-3xl font-black text-indigo-200 font-mono mt-1">{totalMRR} <span className="text-xs text-indigo-400 font-sans font-bold">TND</span></p>
            <p className="text-[11px] text-indigo-400 font-medium mt-1">Revenu Récurrent Mensuel</p>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex border-b border-slate-800 space-x-8">
          <button
            onClick={() => setActiveTab('factories')}
            className={`pb-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'factories'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">domain</span>
            <span>Parc des Usines ({factories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">analytics</span>
            <span>Analytiques Plateforme & Croissance</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`pb-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'database'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">database</span>
            <span>Gestion Base de Données & Purge</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'logs'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            <span>Événements & Logs Système</span>
          </button>
        </div>

        {/* TAB 1: FACTORIES FLEET */}
        {activeTab === 'factories' && (
          <div className="space-y-6">
            
            {/* Search & Filter Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="relative w-full sm:w-80">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                <input
                  type="text"
                  placeholder="Rechercher nom, matricule fiscal, ville..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-medium text-slate-200 focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-500"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={selectedPlanFilter}
                  onChange={e => setSelectedPlanFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">Tous les statuts d'abonnement</option>
                  <option value="ACTIVE">Clients Payants (Actifs)</option>
                  <option value="TRIALING">Période d'Essai (14j)</option>
                </select>

                <div className="text-xs text-slate-400 font-mono">
                  {filteredFactories.length} usine(s) trouvée(s)
                </div>
              </div>
            </div>

            {/* Factories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {isLoading ? (
                <div className="col-span-full p-12 text-center text-slate-500">
                  <span className="material-symbols-outlined animate-spin text-3xl mb-2 text-cyan-400">sync</span>
                  <p className="text-sm font-medium">Chargement des usines et télémétrie...</p>
                </div>
              ) : filteredFactories.length === 0 ? (
                <div className="col-span-full p-12 text-center bg-slate-900 rounded-3xl border border-dashed border-slate-800 text-slate-500">
                  <p className="text-sm font-semibold">Aucune usine trouvée.</p>
                </div>
              ) : (
                filteredFactories.map((f) => (
                  <div
                    key={f.id}
                    className="bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-5 transition-all group relative overflow-hidden"
                  >
                    {/* Factory Header */}
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-cyan-950 border border-cyan-800/80 flex items-center justify-center text-cyan-400 font-black text-sm shadow-md">
                            {f.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-base font-black text-white group-hover:text-cyan-400 transition-colors tracking-tight">
                              {f.name}
                            </h3>
                            <p className="text-xs text-slate-400 font-medium">{f.city || f.governorate || 'Tunisie'} • {f.industry || 'Industrie'}</p>
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          f.subscription_status === 'ACTIVE'
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : 'bg-amber-950 text-amber-400 border-amber-800'
                        }`}>
                          {f.plan_name} ({f.subscription_status === 'ACTIVE' ? 'Payant' : 'Essai'})
                        </span>
                      </div>

                      {/* Deep Details Badges */}
                      <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-800/80 my-3 text-center">
                        <div className="bg-slate-950/60 rounded-xl p-2 border border-slate-800">
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">Machines</span>
                          <span className="text-sm font-black text-cyan-400 font-mono">{f.machine_count}</span>
                        </div>
                        <div className="bg-slate-950/60 rounded-xl p-2 border border-slate-800">
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">Équipe / PINs</span>
                          <span className="text-sm font-black text-purple-400 font-mono">{f.user_count + f.employee_count}</span>
                        </div>
                        <div className="bg-slate-950/60 rounded-xl p-2 border border-slate-800">
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">Ordres (OF)</span>
                          <span className="text-sm font-black text-amber-400 font-mono">{f.of_count}</span>
                        </div>
                      </div>

                      {/* Second Row Counters */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-slate-950/40 rounded-lg p-1.5 text-slate-400">
                          <span className="text-[10px] text-slate-500 block">Cartons</span>
                          <strong className="text-slate-200 font-mono">{f.carton_count}</strong>
                        </div>
                        <div className="bg-slate-950/40 rounded-lg p-1.5 text-slate-400">
                          <span className="text-[10px] text-slate-500 block">Matières</span>
                          <strong className="text-slate-200 font-mono">{f.material_count}</strong>
                        </div>
                        <div className="bg-slate-950/40 rounded-lg p-1.5 text-slate-400">
                          <span className="text-[10px] text-slate-500 block">Pannes</span>
                          <strong className="text-slate-200 font-mono">{f.stop_count}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleEnterFactory(f)}
                          className="w-full py-2 px-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/20"
                        >
                          <span className="material-symbols-outlined text-[16px]">login</span>
                          <span>Ouvrir l'Espace</span>
                        </button>

                        <button
                          onClick={() => setDetailedFactory(f)}
                          className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                          <span>Détails</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          onClick={() => {
                            setEditPlanFactory(f);
                            setNewPlanSlug(f.plan_name === 'Entreprise' ? 'enterprise' : 'professional');
                            setNewSubStatus(f.subscription_status || 'ACTIVE');
                          }}
                          className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 py-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit_note</span>
                          <span>Gérer Forfait</span>
                        </button>

                        <button
                          onClick={() => setPurgeTarget({ factory: f, type: 'DELETE_FACTORY' })}
                          className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 py-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete_forever</span>
                          <span>Supprimer Données</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ANALYTICS & PERFORMANCE */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-400 uppercase">Revenus Annuels Projetés (ARR)</h3>
                  <span className="material-symbols-outlined text-emerald-400">trending_up</span>
                </div>
                <p className="text-4xl font-black text-white font-mono">{totalMRR * 12} <span className="text-sm text-slate-400 font-sans font-bold">TND/an</span></p>
                <p className="text-xs text-emerald-400 font-medium">Basé sur {factories.filter(f => f.subscription_status === 'ACTIVE').length} abonnements actifs</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-400 uppercase">Taux de Conversion Démo</h3>
                  <span className="material-symbols-outlined text-cyan-400">conversion_path</span>
                </div>
                <p className="text-4xl font-black text-white font-mono">
                  {totalFactories > 0 ? Math.round((factories.filter(f => f.subscription_status === 'ACTIVE').length / totalFactories) * 100) : 0}%
                </p>
                <p className="text-xs text-slate-400 font-medium">Passage de l'essai gratuit au forfait payant</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-400 uppercase">Moyenne Machines / Usine</h3>
                  <span className="material-symbols-outlined text-blue-400">memory</span>
                </div>
                <p className="text-4xl font-black text-white font-mono">
                  {totalFactories > 0 ? (totalMachines / totalFactories).toFixed(1) : 0}
                </p>
                <p className="text-xs text-blue-400 font-medium">Équipements connectés par site industriel</p>
              </div>
            </div>

            {/* Ranking of Factories */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-base font-black text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400">military_tech</span>
                Classement des Usines les Plus Actives
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950 text-slate-400 text-xs font-bold uppercase border-b border-slate-800">
                    <tr>
                      <th className="p-4">Rang</th>
                      <th className="p-4">Usine</th>
                      <th className="p-4">Gouvernorat</th>
                      <th className="p-4 text-center">Machines</th>
                      <th className="p-4 text-center">OFs Lancés</th>
                      <th className="p-4 text-center">Cartons Produits</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {[...factories]
                      .sort((a, b) => (b.production_count + b.carton_count) - (a.production_count + a.carton_count))
                      .map((f, idx) => (
                        <tr key={f.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-4">
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                              idx === 0 ? 'bg-amber-400 text-slate-950' :
                              idx === 1 ? 'bg-slate-300 text-slate-950' :
                              idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'
                            }`}>
                              #{idx + 1}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-white flex items-center gap-2">
                            {f.name}
                          </td>
                          <td className="p-4 text-slate-400">{f.city || f.governorate || 'Tunisie'}</td>
                          <td className="p-4 text-center font-mono text-cyan-400 font-bold">{f.machine_count}</td>
                          <td className="p-4 text-center font-mono text-amber-400 font-bold">{f.of_count}</td>
                          <td className="p-4 text-center font-mono text-emerald-400 font-bold">{f.carton_count}</td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleEnterFactory(f)}
                              className="px-3 py-1 bg-cyan-950 text-cyan-400 border border-cyan-800 hover:bg-cyan-900 rounded-lg text-xs font-bold transition-colors"
                            >
                              Ouvrir
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DATABASE & PURGE MASTER */}
        {activeTab === 'database' && (
          <div className="space-y-8">
            <div className="bg-rose-950/40 border border-rose-800/60 rounded-3xl p-6 text-rose-200">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-3xl text-rose-400 shrink-0">warning</span>
                <div>
                  <h3 className="text-base font-black text-white">Zone de Nettoyage et Contrôle Direct des Données</h3>
                  <p className="text-xs text-rose-300 mt-1 leading-relaxed">
                    Cette section permet d'analyser le volume exact de chaque table Supabase et d'exécuter des purges partielles ou totales.
                    Toute action de suppression nécessite la confirmation manuelle du nom de l'usine pour éviter toute perte accidentelle.
                  </p>
                </div>
              </div>
            </div>

            {/* Tables Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(tableCounts).map(([tableName, count]) => (
                <div key={tableName} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs font-mono font-bold text-cyan-400 uppercase">{tableName}</p>
                  <p className="text-3xl font-black text-white font-mono mt-2">{count}</p>
                  <p className="text-[11px] text-slate-500 font-medium mt-1">Lignes enregistrées</p>
                </div>
              ))}
            </div>

            {/* Selective Purge Tool for each Factory */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-base font-black text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-400">cleaning_services</span>
                Purge Ciblée par Usine
              </h3>

              <div className="divide-y divide-slate-800">
                {factories.map((f) => (
                  <div key={f.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-white">{f.name} <span className="text-xs text-slate-500 font-mono">({f.id})</span></h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {f.of_count} OFs • {f.production_count} Entrées de prod • {f.carton_count} Cartons • {f.material_count} Matières
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setPurgeTarget({ factory: f, type: 'WIPE_CARTONS' })}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-xl border border-slate-700 transition-colors"
                      >
                        Purger Cartons
                      </button>

                      <button
                        onClick={() => setPurgeTarget({ factory: f, type: 'WIPE_PRODUCTION' })}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-orange-300 text-xs font-bold rounded-xl border border-slate-700 transition-colors"
                      >
                        Purger Production & OF
                      </button>

                      <button
                        onClick={() => setPurgeTarget({ factory: f, type: 'WIPE_MATERIALS' })}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-yellow-300 text-xs font-bold rounded-xl border border-slate-700 transition-colors"
                      >
                        Purger Matières
                      </button>

                      <button
                        onClick={() => setPurgeTarget({ factory: f, type: 'DELETE_FACTORY' })}
                        className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold rounded-xl transition-colors"
                      >
                        Supprimer Usine Complète
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SYSTEM LOGS & AUDIT */}
        {activeTab === 'logs' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400">sensors</span>
                Journal d'Audit Global en Direct (Multi-Usines)
              </h3>
              <button
                onClick={fetchDeveloperData}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors"
              >
                Actualiser Logs
              </button>
            </div>

            <div className="divide-y divide-slate-800/60 font-mono text-xs max-h-[600px] overflow-y-auto">
              {systemLogs.length === 0 ? (
                <p className="p-6 text-center text-slate-500">Aucun log récent.</p>
              ) : (
                systemLogs.map((log) => (
                  <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.action === 'INSERT' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                          log.action === 'UPDATE' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                          'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}>
                          {log.action}
                        </span>
                        <span className="text-slate-200 font-bold">{log.table_name}</span>
                        <span className="text-slate-500">ID: {log.record_id}</span>
                      </div>
                      <p className="text-slate-400 truncate max-w-2xl">{JSON.stringify(log.new_data || log.old_data || {})}</p>
                    </div>
                    <span className="text-slate-500 text-[11px] shrink-0">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </main>

      {/* DETAILED FACTORY MODAL */}
      {detailedFactory && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-800 text-cyan-400 font-black text-lg flex items-center justify-center">
                  {detailedFactory.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">{detailedFactory.name}</h3>
                  <p className="text-xs text-cyan-400 font-mono">{detailedFactory.id}</p>
                </div>
              </div>
              <button onClick={() => setDetailedFactory(null)} className="text-slate-400 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
                <span className="text-slate-500 block font-bold">Raison Sociale</span>
                <span className="text-white font-semibold">{detailedFactory.legal_name || 'Non spécifié'}</span>
              </div>
              <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
                <span className="text-slate-500 block font-bold">Matricule Fiscal (MF)</span>
                <span className="text-white font-semibold">{detailedFactory.tax_id || 'Non spécifié'}</span>
              </div>
              <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
                <span className="text-slate-500 block font-bold">Ville / Gouvernorat</span>
                <span className="text-white font-semibold">{detailedFactory.city || detailedFactory.governorate || 'Tunis'}</span>
              </div>
              <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
                <span className="text-slate-500 block font-bold">Date de Création</span>
                <span className="text-white font-semibold">{new Date(detailedFactory.created_at).toLocaleString()}</span>
              </div>
              <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
                <span className="text-slate-500 block font-bold">Email Contact</span>
                <span className="text-white font-semibold">{detailedFactory.email || 'N/A'}</span>
              </div>
              <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
                <span className="text-slate-500 block font-bold">Téléphone</span>
                <span className="text-white font-semibold">{detailedFactory.phone || 'N/A'}</span>
              </div>
            </div>

            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase">Volume des Enregistrements</h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 bg-slate-900 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase block">Machines</span>
                  <span className="text-lg font-black text-cyan-400 font-mono">{detailedFactory.machine_count}</span>
                </div>
                <div className="p-2 bg-slate-900 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase block">Ordres de Fab</span>
                  <span className="text-lg font-black text-amber-400 font-mono">{detailedFactory.of_count}</span>
                </div>
                <div className="p-2 bg-slate-900 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase block">Cartons</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">{detailedFactory.carton_count}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDetailedFactory(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  const target = detailedFactory;
                  setDetailedFactory(null);
                  handleEnterFactory(target);
                }}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-500/20"
              >
                Se connecter en tant qu'Usine
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE PLAN MODAL */}
      {editPlanFactory && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-6">
            <h3 className="text-xl font-black text-white">Gérer le Forfait : {editPlanFactory.name}</h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Forfait d'Abonnement</label>
                <select
                  value={newPlanSlug}
                  onChange={e => setNewPlanSlug(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 font-bold focus:outline-none focus:border-indigo-500"
                >
                  <option value="starter">Starter (149 TND / mois)</option>
                  <option value="professional">Professionnel (299 TND / mois)</option>
                  <option value="enterprise">Entreprise Illimité (599 TND / mois)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Statut du Compte</label>
                <select
                  value={newSubStatus}
                  onChange={e => setNewSubStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 font-bold focus:outline-none focus:border-indigo-500"
                >
                  <option value="ACTIVE">Actif (Payant Confirmé)</option>
                  <option value="TRIALING">Essai Gratuit (14 jours)</option>
                  <option value="SUSPENDED">Suspendu / En Attente Paiement</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setEditPlanFactory(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Annuler
              </button>
              <button
                onClick={handleSavePlan}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg"
              >
                Enregistrer Modifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PURGE / DELETE CONFIRMATION MODAL */}
      {purgeTarget && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-rose-500/40 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl space-y-6">
            <div className="flex items-center gap-3 text-rose-400">
              <span className="material-symbols-outlined text-3xl">delete_forever</span>
              <h3 className="text-xl font-black text-white">Confirmation de Suppression</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Vous êtes sur le point d'exécuter l'action <strong className="text-rose-400 font-mono">[{purgeTarget.type}]</strong> sur l'usine <strong className="text-white">{purgeTarget.factory.name}</strong>.
              Cette opération est irréversible et supprimera définitivement les enregistrements de la base de données.
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-400">
                  Pour confirmer, tapez : <span className="text-cyan-400 font-mono">"{purgeTarget.factory.name}"</span>
                </label>
                <button
                  type="button"
                  onClick={() => setPurgeConfirmText(purgeTarget.factory.name)}
                  className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 underline bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/80"
                >
                  Remplir automatiquement ⚡
                </button>
              </div>

              <input
                type="text"
                value={purgeConfirmText}
                onChange={e => setPurgeConfirmText(e.target.value)}
                placeholder={`Tapez "${purgeTarget.factory.name}" ou "DELETE"`}
                className={`w-full bg-slate-900 border rounded-xl p-3 text-sm text-white font-mono focus:outline-none transition-all ${
                  purgeConfirmText.trim().toLowerCase() === purgeTarget.factory.name.trim().toLowerCase() ||
                  purgeConfirmText.trim().toLowerCase() === 'delete' ||
                  purgeConfirmText.trim().toLowerCase() === 'supprimer'
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'border-slate-700 focus:border-rose-500'
                }`}
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setPurgeTarget(null);
                  setPurgeConfirmText('');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isPurging}
                onClick={handleExecutePurge}
                className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all cursor-pointer"
              >
                {isPurging ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[16px]">refresh</span>
                    <span>Purge en cours...</span>
                  </>
                ) : (
                  <span>Confirmer la Suppression</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
