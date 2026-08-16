import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useTenantStore } from '../../store/tenantStore';
import type { OrgRole } from '../../types/saas';
import toast from 'react-hot-toast';

interface MemberItem {
  id: string;
  user_id: string;
  name?: string;
  email: string;
  role: OrgRole;
  status: 'ACTIVE' | 'INVITED' | 'DEACTIVATED';
  created_at: string;
}

export function TenantUsers() {
  const { currentOrg, canCreateUser, fetchTenantData } = useTenantStore();
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState<{ email: string; name: string; role: OrgRole }>({
    email: '',
    name: '',
    role: 'MANAGER'
  });
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [currentOrg]);

  const fetchMembers = async () => {
    setIsLoading(true);
    const orgId = currentOrg?.id || localStorage.getItem('active_org_id');
    try {
      if (orgId) {
        const { data: usersData } = await (supabase as any)
          .from('users')
          .select('*')
          .eq('organization_id', orgId);

        const { data: membersData } = await (supabase as any)
          .from('organization_members')
          .select('*')
          .eq('organization_id', orgId);

        // Filter to ONLY include managers and administrators in the SaaS team list
        const isShopfloorRole = (role: string) => [
          'Machine Operator',
          'Operator',
          'Opérateur',
          'Opérateur Machine',
          'Quality Controller',
          'Contrôleur Qualité',
          'Warehouse Operator',
          'Opérateur Entrepôt',
          'Mechanic',
          'Mécanicien'
        ].includes(role);

        const managementUsers = (usersData || []).filter((u: any) => !isShopfloorRole(u.role || ''));

        const combined: MemberItem[] = managementUsers.map((u: any) => {
          const m = (membersData || []).find((mem: any) => mem.user_id === u.id);
          const computedRole: OrgRole = m?.role || (u.role === 'Administrator' ? 'OWNER' : 'MANAGER');
          return {
            id: m?.id || u.id,
            user_id: u.id,
            name: u.name || u.email,
            email: u.email,
            role: computedRole,
            status: m?.status || 'ACTIVE',
            created_at: u.created_at || new Date().toISOString()
          };
        });

        setMembers(combined);
      }
    } catch (err) {
      console.error('Failed to load members', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const quota = canCreateUser();
    if (!quota.allowed) {
      toast.error(quota.message || 'Limite d\'utilisateurs atteinte sur votre forfait.');
      return;
    }

    setIsInviting(true);
    const orgId = currentOrg?.id || localStorage.getItem('active_org_id');

    try {
      const newUserId = crypto.randomUUID();
      // Insert in users table
      await (supabase as any).from('users').insert([{
        id: newUserId,
        organization_id: orgId,
        email: inviteForm.email,
        name: inviteForm.name || inviteForm.email.split('@')[0],
        role: inviteForm.role === 'OWNER' ? 'Administrator' : 'Production Manager',
        status: 'Active'
      }]);

      // Insert in organization_members
      await (supabase as any).from('organization_members').insert([{
        organization_id: orgId,
        user_id: newUserId,
        role: inviteForm.role,
        status: 'ACTIVE'
      }]);

      toast.success(`Invitation envoyée à ${inviteForm.email}`);
      setIsInviteModalOpen(false);
      setInviteForm({ email: '', name: '', role: 'MANAGER' });
      fetchMembers();
      fetchTenantData();
    } catch (err: any) {
      toast.error('Erreur lors de l\'invitation.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce membre de l\'usine ?')) return;
    try {
      await (supabase as any).from('organization_members').delete().eq('user_id', userId);
      await (supabase as any).from('users').delete().eq('id', userId);
      setMembers(members.filter(m => m.user_id !== userId));
      toast.success('Membre retiré avec succès.');
      fetchTenantData();
    } catch (err) {
      toast.error('Erreur lors de la suppression.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Membres & Rôles</h1>
          <p className="text-sm text-zinc-500 font-medium mt-1">
            Gérez les comptes managers et administrateurs ayant accès à l'espace de votre usine.
          </p>
        </div>
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          <span>Inviter un Membre</span>
        </button>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 text-xs font-bold uppercase border-b border-zinc-200">
              <tr>
                <th className="p-4">Utilisateur</th>
                <th className="p-4">Email</th>
                <th className="p-4">Rôle</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-zinc-50/50">
                  <td className="p-4 font-black text-zinc-900 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-black text-xs flex items-center justify-center">
                      {(m.name || m.email)[0].toUpperCase()}
                    </span>
                    {m.name || 'Manager'}
                  </td>
                  <td className="p-4 text-zinc-600 font-medium">{m.email}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-xs font-black rounded-lg uppercase ${
                      m.role === 'OWNER' ? 'bg-purple-100 text-purple-800' :
                      m.role === 'MANAGER' ? 'bg-blue-100 text-blue-800' :
                      'bg-zinc-100 text-zinc-700'
                    }`}>
                      {m.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Actif
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {m.role !== 'OWNER' && (
                      <button
                        onClick={() => handleRemoveMember(m.user_id)}
                        className="text-zinc-400 hover:text-red-600 text-xs font-bold transition-colors"
                      >
                        Retirer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-zinc-200 space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h3 className="text-lg font-black text-zinc-900">Inviter un Nouveau Membre</h3>
              <button onClick={() => setIsInviteModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase mb-1.5">Nom & Prénom</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Anis Trabelsi"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase mb-1.5">Email Professionnel</label>
                <input
                  type="email"
                  required
                  placeholder="anis@usine.tn"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase mb-1.5">Rôle & Privilèges</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as OrgRole })}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:bg-white focus:border-blue-600 focus:outline-none"
                >
                  <option value="MANAGER">MANAGER (Accès complet production & rapports)</option>
                  <option value="SUPERVISOR">SUPERVISOR (Gestion des OF & arrêts machines)</option>
                  <option value="VIEWER">VIEWER (Lecture seule rapports & indicateurs)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 bg-zinc-100 text-zinc-700 font-bold text-xs rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  {isInviting ? 'Envoi...' : 'Envoyer l\'Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
