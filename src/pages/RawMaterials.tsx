import React, { useState, useEffect } from 'react';
import { useRawMaterialsStore } from '../store/rawMaterials';
import { useLanguageStore } from '../store/language';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function RawMaterials() {
  const { 
    materials, 
    transactions, 
    consumptions, 
    loading, 
    fetchMaterials, 
    addMaterial, 
    updateMaterial, 
    deleteMaterial,
    recordTransaction 
  } = useRawMaterialsStore();
  const { t } = useLanguageStore();

  const [activeTab, setActiveTab] = useState<'stock' | 'ledger' | 'yield'>('stock');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [deletingMaterialId, setDeletingMaterialId] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  
  // Create / Edit Form State
  const [formData, setFormData] = useState({
    reference: '',
    designation: '',
    category: 'Jumbo Roll',
    quantity_in_stock: 0,
    min_stock: 0,
    unit: 'RLX',
    supplier: ''
  });

  // Movement Form State
  const [movementData, setMovementData] = useState({
    raw_material_id: '',
    transaction_type: 'RECEIPT' as 'RECEIPT' | 'ADJUSTMENT' | 'WASTE' | 'RETURN',
    quantity: 0,
    notes: ''
  });

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleAddClick = () => {
    setFormData({
      reference: '',
      designation: '',
      category: 'Jumbo Roll',
      quantity_in_stock: 0,
      min_stock: 10,
      unit: 'RLX',
      supplier: ''
    });
    setEditingMaterialId(null);
    setIsModalOpen(true);
  };

  const handleMovementClick = (materialId?: string) => {
    setMovementData({
      raw_material_id: materialId || (materials[0]?.id || ''),
      transaction_type: 'RECEIPT',
      quantity: 0,
      notes: ''
    });
    setIsMovementModalOpen(true);
  };

  const handleEdit = (m: any) => {
    setFormData({
      reference: m.reference || '',
      designation: m.designation || '',
      category: m.category || 'Jumbo Roll',
      quantity_in_stock: m.quantity_in_stock || 0,
      min_stock: m.min_stock || 0,
      unit: m.unit || 'RLX',
      supplier: m.supplier || ''
    });
    setEditingMaterialId(m.id);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletingMaterialId) {
      try {
        await deleteMaterial(deletingMaterialId);
        toast.success('Matière première supprimée avec succès');
      } catch (err: any) {
        toast.error('Erreur lors de la suppression: ' + (err.message || ''));
      } finally {
        setDeletingMaterialId(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMaterialId) {
        await updateMaterial(editingMaterialId, formData);
        toast.success('Matière première modifiée avec succès');
      } else {
        await addMaterial(formData);
        toast.success('Matière première ajoutée avec succès');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementData.raw_material_id) {
      toast.error('Veuillez sélectionner une matière première');
      return;
    }
    if (movementData.quantity <= 0) {
      toast.error('La quantité doit être supérieure à 0');
      return;
    }

    try {
      await recordTransaction({
        raw_material_id: movementData.raw_material_id,
        transaction_type: movementData.transaction_type,
        quantity: movementData.quantity,
        notes: movementData.notes
      });
      toast.success('Mouvement de stock enregistré dans le registre !');
      setIsMovementModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors du mouvement');
    }
  };

  const filteredMaterials = materials.filter(m => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = (
      (m.reference && m.reference.toLowerCase().includes(q)) ||
      (m.designation && m.designation.toLowerCase().includes(q))
    );
    const matchesCat = filterCategory === 'ALL' || m.category === filterCategory;
    const isLow = Number(m.quantity_in_stock) <= Number(m.min_stock || 0);
    const matchesLow = !onlyLowStock || isLow;

    return matchesSearch && matchesCat && matchesLow;
  });

  const lowStockCount = materials.filter(m => Number(m.quantity_in_stock) <= Number(m.min_stock || 0)).length;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t.raw_materials}</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">{t.overview}</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleMovementClick()} 
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
            Mouvement de Stock
          </button>
          <button 
            onClick={handleAddClick} 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            {t.add}
          </button>
        </div>
      </div>

      {/* Low Stock Warning Banner if any */}
      {lowStockCount > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-600 text-2xl">warning</span>
            <div>
              <p className="text-sm font-bold text-amber-900">{lowStockCount} {t.raw_materials}</p>
              <p className="text-xs text-amber-700">{t.target}</p>
            </div>
          </div>
          <button
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className="px-3 py-1.5 bg-amber-200/80 hover:bg-amber-300 text-amber-900 text-xs font-semibold rounded-lg transition-colors"
          >
            {onlyLowStock ? 'All' : t.filter}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6">
        <button
          onClick={() => setActiveTab('stock')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'stock'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">inventory_2</span>
          {t.raw_materials} ({materials.length})
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'ledger'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">receipt_long</span>
          {t.system_history} ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab('yield')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'yield'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">monitoring</span>
          {t.efficiency} ({consumptions.length})
        </button>
      </div>

      {/* TAB 1: STOCK STATUS */}
      {activeTab === 'stock' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                <input
                  type="text"
                  placeholder="Rechercher référence, désignation..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full sm:w-64"
                />
              </div>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none"
              >
                <option value="ALL">Toutes catégories</option>
                <option value="Jumbo Roll">Jumbo Roll</option>
                <option value="Mandrin">Mandrin</option>
                <option value="Carton">Carton</option>
                <option value="Film">Film</option>
              </select>
            </div>
            <div className="text-xs text-slate-500">
              {filteredMaterials.length} article(s) trouvé(s)
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Référence & Désignation</th>
                  <th className="p-4">Catégorie</th>
                  <th className="p-4">Stock Actuel</th>
                  <th className="p-4">Seuil Alerte</th>
                  <th className="p-4">État</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {filteredMaterials.map(m => {
                  const isLow = Number(m.quantity_in_stock) <= Number(m.min_stock || 0);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="p-4">
                        <div className="font-semibold text-slate-900">{m.reference}</div>
                        <div className="text-slate-500 text-xs">{m.designation}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md border border-slate-200">
                          {m.category}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-900 text-base">
                        {m.quantity_in_stock} <span className="text-xs text-slate-500 font-normal">{m.unit}</span>
                      </td>
                      <td className="p-4 text-slate-500 text-xs font-medium">
                        {m.min_stock || 0} {m.unit}
                      </td>
                      <td className="p-4">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                            Stock Faible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Optimal
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-1">
                        <button 
                          onClick={() => handleMovementClick(m.id)} 
                          title="Mouvement de stock"
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors rounded-lg"
                        >
                          <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                        </button>
                        <button 
                          onClick={() => handleEdit(m)} 
                          title="Modifier"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded-lg"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button 
                          onClick={() => setDeletingMaterialId(m.id)} 
                          title="Supprimer"
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors rounded-lg"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredMaterials.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Aucune matière première ne correspond aux filtres.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: IMMUTABLE LEDGER */}
      {activeTab === 'ledger' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900">Registre Immuable des Mouvements</h3>
              <p className="text-xs text-slate-500 mt-0.5">Historique non modifiable de toutes les réceptions, consommations et ajustements.</p>
            </div>
            <button
              onClick={() => handleMovementClick()}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Ajouter Mouvement
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Date & Heure</th>
                  <th className="p-4">Type Mouvement</th>
                  <th className="p-4">Matière Première</th>
                  <th className="p-4">Quantité</th>
                  <th className="p-4">Stock Avant ➔ Après</th>
                  <th className="p-4">Notes / Motif</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {transactions.map(t => {
                  const typeStyles: Record<string, { label: string; bg: string }> = {
                    RECEIPT: { label: 'Réception Fournisseur', bg: 'bg-emerald-100 text-emerald-800' },
                    CONSUMPTION: { label: 'Consommation Production', bg: 'bg-blue-100 text-blue-800' },
                    ADJUSTMENT: { label: 'Ajustement Inventaire', bg: 'bg-purple-100 text-purple-800' },
                    WASTE: { label: 'Perte / Déchet', bg: 'bg-red-100 text-red-800' },
                    RETURN: { label: 'Retour Stock', bg: 'bg-amber-100 text-amber-800' },
                    TRANSFER: { label: 'Transfert', bg: 'bg-slate-100 text-slate-800' }
                  };
                  const style = typeStyles[t.transaction_type] || { label: t.transaction_type, bg: 'bg-slate-100 text-slate-800' };

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 text-xs text-slate-500 whitespace-nowrap">
                        {t.created_at ? format(new Date(t.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }) : '-'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${style.bg}`}>
                          {style.label}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-slate-900">
                        {t.raw_materials?.reference || '-'}
                        <div className="text-xs text-slate-500 font-normal">{t.raw_materials?.designation}</div>
                      </td>
                      <td className="p-4 font-bold text-slate-900">
                        {t.transaction_type === 'RECEIPT' || t.transaction_type === 'RETURN' ? '+' : '-'}
                        {t.quantity}
                      </td>
                      <td className="p-4 text-xs font-mono text-slate-600">
                        {t.previous_stock ?? '-'} ➔ <span className="font-bold text-slate-900">{t.new_stock ?? '-'}</span>
                      </td>
                      <td className="p-4 text-xs text-slate-500 max-w-xs truncate">
                        {t.notes || '-'}
                      </td>
                    </tr>
                  );
                })}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Aucune transaction dans le registre pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CONSUMPTIONS & YIELD */}
      {activeTab === 'yield' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-900">Consommations et Rendement par Ordre de Fabrication</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Date</th>
                  <th className="p-4">Matière Première</th>
                  <th className="p-4">Quantité Consommée</th>
                  <th className="p-4">Taux de Rendement</th>
                  <th className="p-4">Taux de Déchet</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {consumptions.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 text-xs text-slate-500">
                      {c.created_at ? format(new Date(c.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }) : '-'}
                    </td>
                    <td className="p-4 font-semibold text-slate-900">
                      {c.raw_materials?.reference} - {c.raw_materials?.designation}
                    </td>
                    <td className="p-4 font-semibold text-slate-700">
                      {c.consumed_quantity || '-'}
                    </td>
                    <td className="p-4 font-bold text-emerald-600">
                      {c.yield_percentage || 0}%
                    </td>
                    <td className="p-4 font-bold text-red-600">
                      {c.waste_percentage || 0}%
                    </td>
                  </tr>
                ))}
                {consumptions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      Aucune consommation de production enregistrée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MATERIAL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md border border-slate-200 shadow-xl">
            <h2 className="font-bold text-xl mb-4 text-slate-900">
              {editingMaterialId ? 'Modifier la matière première' : 'Ajouter une matière première'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Référence</label>
                <input required type="text" value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} className="input-base" placeholder="Ex: JMB-BOPP-1280" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Désignation</label>
                <input required type="text" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} className="input-base" placeholder="Ex: Bobine Jumbo BOPP 1280mm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Catégorie</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="input-base">
                  <option value="Jumbo Roll">Jumbo Roll</option>
                  <option value="Mandrin">Mandrin</option>
                  <option value="Carton">Carton</option>
                  <option value="Film">Film</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Stock Initial</label>
                  <input type="number" step="0.01" value={formData.quantity_in_stock} onChange={e => setFormData({...formData, quantity_in_stock: parseFloat(e.target.value) || 0})} className="input-base" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Seuil Alerte</label>
                  <input type="number" step="0.01" value={formData.min_stock} onChange={e => setFormData({...formData, min_stock: parseFloat(e.target.value) || 0})} className="input-base" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Unité</label>
                <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="input-base">
                  <option value="RLX">Rouleaux (RLX)</option>
                  <option value="KG">Kilogrammes (KG)</option>
                  <option value="PCS">Pièces (PCS)</option>
                  <option value="M">Mètres (M)</option>
                  <option value="M²">Mètres Carrés (M²)</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-200 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg transition-colors shadow-sm">{editingMaterialId ? 'Modifier' : 'Ajouter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOCK MOVEMENT MODAL */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md border border-slate-200 shadow-xl">
            <h2 className="font-bold text-xl mb-4 text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600">swap_horiz</span>
              Enregistrer un Mouvement de Stock
            </h2>
            <form onSubmit={handleMovementSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Matière Première</label>
                <select 
                  value={movementData.raw_material_id} 
                  onChange={e => setMovementData({...movementData, raw_material_id: e.target.value})}
                  className="input-base"
                  required
                >
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.reference} — {m.designation} (Actuel: {m.quantity_in_stock} {m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type d'opération</label>
                <select 
                  value={movementData.transaction_type} 
                  onChange={e => setMovementData({...movementData, transaction_type: e.target.value as any})}
                  className="input-base"
                >
                  <option value="RECEIPT">📦 Réception Fournisseur (+ Stock)</option>
                  <option value="ADJUSTMENT">⚙️ Ajustement Inventaire (Fixer nouvelle valeur)</option>
                  <option value="WASTE">⚠️ Perte / Rebut Matière (- Stock)</option>
                  <option value="RETURN">↩️ Retour en Stock (+ Stock)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {movementData.transaction_type === 'ADJUSTMENT' ? 'Nouveau Stock Réel' : 'Quantité à ajouter/déduire'}
                </label>
                <input 
                  type="number" 
                  step="0.01" 
                  required
                  value={movementData.quantity || ''} 
                  onChange={e => setMovementData({...movementData, quantity: parseFloat(e.target.value) || 0})}
                  className="input-base text-lg font-bold"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Motif / N° Bon de Livraison</label>
                <input 
                  type="text" 
                  value={movementData.notes} 
                  onChange={e => setMovementData({...movementData, notes: e.target.value})}
                  className="input-base"
                  placeholder="Ex: BL-2026-9812 / Inventaire mensuel"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-200 mt-6">
                <button type="button" onClick={() => setIsMovementModalOpen(false)} className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white font-medium hover:bg-emerald-700 rounded-lg transition-colors shadow-sm">Valider le Mouvement</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingMaterialId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm border border-slate-200 shadow-xl">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <span className="material-symbols-outlined text-3xl">warning</span>
              <h2 className="font-bold text-xl text-slate-900">Confirmer suppression</h2>
            </div>
            <p className="text-slate-600 mb-6 text-sm">
              Êtes-vous sûr de vouloir supprimer cette matière première ? Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeletingMaterialId(null)} className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors">Annuler</button>
              <button onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 text-white font-medium hover:bg-red-700 rounded-lg transition-colors shadow-sm">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
