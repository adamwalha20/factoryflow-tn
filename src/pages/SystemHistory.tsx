import React, { useEffect, useState } from 'react';
import { useAuditStore, AuditLog } from '../store/audit';
import toast from 'react-hot-toast';

export function SystemHistory() {
  const { logs, loading, error, fetchLogs, undoChange, subscribeToLogs } = useAuditStore();
  const [undoingId, setUndoingId] = useState<string | null>(null);
  const [logToUndo, setLogToUndo] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchLogs();
    const unsubscribe = subscribeToLogs();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchLogs, subscribeToLogs]);

  const confirmUndo = async (log: AuditLog) => {
    setUndoingId(log.id);
    try {
      await undoChange(log.id);
      toast.success('Action annulée avec succès !');
      setLogToUndo(null);
    } catch (err: any) {
      toast.error("Erreur lors de l'annulation: " + err.message);
    } finally {
      setUndoingId(null);
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'INSERT':
        return <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md border border-green-200">AJOUT</span>;
      case 'UPDATE':
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-md border border-blue-200">MODIFICATION</span>;
      case 'DELETE':
        return <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-md border border-red-200">SUPPRESSION</span>;
      default:
        return <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-md">{action}</span>;
    }
  };

  const formatDataChanges = (log: AuditLog) => {
    const changes: string[] = [];

    const formatVal = (val: any) => {
      if (val === null || val === undefined) return 'vide';
      if (typeof val === 'object') return JSON.stringify(val);
      // Truncate long strings for display
      const str = String(val);
      return str.length > 50 ? str.substring(0, 50) + '...' : str;
    };

    if (log.action === 'INSERT' && log.new_data) {
      Object.keys(log.new_data).forEach(key => {
        if (key === 'updated_at' || key === 'created_at' || key === 'id') return;
        changes.push(`${key}: ${formatVal(log.new_data[key])}`);
      });
    } else if (log.action === 'DELETE' && log.old_data) {
      Object.keys(log.old_data).forEach(key => {
        if (key === 'updated_at' || key === 'created_at' || key === 'id') return;
        changes.push(`${key}: ${formatVal(log.old_data[key])}`);
      });
    } else if (log.action === 'UPDATE' && log.old_data && log.new_data) {
      Object.keys(log.new_data).forEach(key => {
        if (key === 'updated_at' || key === 'created_at' || key === 'id') return;
        if (JSON.stringify(log.old_data[key]) !== JSON.stringify(log.new_data[key])) {
          changes.push(`${key}: ${formatVal(log.old_data[key])} ➔ ${formatVal(log.new_data[key])}`);
        }
      });
    }

    if (changes.length === 0) return <div className="text-xs text-gray-400 mt-1">Aucun détail pertinent à afficher.</div>;

    return (
      <div className="mt-2 space-y-1">
        {changes.slice(0, 4).map((change, idx) => (
          <div key={idx} className="text-xs text-gray-600 bg-gray-50 p-1.5 rounded border border-gray-100 font-mono break-all">
            {change}
          </div>
        ))}
        {changes.length > 4 && (
          <div className="text-xs text-gray-400 italic font-medium mt-1">+{changes.length - 4} autres champs...</div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Journal d'Audit Système</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Traceabilité complète des actions et annulations</p>
        </div>
        <button onClick={() => fetchLogs()} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-md shadow-sm hover:bg-gray-50 flex items-center gap-2 font-medium text-sm transition-colors">
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Actualiser
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden card-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 table-header-sticky">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-48">Date & Heure</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Table</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Action</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Détails</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-48">Utilisateur</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right w-32">Annuler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    <span className="material-symbols-outlined animate-spin text-3xl mb-2">refresh</span>
                    <p>Chargement de l'historique...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-red-500 bg-red-50">
                    Erreur: {error}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Aucun événement enregistré.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-4 align-top">
                      <div className="font-medium text-gray-900 text-sm">
                        {new Date(log.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <span className="font-semibold text-gray-700 capitalize text-sm">
                        {log.table_name.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 align-top">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="p-4 align-top max-w-md">
                      {formatDataChanges(log)}
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-gray-400">person</span>
                        <span className="text-sm font-medium text-gray-700">{log.user_email || 'Système'}</span>
                      </div>
                    </td>
                    <td className="p-4 align-top text-right">
                      <button
                        onClick={() => setLogToUndo(log)}
                        disabled={undoingId === log.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 rounded shadow-sm text-sm font-medium flex items-center justify-center gap-1.5 ml-auto disabled:opacity-50"
                      >
                        {undoingId === log.id ? (
                          <span className="material-symbols-outlined animate-spin text-[16px]">refresh</span>
                        ) : (
                          <span className="material-symbols-outlined text-[16px]">undo</span>
                        )}
                        Undo
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {logToUndo && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-4 text-orange-600">
                <span className="material-symbols-outlined text-2xl">warning</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmer l'annulation</h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Êtes-vous sûr de vouloir annuler cette action <strong>({logToUndo.action} sur {logToUndo.table_name})</strong> ? Cette opération va restaurer l'état précédent dans la base de données.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setLogToUndo(null)}
                  disabled={undoingId !== null}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={() => confirmUndo(logToUndo)}
                  disabled={undoingId !== null}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  {undoingId === logToUndo.id ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[16px]">refresh</span>
                      Traitement...
                    </>
                  ) : (
                    'Oui, annuler l\'action'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
