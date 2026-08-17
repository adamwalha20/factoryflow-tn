import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Scanner } from '@yudiel/react-qr-scanner';
import { useMesStore } from '../store/mesStore';
import { useTenantStore } from '../store/tenantStore';
import { useWarehouseStore } from '../store/warehouseStore';

export function ScanQR() {
  const [searchParams] = useSearchParams();
  const { fetchCartonByNumber, verifyCarton, stockCarton, verifyLot, stockLot, orders, articles, fetchInitialData, cartons, markLotInReview } = useMesStore();
  const { fetchTenantData } = useTenantStore();
  const { locations, fetchLocations } = useWarehouseStore();
  const [scanResult, setScanResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // QA Action State
  const [actionState, setActionState] = useState<'None' | 'conforme' | 'non-conforme' | 'stock'>('None');
  const [warehouseLocation, setWarehouseLocation] = useState('Entrepôt Principal');
  const [rejectionReason, setRejectionReason] = useState('');
  const [validatedQty, setValidatedQty] = useState<number | ''>('');
  const [lotGapReason, setLotGapReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const orgParam = searchParams.get('org');
    if (orgParam && orgParam !== localStorage.getItem('active_org_id')) {
      localStorage.setItem('active_org_id', orgParam);
      fetchTenantData(orgParam);
    }
    fetchInitialData();
    fetchLocations();
  }, [searchParams, fetchTenantData, fetchInitialData, fetchLocations]);

  useEffect(() => {
    if (locations && locations.length > 0 && (!warehouseLocation || warehouseLocation === 'Entrepôt Principal')) {
      setWarehouseLocation(locations[0].name);
    }
  }, [locations]);

  const handleScan = async (result: any) => {
    if (result && result.length > 0 && isScanning && !isLoading) {
      const text = result[0].rawValue;
      setIsScanning(false);
      setIsLoading(true);
      
      let cartonNumber = text;
      try {
        const data = JSON.parse(text);
        if (data.is_lot) {
           const cartonsInLot = cartons.filter(c => {
             const cartonDate = new Date(c.created_at).getTime();
             const start = new Date(data.start).getTime();
             const end = data.end ? new Date(data.end).getTime() : Date.now();
             return c.article_id === data.article && cartonDate >= start && cartonDate <= end && c.status !== 'Waiting';
           });
           
           if (cartonsInLot.length > 0) {
             setScanResult({
               is_lot: true,
               id: 'lot_id',
               lot_number: data.lot_number,
               carton_number: data.lot_number,
               carton_ids: cartonsInLot.map(c => c.id),
               quantity: data.qty,
               article_id: cartonsInLot[0].article_id,
               of_id: cartonsInLot[0].of_id,
               status: cartonsInLot[0].status,
               created_at: cartonsInLot[0].created_at
             });
             toast.success(`Lot trouvé (${cartonsInLot.length} cartons)`);
           } else {
             toast.error('Aucun carton trouvé pour ce lot');
             setIsScanning(true);
           }
           setIsLoading(false);
           return;
        }
        if (data.carton) cartonNumber = data.carton;
      } catch (e) {
        // Not JSON, use raw text as carton number
      }
      
      const cartonData = await fetchCartonByNumber(cartonNumber);
      if (cartonData) {
        setScanResult(cartonData);
        toast.success('Carton trouvé');
      } else {
        toast.error('Carton introuvable dans la base de données');
        setIsScanning(true);
      }
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setScanResult(null);
    setActionState('None');
    setWarehouseLocation('Entrepôt Principal');
    setRejectionReason('');
    setValidatedQty('');
    setLotGapReason('');
    setIsScanning(true);
  };

  const handleSubmit = async () => {
    if (!scanResult) return;
    
    if (actionState === 'non-conforme' && !rejectionReason.trim()) {
      toast.error('Veuillez préciser la raison du rejet');
      return;
    }

    setIsSubmitting(true);
    try {
      if (scanResult.is_lot) {
        if (actionState === 'stock') {
          await stockLot(scanResult.carton_ids, warehouseLocation);
          toast.success('Lot mis en stock avec succès');
        } else if (actionState === 'conforme' || actionState === 'non-conforme') {
          let vQty = undefined;
          let defectDesc = actionState === 'non-conforme' ? rejectionReason : undefined;
          
          if (actionState === 'conforme') {
            vQty = validatedQty === '' ? 0 : validatedQty;
            if (vQty !== scanResult.quantity) {
              if (scanResult.status !== 'QC_In_Review') {
                await markLotInReview(scanResult.carton_ids);
                toast.success('Le lot a été marqué pour révision');
                handleReset();
                setIsSubmitting(false);
                return;
              } else {
                if (!lotGapReason.trim()) {
                  toast.error("Veuillez préciser la raison de l'écart de quantité");
                  setIsSubmitting(false);
                  return;
                }
                defectDesc = `Écart de quantité (${scanResult.quantity} -> ${vQty}): ${lotGapReason}`;
              }
            }
          }
          
          await verifyLot(
            scanResult.carton_ids,
            scanResult.lot_number,
            scanResult.article_id,
            actionState,
            defectDesc,
            undefined,
            vQty
          );
          toast.success(`Lot marqué comme ${actionState === 'conforme' ? 'Conforme' : 'Rejeté'}`);
        }
      } else {
        if (actionState === 'stock') {
          await stockCarton(scanResult.id, warehouseLocation);
          toast.success('Carton mis en stock avec succès');
        } else if (actionState === 'conforme' || actionState === 'non-conforme') {
          await verifyCarton(
            scanResult.id,
            scanResult.carton_number,
            scanResult.article_id,
            actionState,
            actionState === 'non-conforme' ? rejectionReason : undefined
          );
          toast.success(`Carton marqué comme ${actionState === 'conforme' ? 'Conforme' : 'Rejeté'}`);
        }
      }
      handleReset();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors du traitement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-lg mx-auto bg-zinc-50 relative">
      {/* Viewfinder */}
      <div className="relative shrink-0 flex items-center justify-center bg-black h-[40vh] rounded-b-3xl overflow-hidden shadow-sm">
        {isScanning ? (
          <Scanner 
            onScan={handleScan}
            formats={['qr_code', 'code_128', 'ean_13']}
            styles={{ container: { width: '100%', height: '100%' } }}
          />
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center w-full h-full bg-zinc-900">
            <span className="material-symbols-outlined text-[48px] text-white animate-spin mb-2">refresh</span>
            <p className="text-sm font-medium text-white">Recherche du carton...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full bg-green-600">
            <span className="material-symbols-outlined text-[64px] text-white mb-2">check_circle</span>
            <p className="text-xl font-bold text-white">Scan Réussi</p>
            <button onClick={handleReset} className="mt-4 px-4 py-2 bg-white/20 text-white rounded-full text-sm font-medium backdrop-blur-sm">Scanner à nouveau</button>
          </div>
        )}
      </div>

      {/* Result Panel */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto">
        {!scanResult && !isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
            <span className="material-symbols-outlined text-4xl mb-3 opacity-50">qr_code_scanner</span>
            <p className="text-center font-medium text-sm">En attente de scan...</p>
          </div>
        )}

        {scanResult && actionState === 'None' && (
          <div className="flex-1 flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {scanResult.is_lot ? 'Détails du Lot' : 'Détails du Carton'}
              </h2>
              <p className="text-sm text-gray-500 font-medium">Vérifiez les informations avant validation</p>
            
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                <span className="text-gray-500 font-medium text-sm">{scanResult.is_lot ? 'N° de Lot' : 'N° Carton'}</span>
                <span className="font-bold text-gray-900">{scanResult.carton_number}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
                <span className="text-zinc-500 font-medium text-xs uppercase">Ordre de Fab.</span>
                <span className="text-sm font-bold text-zinc-900">{orders.find(o => o.id === scanResult.of_id)?.of_number || 'Inconnu'}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
                <span className="text-zinc-500 font-medium text-xs uppercase">Article</span>
                <span className="text-sm font-semibold text-zinc-700">{articles.find(a => a.id === scanResult.article_id)?.designation || 'Inconnu'}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
                <span className="text-zinc-500 font-medium text-xs uppercase">Créé le</span>
                <span className="text-xs font-semibold text-zinc-600">{new Date(scanResult.created_at).toLocaleString('fr-FR')}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
                <span className="text-zinc-500 font-medium text-xs uppercase">Quantité</span>
                <span className="text-xl font-bold text-blue-600">{scanResult.quantity}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 font-medium text-xs uppercase">Statut Actuel</span>
                <span className={`text-sm font-bold px-2.5 py-1 rounded-md ${
                  scanResult.status === 'QC_Rejected' ? 'bg-red-100 text-red-700' :
                  scanResult.status === 'QC_Passed' || scanResult.status === 'In_Warehouse' ? 'bg-green-100 text-green-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {scanResult.status}
                </span>
              </div>
            </div>

            <h3 className="text-sm font-bold text-zinc-800 mb-3">
              {(scanResult.is_lot || scanResult.status === 'Produced' || scanResult.status === 'QC_In_Review') ? 'Vérification Qualité' : 
               scanResult.status === 'QC_Passed' ? 'Mise en Stock' : 'Statut'}
            </h3>
            
            {(scanResult.is_lot || scanResult.status === 'Produced' || scanResult.status === 'QC_In_Review') && (
              <div className={`grid gap-3 mt-auto ${!scanResult.is_lot ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <button 
                  onClick={() => {
                    if (scanResult.is_lot) setValidatedQty(scanResult.quantity);
                    setActionState('conforme');
                  }}
                  className="bg-green-500 text-white hover:bg-green-600 py-4 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all shadow-md"
                >
                  <span className="material-symbols-outlined text-2xl">check_circle</span>
                  Conforme
                </button>
                {!scanResult.is_lot && (
                  <button 
                    onClick={() => setActionState('non-conforme')}
                    className="bg-red-500 text-white hover:bg-red-600 py-4 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all shadow-md"
                  >
                    <span className="material-symbols-outlined text-2xl">cancel</span>
                    Rejeté
                  </button>
                )}
              </div>
            )}

            {scanResult.status === 'QC_Passed' && (
              <div className="grid grid-cols-1 gap-3 mt-auto">
                <button 
                  onClick={() => setActionState('stock')}
                  className="col-span-1 bg-blue-600 text-white hover:bg-blue-700 py-4 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all shadow-md"
                >
                  <span className="material-symbols-outlined text-2xl">warehouse</span>
                  Mettre en Stock
                </button>
              </div>
            )}

            {(scanResult.status === 'QC_Rejected' || scanResult.status === 'In_Warehouse') && !scanResult.is_lot && (
               <div className="p-4 bg-zinc-100 rounded-lg text-center text-zinc-600 font-medium mt-auto">
                 Aucune action requise pour ce statut.
               </div>
            )}
          </div>
        )}

        {scanResult && actionState === 'conforme' && (
           <div className="flex-1 flex flex-col animate-in slide-in-from-right-4 duration-300">
             <div className="flex items-center gap-3 mb-6">
               <button onClick={() => setActionState('None')} className="p-2 bg-zinc-200 rounded-full text-zinc-600">
                 <span className="material-symbols-outlined text-lg block">arrow_back</span>
               </button>
               <h2 className="text-lg font-bold text-green-700">Valider la Conformité</h2>
             </div>
             
             <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex-1 flex flex-col justify-center items-center text-center">
               <span className="material-symbols-outlined text-6xl text-green-500 mb-4">verified</span>
               <p className="text-lg font-semibold text-zinc-800">
                 Confirmer que ce {scanResult.is_lot ? 'lot' : 'carton'} est conforme ?
               </p>
               <p className="text-sm text-zinc-500 mt-2 mb-4">Il sera enregistré comme ayant passé le contrôle qualité avec succès.</p>
               
               {scanResult.is_lot && (
                 <div className="w-full mt-2 text-left space-y-4">
                   <div>
                     <label className="block text-sm font-semibold text-zinc-700 mb-2">Quantité Validée (ajustable) :</label>
                     <input 
                       type="number" 
                       className="w-full border border-zinc-300 rounded-lg px-4 py-3 text-lg font-bold focus:ring-2 focus:ring-green-500 focus:border-green-500"
                       value={validatedQty}
                       onChange={e => setValidatedQty(e.target.value === '' ? '' : Number(e.target.value))}
                     />
                   </div>
                   
                   {validatedQty !== '' && validatedQty !== scanResult.quantity && scanResult.status === 'QC_In_Review' && (
                      <div className="animate-in fade-in slide-in-from-top-2">
                        <label className="block text-sm font-semibold text-red-600 mb-2">Raison de l'écart (Revue Finale) :</label>
                        <textarea 
                          value={lotGapReason}
                          onChange={e => setLotGapReason(e.target.value)}
                          className="w-full border border-red-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="Ex: 5 produits jetés pour défaut d'impression"
                          rows={2}
                        />
                      </div>
                    )}
                    {validatedQty !== '' && validatedQty !== scanResult.quantity && scanResult.status !== 'QC_In_Review' && (
                      <div className="p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm font-medium mt-3 border border-yellow-200">
                        ⚠️ Quantité différente du total prévu. Ce lot sera placé "En Révision" pour vérification ultérieure.
                      </div>
                    )}
                 </div>
               )}
             </div>

              <button  
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`mt-6 w-full py-4 rounded-xl font-bold text-lg shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 text-white ${
                  validatedQty !== '' && validatedQty !== scanResult.quantity && scanResult.status !== 'QC_In_Review' 
                    ? 'bg-yellow-500 hover:bg-yellow-600' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isSubmitting ? <span className="material-symbols-outlined animate-spin">refresh</span> : 
                 <span className="material-symbols-outlined">
                   {validatedQty !== '' && validatedQty !== scanResult.quantity && scanResult.status !== 'QC_In_Review' ? 'pending_actions' : 'check'}
                 </span>}
                {validatedQty !== '' && validatedQty !== scanResult.quantity && scanResult.status !== 'QC_In_Review' 
                  ? 'Marquer pour Révision' 
                  : scanResult.status === 'QC_In_Review' ? 'Validation Finale' : 'Confirmer la Qualité'}
              </button>
           </div>
        )}

        {scanResult && actionState === 'stock' && (
           <div className="flex-1 flex flex-col animate-in slide-in-from-right-4 duration-300">
             <div className="flex items-center gap-3 mb-6">
               <button onClick={() => setActionState('None')} className="p-2 bg-zinc-200 rounded-full text-zinc-600">
                 <span className="material-symbols-outlined text-lg block">arrow_back</span>
               </button>
               <h2 className="text-lg font-bold text-blue-700">Mettre en Stock</h2>
             </div>
             
             <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex-1">
                <label className="block text-sm font-semibold text-zinc-700 mb-2">Choisir l'Emplacement / Entrepôt :</label>
                <select 
                  value={warehouseLocation} 
                  onChange={e => setWarehouseLocation(e.target.value)}
                  className="w-full border border-zinc-300 rounded-lg px-4 py-3 text-base font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  {locations && locations.length > 0 ? (
                    locations.map(loc => (
                      <option key={loc.id} value={loc.name}>
                        {loc.name} {loc.code ? `(${loc.code})` : ''} {loc.zone ? `— ${loc.zone}` : ''}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Entrepôt Principal">Entrepôt Principal (WH-MAIN)</option>
                      <option value="Zone d'Expédition">Zone d'Expédition (EXP-01)</option>
                      <option value="Magasin Produits Finis">Magasin Produits Finis (PF-MAG)</option>
                      <option value="Quai de Chargement">Quai de Chargement (QUAI-B)</option>
                    </>
                  )}
                </select>
                
                <p className="text-xs text-zinc-500 mt-4">
                  Ce carton / lot sera enregistré dans l'historique et transféré virtuellement vers cet emplacement personnalisé.
                </p>
              </div>

             <button 
               onClick={handleSubmit}
               disabled={isSubmitting}
               className="mt-6 w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
             >
               {isSubmitting ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined">save</span>}
               Valider le transfert
             </button>
           </div>
        )}

        {scanResult && actionState === 'non-conforme' && (
           <div className="flex-1 flex flex-col animate-in slide-in-from-right-4 duration-300">
             <div className="flex items-center gap-3 mb-6">
               <button onClick={() => setActionState('None')} className="p-2 bg-zinc-200 rounded-full text-zinc-600">
                 <span className="material-symbols-outlined text-lg block">arrow_back</span>
               </button>
               <h2 className="text-lg font-bold text-red-700">Carton Rejeté</h2>
             </div>
             
             <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex-1">
               <label className="block text-sm font-semibold text-zinc-700 mb-2">Raison du rejet (obligatoire) :</label>
               <textarea 
                 value={rejectionReason}
                 onChange={e => setRejectionReason(e.target.value)}
                 placeholder="Ex: Défaut de fabrication, quantité incorrecte..."
                 className="w-full border border-zinc-300 rounded-lg px-4 py-3 text-base min-h-[120px] focus:ring-2 focus:ring-red-500 focus:border-red-500"
               />
             </div>

             <button 
               onClick={handleSubmit}
               disabled={isSubmitting}
               className="mt-6 w-full bg-red-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
             >
               {isSubmitting ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined">gavel</span>}
               Confirmer le rejet
             </button>
           </div>
        )}
      </div>
    </div>
  );
}
