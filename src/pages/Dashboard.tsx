import { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMesStore } from '../store/mesStore';
import { useProductionStore } from '../store/production';
import { useStopsStore } from '../store/stops';
import { useLanguageStore } from '../store/language';
import { generateDailyExecutiveDigest } from '../lib/ai';
import { format, startOfToday, startOfMonth } from 'date-fns';

function renderMarkdownHtml(md: string): string {
  if (!md) return '';
  return md
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('### ')) {
        return `<h3 class="font-bold text-base text-blue-900 mt-4 mb-1.5 flex items-center gap-1.5">${trimmed.replace('### ', '')}</h3>`;
      }
      if (trimmed.startsWith('## ')) {
        return `<h2 class="font-extrabold text-lg text-slate-900 mt-5 mb-2">${trimmed.replace('## ', '')}</h2>`;
      }
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        const itemContent = trimmed.substring(2)
          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>');
        return `<li class="ml-4 list-disc text-slate-700 my-1">${itemContent}</li>`;
      }
      if (/^[0-9]+\.\s/.test(trimmed)) {
        const itemContent = trimmed.replace(/^[0-9]+\.\s/, '')
          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>');
        return `<li class="ml-4 list-decimal text-slate-700 my-1">${itemContent}</li>`;
      }
      if (!trimmed) {
        return '<div class="h-2"></div>';
      }
      const pContent = trimmed
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
      return `<p class="my-1 text-slate-700">${pContent}</p>`;
    })
    .join('');
}

