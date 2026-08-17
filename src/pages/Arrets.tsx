import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useStopsStore } from '../store/stops';
import { useProductionStore } from '../store/production';
import { useLanguageStore } from '../store/language';

const MOTIFS = [
  { id: 'panne', label: 'Panne mécanique', icon: 'build' },
  { id: 'matiere', label: 'Manque matière', icon: 'inventory_2' },
  { id: 'elec', label: 'Coupure électrique', icon: 'bolt' },
  { id: 'maint', label: 'Maintenance', icon: 'engineering' },
  { id: 'reglage', label: 'Réglage machine', icon: 'tune' },
  { id: 'autre', label: 'Autre', icon: 'more_horiz' },
];

const Arrets = () => {
  const { stops, fetchStops, declareStop, resolveStop, loading } = useStopsStore();
  const { machines, fetchInitialData } = useProductionStore();
  const { t } = useLanguageStore();

  const [machineId, setMachineId] = useState('');
  const [motif, setMotif] = useState('');

  useEffect(() => {
    fetchStops();
    fetchInitialData();
  }, [fetchStops, fetchInitialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineId || !motif) {
      toast.error('Veuillez sélectionner une machine et un motif');
      return;
    }

    try {
      await declareStop({
        machine_id: machineId,
        reason: motif
      });
      toast.success('Arrêt enregistré avec succès !');
      setMachineId('');
      setMotif('');
    } catch (err) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const getMachineName = (id: string | null) => { const m = machines.find(m => m.id === id); return m ? (m.code ? `${m.name} (${m.code})` : m.name) : 'Inconnu'; };

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return 'En cours';
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      
<div className="max-w-7xl mx-auto space-y-card-gap">

<div className="flex flex-col gap-2">
<h2 className="font-headline-lg text-headline-lg text-on-surface">{t.machine_stops}</h2>
<p className="text-on-surface-variant">{t.overview}</p>
</div>

<div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm">
<form className="space-y-8" onSubmit={handleSubmit}>

<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<div>
<label className="block font-label-md text-label-md text-on-surface mb-2">{t.machine}</label>
<select value={machineId} onChange={e => setMachineId(e.target.value)} className="w-full bg-surface border-1.5 border-outline-variant rounded-lg px-4 py-3 focus:ring-primary focus:border-primary text-on-surface min-h-[48px]">
<option value="">{t.machine}</option>
{machines.map(m => (
  <option key={m.id} value={m.id}>{m.name} {m.code ? `(${m.code})` : ''}</option>
))}
</select>
</div>
</div>

<div>
<label className="block font-label-md text-label-md text-on-surface mb-4">{t.defect_reason}</label>
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
{MOTIFS.map(m => (
  <label key={m.id} className="motif-card cursor-pointer relative">
  <input checked={motif === m.label} onChange={() => setMotif(m.label)} className="sr-only peer" name="motif" type="radio"/>
  <div className="border-2 border-outline-variant rounded-xl p-4 flex flex-col items-center gap-3 hover:bg-surface-container-highest transition-colors text-center h-full peer-checked:bg-primary-container peer-checked:border-primary peer-checked:text-on-primary-container">
  <div className={`icon-container w-12 h-12 rounded-full flex items-center justify-center transition-colors ${motif === m.label ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface-variant'}`}>
  <span className="material-symbols-outlined">{m.icon}</span>
  </div>
  <span className="font-label-md text-label-md">{m.label}</span>
  </div>
  </label>
))}
</div>
</div>

<div className="flex justify-end pt-4 border-t border-outline-variant">
<button className="bg-primary text-on-primary font-label-md text-label-md font-bold rounded-lg px-8 py-4 h-14 hover:bg-primary/90 transition-colors flex items-center gap-2" type="submit">
<span className="material-symbols-outlined">save</span>
  {t.save}
</button>
</div>
</form>
</div>

<div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm">
<div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
<h3 className="font-headline-md text-headline-md text-on-surface">Historique Récent</h3>
<button onClick={() => toast('Affichage de l\'historique complet...')} className="text-primary font-label-md text-label-md hover:underline min-h-[48px] px-2">Voir tout</button>
</div>
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead>
<tr className="bg-surface text-on-surface-variant border-b border-outline-variant font-label-md text-label-md">
<th className="p-4 font-semibold">Machine</th>
<th className="p-4 font-semibold">Début</th>
<th className="p-4 font-semibold">Fin</th>
<th className="p-4 font-semibold">Durée</th>
<th className="p-4 font-semibold">Motif</th>
<th className="p-4 font-semibold">Statut</th>
<th className="p-4 font-semibold text-right">Actions</th>
</tr>
</thead>
<tbody className="divide-y divide-outline-variant">
{loading ? (
  <tr><td colSpan={7} className="p-4 text-center">Chargement...</td></tr>
) : stops.length === 0 ? (
  <tr><td colSpan={7} className="p-4 text-center">Aucun arrêt trouvé</td></tr>
) : (
  stops.map(stop => (
<tr key={stop.id} className="hover:bg-surface-container-highest transition-colors">
<td className="p-4 font-medium text-on-surface">{getMachineName(stop.machine_id)}</td>
<td className="p-4 text-on-surface-variant">{formatTime(stop.start_time)}</td>
<td className="p-4 text-on-surface-variant">{formatTime(stop.end_time)}</td>
<td className="p-4 text-on-surface-variant">{formatDuration(stop.start_time || '', stop.end_time)}</td>
<td className={`p-4 font-medium ${!stop.end_time ? 'text-error' : 'text-on-surface-variant'}`}>{stop.reason}</td>
<td className="p-4">
{!stop.end_time ? (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-error-container text-on-error-container">
  <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
    En cours
  </span>
) : (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-surface-variant text-on-surface-variant">
  <span className="w-2 h-2 rounded-full bg-outline"></span>
    Résolu
  </span>
)}
</td>
<td className="p-4 text-right">
{!stop.end_time && (
  <button onClick={() => resolveStop(stop.id)} className="bg-secondary text-on-secondary font-label-md text-label-md rounded-lg px-4 py-2 hover:bg-secondary/90 transition-colors">
    Résoudre
  </button>
)}
</td>
</tr>
  ))
)}
</tbody>
</table>
</div>
</div>
</div>

    </>
  );
};

export default Arrets;
