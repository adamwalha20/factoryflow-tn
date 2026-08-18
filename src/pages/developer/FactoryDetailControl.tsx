import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTenantStore } from '../../store/tenantStore';
import { useAuthStore } from '../../store/auth';
import toast from 'react-hot-toast';

interface FactoryData {
  organization: any;
  subscription: any;
  machines: any[];
  employees: any[];
  users: any[];
  articles: any[];
  manufacturing_orders: any[];
  production_entries: any[];
  production_sessions: any[];
  cartons: any[];
  raw_materials: any[];
  machine_stops: any[];
  quality_controls: any[];
  warehouse_locations: any[];
  audit_logs: any[];
}

export function FactoryDetailControl() {
  const { factoryId } = useParams<{ factoryId: string }>();
  const navigate = useNavigate();
  const { employee } = useAuthStore();
  const { switchOrganization } = useTenantStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Standalone Developer Gate check
  const isUnlocked = sessionStorage.getItem('dev_master_auth') === 'true' || employee?.role === 'Developer';

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'machines' | 'team' | 'orders' | 'cartons' | 'production' | 'materials' | 'stops' | 'articles' | 'backup'
  >('overview');

  const [factoryData, setFactoryData] = useState<FactoryData>({
    organization: null,
    subscription: null,
    machines: [],
    employees: [],
    users: [],
    articles: [],
    manufacturing_orders: [],
    production_entries: [],
    production_sessions: [],
    cartons: [],
    raw_materials: [],
    machine_stops: [],
    quality_controls: [],
    warehouse_locations: [],
    audit_logs: []
  });

  const [deleteTarget, setDeleteTarget] = useState<{
    type: string;
    id?: string;
    name?: string;
    table: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (!isUnlocked) {
      navigate('/developer');
      return;
    }
    if (factoryId) {
      fetchFactoryDeepData();
    }
  }, [factoryId, isUnlocked]);

  const fetchFactoryDeepData = async () => {
    if (!factoryId) return;
    setIsLoading(true);
    try {
      const [
        { data: org },
        { data: sub },
        { data: machines },
        { data: employees },
        { data: users },
        { data: articles },
        { data: ofs },
        { data: prods },
        { data: sessions },
        { data: cartons },
        { data: materials },
        { data: stops },
        { data: quality },
        { data: warehouses },
        { data: audits }
      ] = await Promise.all([
        (supabase as any).from('organizations').select('*').eq('id', factoryId).maybeSingle(),
        (supabase as any).from('subscriptions').select('*, plan:subscription_plans(*)').eq('organization_id', factoryId).maybeSingle(),
        (supabase as any).from('machines').select('*').eq('organization_id', factoryId).order('created_at', { ascending: false }),
        (supabase as any).from('employees').select('*').eq('organization_id', factoryId).order('created_at', { ascending: false }),
        (supabase as any).from('users').select('*').eq('organization_id', factoryId).order('created_at', { ascending: false }),
        (supabase as any).from('articles').select('*').eq('organization_id', factoryId).order('created_at', { ascending: false }),
        (supabase as any).from('manufacturing_orders').select('*, article:articles(name, reference)').eq('organization_id', factoryId).order('created_at', { ascending: false }),
        (supabase as any).from('production_entries').select('*').eq('organization_id', factoryId).order('created_at', { ascending: false }).limit(200),
        (supabase as any).from('production_sessions').select('*').eq('organization_id', factoryId).order('created_at', { ascending: false }).limit(100),
        (supabase as any).from('cartons').select('*').eq('organization_id', factoryId).order('created_at', { ascending: false }).limit(300),
        (supabase as any).from('raw_materials').select('*').eq('organization_id', factoryId).order('created_at', { ascending: false }),
        (supabase as any).from('machine_stops').select('*, machine:machines(name)').eq('organization_id', factoryId).order('created_at', { ascending: false }),
        (supabase as any).from('quality_controls').select('*').eq('organization_id', factoryId).order('created_at', { ascending: false }),
        (supabase as any).from('warehouse_locations').select('*').eq('organization_id', factoryId).order('created_at', { ascending: false }),
        (supabase as any).from('audit_logs').select('*').eq('organization_id', factoryId).order('created_at', { ascending: false }).limit(50)
      ]);

      setFactoryData({
        organization: org || null,
        subscription: sub || null,
        machines: machines || [],
        employees: employees || [],
        users: users || [],
        articles: articles || [],
        manufacturing_orders: ofs || [],
        production_entries: prods || [],
        production_sessions: sessions || [],
        cartons: cartons || [],
        raw_materials: materials || [],
        machine_stops: stops || [],
        quality_controls: quality || [],
        warehouse_locations: warehouses || [],
        audit_logs: audits || []
      });
    } catch (err: any) {
      console.error('Error fetching factory deep data:', err);
      toast.error('Erreur chargement usine: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 📥 Export Single Factory Full JSON Backup
  const handleExportFactoryBackup = () => {
    if (!factoryData.organization) return;
    try {
      const backupPayload = {
        export_type: 'FACTORYFLOW_SINGLE_FACTORY_SNAPSHOT',
        export_date: new Date().toISOString(),
        version: 'v2.0',
        organization_id: factoryData.organization.id,
        organization_name: factoryData.organization.name,
        data: {
          organization: factoryData.organization,
          subscription: factoryData.subscription,
          machines: factoryData.machines,
          employees: factoryData.employees,
          users: factoryData.users,
          articles: factoryData.articles,
          manufacturing_orders: factoryData.manufacturing_orders,
          production_entries: factoryData.production_entries,
          production_sessions: factoryData.production_sessions,
          cartons: factoryData.cartons,
          raw_materials: factoryData.raw_materials,
          machine_stops: factoryData.machine_stops,
          quality_controls: factoryData.quality_controls,
          warehouse_locations: factoryData.warehouse_locations,
          audit_logs: factoryData.audit_logs
        }
      };

      const jsonStr = JSON.stringify(backupPayload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const cleanSlug = (factoryData.organization.slug || factoryData.organization.name || 'usine').toLowerCase().replace(/[^a-z0-9]/g, '_');
      a.href = url;
      a.download = `backup_${cleanSlug}_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Sauvegarde complète de "${factoryData.organization.name}" exportée en JSON !`);
    } catch (err: any) {
      toast.error('Erreur lors du téléchargement: ' + err.message);
    }
  };

  // 📤 Restore Factory from JSON Backup
  const handleRestoreBackupFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !factoryId) return;

    setIsRestoring(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const backup = JSON.parse(content);

        const data = backup.data || backup;
        const targetOrgId = factoryId;

        // Restore Tables with organization_id re-mapping
        const restoreTable = async (tableName: string, rows: any[]) => {
          if (!rows || rows.length === 0) return;
          const sanitizedRows = rows.map((r: any) => {
            const { article, machine, plan, ...cleanRow } = r;
            return {
              ...cleanRow,
              organization_id: targetOrgId
            };
          });
          await (supabase as any).from(tableName).upsert(sanitizedRows, { onConflict: 'id' });
        };

        if (data.machines) await restoreTable('machines', data.machines);
        if (data.employees) await restoreTable('employees', data.employees);
        if (data.users) await restoreTable('users', data.users);
        if (data.articles) await restoreTable('articles', data.articles);
        if (data.manufacturing_orders) await restoreTable('manufacturing_orders', data.manufacturing_orders);
        if (data.production_entries) await restoreTable('production_entries', data.production_entries);
        if (data.production_sessions) await restoreTable('production_sessions', data.production_sessions);
        if (data.cartons) await restoreTable('cartons', data.cartons);
        if (data.raw_materials) await restoreTable('raw_materials', data.raw_materials);
        if (data.machine_stops) await restoreTable('machine_stops', data.machine_stops);
        if (data.quality_controls) await restoreTable('quality_controls', data.quality_controls);
        if (data.warehouse_locations) await restoreTable('warehouse_locations', data.warehouse_locations);

        toast.success('Restauration des données effectuée avec succès !');
        fetchFactoryDeepData();
      } catch (err: any) {
        console.error('Restore error:', err);
        toast.error('Erreur lors de la restauration: ' + err.message);
      } finally {
        setIsRestoring(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Delete Individual Record or Bulk Purge Table
  const executeDeletion = async () => {
    if (!deleteTarget || !factoryId) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.id) {
        // Delete single item
        const { error } = await (supabase as any)
          .from(deleteTarget.table)
          .delete()
          .eq('id', deleteTarget.id);
        if (error) throw error;
        toast.success(`Élément supprimé (${deleteTarget.name || deleteTarget.id})`);
      } else {
        // Bulk purge table for this factory
        const { error } = await (supabase as any)
          .from(deleteTarget.table)
          .delete()
          .eq('organization_id', factoryId);
        if (error) throw error;
        toast.success(`Table "${deleteTarget.table}" purgée pour cette usine.`);
      }

      setDeleteTarget(null);
      fetchFactoryDeepData();
    } catch (err: any) {
      toast.error('Erreur suppression : ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Impersonate / Enter Workspace
  const handleEnterWorkspace = () => {
    if (!factoryData.organization) return;
    localStorage.setItem('active_org_id', factoryData.organization.id);
    switchOrganization(factoryData.organization.id);
    toast.success(`Connecté à l'espace : ${factoryData.organization.name}`);
    navigate('/admin');
  };

  if (isLoading && !factoryData.organization) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-4">
        <span className="material-symbols-outlined animate-spin text-5xl text-cyan-400">refresh</span>
        <p className="text-sm font-bold text-slate-400 font-mono">Chargement des données complètes de l'usine...</p>
      </div>
    );
  }

  const org = factoryData.organization;
  if (!org) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-black text-rose-400">Usine non trouvée</h2>
        <p className="text-slate-400 text-sm">L'identifiant spécifié n'existe pas dans la base de données.</p>
        <Link to="/developer" className="px-6 py-2.5 bg-cyan-600 rounded-xl font-bold text-xs text-white">
          ← Retour Console Développeur
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 pb-20">
      
      {/* TOP MASTER HEADER */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-cyan-500/20 px-6 py-3.5 shadow-2xl">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/developer"
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors shrink-0"
              title="Retour au parc des usines"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-black text-white">{org.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                  {org.slug || 'TENANT'}
                </span>
                <span className="text-xs text-slate-500 font-mono">({org.id})</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {org.city || org.governorate || 'Tunisie'} • {org.industry || 'Industrie'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Download JSON Backup Button */}
            <button
              onClick={handleExportFactoryBackup}
              className="px-4 py-2 bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-600 hover:to-blue-600 text-white rounded-xl text-xs font-black shadow-md shadow-cyan-600/20 transition-all flex items-center gap-2"
              title="Télécharger une sauvegarde complète JSON pour cette usine"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Sauvegarder JSON</span>
            </button>

            {/* Restore JSON Backup Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleRestoreBackupFile}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isRestoring}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-700/40 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
              title="Restaurer des données à partir d'un fichier JSON"
            >
              <span className="material-symbols-outlined text-[18px]">upload</span>
              <span>{isRestoring ? 'Restauration...' : 'Restaurer JSON'}</span>
            </button>

            {/* Impersonate / Enter Workspace */}
            <button
              onClick={handleEnterWorkspace}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              <span>Ouvrir l'Espace (/admin)</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-[1600px] mx-auto px-6 pt-6 space-y-6">
        
        {/* FACTORY TELEMETRY HERO STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <span className="text-[11px] text-slate-500 font-bold uppercase block">Machines</span>
            <p className="text-2xl font-black text-cyan-400 font-mono mt-1">{factoryData.machines.length}</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <span className="text-[11px] text-slate-500 font-bold uppercase block">Équipe (PINs)</span>
            <p className="text-2xl font-black text-purple-400 font-mono mt-1">
              {Math.max(factoryData.employees.length, factoryData.users.length)}
            </p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <span className="text-[11px] text-slate-500 font-bold uppercase block">Ordres de Fab</span>
            <p className="text-2xl font-black text-amber-400 font-mono mt-1">{factoryData.manufacturing_orders.length}</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <span className="text-[11px] text-slate-500 font-bold uppercase block">Cartons Produits</span>
            <p className="text-2xl font-black text-emerald-400 font-mono mt-1">{factoryData.cartons.length}</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <span className="text-[11px] text-slate-500 font-bold uppercase block">Matières Stock</span>
            <p className="text-2xl font-black text-blue-400 font-mono mt-1">{factoryData.raw_materials.length}</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <span className="text-[11px] text-slate-500 font-bold uppercase block">Pannes Déclarées</span>
            <p className="text-2xl font-black text-rose-400 font-mono mt-1">{factoryData.machine_stops.length}</p>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex border-b border-slate-800 space-x-2 sm:space-x-4 overflow-x-auto pb-1">
          {[
            { id: 'overview', label: 'Vue d\'Ensemble', icon: 'info' },
            { id: 'machines', label: `Machines (${factoryData.machines.length})`, icon: 'precision_manufacturing' },
            { id: 'team', label: `Équipe & PINs (${Math.max(factoryData.employees.length, factoryData.users.length)})`, icon: 'group' },
            { id: 'orders', label: `OFs (${factoryData.manufacturing_orders.length})`, icon: 'assignment' },
            { id: 'cartons', label: `Cartons (${factoryData.cartons.length})`, icon: 'package_2' },
            { id: 'production', label: `Prod Logs (${factoryData.production_entries.length})`, icon: 'bolt' },
            { id: 'materials', label: `Matières (${factoryData.raw_materials.length})`, icon: 'inventory_2' },
            { id: 'stops', label: `Pannes (${factoryData.machine_stops.length})`, icon: 'car_crash' },
            { id: 'articles', label: `Articles (${factoryData.articles.length})`, icon: 'category' },
            { id: 'backup', label: 'Sauvegarde & Purge', icon: 'shield' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400">domain</span>
                Informations Générales de l'Usine
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 font-bold block">Nom de l'Usine</span>
                  <span className="text-white font-bold">{org.name}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 font-bold block">Raison Sociale</span>
                  <span className="text-white font-bold">{org.legal_name || 'Non spécifié'}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 font-bold block">Matricule Fiscal</span>
                  <span className="text-white font-mono font-bold">{org.tax_id || 'N/A'}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 font-bold block">Gouvernorat / Ville</span>
                  <span className="text-white font-bold">{org.governorate || org.city || 'Tunis'}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 font-bold block">Email Contact</span>
                  <span className="text-white font-mono">{org.email || 'N/A'}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 font-bold block">Téléphone</span>
                  <span className="text-white font-mono">{org.phone || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400">payments</span>
                Abonnement & État SaaS
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 font-bold block">Forfait Actif</span>
                  <span className="text-amber-400 font-black text-sm">{factoryData.subscription?.plan?.name || 'Essai Pro'}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 font-bold block">Statut Abonnement</span>
                  <span className="text-emerald-400 font-black text-sm">{factoryData.subscription?.status || 'TRIALING'}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 font-bold block">Onboarding Complété</span>
                  <span className="text-white font-bold">{org.onboarding_completed ? '✅ Oui' : '⏳ En cours'}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 font-bold block">Date de Création</span>
                  <span className="text-slate-300 font-mono">{new Date(org.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MACHINES */}
        {activeTab === 'machines' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white">Parc des Machines ({factoryData.machines.length})</h3>
              <button
                onClick={() => setDeleteTarget({ type: 'ALL', table: 'machines', name: 'Toutes les machines' })}
                disabled={factoryData.machines.length === 0}
                className="px-3.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold rounded-xl transition-colors"
              >
                Purger Toutes les Machines
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Nom Machine</th>
                    <th className="p-3.5">Code</th>
                    <th className="p-3.5">Statut</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {factoryData.machines.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-800/40">
                      <td className="p-3.5 font-bold text-white">{m.name}</td>
                      <td className="p-3.5 font-mono text-cyan-400">{m.code || 'N/A'}</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          m.status === 'En production' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                          m.status === 'En panne' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {m.status || 'Inactif'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setDeleteTarget({ type: 'SINGLE', id: m.id, name: m.name, table: 'machines' })}
                          className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-lg text-xs font-bold transition-colors"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                  {factoryData.machines.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">Aucune machine enregistrée.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: TEAM & PINS */}
        {activeTab === 'team' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white">Équipe, Opérateurs & Codes PIN</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Nom</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Rôle</th>
                    <th className="p-3.5">Code PIN</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {factoryData.employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-800/40">
                      <td className="p-3.5 font-bold text-white">{emp.first_name} {emp.last_name}</td>
                      <td className="p-3.5 font-mono text-slate-300">{emp.email}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                          {emp.role}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-amber-400 font-bold">{emp.pin_code || '1111'}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setDeleteTarget({ type: 'SINGLE', id: emp.id, name: `${emp.first_name} ${emp.last_name}`, table: 'employees' })}
                          className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-lg text-xs font-bold transition-colors"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                  {factoryData.employees.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">Aucun membre d'équipe enregistré.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: OFs */}
        {activeTab === 'orders' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white">Ordres de Fabrication ({factoryData.manufacturing_orders.length})</h3>
              <button
                onClick={() => setDeleteTarget({ type: 'ALL', table: 'manufacturing_orders', name: 'Tous les OFs' })}
                disabled={factoryData.manufacturing_orders.length === 0}
                className="px-3.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold rounded-xl transition-colors"
              >
                Purger Tous les OFs
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Code OF</th>
                    <th className="p-3.5">Article</th>
                    <th className="p-3.5 text-center">Qté Prévue</th>
                    <th className="p-3.5 text-center">Qté Produite</th>
                    <th className="p-3.5">Statut</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {factoryData.manufacturing_orders.map((of) => (
                    <tr key={of.id} className="hover:bg-slate-800/40">
                      <td className="p-3.5 font-mono font-bold text-amber-400">{of.order_number || of.id.substring(0, 8)}</td>
                      <td className="p-3.5 text-white font-semibold">{of.article?.name || 'N/A'}</td>
                      <td className="p-3.5 text-center font-mono">{of.target_quantity || 0}</td>
                      <td className="p-3.5 text-center font-mono text-emerald-400 font-bold">{of.produced_quantity || 0}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                          {of.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setDeleteTarget({ type: 'SINGLE', id: of.id, name: of.order_number, table: 'manufacturing_orders' })}
                          className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-lg text-xs font-bold transition-colors"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                  {factoryData.manufacturing_orders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">Aucun ordre de fabrication.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: CARTONS */}
        {activeTab === 'cartons' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white">Cartons & Colis Traçables ({factoryData.cartons.length})</h3>
              <button
                onClick={() => setDeleteTarget({ type: 'ALL', table: 'cartons', name: 'Tous les cartons' })}
                disabled={factoryData.cartons.length === 0}
                className="px-3.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold rounded-xl transition-colors"
              >
                Purger Tous les Cartons
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Code Carton / QR</th>
                    <th className="p-3.5 text-center">Quantité (pcs)</th>
                    <th className="p-3.5">Statut</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {factoryData.cartons.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/40">
                      <td className="p-3.5 font-mono text-emerald-400 font-bold">{c.barcode || c.carton_number || c.id.substring(0, 8)}</td>
                      <td className="p-3.5 text-center font-mono font-bold">{c.quantity}</td>
                      <td className="p-3.5 font-semibold text-slate-300">{c.status || 'En stock'}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setDeleteTarget({ type: 'SINGLE', id: c.id, name: c.barcode, table: 'cartons' })}
                          className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-lg text-xs font-bold transition-colors"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                  {factoryData.cartons.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">Aucun carton enregistré.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: PRODUCTION LOGS */}
        {activeTab === 'production' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white">Entrées de Production ({factoryData.production_entries.length})</h3>
              <button
                onClick={() => setDeleteTarget({ type: 'ALL', table: 'production_entries', name: 'Toutes les entrées de prod' })}
                disabled={factoryData.production_entries.length === 0}
                className="px-3.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold rounded-xl transition-colors"
              >
                Purger Production
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">ID</th>
                    <th className="p-3.5 text-center">Bonnes Pièces</th>
                    <th className="p-3.5 text-center">Déchets (Scrap)</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {factoryData.production_entries.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40">
                      <td className="p-3.5 font-mono text-slate-400">{p.id.substring(0, 8)}</td>
                      <td className="p-3.5 text-center font-mono text-emerald-400 font-bold">{p.good_quantity}</td>
                      <td className="p-3.5 text-center font-mono text-rose-400 font-bold">{p.scrap_quantity}</td>
                      <td className="p-3.5 font-mono text-slate-400">{new Date(p.created_at).toLocaleString()}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setDeleteTarget({ type: 'SINGLE', id: p.id, name: p.id, table: 'production_entries' })}
                          className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-lg text-xs font-bold transition-colors"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                  {factoryData.production_entries.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">Aucune entrée de production.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: MATERIALS */}
        {activeTab === 'materials' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white">Matières Premières & Bobines Jumbo ({factoryData.raw_materials.length})</h3>
              <button
                onClick={() => setDeleteTarget({ type: 'ALL', table: 'raw_materials', name: 'Toutes les matières' })}
                disabled={factoryData.raw_materials.length === 0}
                className="px-3.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold rounded-xl transition-colors"
              >
                Purger Matières
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Référence</th>
                    <th className="p-3.5">Désignation</th>
                    <th className="p-3.5 text-center">Stock</th>
                    <th className="p-3.5">Unité</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {factoryData.raw_materials.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-800/40">
                      <td className="p-3.5 font-mono text-cyan-400 font-bold">{m.reference}</td>
                      <td className="p-3.5 font-semibold text-white">{m.designation}</td>
                      <td className="p-3.5 text-center font-mono font-bold text-amber-400">{m.quantity_in_stock}</td>
                      <td className="p-3.5 text-slate-400">{m.unit || 'Kg'}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setDeleteTarget({ type: 'SINGLE', id: m.id, name: m.reference, table: 'raw_materials' })}
                          className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-lg text-xs font-bold transition-colors"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                  {factoryData.raw_materials.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">Aucune matière première en stock.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 8: STOPS */}
        {activeTab === 'stops' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white">Arrêts & Pannes Machine ({factoryData.machine_stops.length})</h3>
              <button
                onClick={() => setDeleteTarget({ type: 'ALL', table: 'machine_stops', name: 'Toutes les pannes' })}
                disabled={factoryData.machine_stops.length === 0}
                className="px-3.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold rounded-xl transition-colors"
              >
                Purger Pannes
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Machine</th>
                    <th className="p-3.5">Motif de Panne</th>
                    <th className="p-3.5">Commentaire</th>
                    <th className="p-3.5">Statut</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {factoryData.machine_stops.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40">
                      <td className="p-3.5 font-bold text-white">{s.machine?.name || 'Machine'}</td>
                      <td className="p-3.5 font-bold text-rose-400">{s.reason}</td>
                      <td className="p-3.5 text-slate-400 italic">{s.comments || '-'}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === 'En cours' ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {s.status || 'En cours'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setDeleteTarget({ type: 'SINGLE', id: s.id, name: s.reason, table: 'machine_stops' })}
                          className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-lg text-xs font-bold transition-colors"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                  {factoryData.machine_stops.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">Aucune panne enregistrée.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 9: ARTICLES */}
        {activeTab === 'articles' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white">Articles & Produits Finis ({factoryData.articles.length})</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Référence</th>
                    <th className="p-3.5">Nom de l'Article</th>
                    <th className="p-3.5 text-center">Colisage (pcs/ctn)</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {factoryData.articles.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-800/40">
                      <td className="p-3.5 font-mono text-cyan-400 font-bold">{a.reference}</td>
                      <td className="p-3.5 font-bold text-white">{a.name}</td>
                      <td className="p-3.5 text-center font-mono font-bold text-amber-400">{a.pieces_per_carton || a.colisage || 36}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setDeleteTarget({ type: 'SINGLE', id: a.id, name: a.name, table: 'articles' })}
                          className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-lg text-xs font-bold transition-colors"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                  {factoryData.articles.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">Aucun article au catalogue.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 10: BACKUP & PURGE ZONE */}
        {activeTab === 'backup' && (
          <div className="space-y-6">
            
            {/* Backup & Restore Action Card */}
            <div className="bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                  <span className="material-symbols-outlined text-[32px]">cloud_sync</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Centre de Sauvegarde & Restauration Développeur</h3>
                  <p className="text-xs text-indigo-200 mt-1 leading-relaxed max-w-3xl">
                    Chaque usine possède son propre coffre-fort de données. Vous pouvez exporter un snapshot JSON complet contenant toutes les tables
                    (machines, employés, ordres de fabrication, cartons, stocks, pannes) et le restaurer à tout moment en cas d'erreur humaine ou de suppression accidentelle.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={handleExportFactoryBackup}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-2xl text-xs font-black shadow-lg shadow-cyan-600/30 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">download</span>
                  <span>Télécharger Sauvegarde Complète (JSON)</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isRestoring}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-600/40 rounded-2xl text-xs font-black transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">upload</span>
                  <span>{isRestoring ? 'Restauration en cours...' : 'Restaurer depuis un fichier JSON'}</span>
                </button>
              </div>
            </div>

            {/* Granular Purge Table */}
            <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-rose-500">cleaning_services</span>
                  Zone de Purge Ciblée par Table
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Supprimez des sections spécifiques de données pour cette usine sans toucher aux autres tables.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: 'Purger Tous les Cartons', table: 'cartons', count: factoryData.cartons.length },
                  { label: 'Purger Ordres & Production', table: 'manufacturing_orders', count: factoryData.manufacturing_orders.length },
                  { label: 'Purger Matières Premières', table: 'raw_materials', count: factoryData.raw_materials.length },
                  { label: 'Purger Arrêts & Pannes', table: 'machine_stops', count: factoryData.machine_stops.length },
                  { label: 'Purger Parc Machines', table: 'machines', count: factoryData.machines.length },
                  { label: 'Purger Contrôles Qualité', table: 'quality_controls', count: factoryData.quality_controls.length }
                ].map(item => (
                  <div key={item.table} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-white">{item.label}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.count} enregistrement(s)</p>
                    </div>
                    <button
                      onClick={() => setDeleteTarget({ type: 'ALL', table: item.table, name: item.label })}
                      disabled={item.count === 0}
                      className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 disabled:opacity-40 text-rose-300 text-xs font-bold rounded-xl border border-rose-800 transition-colors shrink-0"
                    >
                      Purger
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </main>

      {/* CONFIRMATION DELETION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-5 text-center">
            <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/30">
              <span className="material-symbols-outlined text-[32px]">warning</span>
            </div>

            <div>
              <h3 className="text-xl font-black text-white">Confirmer la suppression</h3>
              <p className="text-xs text-slate-400 mt-1">
                Êtes-vous sûr de vouloir supprimer : <strong className="text-rose-400">{deleteTarget.name || deleteTarget.table}</strong> ?
              </p>
              <p className="text-[11px] text-amber-400/90 mt-2 bg-amber-950/40 p-2 rounded-xl border border-amber-800/60">
                Astuce : Vous pouvez télécharger une sauvegarde JSON préalable depuis l'onglet "Sauvegarde & Purge".
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="w-1/2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={executeDeletion}
                disabled={isDeleting}
                className="w-1/2 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition-colors shadow-lg shadow-rose-600/30"
              >
                {isDeleting ? 'Suppression...' : 'Supprimer Définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
