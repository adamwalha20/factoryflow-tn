import React, { useState, useEffect } from 'react';
import { useBomStore, BomItem } from '../../store/bomStore';
import { useRawMaterialsStore } from '../../store/rawMaterials';
import toast from 'react-hot-toast';

interface BomManagerModalProps {
  article: {
    id: string;
    reference: string;
    designation: string;
  };
  onClose: () => void;
}

export function BomManagerModal({ article, onClose }: BomManagerModalProps) {
  const { bomItems, saveBomItems, fetchBomForArticle } = useBomStore();
  const { materials, fetchMaterials } = useRawMaterialsStore();

  const [items, setItems] = useState<Omit<BomItem, 'id'>[]>([]);
  const [selectedRawMaterialId, setSelectedRawMaterialId] = useState('');
  const [quantityRatio, setQuantityRatio] = useState(0.01);
  const [wasteFactor, setWasteFactor] = useState(2.0);
  const [simulationQty, setSimulationQty] = useState(1000);

  useEffect(() => {
    fetchMaterials();
    fetchBomForArticle(article.id).then(current => {
      setItems(current.map(({ id, ...rest }) => rest));
    });
  }, [article.id, fetchMaterials, fetchBomForArticle]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRawMaterialId) {
      toast.error('Veuillez sélectionner une matière première');
      return;
    }

    const rm = materials.find(m => m.id === selectedRawMaterialId);
    const newItem: Omit<BomItem, 'id'> = {
      article_id: article.id,
      raw_material_id: selectedRawMaterialId,
      quantity_per_unit: Number(quantityRatio),
      waste_factor_percent: Number(wasteFactor),
      raw_materials: rm ? {
        id: rm.id,
        reference: rm.reference,
        designation: rm.designation,
        category: rm.category,
        unit: rm.unit
      } : undefined
    };

    setItems([...items, newItem]);
    setSelectedRawMaterialId('');
    toast.success('Composant ajouté à la nomenclature');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    await saveBomItems(article.id, items);
    toast.success('Nomenclature (BOM) enregistrée avec succès !');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-2xl">account_tree</span>
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-900">Nomenclature & Formule (BOM)</h2>
              <p className="text-xs text-slate-500 font-medium">
                {article.reference} — <span className="text-slate-700">{article.designation}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {/* Add Component Form */}
          <form onSubmit={handleAddItem} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Ajouter un ingrédient / composant</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Matière Première</label>
                <select
                  value={selectedRawMaterialId}
                  onChange={e => setSelectedRawMaterialId(e.target.value)}
                  className="input-base text-xs"
                >
                  <option value="">Sélectionner une matière...</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.reference} — {m.designation} ({m.category} / {m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ratio / Unité Finie</label>
                <input
                  type="number"
                  step="0.0001"
                  value={quantityRatio}
                  onChange={e => setQuantityRatio(parseFloat(e.target.value) || 0)}
                  className="input-base text-xs font-mono font-bold"
                  placeholder="Ex: 0.027"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Perte Technique (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={wasteFactor}
                  onChange={e => setWasteFactor(parseFloat(e.target.value) || 0)}
                  className="input-base text-xs font-mono font-bold text-amber-700"
                  placeholder="Ex: 2.5%"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Ajouter au BOM
                </button>
              </div>
            </div>
          </form>

          {/* Current Components Table */}
          <div>
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-2">Composants de la recette ({items.length})</h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-600">
                    <th className="p-3">Matière Première</th>
                    <th className="p-3">Catégorie</th>
                    <th className="p-3">Quantité Théorique</th>
                    <th className="p-3">Perte Prévue</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">
                        {item.raw_materials?.reference || 'Matière'}
                        <div className="text-[10px] text-slate-500 font-normal">{item.raw_materials?.designation}</div>
                      </td>
                      <td className="p-3 text-slate-600">{item.raw_materials?.category || '-'}</td>
                      <td className="p-3 font-mono font-semibold text-slate-800">
                        {item.quantity_per_unit} <span className="text-[10px] text-slate-500">{item.raw_materials?.unit}</span> / unité
                      </td>
                      <td className="p-3 font-bold text-amber-700">+{item.waste_factor_percent}%</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded-md transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
                        Aucun composant configuré. Ajoutez vos bobines mères, mandrins et cartons.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Theoretical Consumption Simulator */}
          {items.length > 0 && (
            <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-blue-600 text-[18px]">calculate</span>
                  Simulateur de Besoins Matières
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-blue-700">Pour un ordre de :</span>
                  <input
                    type="number"
                    value={simulationQty}
                    onChange={e => setSimulationQty(parseInt(e.target.value) || 0)}
                    className="w-24 px-2 py-1 bg-white border border-blue-200 rounded-lg text-xs font-bold text-blue-900 outline-none"
                  />
                  <span className="text-xs text-blue-700">unités</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {items.map((item, idx) => {
                  const factor = 1 + ((item.waste_factor_percent || 0) / 100);
                  const totalReq = Math.round(simulationQty * item.quantity_per_unit * factor * 100) / 100;
                  return (
                    <div key={idx} className="p-2.5 bg-white rounded-lg border border-blue-100 flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-800">{item.raw_materials?.reference}</span>
                      <span className="font-mono font-bold text-blue-700">{totalReq} {item.raw_materials?.unit}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-700 text-xs font-semibold hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
          >
            Valider la Nomenclature
          </button>
        </div>
      </div>
    </div>
  );
}
