import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useUsersStore } from '../store/users';
import { useProductionStore } from '../store/production';

interface HistoryEntry {
  id: string;
  created_at: string;
  good_quantity: number;
  scrap_quantity: number;
  machines: { name: string } | null;
  manufacturing_orders: { of_number: string, articles: { designation: string } | null } | null;
  operator_id: string | null;
  operator_ids?: string[] | null;
  comments?: string | null;
}

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000000';
const getActiveOrgId = () => typeof localStorage !== 'undefined' ? (localStorage.getItem('active_org_id') || DEFAULT_ORG_ID) : DEFAULT_ORG_ID;

const Historique = () => {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { users, fetchUsers } = useUsersStore();
  const { operators, fetchInitialData } = useProductionStore();

  useEffect(() => {
    fetchHistory();
    fetchUsers();
    fetchInitialData();
  }, [fetchUsers, fetchInitialData]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const orgId = getActiveOrgId();
      const { data, error } = await (supabase as any)
        .from('production_entries')
        .select(`
          id,
          created_at,
          good_quantity,
          scrap_quantity,
          machines ( name ),
          manufacturing_orders ( of_number, articles ( designation ) ),
          operator_id,
          operator_ids,
          comments
        `)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error: any) {
      toast.error("Erreur lors du chargement de l'historique");
    } finally {
      setLoading(false);
    }
  };

  const calculateTRS = (good: number, scrap: number) => {
    const total = good + scrap;
    if (total === 0) return 0;
    return Math.round((good / total) * 100);
  };

  const getOperatorName = (id: string) => {
    const fromUsers = users.find(u => u.id === id || (u as any).user_id === id);
    if (fromUsers?.name) return fromUsers.name;
    const fromProd = operators.find(o => o.id === id || (o as any).user_id === id);
    if (fromProd?.name) return fromProd.name;
    return null;
  };

  const renderOperators = (entry: HistoryEntry) => {
    let opIds: string[] = [];
    if (Array.isArray(entry.operator_ids) && entry.operator_ids.length > 0) {
      opIds = entry.operator_ids;
    } else if (entry.operator_id) {
      opIds = [entry.operator_id];
    }

    if (opIds.length === 0) return <span className="text-gray-400 italic">Inconnu</span>;

    const names = opIds
      .map(id => getOperatorName(id))
      .filter(Boolean);

    if (names.length === 0) {
      return <span className="text-gray-700 font-medium">{getOperatorName(entry.operator_id || '') || 'Opérateur'}</span>;
    }

    return (
      <div className="flex flex-wrap gap-1.5 items-center">
        {names.map((name, i) => (
          <span key={i} className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 bg-blue-50 text-blue-800 rounded-md border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            {name}
          </span>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="p-container-padding max-w-[1440px] mx-auto space-y-card-gap animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Historique de Production</h1>
            <p className="text-sm text-gray-500 font-medium">Consultez et analysez les données de production passées.</p>
          </div>
          <button onClick={() => toast.success('Exportation en cours...')} className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Exporter Données
          </button>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm card-shadow">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date &amp; Heure</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Opérateurs (Équipe)</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Machine</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Produit / OF</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Quantité Produite</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Déchets</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Rendement (TRS)</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      Chargement de l'historique...
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      Aucune donnée de production trouvée.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => {
                    const trs = calculateTRS(entry.good_quantity, entry.scrap_quantity);
                    const isGoodTrs = trs >= 90;
                    const isBadTrs = trs < 85;

                    return (
                      <tr key={entry.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="p-4">
                          <div className="font-semibold text-gray-900">
                            {format(new Date(entry.created_at), 'dd MMM yyyy', { locale: fr })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(entry.created_at), 'HH:mm')}
                          </div>
                        </td>
                        <td className="p-4">
                          {renderOperators(entry)}
                        </td>
                        <td className="p-4 font-medium text-gray-700">
                          {entry.machines?.name || <span className="text-gray-400 italic">Machine supprimée</span>}
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-gray-900">
                            {entry.manufacturing_orders?.articles?.designation || '-'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {entry.manufacturing_orders?.of_number || <span className="text-gray-400 italic">OF supprimé</span>}
                          </div>
                        </td>
                        <td className="p-4 text-right font-bold text-gray-900">
                          {entry.good_quantity.toLocaleString()} u.
                        </td>
                        <td className="p-4 text-right font-bold text-error">
                          {entry.scrap_quantity > 0 ? (
                            <>{entry.scrap_quantity.toLocaleString()} u. <span className="text-xs font-normal text-gray-500">({((entry.scrap_quantity / (entry.good_quantity + entry.scrap_quantity)) * 100).toFixed(1)}%)</span></>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border ${
                            isGoodTrs ? 'bg-green-50 text-green-700 border-green-200' :
                            isBadTrs ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }`}>
                            <span className="material-symbols-outlined text-[16px]">
                              {isGoodTrs ? 'trending_up' : isBadTrs ? 'trending_down' : 'trending_flat'}
                            </span>
                            {trs}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!loading && entries.length > 0 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
              <span className="text-sm text-gray-500">
                Affichage de {entries.length} résultats
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Historique;
