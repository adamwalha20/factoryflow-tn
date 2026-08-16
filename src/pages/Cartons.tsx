import { useEffect, useState } from 'react';
import { useMesStore } from '../store/mesStore';
import { useSearchParams } from 'react-router-dom';

import toast from 'react-hot-toast';

import { printLabel, printAllLabels, printLotLabel } from '../utils/printLabel';

export function Cartons() {
  const { cartons, orders, articles, fetchInitialData, loading, deleteCarton } = useMesStore();

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const [searchParams] = useSearchParams();
  const sessionStart = searchParams.get('start');
  const sessionEnd = searchParams.get('end');
  const sessionOperator = searchParams.get('operator');
  const sessionArticle = searchParams.get('article');

  useEffect(() => {
    if (cartons.length > 0 && sessionStart) {
      const timer = setTimeout(() => {
        const highlightedRows = document.querySelectorAll('.highlighted-carton');
        if (highlightedRows.length > 0) {
          highlightedRows[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [cartons, sessionStart]);

  const isCartonInSession = (carton: any) => {
    if (!sessionStart || !sessionArticle) return false;
    
    const cartonDate = new Date(carton.created_at).getTime();
    const start = new Date(sessionStart).getTime();
    // If there is no end date, it means the session is still ongoing
    const end = sessionEnd ? new Date(sessionEnd).getTime() : Date.now();
    
    const targetOperator = (sessionOperator === 'null' || sessionOperator === '') ? null : sessionOperator;
    const operatorMatch = carton.operator_id === targetOperator || String(carton.operator_id) === sessionOperator;
    
    return operatorMatch && 
           carton.article_id === sessionArticle && 
           cartonDate >= start && 
           cartonDate <= end &&
           carton.status !== 'Waiting';
  };

  const [deletingCartonId, setDeletingCartonId] = useState<string | null>(null);

  const handleDeleteConfirm = async () => {
    if (deletingCartonId) {
      try {
        await deleteCarton(deletingCartonId);
        toast.success('Carton supprimé avec succès');
      } catch (err: any) {
        toast.error('Erreur lors de la suppression');
      } finally {
        setDeletingCartonId(null);
      }
    }
  };
  const [printingCarton, setPrintingCarton] = useState<{carton: any, article: any, order: any} | null>(null);

  const handlePrint = (carton: any, article: any, order: any) => {
    setPrintingCarton({ carton, article, order });
  };

  const confirmPrint = (data: {carton: any, article: any, order: any}) => {
    setPrintingCarton(null);
    const { carton, article, order } = data;
    
    try {
      printLabel(carton, article, order);
      toast.success('Impression envoyée vers l\'imprimante thermique');
    } catch (err) {
      toast.error('Erreur d\'impression');
    }
  };

  if (loading) return <div className="p-6">Chargement...</div>;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Cartons Management</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Traceability and label printing</p>
        </div>
        {sessionStart && (
          <div className="flex gap-3">
            <button 
              onClick={() => {
                const highlightedCartons = cartons.filter(isCartonInSession);
                if (highlightedCartons.length === 0) return toast.error("Aucun carton trouvé pour ce lot");
                
                const order = orders.find(o => o.id === highlightedCartons[0].of_id);
                const article = articles.find(a => a.id === highlightedCartons[0].article_id);
                const totalQty = highlightedCartons.reduce((acc, c) => acc + (c.quantity || 0), 0);
                
                // Assuming the first carton's carton_number has the lot info like CARTON-20260720-38
                const dateStr = new Date(sessionStart).toISOString().slice(0, 10).replace(/-/g, '');
                const lotName = `LOT-${dateStr}-${order?.of_number}`;
                
                printLotLabel(lotName, totalQty, article, order, sessionStart, sessionStart, sessionEnd, sessionArticle!);
                toast.success(`Impression de l'étiquette maître pour le lot en cours...`);
              }}
              className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">print</span>
              Imprimer l'étiquette globale du Lot
            </button>
            <button 
              onClick={() => {
                const highlightedCartons = cartons.filter(isCartonInSession);
                if (highlightedCartons.length === 0) return toast.error("Aucun carton trouvé pour ce lot");
                
                const itemsToPrint = highlightedCartons.map(carton => {
                  const order = orders.find(o => o.id === carton.of_id);
                  const article = articles.find(a => a.id === carton.article_id);
                  return { carton, article, order };
                });
                
                printAllLabels(itemsToPrint);
                toast.success(`Impression de ${itemsToPrint.length} étiquettes en cours...`);
              }}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">layers</span>
              Imprimer toutes les étiquettes
            </button>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden card-shadow">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 table-header-sticky">
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Carton No</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Article</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-100">
            {[...cartons].sort((a, b) => {
              const timeA = new Date(a.created_at).getTime();
              const timeB = new Date(b.created_at).getTime();
              // If cartons were created within the same second (same batch)
              if (Math.abs(timeA - timeB) < 1000) {
                const getSeq = (num: string) => parseInt(num?.split('-').pop() || '0');
                return getSeq(b.carton_number) - getSeq(a.carton_number); // Descending order
              }
              return timeB - timeA; // Newer first
            }).map(carton => {
              const order = orders.find(o => o.id === carton.of_id);
              const article = articles.find(a => a.id === carton.article_id);
              const highlighted = isCartonInSession(carton);
              
              return (
                <tr 
                  key={carton.id} 
                  className={`group transition-colors ${
                    highlighted 
                      ? 'highlighted-carton bg-blue-50 border-l-4 border-blue-500 hover:bg-blue-100' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="p-4 font-semibold text-gray-900">{carton.carton_number}</td>
                  <td className="p-4 font-medium text-gray-600">{order?.of_number}</td>
                  <td className="p-4 text-gray-600">{article?.reference}</td>
                  <td className="p-4 font-medium text-gray-900">{carton.quantity}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${
                      carton.status === 'QC_Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                      carton.status === 'QC_Passed' || carton.status === 'In_Warehouse' ? 'bg-green-50 text-green-700 border-green-200' :
                      'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {carton.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handlePrint(carton, article, order)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors rounded-md flex items-center justify-center gap-2 font-medium border border-blue-200 hover:border-blue-600"
                      >
                        <span className="material-symbols-outlined text-[18px]">print</span>
                        <span>Print</span>
                      </button>
                      <button 
                        onClick={() => setDeletingCartonId(carton.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded hover:bg-red-50 flex items-center justify-center"
                        aria-label="Delete"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingCartonId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl border border-gray-200">
            <h2 className="text-xl font-bold mb-2 text-gray-900">Confirmer la suppression</h2>
            <p className="text-gray-600 mb-6 text-sm">
              Êtes-vous sûr de vouloir supprimer ce carton ? Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setDeletingCartonId(null)} 
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded transition-colors text-sm"
              >
                Annuler
              </button>
              <button 
                onClick={handleDeleteConfirm} 
                className="px-6 py-2 bg-red-600 text-white font-medium rounded hover:bg-red-700 transition-colors text-sm shadow-sm"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Print Confirmation Modal */}
      {printingCarton && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4 text-blue-600">
                <span className="material-symbols-outlined text-2xl">print</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmer l'impression</h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Êtes-vous sûr de vouloir imprimer l'étiquette pour ce carton <strong>({printingCarton.carton.carton_number})</strong> ? L'impression sera envoyée vers l'imprimante thermique.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setPrintingCarton(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={() => confirmPrint(printingCarton)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm"
                >
                  Oui, imprimer l'étiquette
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
