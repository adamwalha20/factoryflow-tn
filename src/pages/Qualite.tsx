import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useQualityStore } from '../store/quality';
import { useProductionStore } from '../store/production';
import { useLanguageStore } from '../store/language';

const Qualite = () => {
  const { inspections, fetchInspections, addInspection, loading } = useQualityStore();
  const { articles, machines, fetchInitialData } = useProductionStore();
  const { t } = useLanguageStore();

  const [productId, setProductId] = useState('');
  const [machineId, setMachineId] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [result, setResult] = useState('conforme');
  const [defectDesc, setDefectDesc] = useState('');
  
  const [selectedInspection, setSelectedInspection] = useState<any>(null);

  useEffect(() => {
    fetchInspections();
    fetchInitialData();
  }, [fetchInspections, fetchInitialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !machineId || !lotNumber) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await addInspection({
        article_id: productId,
        machine_id: machineId,
        lot_number: lotNumber,
        result,
        defect_description: result === 'non-conforme' ? defectDesc : null
      });
      toast.success('Inspection enregistrée avec succès !');
      setProductId('');
      setMachineId('');
      setLotNumber('');
      setResult('conforme');
      setDefectDesc('');
    } catch (err) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const getArticleName = (id: string | null) => articles.find(a => a.id === id)?.designation || 'Inconnu';
  const getMachineName = (id: string | null) => { const m = machines.find(m => m.id === id); return m ? (m.code ? `${m.name} (${m.code})` : m.name) : 'Inconnu'; };

  const rejectedCount = inspections.filter(i => i.result === 'non-conforme').length;
  const totalCount = inspections.length;
  const conformCount = totalCount - rejectedCount;
  const complianceRate = totalCount > 0 ? ((conformCount / totalCount) * 100).toFixed(1) : '100.0';

  return (
    <>
      
<div className="flex-1 mt-16 p-container-padding overflow-y-auto w-full max-w-[1440px] mx-auto">
<div className="mb-8">
<h2 className="font-headline-lg text-headline-lg text-on-background">{t.quality_control}</h2>
<p className="font-body-lg text-body-lg text-on-surface-variant mt-2">{t.overview}</p>
</div>

<div className="grid grid-cols-1 md:grid-cols-3 gap-card-gap mb-8">
<div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 hover-elevate transition-all">
<div className="flex items-center justify-between mb-4">
<h3 className="font-label-md text-label-md text-on-surface-variant">{t.conforme}</h3>
<div className="w-10 h-10 rounded-full bg-secondary-container/30 flex items-center justify-center text-secondary">
<span className="material-symbols-outlined" data-icon="check_circle">check_circle</span>
</div>
</div>
<div className="font-stat-display text-stat-display text-on-background">{conformCount}</div>
<div className="flex items-center gap-1 mt-2 text-secondary font-label-md text-label-md">
<span className="material-symbols-outlined text-[16px]" data-icon="trending_up">trending_up</span>
<span>{t.dash_today_prod}</span>
</div>
</div>
<div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 hover-elevate transition-all">
<div className="flex items-center justify-between mb-4">
<h3 className="font-label-md text-label-md text-on-surface-variant">{t.non_conforme}</h3>
<div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center text-error">
<span className="material-symbols-outlined" data-icon="cancel">cancel</span>
</div>
</div>
<div className="font-stat-display text-stat-display text-on-background">{rejectedCount}</div>
<div className="flex items-center gap-1 mt-2 text-error font-label-md text-label-md">
<span className="material-symbols-outlined text-[16px]" data-icon="trending_down">trending_down</span>
<span>{t.dash_today_prod}</span>
</div>
</div>
<div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 hover-elevate transition-all">
<div className="flex items-center justify-between mb-4">
<h3 className="font-label-md text-label-md text-on-surface-variant">{t.efficiency}</h3>
<div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
<span className="material-symbols-outlined" data-icon="percent">percent</span>
</div>
</div>
<div className="font-stat-display text-stat-display text-on-background">{complianceRate}%</div>

<div className="mt-4 w-full bg-surface-container-high rounded-full h-2">
<div className="bg-secondary h-2 rounded-full" style={{width: `${complianceRate}%`}}></div>
</div>
<div className="mt-2 text-right font-label-md text-label-md text-on-surface-variant">{t.target}: 99.0%</div>
</div>
</div>
<div className="grid grid-cols-1 lg:grid-cols-12 gap-card-gap">

<div className="lg:col-span-4 flex flex-col gap-card-gap">
<div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
<h3 className="font-headline-md text-headline-md text-on-background border-b border-outline-variant pb-4 mb-6">Nouvelle Inspection</h3>
<form className="space-y-6" onSubmit={handleSubmit}>
<div>
<label className="block font-label-md text-label-md text-on-surface-variant mb-2">Article</label>
<select value={productId} onChange={e => setProductId(e.target.value)} className="w-full h-[56px] bg-surface rounded-md border-1.5 border-outline-variant px-4 font-body-md text-body-md text-on-background focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors">
<option value="">Sélectionner un article</option>
{articles.map(a => (
  <option key={a.id} value={a.id}>{a.designation}</option>
))}
</select>
</div>
<div>
<label className="block font-label-md text-label-md text-on-surface-variant mb-2">Machine</label>
<select value={machineId} onChange={e => setMachineId(e.target.value)} className="w-full h-[56px] bg-surface rounded-md border-1.5 border-outline-variant px-4 font-body-md text-body-md text-on-background focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors">
<option value="">Sélectionner une machine</option>
{machines.map(m => (
  <option key={m.id} value={m.id}>{m.name} {m.code ? `(${m.code})` : ''}</option>
))}
</select>
</div>
<div>
<label className="block font-label-md text-label-md text-on-surface-variant mb-2">Numéro Lot</label>
<input value={lotNumber} onChange={e => setLotNumber(e.target.value)} className="w-full h-[56px] bg-surface rounded-md border-1.5 border-outline-variant px-4 font-body-md text-body-md text-on-background focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" placeholder="Ex: LOT-2023-10-A" type="text"/>
</div>
<div className="border-t border-outline-variant pt-6">
<label className="block font-label-md text-label-md text-on-surface-variant mb-4">Résultat d'inspection</label>
<div className="grid grid-cols-2 gap-4">
<label className="cursor-pointer relative">
<input checked={result === 'conforme'} onChange={() => setResult('conforme')} className="peer sr-only" name="resultat" type="radio" value="conforme"/>
<div className="h-[56px] rounded-md border-1.5 border-outline-variant flex items-center justify-center gap-2 font-label-md text-label-md text-on-surface-variant peer-checked:bg-secondary-container peer-checked:border-secondary peer-checked:text-on-secondary-container transition-colors">
<span className="material-symbols-outlined" data-icon="check_circle">check_circle</span>
                                            Conforme
                                        </div>
</label>
<label className="cursor-pointer relative">
<input checked={result === 'non-conforme'} onChange={() => setResult('non-conforme')} className="peer sr-only" name="resultat" type="radio" value="non-conforme"/>
<div className="h-[56px] rounded-md border-1.5 border-outline-variant flex items-center justify-center gap-2 font-label-md text-label-md text-on-surface-variant peer-checked:bg-error-container peer-checked:border-error peer-checked:text-on-error-container transition-colors">
<span className="material-symbols-outlined" data-icon="cancel">cancel</span>
                                            Non Conforme
                                        </div>
</label>
</div>
</div>
{result === 'non-conforme' && (
<div className="bg-surface-container-low p-4 rounded-md border border-outline-variant mt-4" id="defect-area">
<label className="block font-label-md text-label-md text-on-surface-variant mb-2">Description du défaut</label>
<textarea value={defectDesc} onChange={e => setDefectDesc(e.target.value)} className="w-full bg-surface rounded-md border-1.5 border-outline-variant p-4 font-body-md text-body-md text-on-background focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors resize-none" placeholder="Détaillez le problème rencontré..." rows={3}></textarea>
</div>
)}
<button type="submit" className="w-full h-[56px] bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-surface-tint transition-colors flex items-center justify-center gap-2 mt-8">
<span className="material-symbols-outlined" data-icon="save">save</span>
                                Enregistrer l'inspection
                            </button>
</form>
</div>
</div>

<div className="lg:col-span-8 flex flex-col">
<div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-0 overflow-hidden flex-1 flex flex-col">
<div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
<h3 className="font-headline-md text-headline-md text-on-background">Historique des Inspections</h3>
<button onClick={() => toast('Ouverture des filtres...')} className="h-[48px] px-4 border border-outline-variant rounded-md text-on-surface-variant font-label-md text-label-md flex items-center gap-2 hover:bg-surface-container-high transition-colors">
<span className="material-symbols-outlined text-[20px]" data-icon="filter_list">filter_list</span>
                                Filtrer
                            </button>
</div>
<div className="overflow-x-auto flex-1">
<table className="w-full text-left border-collapse">
<thead className="bg-surface-container-low border-b border-outline-variant">
<tr>
<th className="p-4 font-label-md text-label-md text-on-surface-variant font-semibold">{t.date}</th>
<th className="p-4 font-label-md text-label-md text-on-surface-variant font-semibold">{t.lot_no}</th>
<th className="p-4 font-label-md text-label-md text-on-surface-variant font-semibold">{t.articles}</th>
<th className="p-4 font-label-md text-label-md text-on-surface-variant font-semibold">{t.machine}</th>
<th className="p-4 font-label-md text-label-md text-on-surface-variant font-semibold">{t.status}</th>
<th className="p-4 font-label-md text-label-md text-on-surface-variant font-semibold text-right">{t.actions}</th>
</tr>
</thead>
<tbody className="font-body-md text-body-md divide-y divide-outline-variant">
{loading ? (
  <tr><td colSpan={6} className="p-4 text-center">Chargement...</td></tr>
) : inspections.length === 0 ? (
  <tr><td colSpan={6} className="p-4 text-center">Aucune inspection trouvée</td></tr>
) : (
  inspections.map(insp => (
<tr key={insp.id} className="hover:bg-surface-container-lowest transition-colors group">
<td className="p-4 text-on-surface-variant">{new Date(insp.created_at || '').toLocaleString('fr-FR')}</td>
<td className="p-4 text-on-background font-medium">{insp.lot_number}</td>
<td className="p-4 text-on-background">{getArticleName(insp.article_id)}</td>
<td className="p-4 text-on-surface-variant">{getMachineName(insp.machine_id)}</td>
<td className="p-4">
{insp.result === 'conforme' ? (
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-container/30 text-secondary">
    Conforme
  </span>
) : (
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error-container text-on-error-container">
    Défaut: {insp.defect_description}
  </span>
)}
</td>
<td className="p-4 text-right">
<button onClick={() => setSelectedInspection(insp)} className="text-primary hover:text-surface-tint p-2 rounded-full hover:bg-surface-container-high transition-colors">
<span className="material-symbols-outlined" data-icon="visibility">visibility</span>
</button>
</td>
</tr>
  ))
)}
</tbody>
</table>
</div>
<div className="p-4 border-t border-outline-variant bg-surface-container-lowest flex justify-center">
<button onClick={() => toast('Affichage de l\'historique complet...')} className="font-label-md text-label-md text-primary hover:underline flex items-center gap-1 min-h-[48px]">
                                Voir tout l'historique <span className="material-symbols-outlined text-[18px]" data-icon="arrow_forward">arrow_forward</span>
</button>
</div>
</div>
</div>
</div>
</div>

      {selectedInspection && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Détails de l'inspection</h3>
              <button onClick={() => setSelectedInspection(null)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                <span className="text-gray-500 font-medium text-sm">Lot / Carton No</span>
                <span className="font-bold text-gray-900">{selectedInspection.lot_number}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                <span className="text-gray-500 font-medium text-sm">Date</span>
                <span className="font-semibold text-gray-700">{new Date(selectedInspection.created_at || '').toLocaleString('fr-FR')}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                <span className="text-gray-500 font-medium text-sm">Article</span>
                <span className="font-semibold text-gray-700 max-w-[200px] text-right truncate" title={getArticleName(selectedInspection.article_id)}>{getArticleName(selectedInspection.article_id)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                <span className="text-gray-500 font-medium text-sm">Machine</span>
                <span className="font-semibold text-gray-700">{getMachineName(selectedInspection.machine_id)}</span>
              </div>
              <div className="flex justify-between items-start pt-2">
                <span className="text-gray-500 font-medium text-sm">Résultat</span>
                <div className="flex flex-col items-end">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-bold ${selectedInspection.result === 'conforme' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {selectedInspection.result === 'conforme' ? 'Conforme' : 'Rejeté'}
                  </span>
                  
                  {selectedInspection.validated_quantity !== null && selectedInspection.validated_quantity !== undefined && (
                    <span className="block mt-1 text-xs font-medium text-gray-500">
                      Quantité validée: <strong className="text-gray-700">{selectedInspection.validated_quantity}</strong>
                    </span>
                  )}
                  {selectedInspection.result === 'non-conforme' && (
                    <div className="mt-3 text-right">
                      <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">Raison du défaut</span>
                      <span className="text-sm font-medium text-red-600 bg-red-50 px-3 py-2 rounded-md inline-block max-w-[250px] break-words">
                        {selectedInspection.defect_description || 'Non précisée'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedInspection(null)}
                className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default Qualite;
