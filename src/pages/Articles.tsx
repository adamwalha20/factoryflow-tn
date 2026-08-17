import React, { useState, useEffect } from 'react';
import { useMesStore } from '../store/mesStore';
import { useLanguageStore } from '../store/language';
import { BomManagerModal } from '../components/bom/BomManagerModal';

import toast from 'react-hot-toast';

export function Articles() {
  const { articles, loading, error, fetchInitialData, addArticle, updateArticle, deleteArticle } = useMesStore();
  const { t } = useLanguageStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBomArticle, setSelectedBomArticle] = useState<any | null>(null);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    reference: '',
    designation: '',
    category: '',
    width: '',
    length: '',
    weight: ''
  });

  const [deletingArticleId, setDeletingArticleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArticles = articles.filter(article => {
    const q = searchQuery.toLowerCase();
    return (
      (article.reference && article.reference.toLowerCase().includes(q)) ||
      (article.designation && article.designation.toLowerCase().includes(q)) ||
      (article.category && article.category.toLowerCase().includes(q))
    );
  }); // Removed slice(0, 50) so all items are visible


  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  if (loading) {
    return <div className="p-6">{t.loading}</div>;
  }

  if (error) {
    return <div className="p-6 text-error">{error}</div>;
  }

  const handleDeleteConfirm = async () => {
    if (deletingArticleId) {
      try {
        await deleteArticle(deletingArticleId);
        toast.success(t.confirm_delete);
        setDeletingArticleId(null);
      } catch (err: any) {
        toast.error(err.message);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        reference: formData.reference,
        designation: formData.designation,
        category: formData.category,
        width: formData.width ? Number(formData.width) : undefined,
        length: formData.length ? Number(formData.length) : undefined,
        weight: formData.weight ? Number(formData.weight) : undefined
      };

      if (editingArticleId) {
        await updateArticle(editingArticleId, payload);
        toast.success(t.save);
      } else {
        await addArticle(payload);
        toast.success(t.add);
      }
      setIsModalOpen(false);
      setEditingArticleId(null);
      setFormData({ reference: '', designation: '', category: '', width: '', length: '', weight: '' });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleEditClick = (article: any) => {
    setEditingArticleId(article.id);
    setFormData({
      reference: article.reference || '',
      designation: article.designation || '',
      category: article.category || '',
      width: article.width ? article.width.toString() : '',
      length: article.length ? article.length.toString() : '',
      weight: article.weight ? article.weight.toString() : ''
    });
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setEditingArticleId(null);
    setFormData({ reference: '', designation: '', category: '', width: '', length: '', weight: '' });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t.articles}</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">{t.overview}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">search</span>
            <input 
              type="text" 
              placeholder={t.search} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary w-64"
            />
          </div>
          <button onClick={handleAddClick} className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">add</span>
            {t.add}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden card-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 table-header-sticky">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.reference}</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.designation}</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.category}</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.width}</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.length}</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.weight}</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-on-surface-variant">
                    Aucun article trouvé.
                  </td>
                </tr>
              ) : (
                filteredArticles.map((article) => (
                  <tr key={article.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors text-sm group">
                    <td className="p-4 font-semibold text-gray-900">{article.reference}</td>
                    <td className="p-4 font-medium text-gray-600">{article.designation}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-md border border-gray-200">
                        {article.category}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">{article.width ? `${article.width} ${article.unit || 'mm'}` : '-'}</td>
                    <td className="p-4 text-gray-600">{article.length ? `${article.length} m` : '-'}</td>
                    <td className="p-4 text-gray-600">{article.weight ? `${article.weight} kg` : '-'}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setSelectedBomArticle(article)} 
                          title="Nomenclature & Recette (BOM)" 
                          className="p-1.5 text-blue-600 hover:text-blue-800 transition-colors rounded hover:bg-blue-50"
                        >
                          <span className="material-symbols-outlined text-[18px]">account_tree</span>
                        </button>
                        <button onClick={() => handleEditClick(article)} className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors rounded hover:bg-gray-100">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onClick={() => setDeletingArticleId(article.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded hover:bg-red-50">
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

      {/* BOM Manager Modal */}
      {selectedBomArticle && (
        <BomManagerModal
          article={{
            id: selectedBomArticle.id,
            reference: selectedBomArticle.reference || '',
            designation: selectedBomArticle.designation || ''
          }}
          onClose={() => setSelectedBomArticle(null)}
        />
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-200">
            <h2 className="text-xl font-bold mb-4 text-gray-900">{editingArticleId ? "Modifier l'Article" : "Ajouter un Article"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Référence</label>
                <input required type="text" value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} className="input-base" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Désignation</label>
                <input required type="text" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} className="input-base" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Catégorie</label>
                <input required type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="input-base" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Largeur</label>
                  <input type="number" step="0.01" value={formData.width} onChange={e => setFormData({...formData, width: e.target.value})} className="input-base" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Longueur</label>
                  <input type="number" step="0.01" value={formData.length} onChange={e => setFormData({...formData, length: e.target.value})} className="input-base" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Poids (kg)</label>
                <input type="number" step="0.01" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="input-base" />
              </div>
              
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Annuler</button>
                <button type="submit" className="btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deletingArticleId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl border border-gray-200">
            <h2 className="text-xl font-bold mb-2 text-gray-900">Confirmer la suppression</h2>
            <p className="text-gray-600 mb-6 text-sm">
              Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setDeletingArticleId(null)} 
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded transition-colors text-sm"
              >
                Annuler
              </button>
              <button 
                onClick={handleDeleteConfirm} 
                className="px-6 py-2 bg-red-600 text-white font-medium rounded hover:bg-red-700 transition-colors text-sm shadow-sm"
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
