import React, { useState, useEffect } from 'react';
import { useTenantStore } from '../../store/tenantStore';
import { useLanguageStore } from '../../store/language';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export function SubscriptionSettings() {
  const { currentOrg, currentSubscription, plans, usage, fetchTenantData, fetchPlans } = useTenantStore();
  const { t } = useLanguageStore();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedPlanSlug, setSelectedPlanSlug] = useState<string>('professional');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchTenantData();
    fetchPlans();
  }, [fetchTenantData, fetchPlans]);

  const activePlan = currentSubscription?.plan || plans.find(p => p.slug === 'professional') || {
    name: 'Professionnel',
    slug: 'professional',
    monthly_price: 299,
    currency: 'TND',
    limits: { max_machines: 10, max_workers: 50, max_users: 10 }
  };

  const limits = (activePlan.limits as any) || { max_machines: 10, max_workers: 50, max_users: 10 };

  const calculateDaysLeft = () => {
    if (!currentSubscription?.trial_end) return 14;
    const diff = new Date(currentSubscription.trial_end).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const handleUpgradePlan = async (slug: string) => {
    setIsUpdating(true);
    const orgId = currentOrg?.id || localStorage.getItem('active_org_id');
    const targetPlan = plans.find(p => p.slug === slug);

    try {
      if (orgId && targetPlan) {
        if (currentSubscription?.id) {
          await (supabase as any)
            .from('subscriptions')
            .update({
              plan_id: targetPlan.id,
              status: 'ACTIVE',
              updated_at: new Date().toISOString()
            })
            .eq('id', currentSubscription.id);
        } else {
          await (supabase as any)
            .from('subscriptions')
            .insert([{
              organization_id: orgId,
              plan_id: targetPlan.id,
              status: 'ACTIVE',
              billing_cycle: 'monthly',
              start_date: new Date().toISOString()
            }]);
        }
      }

      await fetchTenantData();
      setIsUpgradeModalOpen(false);
      toast.success(`Forfait ${targetPlan?.name || slug} activé avec succès !`);
    } catch (err: any) {
      console.error('Upgrade failed', err);
      toast.error('Erreur lors du changement de forfait.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-zinc-900 tracking-tight">{t.subscription_quotas}</h1>
        <p className="text-sm text-zinc-500 font-medium mt-1">
          {t.overview}
        </p>
      </div>

      {/* Subscription Card */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-black uppercase tracking-wider text-blue-200 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {currentSubscription?.status === 'TRIALING' ? 'Période d\'essai gratuite (14 jours)' : 'Abonnement Actif'}
            </div>
            <h2 className="text-3xl sm:text-4xl font-black">Forfait {activePlan.name}</h2>
            <p className="text-sm text-blue-100 mt-1">
              {activePlan.monthly_price} {activePlan.currency || 'TND'} / mois • Facturation mensuelle
            </p>
            {currentSubscription?.status === 'TRIALING' && (
              <p className="text-xs font-bold text-amber-300 mt-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">timer</span>
                Il vous reste {calculateDaysLeft()} jours d'essai gratuit avec fonctionnalités complètes.
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="px-6 py-3.5 bg-white text-blue-900 hover:bg-blue-50 font-black text-sm rounded-xl shadow-lg transition-all"
            >
              Changer de Forfait
            </button>
            <button
              onClick={() => toast.success('Votre facture sera envoyée par email à chaque fin de mois.')}
              className="px-6 py-3.5 bg-blue-950/60 hover:bg-blue-950 border border-blue-400/30 text-white font-bold text-sm rounded-xl transition-colors"
            >
              Historique Factures
            </button>
          </div>
        </div>
      </div>

      {/* Usage Meters / Quotas */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-zinc-900">Consommation des Quotas de votre Forfait</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Machines Quota */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                <span className="material-symbols-outlined text-blue-600 text-[18px]">precision_manufacturing</span>
                Machines Actives
              </span>
              <span className="text-xs font-black text-zinc-900">
                {usage.machinesCount} / {limits.max_machines}
              </span>
            </div>
            <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  (usage.machinesCount / limits.max_machines) >= 1 ? 'bg-red-500' : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(100, (usage.machinesCount / limits.max_machines) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-400 mt-2 font-medium">
              {(limits.max_machines - usage.machinesCount)} machine(s) disponible(s) sur votre forfait.
            </p>
          </div>

          {/* Workers Quota */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">badge</span>
                Ouvriers & Opérateurs
              </span>
              <span className="text-xs font-black text-zinc-900">
                {usage.workersCount} / {limits.max_workers}
              </span>
            </div>
            <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  (usage.workersCount / limits.max_workers) >= 1 ? 'bg-red-500' : 'bg-emerald-600'
                }`}
                style={{ width: `${Math.min(100, (usage.workersCount / limits.max_workers) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-400 mt-2 font-medium">
              {(limits.max_workers - usage.workersCount)} ouvrier(s) disponible(s).
            </p>
          </div>

          {/* Users / Managers Quota */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                <span className="material-symbols-outlined text-indigo-600 text-[18px]">group</span>
                Utilisateurs Web / Managers
              </span>
              <span className="text-xs font-black text-zinc-900">
                {usage.usersCount} / {limits.max_users}
              </span>
            </div>
            <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  (usage.usersCount / limits.max_users) >= 1 ? 'bg-red-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${Math.min(100, (usage.usersCount / limits.max_users) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-400 mt-2 font-medium">
              {(limits.max_users - usage.usersCount)} compte(s) manager disponible(s).
            </p>
          </div>
        </div>
      </div>

      {/* Upgrade Plan Modal */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl border border-zinc-200 space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-zinc-900">Changer de Forfait SaaS</h3>
                <p className="text-xs text-zinc-500">Sélectionnez le nouveau palier pour débloquer des quotas supplémentaires.</p>
              </div>
              <button
                onClick={() => setIsUpgradeModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {plans.map((p) => (
                <div
                  key={p.slug}
                  onClick={() => setSelectedPlanSlug(p.slug)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedPlanSlug === p.slug
                      ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                      : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/30'
                  }`}
                >
                  <h4 className="font-black text-zinc-900">{p.name}</h4>
                  <p className="text-xl font-black text-blue-600 mt-2">
                    {p.monthly_price} <span className="text-xs font-normal text-zinc-500">TND/m</span>
                  </p>
                  <ul className="mt-3 space-y-1 text-[11px] text-zinc-600 font-medium">
                    <li>• {p.limits?.max_machines} machines</li>
                    <li>• {p.limits?.max_workers} ouvriers</li>
                    <li>• {p.limits?.max_users} managers</li>
                  </ul>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsUpgradeModalOpen(false)}
                className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleUpgradePlan(selectedPlanSlug)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md"
              >
                {isUpdating ? 'Mise à niveau...' : 'Confirmer le Forfait'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
