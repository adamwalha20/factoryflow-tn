import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useProductionStore } from '../store/production';
import { useTenantStore } from '../store/tenantStore';
import { useLanguageStore } from '../store/language';

export function Machines() {
  const { machines, fetchInitialData, loading, addMachine, updateMachine, deleteMachine } = useProductionStore();
  const { currentOrg } = useTenantStore();
  const { t } = useLanguageStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMachineId, setEditingMachineId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', location: '', status: 'Active' });

  // Tablet Pairing Modal State
  const [pairingMachine, setPairingMachine] = useState<any | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const [deletingMachineId, setDeletingMachineId] = useState<string | null>(null);

  const activeOrgId = currentOrg?.id || (typeof localStorage !== 'undefined' ? localStorage.getItem('active_org_id') : null) || '';

  const handleDeleteConfirm = async () => {
    if (deletingMachineId) {
      try {
        await deleteMachine(deletingMachineId);
        toast.success(t.confirm_delete);
      } catch (err: any) {
        toast.error(err.message || '');
      } finally {
        setDeletingMachineId(null);
      }
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingMachineId(id);
  };

  const handleEdit = (m: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData({
      name: m.name,
      location: m.department || '',
      status: m.status || 'Active'
    });
    setEditingMachineId(m.id);
    setIsModalOpen(true);
  };

  const handlePairTablet = (m: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setPairingMachine(m);
  };

  const handleAddClick = () => {
    setFormData({ name: '', location: '', status: 'Active' });
    setEditingMachineId(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Nom requis');
    try {
      if (editingMachineId) {
        await updateMachine(editingMachineId, formData);
        toast.success(t.save);
      } else {
        await addMachine(formData);
        toast.success(t.add);
      }
      setIsModalOpen(false);
      setEditingMachineId(null);
    } catch (err: any) {
      toast.error(err.message || 'Erreur');
    }
  };

  const getTabletUrl = (machineId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/tablet?org=${activeOrgId}&machine=${machineId}`;
  };

  const copyTabletUrl = (machineId: string) => {
    const url = getTabletUrl(machineId);
    navigator.clipboard.writeText(url);
    toast.success('Lien copié');
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t.machines}</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            {t.overview}
          </p>
        </div>
        <button onClick={handleAddClick} className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shadow-sm">
          <span className="material-symbols-outlined text-[18px]">add</span>
          {t.add}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full p-8 text-center text-gray-500">{t.loading}</div>
        ) : machines.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300 space-y-3">
            <span className="material-symbols-outlined text-4xl text-gray-400">precision_manufacturing</span>
            <p className="text-sm font-semibold text-gray-700">Aucune machine enregistrée pour cette usine.</p>
            <button onClick={handleAddClick} className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-sm">
              + Créer votre première machine
            </button>
          </div>
        ) : machines.map(m => (
          <div key={m.id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">precision_manufacturing</span>
                </div>
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                  m.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' :
                  m.status === 'En panne' || m.status === 'Maintenance' ? 'bg-red-50 text-red-700 border-red-200' :
                  'bg-gray-100 text-gray-600 border-gray-200'
                }`}>
                  {m.status || 'Active'}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors tracking-tight">
                {m.name}
              </h3>
              <p className="text-xs font-semibold text-gray-500 mt-1">Code : {(m as any).code || 'N/A'}</p>
              <p className="text-xs font-medium text-gray-400">Département : {(m as any).department || 'Atelier'}</p>
            </div>
            
            {/* Tablet Activation Button */}
            <div className="pt-4 border-t border-gray-100 mt-4 space-y-3">
              <button
                onClick={(e) => handlePairTablet(m, e)}
                className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">tablet</span>
                <span>Associer / QR Tablette</span>
              </button>

              <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                <span>Rendement (TRS) : <strong className="text-gray-900 font-bold">{m.oee || 85}%</strong></span>
                <div className="flex items-center gap-1">
                  <button onClick={(e) => handleEdit(m, e)} title="Modifier" className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100">
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button onClick={(e) => handleDelete(m.id, e)} title="Supprimer" className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Machine Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-gray-200 shadow-2xl space-y-4">
            <h2 className="font-bold text-xl text-gray-900">{editingMachineId ? 'Modifier la machine' : 'Ajouter une machine'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Nom de la machine</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Enrouleuse 01" className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Code Poste</label>
                <input required type="text" value={(formData as any).code || ''} onChange={e => setFormData({...formData, code: e.target.value} as any)} placeholder="Ex: ENR-01" className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Département / Emplacement</label>
                <input type="text" value={(formData as any).department || formData.location || ''} onChange={e => setFormData({...formData, department: e.target.value, location: e.target.value} as any)} placeholder="Ex: Ligne 1 - Découpe" className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              {editingMachineId && (
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Statut</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500">
                    <option value="Active">Active</option>
                    <option value="En panne">En panne</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Inactif">Inactif</option>
                  </select>
                </div>
              )}
              
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 font-bold text-xs uppercase hover:bg-gray-100 rounded-xl border border-gray-300 transition-colors">Annuler</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold text-xs uppercase rounded-xl hover:bg-blue-700 transition-colors shadow-sm">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tablet Machine Pairing & QR Modal */}
      {pairingMachine && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl border border-gray-200 space-y-6 text-center">
            
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
              <span className="material-symbols-outlined text-[32px]">tablet_mac</span>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">Écran Tablette pour {pairingMachine.name}</h2>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Ouvrez ce lien direct sur la tablette de l'opérateur ou scannez le QR code. La tablette sera automatiquement et définitivement connectée à cette machine sans mot de passe requis.
              </p>
            </div>

            {/* QR Code display */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 inline-block mx-auto shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(getTabletUrl(pairingMachine.id))}`}
                alt="QR Code Tablette"
                className="w-44 h-44 mx-auto rounded-lg"
              />
              <p className="text-[11px] font-bold text-gray-600 mt-2">Scannez avec la tablette atelier</p>
            </div>

            {/* URL & Action buttons */}
            <div className="space-y-3">
              <div className="p-3 bg-gray-100 rounded-xl font-mono text-xs text-gray-700 break-all text-left border border-gray-200">
                {getTabletUrl(pairingMachine.id)}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => copyTabletUrl(pairingMachine.id)}
                  className="flex-1 py-2.5 px-4 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  <span>Copier le Lien</span>
                </button>
                <a
                  href={getTabletUrl(pairingMachine.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20"
                >
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  <span>Ouvrir l'Écran</span>
                </a>
              </div>
            </div>

            <button
              onClick={() => setPairingMachine(null)}
              className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-wider"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingMachineId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-gray-200">
            <h2 className="text-lg font-bold mb-2 text-gray-900">Confirmer la suppression</h2>
            <p className="text-gray-600 mb-6 text-xs leading-relaxed">
              Êtes-vous sûr de vouloir supprimer cette machine ? Cette action détachera les sessions associées.
            </p>
            <div className="flex gap-2 justify-end">
              <button 
                onClick={() => setDeletingMachineId(null)} 
                className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors text-xs uppercase"
              >
                Annuler
              </button>
              <button 
                onClick={handleDeleteConfirm} 
                className="px-5 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors text-xs uppercase shadow-sm"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
