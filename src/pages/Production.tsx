import React, { useEffect } from 'react';
import { useProductionStore } from '../store/production';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export function Production() {
  const { sessions, machines, articles, operators, loading, fetchInitialData, setupRealtime, updateSessionStatus } = useProductionStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchInitialData();
    setupRealtime();
  }, [fetchInitialData, setupRealtime]);

  const getMachine = (id: string | null) => machines.find(m => m.id === id);
  const getArticleName = (id: string | null) => articles.find(a => a.id === id)?.designation || 'Inconnu';

  const renderOperatorBadges = (session: any) => {
    let opIds: string[] = [];
    if (Array.isArray(session.operator_ids) && session.operator_ids.length > 0) {
      opIds = session.operator_ids;
    } else if (session.operator_id) {
      opIds = [session.operator_id];
    }

    if (opIds.length === 0) return <span className="text-gray-400 italic">Inconnu</span>;

    const names = opIds
      .map(id => operators.find(o => o.id === id)?.name)
      .filter(Boolean);

    if (names.length === 0) {
      return <span>{operators.find(o => o.id === session.operator_id)?.name || 'Opérateur'}</span>;
    }

    return (
      <div className="flex flex-wrap gap-1 items-center">
        {names.map((name, i) => (
          <span key={i} className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-800 rounded-md border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            {name}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Suivi de Production</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Suivi en temps réel des ordres et des équipes sur machines</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 card-shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-gray-900 text-lg">Sessions & Ordres de Fabrication</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="p-4">Lot</th>
                <th className="p-4">Machine</th>
                <th className="p-4">Article</th>
                <th className="p-4">Équipe Opérateurs</th>
                <th className="p-4">Début</th>
                <th className="p-4">Fin</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">Chargement...</td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">Aucun ordre de fabrication en cours ou terminé.</td>
                </tr>
              ) : sessions.map(session => (
                <tr 
                  key={session.id} 
                  onClick={() => navigate(`/admin/cartons?start=${encodeURIComponent(session.start_time || '')}&end=${encodeURIComponent(session.end_time || '')}&operator=${encodeURIComponent(session.operator_id || '')}&article=${encodeURIComponent(session.article_id || '')}`)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer group"
                >
                  <td className="p-4 font-medium text-gray-900">{session.lot_number || '-'}</td>
                  <td className="p-4 text-gray-900">
                    <div className="font-semibold">{getMachine(session.machine_id)?.name || 'Inconnue'}</div>
                    {getMachine(session.machine_id)?.code && (
                      <div className="text-xs text-gray-500 mt-0.5 font-medium">{getMachine(session.machine_id)?.code}</div>
                    )}
                  </td>
                  <td className="p-4 text-gray-700 font-medium">{getArticleName(session.article_id)}</td>
                  <td className="p-4">
                    {renderOperatorBadges(session)}
                  </td>
                  <td className="p-4 text-gray-600 font-medium">
                    {session.start_time ? format(new Date(session.start_time), 'HH:mm dd/MM') : '-'}
                  </td>
                  <td className="p-4 text-gray-600 font-medium">
                    {session.end_time ? format(new Date(session.end_time), 'HH:mm dd/MM') : '-'}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${
                      session.status === 'En cours' 
                        ? 'bg-blue-50 text-blue-700 border-blue-200' 
                        : session.status === 'Terminé' 
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        session.status === 'En cours' ? 'bg-blue-600 animate-pulse' : session.status === 'Terminé' ? 'bg-green-600' : 'bg-gray-500'
                      }`}></span> 
                      {session.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {session.status === 'En cours' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); updateSessionStatus(session.id, 'Terminé', new Date().toISOString()); }}
                        className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors text-xs font-bold border border-blue-200"
                      >
                        Terminer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
