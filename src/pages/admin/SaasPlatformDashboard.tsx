import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Lead, Organization, Subscription } from '../../types/saas';
import toast from 'react-hot-toast';

export function SaasPlatformDashboard() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPlatformMetrics();
  }, []);

  const fetchPlatformMetrics = async () => {
    setIsLoading(true);
    try {
      const [
        { data: orgsData },
        { data: subsData },
        { data: leadsData }
      ] = await Promise.all([
        (supabase as any).from('organizations').select('*').order('created_at', { ascending: false }),
        (supabase as any).from('subscriptions').select('*, plan:subscription_plans(*)'),
        (supabase as any).from('leads').select('*').order('created_at', { ascending: false })
      ]);

      setOrganizations(orgsData || []);
      setSubscriptions(subsData || []);
      setLeads(leadsData || []);
    } catch (err) {
      console.error('Failed to load SaaS metrics', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateLeadStatus = async (leadId: string, newStatus: Lead['status']) => {
    try {
      await (supabase as any).from('leads').update({ status: newStatus }).eq('id', leadId);
      setLeads(leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
      toast.success('Statut du prospect mis à jour.');
    } catch (err) {
      toast.error('Erreur lors de la mise à jour.');
    }
  };

  // Compute SaaS KPIs
  const totalOrgs = organizations.length;
  const trialingSubs = subscriptions.filter(s => s.status === 'TRIALING').length;
  const activeSubs = subscriptions.filter(s => s.status === 'ACTIVE').length;
  const totalMrr = subscriptions
    .filter(s => s.status === 'ACTIVE')
    .reduce((acc, s) => acc + (Number(s.plan?.monthly_price) || 299), 0);

  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-black uppercase mb-2">
          <span>Super Admin Control Plane</span>
        </div>
        <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Supervision Commerciale SaaS</h1>
        <p className="text-sm text-zinc-500 font-medium mt-1">
          Vue d'ensemble de l'ensemble des usines clientes, abonnements actifs et prospects commerciaux.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs">
          <p className="text-xs font-bold text-zinc-400 uppercase">Usines Clientes (Tenants)</p>
          <p className="text-3xl font-black text-zinc-900 mt-2">{totalOrgs}</p>
          <p className="text-xs text-blue-600 font-bold mt-1">Isolées par PostgreSQL RLS</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs">
          <p className="text-xs font-bold text-zinc-400 uppercase">Revenu Mensuel Récurrent (MRR)</p>
          <p className="text-3xl font-black text-emerald-600 mt-2">{totalMrr} <span className="text-sm font-bold text-zinc-500">TND</span></p>
          <p className="text-xs text-zinc-400 mt-1">Sur forfaits payants actifs</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs">
          <p className="text-xs font-bold text-zinc-400 uppercase">Abonnements en Essai (14j)</p>
          <p className="text-3xl font-black text-amber-500 mt-2">{trialingSubs}</p>
          <p className="text-xs text-zinc-400 mt-1">Prospects en test actif</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs">
          <p className="text-xs font-bold text-zinc-400 uppercase">Abonnements Payants</p>
          <p className="text-3xl font-black text-purple-600 mt-2">{activeSubs}</p>
          <p className="text-xs text-zinc-400 mt-1">Clients récurrents</p>
        </div>
      </div>

      {/* Tenant Fleet Table */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
          <h2 className="text-lg font-black text-zinc-900">Parc des Usines Enregistrées</h2>
          <button
            onClick={fetchPlatformMetrics}
            className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-lg transition-colors"
          >
            Actualiser
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 text-xs font-bold uppercase border-b border-zinc-200">
              <tr>
                <th className="p-4">Usine</th>
                <th className="p-4">Gouvernorat</th>
                <th className="p-4">Secteur</th>
                <th className="p-4">Machines</th>
                <th className="p-4">Date Création</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {organizations.map((org) => (
                <tr key={org.id} className="hover:bg-zinc-50/50">
                  <td className="p-4 font-black text-zinc-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {org.name}
                  </td>
                  <td className="p-4 text-zinc-600 font-medium">{org.city || org.governorate || 'Tunisie'}</td>
                  <td className="p-4 text-zinc-600 font-medium">{org.industry || 'Industrie Générale'}</td>
                  <td className="p-4 font-bold text-zinc-900">{org.machine_count || '1-5'}</td>
                  <td className="p-4 text-xs text-zinc-400">{new Date(org.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leads CRM Table */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-zinc-100">
          <h2 className="text-lg font-black text-zinc-900">Prospects Commerciaux & Demandes de Démo</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Formulaires reçus depuis le site web commercial.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 text-xs font-bold uppercase border-b border-zinc-200">
              <tr>
                <th className="p-4">Contact</th>
                <th className="p-4">Entreprise</th>
                <th className="p-4">Email / Téléphone</th>
                <th className="p-4">Taille Parc</th>
                <th className="p-4">Statut Commercial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-400 font-medium text-xs">
                    Aucune nouvelle demande de démo pour le moment.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-zinc-50/50">
                    <td className="p-4 font-black text-zinc-900">{lead.name}</td>
                    <td className="p-4 text-zinc-700 font-bold">{lead.company}</td>
                    <td className="p-4 text-xs font-medium text-zinc-600">
                      <div>{lead.email}</div>
                      <div className="text-zinc-400">{lead.phone || '-'}</div>
                    </td>
                    <td className="p-4 text-xs font-bold text-zinc-700">{lead.factory_size || '1-5'}</td>
                    <td className="p-4">
                      <select
                        value={lead.status}
                        onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value as any)}
                        className={`text-xs font-black px-2.5 py-1 rounded-lg border uppercase ${
                          lead.status === 'NEW' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          lead.status === 'CONTACTED' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          lead.status === 'QUALIFIED' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          lead.status === 'CONVERTED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          'bg-zinc-100 text-zinc-600 border-zinc-200'
                        }`}
                      >
                        <option value="NEW">Nouveau (NEW)</option>
                        <option value="CONTACTED">Contacté</option>
                        <option value="QUALIFIED">Qualifié</option>
                        <option value="CONVERTED">Converti Client</option>
                        <option value="LOST">Perdu</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
