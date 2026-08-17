import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useMaintenanceStore } from '../store/maintenance';
import { useProductionStore } from '../store/production';
import { useStopsStore } from '../store/stops';
import { useLanguageStore } from '../store/language';

export const Maintenance = () => {
  const { records, loading, fetchRecords, addRecord } = useMaintenanceStore();
  const { machines, fetchInitialData } = useProductionStore();
  const { stops, fetchStops } = useStopsStore();
  const { t } = useLanguageStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    machine_id: '',
    task: '',
    scheduled_for: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchRecords();
    fetchInitialData();
    fetchStops();
  }, [fetchRecords, fetchInitialData, fetchStops]);

  // Predictive health scoring
  const machineHealthScores = useMemo(() => {
    return machines.map(m => {
      const machineStops = stops.filter(s => s.machine_id === m.id);
      let score = 95;
      if (m.status !== 'Active') score -= 25;
      score -= Math.min(30, machineStops.length * 5);
      score = Math.max(35, Math.min(99, score));

      let riskLevel: 'Normal' | 'Attention' | 'Critique' = 'Normal';
      let riskNotice = 'Composants stables';
      if (score < 70) {
        riskLevel = 'Critique';
        riskNotice = 'Micro-arrêts répétés : vérifier courroies et couteaux';
      } else if (score < 85) {
        riskLevel = 'Attention';
        riskNotice = 'Graissage et alignement recommandés';
      }

      return {
        id: m.id,
        name: m.name,
        code: m.code,
        score,
        riskLevel,
        riskNotice,
        stopCount: machineStops.length,
        status: m.status
      };
    });
  }, [machines, stops]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.machine_id) {
      toast.error('Veuillez sélectionner une machine');
      return;
    }
    try {
      await addRecord({
        machine_id: formData.machine_id,
        task: formData.task,
        scheduled_for: formData.scheduled_for,
        status: 'Ouverte'
      });
      toast.success('Intervention ajoutée avec succès');
      setIsModalOpen(false);
      setFormData({
        machine_id: '',
        task: '',
        scheduled_for: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      toast.error('Erreur lors de l\'ajout de l\'intervention');
    }
  };

  const openRecords = records.filter(r => r.status === 'Ouverte').length;
  const completedRecords = records.filter(r => r.status === 'Terminée').length;
  const machinesInMaintenance = new Set(records.filter(r => r.status === 'Ouverte').map(r => r.machine_id)).size;

  return (
    <div className="max-w-[1440px] mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t.maintenance}</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">{t.overview}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          {t.add}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t.in_progress}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600">{openRecords}</span>
            <span className="text-xs text-slate-400 font-medium">{t.in_progress}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t.completed}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600">{completedRecords}</span>
            <span className="text-xs text-slate-400 font-medium">{t.month}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t.machines}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-600">{machinesInMaintenance}</span>
            <span className="text-xs text-slate-400 font-medium">/ {machines.length}</span>
          </div>
        </div>
      </div>

      {/* Predictive Health Monitor */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-600">troubleshoot</span>
              Surveillance Prédictive d'Usure
            </h3>
            <p className="text-xs text-slate-500">Anticipez les pannes critiques avant l'arrêt complet de la chaîne</p>
          </div>
          <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg border border-indigo-200">
            Algorithme MTBF
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {machineHealthScores.map(m => (
            <div key={m.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-slate-900 text-sm">{m.name}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    m.riskLevel === 'Critique' ? 'bg-red-100 text-red-800' :
                    m.riskLevel === 'Attention' ? 'bg-amber-100 text-amber-800' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {m.score}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
                  <div 
                    className={`h-full rounded-full ${
                      m.score < 70 ? 'bg-red-500' : m.score < 85 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${m.score}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-tight mb-2">
                  {m.riskNotice}
                </p>
              </div>
              <button 
                onClick={() => {
                  setFormData({
                    machine_id: m.id,
                    task: `Maintenance préventive : ${m.riskNotice}`,
                    scheduled_for: new Date().toISOString().split('T')[0]
                  });
                  setIsModalOpen(true);
                }}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 text-left pt-2 border-t border-slate-200"
              >
                + Planifier Révision
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Maintenance Tasks Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-900 text-sm">Registre des Interventions Planifiées</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="p-4">Machine</th>
                <th className="p-4">Tâche</th>
                <th className="p-4">Date Prévue</th>
                <th className="p-4">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr><td colSpan={4} className="p-6 text-center text-slate-400">Chargement...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={4} className="p-6 text-center text-slate-400">Aucune intervention enregistrée</td></tr>
              ) : records.map(record => (
                <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-semibold text-slate-900">{record.machines?.name || 'Machine'}</td>
                  <td className="p-4 text-slate-700">{record.task}</td>
                  <td className="p-4 text-xs text-slate-500">{new Date(record.scheduled_for).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      record.status === 'Terminée' ? 'bg-emerald-100 text-emerald-800' :
                      record.status === 'En cours' ? 'bg-blue-100 text-blue-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md border border-slate-200 shadow-xl">
            <h2 className="font-bold text-xl mb-4 text-slate-900">Nouvelle Tâche de Maintenance</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Machine</label>
                <select 
                  required 
                  value={formData.machine_id} 
                  onChange={e => setFormData({...formData, machine_id: e.target.value})} 
                  className="input-base"
                >
                  <option value="">Sélectionner une machine</option>
                  {machines.map(m => (
                    <option key={m.id} value={m.id}>{m.name} {m.code ? `(${m.code})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description de la tâche</label>
                <input 
                  required 
                  type="text" 
                  value={formData.task} 
                  onChange={e => setFormData({...formData, task: e.target.value})} 
                  className="input-base" 
                  placeholder="Ex: Remplacement des lames de coupe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date prévue</label>
                <input 
                  required 
                  type="date" 
                  value={formData.scheduled_for} 
                  onChange={e => setFormData({...formData, scheduled_for: e.target.value})} 
                  className="input-base" 
                />
              </div>
              
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-200 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors">Annuler</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Maintenance;