export function Dashboard() {
  const { orders, production_entries, fetchInitialData, setupRealtime } = useMesStore();
  const { machines, fetchInitialData: fetchProdData, operators } = useProductionStore();
  const { stops, fetchStops } = useStopsStore();
  const { t } = useLanguageStore();

  const [dailyDigest, setDailyDigest] = useState<string | null>(null);
  const [loadingDigest, setLoadingDigest] = useState(false);

  useEffect(() => {
    fetchInitialData();
    fetchProdData();
    fetchStops();
    setupRealtime();
  }, [fetchInitialData, fetchProdData, fetchStops, setupRealtime]);

  const stats = useMemo(() => {
    const today = startOfToday().getTime();
    const thisMonth = startOfMonth(new Date()).getTime();
    
    let todayProd = 0;
    let monthProd = 0;
    let waste = 0;

    production_entries.forEach(entry => {
      const entryTime = new Date(entry.created_at).getTime();
      if (entryTime >= today) todayProd += (entry.good_quantity || 0);
      if (entryTime >= thisMonth) monthProd += (entry.good_quantity || 0);
      waste += (entry.scrap_quantity || 0);
    });

    const activeMachines = machines.filter(m => m.status === 'Active').length;
    const stoppedMachines = machines.filter(m => m.status !== 'Active').length;
    
    // Calculate overall OEE
    const validMachines = machines.filter(m => typeof m.oee === 'number');
    const efficiency = validMachines.length > 0 
      ? validMachines.reduce((sum, m) => sum + (m.oee || 0), 0) / validMachines.length 
      : 85.2;

    const totalProducedAll = todayProd + waste;
    const wasteRate = totalProducedAll > 0 ? ((waste / totalProducedAll) * 100).toFixed(2) : '0.00';

    return {
      todayProd,
      monthProd: Math.round(monthProd / 1000), // in k
      efficiency,
      waste,
      wasteRate,
      activeMachines,
      stoppedMachines,
      openOrders: (orders || []).filter(o => o.status !== 'Closed' && o.status !== 'Completed').length,
      completedOrders: (orders || []).filter(o => o.status === 'Completed').length,
    };
  }, [production_entries, machines, orders]);

  // Predictive Maintenance Risk Scoring per Machine
  const machineHealthScores = useMemo(() => {
    return machines.map(m => {
      const machineStops = stops.filter(s => s.machine_id === m.id);
      const totalStopHours = machineStops.reduce((acc, s) => {
        if (!s.start_time) return acc;
        const start = new Date(s.start_time).getTime();
        const end = s.end_time ? new Date(s.end_time).getTime() : Date.now();
        return acc + ((end - start) / (1000 * 60 * 60));
      }, 0);

      // Simple predictive risk algorithm
      let score = 95;
      if (m.status !== 'Active') score -= 25;
      score -= Math.min(30, machineStops.length * 5);
      score -= Math.min(20, totalStopHours * 2);
      score = Math.max(35, Math.min(99, score));

      let riskLevel: 'Normal' | 'Attention' | 'Critique' = 'Normal';
      let riskNotice = 'Fonctionnement stable';
      if (score < 70) {
        riskLevel = 'Critique';
        riskNotice = 'Micro-arrêts fréquents détectés : maintenance préventive requise';
      } else if (score < 85) {
        riskLevel = 'Attention';
        riskNotice = 'Légère déviation TRS : contrôle réglage suggéré';
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

  const stopStats = useMemo(() => {
    const statsMap: Record<string, number> = {};
    let totalDuration = 0;
    
    stops.forEach(stop => {
      if (stop.start_time) {
        const start = new Date(stop.start_time).getTime();
        const end = stop.end_time ? new Date(stop.end_time).getTime() : Date.now();
        const durationHours = (end - start) / (1000 * 60 * 60);
        
        const reason = stop.reason || 'Autre';
        statsMap[reason] = (statsMap[reason] || 0) + durationHours;
        totalDuration += durationHours;
      }
    });

    const formattedStats = Object.entries(statsMap).map(([reason, duration]) => ({
      reason,
      duration: Number(duration.toFixed(1)),
      color: reason.toLowerCase().includes('mécanique') ? 'bg-red-500' : 
             reason.toLowerCase().includes('matériel') ? 'bg-amber-500' : 
             'bg-slate-400'
    })).sort((a, b) => b.duration - a.duration);

    return {
      total: Number(totalDuration.toFixed(1)),
      details: formattedStats
    };
  }, [stops]);

  const chartData = useMemo(() => {
    const today = startOfToday().getTime();
    const hourlyData: Record<string, number> = {};
    
    production_entries.forEach(entry => {
      const date = new Date(entry.created_at);
      if (date.getTime() >= today) {
        const hour = format(date, 'HH:00');
        hourlyData[hour] = (hourlyData[hour] || 0) + (entry.good_quantity || 0);
      }
    });

    if (Object.keys(hourlyData).length === 0) {
      return [
        { time: '08:00', value: 0, target: 15000 },
        { time: '10:00', value: 0, target: 15000 },
        { time: '12:00', value: 0, target: 15000 },
      ];
    }

    return Object.entries(hourlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([time, value]) => ({ time, value, target: 15000 }));
  }, [production_entries]);

  const handleGenerateDigest = async () => {
    setLoadingDigest(true);
    try {
      const digest = await generateDailyExecutiveDigest({
        todayProd: stats.todayProd,
        targetProd: 15000,
        totalScrap: stats.waste,
        wasteRate: stats.wasteRate,
        machines,
        stops,
        activeOrders: (orders || []).filter(o => o.status !== 'Closed')
      });
      setDailyDigest(digest);
      toast.success('Briefing du jour généré par IA !');
    } catch (err: any) {
      toast.error('Erreur: ' + err.message);
    } finally {
      setLoadingDigest(false);
    }
  };

  const copyDigestToClipboard = () => {
    if (dailyDigest) {
      navigator.clipboard.writeText(dailyDigest);
      toast.success('Briefing copié dans le presse-papier');
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto w-full space-y-6">
      {/* Top Bar: Title & AI Digest Trigger */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-gradient-to-r from-blue-900 to-indigo-900 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-widest mb-1">
            <span className="material-symbols-outlined text-[16px]">factory</span>
            {t.factory_portal}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{t.dash_header_title}</h1>
          <p className="text-blue-200 text-xs sm:text-sm mt-1 max-w-xl">
            {t.dash_header_sub}
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={handleGenerateDigest}
            disabled={loadingDigest}
            className="px-5 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-70 hover:scale-102 active:scale-98"
          >
            {loadingDigest ? (
              <>
                <span className="material-symbols-outlined text-[20px] animate-spin">refresh</span>
                {t.loading}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                {t.dash_ai_btn}
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Daily Digest Drawer (if generated) */}
      {dailyDigest && (
        <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-md animate-in slide-in-from-top-4">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-base">
              <span className="material-symbols-outlined text-blue-600">psychology</span>
              {t.dash_ai_btn}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyDigestToClipboard}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">content_copy</span>
                {t.save}
              </button>
              <button
                onClick={() => setDailyDigest(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>
          <div 
            className="prose prose-blue max-w-none text-sm text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200"
            dangerouslySetInnerHTML={{ __html: renderMarkdownHtml(dailyDigest) }}
          />
        </div>
      )}

      {/* Key Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-2">
            <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">{t.dash_today_prod}</span>
            <span className="flex items-center text-emerald-700 text-xs font-bold gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="material-symbols-outlined text-[14px]">trending_up</span> +5.2%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {stats.todayProd.toLocaleString()}
            </h3>
            <span className="text-slate-400 text-xs font-medium">{t.units}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-2">
            <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">{t.dash_scrap_rate}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${Number(stats.wasteRate) > 3 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
              Target &lt; 3%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {stats.wasteRate}%
            </h3>
            <span className="text-slate-400 text-xs font-medium">({stats.waste} {t.units})</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-2">
            <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">{t.dash_oee}</span>
            <span className="flex items-center text-blue-700 text-xs font-bold gap-1 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              Optimal
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-blue-600 tracking-tight">
              {stats.efficiency.toFixed(1)}%
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-2">
            <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">{t.dash_active_machines}</span>
            <span className="text-slate-500 text-xs font-bold">{stats.activeMachines}/{machines.length}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {stats.activeMachines}
            </h3>
            <span className="text-slate-400 text-xs font-medium">{t.active}</span>
          </div>
        </div>
      </div>

      {/* Predictive Maintenance & Machine Health Monitor */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-600">health_and_safety</span>
              {t.dash_health_title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{t.dash_health_sub}</p>
          </div>
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
            {t.active}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {machineHealthScores.map(m => (
            <div key={m.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between hover:border-blue-300 transition-all">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="font-bold text-slate-900 text-sm">{m.name}</div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    m.riskLevel === 'Critique' ? 'bg-red-100 text-red-800' :
                    m.riskLevel === 'Attention' ? 'bg-amber-100 text-amber-800' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {m.score}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-3">
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
              <div className="text-[11px] text-slate-400 font-semibold pt-2 border-t border-slate-200 flex justify-between">
                <span>{m.stopCount} {t.machine_stops}</span>
                <span className={m.status === 'Active' ? 'text-emerald-600 font-bold' : 'text-slate-500'}>{m.status === 'Active' ? t.active : t.stopped}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Production Chart & Downtime Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">{t.dash_hourly_chart}</h3>
              <p className="text-xs text-slate-500 font-medium">{t.production}</p>
            </div>
          </div>
          <div className="p-6 flex-1 flex items-center justify-center min-h-[280px] h-[280px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}
                  itemStyle={{ color: '#0f172a', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Downtime Reasons Pie/List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight mb-1">{t.dash_stops_reasons}</h3>
            <p className="text-xs text-slate-500 mb-6">{t.overview}: <strong className="text-slate-900">{stopStats.total} {t.hours}</strong></p>
            <div className="space-y-3">
              {stopStats.details.length > 0 ? stopStats.details.map((stat, i) => (
                <div key={i} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${stat.color}`}></div>
                    <span className="text-xs font-semibold text-slate-700">{stat.reason}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">{stat.duration}h</span>
                </div>
              )) : (
                <div className="text-center text-slate-400 text-xs py-8">-</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Production Entries */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">{t.dash_recent_entries}</h3>
            <p className="text-xs text-slate-500">{t.dash_recent_entries_sub}</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="p-4">{t.date}</th>
                <th className="p-4">{t.machine}</th>
                <th className="p-4">{t.order}</th>
                <th className="p-4">{t.operator}</th>
                <th className="p-4">{t.good_quantity}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {production_entries.slice(0, 5).map(entry => {
                const machine = machines.find(m => m.id === entry.machine_id);
                const order = orders.find(o => o.id === entry.of_id);
                const operator = operators.find(o => o.id === entry.operator_id);
                return (
                  <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 text-xs font-semibold text-slate-500 whitespace-nowrap">
                      {format(new Date(entry.created_at), 'HH:mm')}
                    </td>
                    <td className="p-4 font-semibold text-slate-900">
                      {machine?.name || 'Machine'}
                      {machine?.code && <span className="text-xs text-slate-400 ml-1 font-normal">({machine.code})</span>}
                    </td>
                    <td className="p-4 text-xs font-bold text-blue-700">
                      {order?.of_number || '-'}
                    </td>
                    <td className="p-4 text-xs text-slate-600 font-medium">
                      {operator?.name || 'Opérateur'}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        +{entry.good_quantity} ex
                      </span>
                    </td>
                  </tr>
                );
              })}
              {production_entries.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 text-xs">
                    Aucune production enregistrée aujourd'hui
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
