import React, { useState, useEffect } from 'react';
import { useMesStore } from '../store/mesStore';
import toast from 'react-hot-toast';

export function BonsDeCommande() {
  const { bons_de_commande, articles, loading, error, fetchInitialData, addBonDeCommande, updateBonDeCommande, deleteBonDeCommande } = useMesStore();

  const initialFormState = {
    bc_number: '',
    customer: '',
    due_date: '',
    status: 'En attente',
    mandrin_type: '',
    carton_type: '',
    epaisseur: '',
    quantity: '',
    article_reference: '',
    article_designation: ''
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBcId, setEditingBcId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialFormState);
  const [deletingBcId, setDeletingBcId] = useState<string | null>(null);
  const [articleSearch, setArticleSearch] = useState('');
  const [showArticleDropdown, setShowArticleDropdown] = useState(false);

  const filteredSearchArticles = articles
    .filter(a => {
      const q = articleSearch.toLowerCase();
      return (a.reference?.toLowerCase().includes(q) || a.designation?.toLowerCase().includes(q));
    })
    .slice(0, 50);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  if (loading && bons_de_commande.length === 0) {
    return <div className="p-6">Chargement des Bons de Commande...</div>;
  }

  if (error) {
    return <div className="p-6 text-error">Erreur: {error}</div>;
  }

  const handleDeleteConfirm = async () => {
    if (deletingBcId) {
      try {
        await deleteBonDeCommande(deletingBcId);
        toast.success('Bon de commande supprimé !');
      } catch (err: any) {
        toast.error('Erreur lors de la suppression');
      } finally {
        setDeletingBcId(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        bc_number: formData.bc_number,
        customer: formData.customer,
        due_date: formData.due_date || null,
        status: formData.status,
        mandrin_type: formData.mandrin_type || null,
        carton_type: formData.carton_type || null,
        epaisseur: formData.epaisseur || null,
        quantity: formData.quantity ? parseInt(formData.quantity) : null,
        article_reference: formData.article_reference || null,
        article_designation: formData.article_designation || null
      };

      if (editingBcId) {
        await updateBonDeCommande(editingBcId, payload);
        toast.success('Bon de commande mis à jour !');
      } else {
        await addBonDeCommande(payload);
        toast.success('Bon de commande créé !');
      }
      setIsModalOpen(false);
      setEditingBcId(null);
      setFormData(initialFormState);
    } catch (err: any) {
      console.error(err);
      toast.error('Erreur: ' + err.message);
    }
  };

  const handleEditClick = (bc: any) => {
    setEditingBcId(bc.id);
    setFormData({
      bc_number: bc.bc_number,
      customer: bc.customer || '',
      due_date: bc.due_date ? bc.due_date.split('T')[0] : '',
      status: bc.status || 'En attente',
      mandrin_type: bc.mandrin_type || '',
      carton_type: bc.carton_type || '',
      epaisseur: bc.epaisseur || '',
      quantity: bc.quantity ? bc.quantity.toString() : '',
      article_reference: bc.article_reference || '',
      article_designation: bc.article_designation || ''
    });
    setArticleSearch(bc.article_reference || '');
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setEditingBcId(null);
    setFormData(initialFormState);
    setArticleSearch('');
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bons de Commande</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Gérer les commandes clients</p>
        </div>
        <button 
          onClick={handleAddClick}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center gap-2 shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nouveau Bon
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden card-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 table-header-sticky">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">N° BC</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Article (Réf / Désign)</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Qté</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date de livraison</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bons_de_commande.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-on-surface-variant">
                    Aucun bon de commande trouvé.
                  </td>
                </tr>
              ) : (
                bons_de_commande.map((bc) => (
                  <tr key={bc.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors text-sm group">
                    <td className="p-4 font-bold text-gray-900">{bc.bc_number}</td>
                    <td className="p-4 font-semibold text-gray-700">{bc.customer}</td>
                    <td className="p-4 text-gray-600">
                      {bc.article_reference || bc.article_designation ? (
                        <div className="flex flex-col">
                          {bc.article_reference && <span className="font-semibold text-gray-900">{bc.article_reference}</span>}
                          {bc.article_designation && <span className="text-xs text-gray-500">{bc.article_designation}</span>}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="p-4 font-medium text-gray-900">{bc.quantity || '-'}</td>
                    <td className="p-4 text-gray-600">{bc.due_date ? new Date(bc.due_date).toLocaleDateString() : '-'}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
                        bc.status === 'En attente' ? 'bg-gray-100 text-gray-700' :
                        bc.status === 'En cours' ? 'bg-blue-50 text-blue-700' :
                        'bg-green-50 text-green-700'
                      }`}>
                        {bc.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditClick(bc)} className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors rounded hover:bg-gray-100">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onClick={() => setDeletingBcId(bc.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded hover:bg-red-50">
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
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-0 w-full max-w-lg shadow-2xl border border-gray-200 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-2xl font-bold text-gray-900">{editingBcId ? "Modifier le Bon" : "Nouveau Bon de Commande"}</h2>
            </div>
            
            <form id="bcForm" onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 grow">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">N° Bon de Commande *</label>
                  <input required type="text" placeholder="ex: BC-2026-001" value={formData.bc_number} onChange={e => setFormData({...formData, bc_number: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Client *</label>
                  <input required type="text" placeholder="ex: AFRICA TRADE" value={formData.customer} onChange={e => setFormData({...formData, customer: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Article (Référence)</label>
                  <input
                    type="text"
                    placeholder="Rechercher un article..."
                    value={articleSearch}
                    onFocus={() => setShowArticleDropdown(true)}
                    onChange={e => {
                      setArticleSearch(e.target.value);
                      setShowArticleDropdown(true);
                      if (formData.article_reference) {
                        setFormData({...formData, article_reference: '', article_designation: ''});
                      }
                    }}
                    onBlur={() => setTimeout(() => setShowArticleDropdown(false), 200)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                  {showArticleDropdown && (
                    <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-md mt-1 max-h-60 overflow-y-auto shadow-xl">
                      {filteredSearchArticles.map(article => (
                        <li
                          key={article.id}
                          className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevents blur event from firing before this
                            setArticleSearch(article.reference);
                            setFormData({
                              ...formData,
                              article_reference: article.reference,
                              article_designation: article.designation || ''
                            });
                            setShowArticleDropdown(false);
                          }}
                        >
                          <div className="font-bold text-gray-900 text-sm">{article.reference}</div>
                          <div className="text-xs text-gray-500 truncate">{article.designation}</div>
                        </li>
                      ))}
                      {filteredSearchArticles.length === 0 && (
                        <li className="px-4 py-3 text-sm text-gray-500 text-center">Aucun article trouvé</li>
                      )}
                    </ul>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Désignation Article</label>
                  <input 
                    type="text" 
                    placeholder="ex: Etiquette 050/048" 
                    value={formData.article_designation} 
                    onChange={e => setFormData({...formData, article_designation: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Type de Mandrin</label>
                  <input type="text" placeholder="ex: blanc" value={formData.mandrin_type} onChange={e => setFormData({...formData, mandrin_type: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Type de Carton</label>
                  <input type="text" placeholder="ex: modele n15" value={formData.carton_type} onChange={e => setFormData({...formData, carton_type: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Taille/Épaisseur</label>
                  <input type="text" placeholder="ex: 40Mu" value={formData.epaisseur} onChange={e => setFormData({...formData, epaisseur: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Quantité (Total)</label>
                  <input type="number" min="0" placeholder="ex: 10000" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date de livraison</label>
                  <input type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Statut</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary">
                    <option value="En attente">En attente</option>
                    <option value="En cours">En cours</option>
                    <option value="Terminé">Terminé</option>
                  </select>
                </div>
              </div>
            </form>

            <div className="p-6 border-t border-gray-100 shrink-0 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-700 font-bold hover:bg-gray-200 rounded-lg transition-colors">
                Annuler
              </button>
              <button form="bcForm" type="submit" className="px-5 py-2.5 bg-primary text-white font-bold hover:bg-primary/90 rounded-lg transition-colors shadow-md flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">save</span>
                {editingBcId ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingBcId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm border border-gray-200 shadow-2xl">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <span className="material-symbols-outlined text-3xl">warning</span>
              <h2 className="font-bold text-xl text-gray-900">Confirmer</h2>
            </div>
            <p className="text-gray-600 mb-6 font-medium">
              Voulez-vous vraiment supprimer ce Bon de Commande ?
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeletingBcId(null)} className="px-4 py-2 text-gray-700 font-bold hover:bg-gray-100 rounded-md transition-colors">Annuler</button>
              <button onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 text-white font-bold hover:bg-red-700 rounded-md transition-colors shadow-sm">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
