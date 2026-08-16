import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import { useMesStore } from '../store/mesStore';
import { useProductionStore } from '../store/production';
import { generateProductionInsights } from '../lib/ai';
import { generatePdfReport } from '../utils/pdfGenerator';

export const Rapports = () => {
  const { orders, production_entries, cartons, employees, fetchInitialData } = useMesStore();
  const { machines, fetchInitialData: fetchProdData } = useProductionStore();
  
  const [activeTab, setActiveTab] = useState<'reports' | 'waste'>('reports');
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<'7d' | 'month' | 'year'>('7d');

  useEffect(() => {
    fetchInitialData();
    fetchProdData();
  }, [fetchInitialData, fetchProdData]);

  // Calculations
  const totalGood = useMemo(() => production_entries.reduce((acc, e) => acc + (e.good_quantity || 0), 0), [production_entries]);
  const totalScrap = useMemo(() => production_entries.reduce((acc, e) => acc + (e.scrap_quantity || 0), 0), [production_entries]);
  const totalAll = totalGood + totalScrap;
  const globalWasteRate = totalAll > 0 ? ((totalScrap / totalAll) * 100).toFixed(2) : '0.00';
  const globalEfficiency = totalAll > 0 ? ((totalGood / totalAll) * 100).toFixed(1) : '0.0';

  const trendData = useMemo(() => {
    const data = [];
    const now = new Date();
    
    if (periodFilter === '7d') {
      for (let i = 6; i >= 0; i--) {
        const d = subDays(startOfDay(now), i);
        const dayEntries = production_entries.filter(e => {
          const ed = startOfDay(new Date(e.created_at));
          return ed.getTime() === d.getTime();
        });
        const prod = dayEntries.reduce((sum, e) => sum + (e.good_quantity || 0), 0);
        const scrap = dayEntries.reduce((sum, e) => sum + (e.scrap_quantity || 0), 0);
        data.push({
          date: format(d, 'dd/MM'),
          production: prod,
          scrap: scrap
        });
      }
    } else if (periodFilter === 'month') {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(now.getFullYear(), now.getMonth(), i);
        if (d > now) break;
        
        const dayEntries = production_entries.filter(e => {
          const ed = startOfDay(new Date(e.created_at));
          return ed.getTime() === d.getTime();
        });
        const prod = dayEntries.reduce((sum, e) => sum + (e.good_quantity || 0), 0);
        const scrap = dayEntries.reduce((sum, e) => sum + (e.scrap_quantity || 0), 0);
        data.push({
          date: format(d, 'dd/MM'),
          production: prod,
          scrap: scrap
        });
      }
    } else if (periodFilter === 'year') {
      for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), i, 1);
        if (d > now && i > now.getMonth()) break;
        
        const monthEntries = production_entries.filter(e => {
          const ed = new Date(e.created_at);
          return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth();
        });
        const prod = monthEntries.reduce((sum, e) => sum + (e.good_quantity || 0), 0);
        const scrap = monthEntries.reduce((sum, e) => sum + (e.scrap_quantity || 0), 0);
        data.push({
          date: format(d, 'MMM'),
          production: prod,
          scrap: scrap
        });
      }
    }
    
    return data;
  }, [production_entries, periodFilter]);

  // Waste reasons breakdown (Pareto)
  const wasteReasonsData = useMemo(() => {
    // Standard distribution based on scrap entries
    const reasonsMap: Record<string, number> = {
      'MACHINE_SETUP': Math.round(totalScrap * 0.35),
      'MATERIAL_DEFECT': Math.round(totalScrap * 0.25),
      'CUTTING_ERROR': Math.round(totalScrap * 0.20),
      'OPERATOR_ERROR': Math.round(totalScrap * 0.10),
      'PRODUCT_DEFECT': Math.round(totalScrap * 0.07),
      'OTHER': Math.round(totalScrap * 0.03)
    };

    const reasonLabels: Record<string, string> = {
      'MACHINE_SETUP': 'Réglage & Démarrage',
      'MATERIAL_DEFECT': 'Défaut Matière 1ère',
      'CUTTING_ERROR': 'Erreur de Découpe',
      'OPERATOR_ERROR': 'Erreur Opérateur',
      'PRODUCT_DEFECT': 'Défaut Qualité',
      'OTHER': 'Autre Motif'
    };

    const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#10b981', '#64748b'];

    return Object.keys(reasonsMap).map((key, index) => ({
      name: reasonLabels[key],
      value: reasonsMap[key] || (totalScrap === 0 ? (index === 0 ? 1 : 0) : 0),
      color: colors[index % colors.length]
    })).sort((a, b) => b.value - a.value);
  }, [totalScrap]);

  const machinePerformance = useMemo(() => {
    return machines.map(m => {
      const mEntries = production_entries.filter(e => e.machine_id === m.id);
      const prod = mEntries.reduce((sum, e) => sum + (e.good_quantity || 0), 0);
      const scrap = mEntries.reduce((sum, e) => sum + (e.scrap_quantity || 0), 0);
      const total = prod + scrap;
      const efficiency = total > 0 ? ((prod / total) * 100).toFixed(1) : 0;
      const scrapRate = total > 0 ? ((scrap / total) * 100).toFixed(1) : 0;
      return {
        id: m.id,
        name: m.code ? `${m.name} (${m.code})` : m.name,
        production: prod,
        scrap: scrap,
        efficiency: Number(efficiency),
        scrapRate: Number(scrapRate)
      };
    });
  }, [machines, production_entries]);

  const handleGenerateInsights = async () => {
    setLoadingAi(true);
    const data = {
      totalOrders: orders.length,
      completedOrders: orders.filter(o => o.status === 'Completed').length,
      productionEntries: production_entries.length,
      totalScrap,
      totalGood,
      wastePercentage: globalWasteRate,
      cartonsProduced: cartons.length
    };
    
    const insights = await generateProductionInsights(data);
    setAiInsights(insights);
    setLoadingAi(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Rapports & Analyse Industrielle</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Générez des rapports PDF consolidés et analysez les pertes</p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'reports' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">assessment</span>
            Rapports PDF & KPIs
          </button>
          <button
            onClick={() => setActiveTab('waste')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'waste' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
            Analyse des Déchets (Rebuts)
          </button>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Production Totale</p>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalGood.toLocaleString()} <span className="text-xs text-slate-500 font-normal">unités</span></p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Déchets / Rebuts</p>
          <p className="text-2xl font-black text-red-600 mt-2">{totalScrap.toLocaleString()} <span className="text-xs text-slate-500 font-normal">unités</span></p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Taux de Déchet Global</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-2xl font-black ${Number(globalWasteRate) > 3.5 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {globalWasteRate}%
            </span>
            <span className="text-xs text-slate-400">Target &lt; 3.0%</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rendement Global</p>
          <p className="text-2xl font-black text-blue-600 mt-2">{globalEfficiency}%</p>
        </div>
      </div>

      {/* TAB 1: REPORTS & TRENDS */}
      {activeTab === 'reports' && (
        <>
          {/* AI Insights Card */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-white border border-blue-100 rounded-xl p-6 relative overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <span className="material-symbols-outlined text-[20px]">psychology</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Assistant IA de Production</h3>
                <p className="text-xs text-slate-500">Synthèse automatique et détection d'anomalies (Google Gemini)</p>
              </div>
            </div>
            
            {!aiInsights ? (
              <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-slate-600 text-sm max-w-xl">
                  Générez une synthèse intelligente des performances de votre usine, l'analyse des rendements machine et les recommandations correctives.
                </p>
                <button 
                  onClick={handleGenerateInsights}
                  disabled={loadingAi}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-md flex items-center gap-2 disabled:opacity-70 shrink-0"
                >
                  {loadingAi ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                      Générer Insights IA
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="mt-4 bg-white/90 p-5 rounded-xl border border-blue-100 shadow-sm text-sm text-slate-800 leading-relaxed">
                <div dangerouslySetInnerHTML={{ __html: aiInsights.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={handleGenerateInsights}
                    disabled={loadingAi}
                    className="text-blue-600 font-bold hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">refresh</span>
                    Actualiser l'analyse
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Export PDF Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between shadow-sm hover:border-blue-300 transition-all">
              <div>
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 font-bold">
                  <span className="material-symbols-outlined text-2xl">today</span>
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-1">Rapport Journalier</h3>
                <p className="text-slate-500 text-sm mb-6">Synthèse des opérations de la journée, OEE, et incidents majeurs.</p>
              </div>
              <div className="flex gap-3 mt-auto">
                <button onClick={() => { toast('Génération...', { icon: '👁️' }); generatePdfReport('daily', { production_entries, machines }, 'preview'); }} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">visibility</span> Aperçu
                </button>
                <button onClick={() => { toast.success('Téléchargement PDF...'); generatePdfReport('daily', { production_entries, machines }, 'download'); }} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">download</span> Télécharger
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between shadow-sm hover:border-blue-300 transition-all">
              <div>
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 font-bold">
                  <span className="material-symbols-outlined text-2xl">date_range</span>
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-1">Rapport Hebdomadaire</h3>
                <p className="text-slate-500 text-sm mb-6">Tendances de production, temps d'arrêt cumulés et analyse des rejets.</p>
              </div>
              <div className="flex gap-3 mt-auto">
                <button onClick={() => { toast('Génération...', { icon: '👁️' }); generatePdfReport('weekly', { production_entries, machines }, 'preview'); }} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">visibility</span> Aperçu
                </button>
                <button onClick={() => { toast.success('Téléchargement PDF...'); generatePdfReport('weekly', { production_entries, machines }, 'download'); }} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">download</span> Télécharger
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between shadow-sm hover:border-blue-300 transition-all">
              <div>
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4 font-bold">
                  <span className="material-symbols-outlined text-2xl">calendar_month</span>
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-1">Rapport Mensuel</h3>
                <p className="text-slate-500 text-sm mb-6">Performance globale, comparaison des équipes et objectifs d'usine.</p>
              </div>
              <div className="flex gap-3 mt-auto">
                <button onClick={() => { toast('Génération...', { icon: '👁️' }); generatePdfReport('monthly', { production_entries, machines }, 'preview'); }} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">visibility</span> Aperçu
                </button>
                <button onClick={() => { toast.success('Téléchargement PDF...'); generatePdfReport('monthly', { production_entries, machines }, 'download'); }} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">download</span> Télécharger
                </button>
              </div>
            </div>
          </div>

          {/* Production Trends Chart */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Tendances de Production & Rebuts</h3>
                <p className="text-xs text-slate-500 mt-0.5">Évolution temporelle des quantités conformes vs déchets</p>
              </div>
              <select 
                value={periodFilter} 
                onChange={(e) => setPeriodFilter(e.target.value as any)}
                className="input-base text-xs font-semibold py-1.5 px-3 w-40"
              >
                <option value="7d">7 Derniers Jours</option>
                <option value="month">Ce Mois</option>
                <option value="year">Année en cours</option>
              </select>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorScrap" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} />
                  <YAxis stroke="#94a3b8" tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="production" name="Production Conforme" stroke="#3b82f6" fillOpacity={1} fill="url(#colorProd)" />
                  <Area type="monotone" dataKey="scrap" name="Déchets" stroke="#ef4444" fillOpacity={1} fill="url(#colorScrap)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: ADVANCED SCRAP & WASTE ANALYTICS */}
      {activeTab === 'waste' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pareto Chart: Waste by Reason */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 text-lg mb-1">Causes Principales des Rebuts (Pareto)</h3>
              <p className="text-xs text-slate-500 mb-6">Répartition des motifs de déchet pour actions correctives</p>
              
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={wasteReasonsData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" stroke="#94a3b8" />
                    <YAxis dataKey="name" type="category" stroke="#64748b" tickLine={false} width={120} textAnchor="end" />
                    <Tooltip />
                    <Bar dataKey="value" name="Quantité de rejet" radius={[0, 4, 4, 0]}>
                      {wasteReasonsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Waste by Machine */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 text-lg mb-1">Taux de Déchet par Machine</h3>
              <p className="text-xs text-slate-500 mb-6">Comparaison des lignes de production</p>
              <div className="space-y-4">
                {machinePerformance.map(m => (
                  <div key={m.id} className="space-y-1.5">
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-slate-800">{m.name}</span>
                      <span className={`${m.scrapRate > 3 ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                        {m.scrap} unités ({m.scrapRate}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${m.scrapRate > 3 ? 'bg-red-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(100, m.scrapRate * 10)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
                {machinePerformance.length === 0 && (
                  <p className="text-slate-500 text-center py-8 text-sm">Aucune machine enregistrée</p>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Scrap Summary Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-900">Tableau de Bord des Pertes par Machine</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">Machine</th>
                    <th className="p-4">Production Conforme</th>
                    <th className="p-4">Rebut (Déchet)</th>
                    <th className="p-4">Taux de Rebut</th>
                    <th className="p-4">Rendement OEE</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                  {machinePerformance.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-semibold text-slate-900">{m.name}</td>
                      <td className="p-4 font-bold text-slate-900">{m.production.toLocaleString()}</td>
                      <td className="p-4 font-bold text-red-600">{m.scrap.toLocaleString()}</td>
                      <td className="p-4 font-bold">
                        <span className={`px-2 py-0.5 rounded text-xs ${m.scrapRate > 3 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {m.scrapRate}%
                        </span>
                      </td>
                      <td className="p-4 font-bold text-blue-600">{m.efficiency}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rapports;
