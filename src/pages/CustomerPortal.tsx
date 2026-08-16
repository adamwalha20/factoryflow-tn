import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

export function CustomerPortal() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [bcs, setBcs] = useState<any[]>([]);
  const [selectedBc, setSelectedBc] = useState<any | null>(null);
  const [bcOrders, setBcOrders] = useState<any[]>([]);
  const [bcCartons, setBcCartons] = useState<any[]>([]);

  // Search customer orders
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error('Veuillez saisir un N° de Commande (BC) ou votre nom de client');
      return;
    }

    setLoading(true);
    try {
      const q = searchQuery.trim();
      const { data, error } = await (supabase as any)
        .from('bons_de_commande')
        .select('*')
        .or(`bc_number.ilike.%${q}%,customer.ilike.%${q}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBcs(data || []);

      if (data && data.length === 1) {
        loadBcDetails(data[0]);
      } else if (data && data.length === 0) {
        toast('Aucune commande trouvée avec cette référence', { icon: '🔍' });
        setSelectedBc(null);
      }
    } catch (err: any) {
      toast.error('Erreur de recherche : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadBcDetails = async (bc: any) => {
    setSelectedBc(bc);
    try {
      // Load related OFs
      const { data: ofs } = await (supabase as any)
        .from('manufacturing_orders')
        .select('*, articles(reference, designation)')
        .eq('po_number', bc.bc_number);

      setBcOrders(ofs || []);

      // Load related cartons
      const ofIds = (ofs || []).map((o: any) => o.id);
      if (ofIds.length > 0) {
        const { data: cartons } = await (supabase as any)
          .from('cartons')
          .select('*')
          .in('of_id', ofIds);
        setBcCartons(cartons || []);
      } else {
        setBcCartons([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-20 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/20">
            FF
          </div>
          <div>
            <span className="font-bold text-base text-white tracking-tight">FactoryFlow TN</span>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest block">Portail Client & Suivi Commandes</span>
          </div>
        </div>
        <a 
          href="/login" 
          className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
        >
          Espace Usine ➔
        </a>
      </header>

      {/* Hero Search Section */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-12 px-4 border-b border-slate-800">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-xs font-bold">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            Traçabilité Directe d'Atelier
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Suivi de vos Commandes en Temps Réel
          </h1>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Consultez instantanément l'avancement de votre fabrication, le nombre de cartons conditionnés et l'état d'expédition.
          </p>

          <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mx-auto pt-4">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input
                type="text"
                placeholder="Ex: BC-2026-001 ou nom société..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 shrink-0 disabled:opacity-50"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>
              ) : (
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              )}
              Rechercher
            </button>
          </form>
        </div>
      </section>

      {/* Results Section */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* If multiple BCs matched */}
        {bcs.length > 1 && !selectedBc && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
            <h3 className="font-bold text-white text-base mb-4">Commandes trouvées ({bcs.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {bcs.map(bc => (
                <div
                  key={bc.id}
                  onClick={() => loadBcDetails(bc)}
                  className="p-4 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl cursor-pointer transition-all hover:border-blue-500 flex justify-between items-center group"
                >
                  <div>
                    <span className="font-bold text-white group-hover:text-blue-400 transition-colors">{bc.bc_number}</span>
                    <p className="text-xs text-slate-400">{bc.customer}</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {bc.status || 'En cours'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected BC Details Overview */}
        {selectedBc && (
          <div className="space-y-6 animate-in fade-in zoom-in-95">
            {/* Back Button if multiple */}
            {bcs.length > 1 && (
              <button 
                onClick={() => setSelectedBc(null)}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Retour aux résultats
              </button>
            )}

            {/* Main Order Card */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-xl">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-6 border-b border-slate-700">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-2xl font-black text-white">{selectedBc.bc_number}</h2>
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      {selectedBc.status || 'En Production'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">Client : <strong className="text-slate-200">{selectedBc.customer}</strong></p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Date de Livraison Prévue</span>
                  <p className="text-base font-bold text-slate-200">
                    {selectedBc.due_date ? format(new Date(selectedBc.due_date), 'dd MMMM yyyy', { locale: fr }) : 'Non spécifiée'}
                  </p>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="py-8">
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-md">✓</div>
                    <span className="text-xs font-semibold text-blue-400 mt-2">1. Validée</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-md">✓</div>
                    <span className="text-xs font-semibold text-blue-400 mt-2">2. En Production</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${bcCartons.length > 0 ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-700 text-slate-400'}`}>
                      3
                    </div>
                    <span className={`text-xs font-semibold mt-2 ${bcCartons.length > 0 ? 'text-blue-400' : 'text-slate-500'}`}>
                      3. Emballage ({bcCartons.length} cartons)
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-400 flex items-center justify-center font-bold text-xs">4</div>
                    <span className="text-xs font-semibold text-slate-500 mt-2">4. Prêt / Expédié</span>
                  </div>
                </div>
              </div>

              {/* Manufacturing Orders Sub-Table */}
              <div className="space-y-4 pt-4 border-t border-slate-700">
                <h3 className="font-bold text-sm text-slate-300 uppercase tracking-wider">Détail des Lignes de Fabrication (OF)</h3>
                <div className="border border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900/60 border-b border-slate-700 font-semibold text-slate-400">
                        <th className="p-3">N° OF</th>
                        <th className="p-3">Article & Format</th>
                        <th className="p-3">Quantité Demandée</th>
                        <th className="p-3">Cartons Prêts</th>
                        <th className="p-3 text-right">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {bcOrders.map(of => (
                        <tr key={of.id} className="hover:bg-slate-700/30">
                          <td className="p-3 font-bold text-blue-400">{of.of_number}</td>
                          <td className="p-3 font-semibold text-white">
                            {of.articles?.reference || '-'}
                            <div className="text-[10px] text-slate-400 font-normal">{of.articles?.designation}</div>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-200">{of.quantity_planned} rouleaux</td>
                          <td className="p-3 font-semibold text-emerald-400">
                            {bcCartons.filter(c => c.of_id === of.id).length} cartons
                          </td>
                          <td className="p-3 text-right">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              {of.status || 'En cours'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {bcOrders.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-500">
                            Aucun ordre de fabrication rattaché pour le moment.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 px-4 text-center text-xs text-slate-500 mt-auto">
        FactoryFlow TN — Plateforme MES & Traçabilité Industrielle Sécurisée • Tunis, Tunisie
      </footer>
    </div>
  );
}

export default CustomerPortal;
