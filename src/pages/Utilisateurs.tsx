import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useUsersStore } from '../store/users';
import { hashPassword } from '../utils/crypto';

export function Utilisateurs() {
  const { users, loading, error, fetchUsers, updateUserStatus, addOperator, updateUser, deleteUser } = useUsersStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Machine Operator',
    phone: '',
    password: '',
    pin_code: '1234'
  });

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Actif' ? 'Inactif' : 'Actif';
    try {
      await updateUserStatus(id, nextStatus);
      toast.success(`Statut mis à jour : ${nextStatus}`);
    } catch (err: any) {
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const handleDeleteConfirm = async () => {
    if (deletingUserId) {
      try {
        await deleteUser(deletingUserId);
        toast.success('Utilisateur supprimé avec succès');
      } catch (err: any) {
        if (err.message && (err.message.includes('foreign key constraint') || err.message.includes('still referenced'))) {
          toast.error("Impossible de supprimer : cet utilisateur est lié à des sessions de production existantes. Veuillez le désactiver à la place.", { duration: 5000 });
        } else {
          toast.error('Erreur lors de la suppression : ' + (err.message || ''));
        }
      } finally {
        setDeletingUserId(null);
      }
    }
  };

  const isShopfloorRole = (role: string) => {
    return [
      'Machine Operator',
      'Operator',
      'Opérateur Machine',
      'Quality Controller',
      'Contrôleur Qualité',
      'Warehouse Operator',
      'Opérateur Entrepôt',
      'Mechanic',
      'Mécanicien'
    ].includes(role);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role as any,
        phone: formData.phone,
        pin_code: formData.pin_code || '1234'
      };

      if (!isShopfloorRole(formData.role) && formData.password) {
        payload.password = await hashPassword(formData.password);
      }

      if (editingUserId) {
        await updateUser(editingUserId, payload);
        toast.success('Utilisateur modifié avec succès');
      } else {
        await addOperator({
          ...payload,
          status: 'Actif'
        });
        toast.success('Utilisateur ajouté avec succès');
      }
      setIsModalOpen(false);
      setEditingUserId(null);
      setFormData({ name: '', email: '', role: 'Machine Operator', phone: '', password: '', pin_code: '1234' });
    } catch (err: any) {
      toast.error(err?.message || (editingUserId ? 'Erreur lors de la modification' : "Erreur lors de l'ajout de l'utilisateur"));
    }
  };

  const handleEditClick = (user: any) => {
    setEditingUserId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role || 'Machine Operator',
      phone: user.phone || '',
      password: '',
      pin_code: user.pin_code || '1234'
    });
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setEditingUserId(null);
    setFormData({ name: '', email: '', role: 'Machine Operator', phone: '', password: '', pin_code: '1234' });
    setIsModalOpen(true);
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Utilisateurs & Personnel</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Gérez les accès, rôles et codes PIN de votre équipe</p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">search</span>
            <input 
              type="text" 
              placeholder="Rechercher..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <button onClick={handleAddClick} className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap">
            <span className="material-symbols-outlined text-[18px]" data-icon="person_add">person_add</span>
            Ajouter Utilisateur
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden card-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 table-header-sticky">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rôle</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Code PIN</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="p-4 text-center text-gray-500">Chargement...</td></tr>
              ) : error ? (
                <tr><td colSpan={6} className="p-4 text-center text-error">{error}</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-center text-gray-500">Aucun utilisateur trouvé.</td></tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className={`hover:bg-gray-50 transition-colors group ${user.status === 'Inactif' ? 'opacity-60' : ''}`}>
                    <td className="p-4 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] ${user.status === 'Actif' ? 'bg-primary-container text-primary' : 'bg-gray-100 text-gray-500'}`}>
                        {user.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
                      </div>
                      <span className="font-semibold text-gray-900">{user.name}</span>
                    </td>
                    <td className="p-4 font-medium text-gray-600">{user.email}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-md border border-gray-200">
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      {isShopfloorRole(user.role || '') ? (
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          •••• {(user as any).pin_code || '1234'}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Mot de passe</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${user.status === 'Actif' ? 'bg-success-container text-success border-success/20' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditClick(user)} aria-label="Edit" className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors rounded hover:bg-gray-100">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onClick={() => toggleStatus(user.id, user.status)} aria-label="Toggle Status" className={`p-1.5 transition-colors rounded hover:bg-gray-100 ${user.status === 'Actif' ? 'text-gray-400 hover:text-error' : 'text-gray-400 hover:text-success'}`}>
                          <span className="material-symbols-outlined text-[18px]">{user.status === 'Actif' ? 'block' : 'check_circle'}</span>
                        </button>
                        <button onClick={() => setDeletingUserId(user.id)} aria-label="Delete" className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded hover:bg-red-50">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-100 p-4 flex justify-between items-center bg-gray-50">
          <span className="text-sm font-medium text-gray-500">Total : {filteredUsers.length} utilisateurs</span>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-slate-200 shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-slate-900">{editingUserId ? "Modifier l'Utilisateur" : "Ajouter un Utilisateur"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nom complet</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-base" placeholder="Ex: Mohamed Amine" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="input-base" placeholder="m.amine@usine.tn" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Téléphone</label>
                <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="input-base" placeholder="+216 20 000 000" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Rôle</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="input-base">
                  <option value="Machine Operator">Opérateur Machine (Tablette Atelier)</option>
                  <option value="Quality Controller">Contrôleur Qualité (Scanner QR Mobile)</option>
                  <option value="Mechanic">Mécanicien (Terminal Maintenance)</option>
                  <option value="Warehouse Operator">Opérateur Entrepôt / Magasin</option>
                  <option value="Production Manager">Manager Production (Web Dashboard)</option>
                  <option value="Administrator">Administrateur Usine (Accès Total)</option>
                </select>
              </div>

              {/* Dynamic Authentication Field based on Role */}
              {isShopfloorRole(formData.role) ? (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Code PIN (4 chiffres) {editingUserId && '(Laisser vide pour ne pas modifier)'}
                  </label>
                  <input 
                    type="text" 
                    maxLength={4}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    placeholder="Ex: 1234"
                    value={formData.pin_code} 
                    onChange={e => setFormData({...formData, pin_code: e.target.value.replace(/[^0-9]/g, '').slice(0, 4)})} 
                    className="input-base font-mono text-lg tracking-widest font-bold text-blue-700" 
                    required={!editingUserId} 
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Code PIN à 4 chiffres utilisé pour l'authentification rapide sur la Tablette Atelier et le Scanner QR.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Mot de passe {editingUserId && '(Laisser vide pour ne pas modifier)'}
                  </label>
                  <input 
                    type="password" 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                    className="input-base" 
                    required={!editingUserId} 
                    minLength={6} 
                    placeholder="••••••••"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Requis pour accéder au tableau de bord administrateur / manager.</p>
                </div>
              )}
              
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-200 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Annuler</button>
                <button type="submit" className="btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUserId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl border border-gray-200">
            <h2 className="text-xl font-bold mb-2 text-gray-900">Confirmer la suppression</h2>
            <p className="text-gray-600 mb-6 text-sm">
              Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setDeletingUserId(null)} 
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded transition-colors text-sm"
              >
                Annuler
              </button>
              <button 
                onClick={handleDeleteConfirm} 
                className="px-4 py-2 bg-red-600 text-white font-medium hover:bg-red-700 rounded transition-colors text-sm"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Utilisateurs;
