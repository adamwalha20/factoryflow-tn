import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMesStore } from '../store/mesStore';
import { useTenantStore } from '../store/tenantStore';
import { useLanguageStore } from '../store/language';
import { BonDeCommande, BonDeCommandeItem } from '../types/mes';
import { extractTextFromPdf, parseBcText } from '../services/pdfBcParser';
import toast from 'react-hot-toast';

interface BcFormItem {
  article_reference: string;
  article_designation: string;
  quantity: string;
  unit: string;
  colisage: string;
  of_id?: string;
  of_number?: string;
}

export function BonsDeCommande() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const { 
    bons_de_commande, 
    articles, 
    orders,
    loading, 
    error, 
    fetchInitialData, 
    addBonDeCommande, 
    updateBonDeCommande, 
    deleteBonDeCommande,
    generateOfsFromBc
  } = useMesStore();
  const { currentOrg } = useTenantStore();
  const { t } = useLanguageStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBcId, setEditingBcId] = useState<string | null>(null);
  const [deletingBcId, setDeletingBcId] = useState<string | null>(null);
  const [printBc, setPrintBc] = useState<BonDeCommande | null>(null);
  const [isGeneratingOf, setIsGeneratingOf] = useState<string | null>(null);
  const [isParsingPdf, setIsParsingPdf] = useState(false);

  // Form State
  const [bcNumber, setBcNumber] = useState('');
  const [customer, setCustomer] = useState('');
  const [referenceClient, setReferenceClient] = useState('');
  const [attention, setAttention] = useState('');
  const [depot, setDepot] = useState('DEPOT SFAX');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<'En attente' | 'En cours' | 'Terminé'>('En attente');
  const [mandrinType, setMandrinType] = useState('Standart Tunisie Tape');
  const [cartonType, setCartonType] = useState('Standart Tunisie Tape (Date/Code Opérateur/Quantité)');
  const [epaisseur, setEpaisseur] = useState('40Mu');

  // Multi-line items array
  const [items, setItems] = useState<BcFormItem[]>([
    { article_reference: '', article_designation: '', quantity: '1000', unit: 'RLX', colisage: '36' }
  ]);

  // Autocomplete state per item index
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingPdf(true);
    const toastId = toast.loading(`Lecture et analyse du PDF "${file.name}"...`);

    try {
      const text = await extractTextFromPdf(file);
      const parsed = parseBcText(text);

      setEditingBcId(null);
      setBcNumber(parsed.bc_number);
      setCustomer(parsed.customer);
      setReferenceClient(parsed.reference_client);
      setAttention(parsed.attention);
      setDepot(parsed.depot);
      setDueDate(parsed.due_date);
      setStatus('En attente');
      setMandrinType(parsed.mandrin_type);
      setCartonType(parsed.carton_type);
      setEpaisseur(parsed.epaisseur);

      setItems(parsed.items.map(it => ({
        article_reference: it.article_reference,
        article_designation: it.article_designation,
        quantity: String(it.quantity || 1000),
        unit: it.unit || 'RLX',
        colisage: String(it.colisage || 36)
      })));

      setIsModalOpen(true);
      toast.success(`✨ Bon de commande importé depuis le PDF (${parsed.items.length} articles détectés) !`, { id: toastId });
    } catch (err: any) {
      console.error('PDF parsing error:', err);
      toast.error(`Erreur lecture PDF : ${err?.message || 'Format non reconnu'}`, { id: toastId });
    } finally {
      setIsParsingPdf(false);
      if (e.target) e.target.value = '';
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleAddItemRow = () => {
    setItems(prev => [
      ...prev,
      { article_reference: '', article_designation: '', quantity: '1000', unit: 'RLX', colisage: '36' }
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) {
      toast.error('Un Bon de Commande doit comporter au moins 1 article.');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof BcFormItem, value: string) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSelectArticle = (index: number, article: any) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        article_reference: article.reference,
        article_designation: article.designation || article.name || article.reference,
        unit: article.unit || 'RLX',
        colisage: article.pieces_per_carton ? String(article.pieces_per_carton) : '36'
      };
      return updated;
    });
    setActiveItemIndex(null);
    setSearchQuery('');
  };

  const handleOpenAddModal = () => {
    setEditingBcId(null);
    setBcNumber(`BC-${new Date().getFullYear().toString().slice(-2)}S${Math.floor(1000 + Math.random() * 9000)}`);
    setCustomer('');
    setReferenceClient('BC ALIM.STOCK');
    setAttention('MR AMJAD');
    setDepot('DEPOT SFAX');
    setDueDate(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
    setStatus('En attente');
    setMandrinType('Standart Tunisie Tape');
    setCartonType('Standart Tunisie Tape (Date/Code Opérateur/Quantité)');
    setEpaisseur('40Mu');
    setItems([
      { article_reference: '', article_designation: '', quantity: '15120', unit: 'RLX', colisage: '36' }
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (bc: BonDeCommande) => {
    setEditingBcId(bc.id);
    setBcNumber(bc.bc_number);
    setCustomer(bc.customer);
    setReferenceClient(bc.reference_client || '');
    setAttention(bc.attention || '');
    setDepot(bc.depot || 'DEPOT SFAX');
    setDueDate(bc.due_date ? bc.due_date.slice(0, 10) : '');
    setStatus(bc.status as any || 'En attente');
    setMandrinType(bc.mandrin_type || 'Standart Tunisie Tape');
    setCartonType(bc.carton_type || 'Standart Tunisie Tape');
    setEpaisseur(bc.epaisseur || '40Mu');

    if (bc.items && bc.items.length > 0) {
      setItems(bc.items.map(it => ({
        article_reference: it.article_reference || '',
        article_designation: it.article_designation || '',
        quantity: String(it.quantity || 0),
        unit: it.unit || 'RLX',
        colisage: String(it.colisage || 36),
        of_id: it.of_id,
        of_number: it.of_number
      })));
    } else {
      setItems([{
        article_reference: bc.article_reference || '',
        article_designation: bc.article_designation || '',
        quantity: String(bc.quantity || 1000),
        unit: 'RLX',
        colisage: '36'
      }]);
    }

    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bcNumber.trim() || !customer.trim()) {
      toast.error('Veuillez remplir le N° de BC et le nom du client.');
      return;
    }

    const parsedItems: BonDeCommandeItem[] = items.map(it => ({
      article_reference: it.article_reference.trim(),
      article_designation: it.article_designation.trim(),
      quantity: parseInt(it.quantity) || 0,
      unit: it.unit || 'RLX',
      colisage: parseInt(it.colisage) || 36,
      mandrin_type: mandrinType,
      carton_type: cartonType,
      epaisseur: epaisseur,
      of_id: it.of_id,
      of_number: it.of_number
    }));

    const totalQty = parsedItems.reduce((sum, it) => sum + (it.quantity || 0), 0);
    const firstItem = parsedItems[0];

    const payload: Partial<BonDeCommande> = {
      bc_number: bcNumber.trim(),
      customer: customer.trim(),
      reference_client: referenceClient.trim() || null,
      attention: attention.trim() || null,
      depot: depot.trim() || null,
      due_date: dueDate || null,
      status: status,
      mandrin_type: mandrinType,
      carton_type: cartonType,
      epaisseur: epaisseur,
      quantity: totalQty,
      article_reference: firstItem?.article_reference || null,
      article_designation: firstItem?.article_designation || null,
      items: parsedItems
    };

    try {
      if (editingBcId) {
        await updateBonDeCommande(editingBcId, payload);
        toast.success('Bon de commande mis à jour !');
      } else {
        await addBonDeCommande(payload);
        toast.success('Nouveau Bon de Commande multi-lignes créé avec succès !');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error('Erreur : ' + err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBcId) return;
    try {
      await deleteBonDeCommande(deletingBcId);
      toast.success('Bon de commande supprimé.');
      setDeletingBcId(null);
    } catch (err: any) {
      toast.error('Erreur suppression : ' + err.message);
    }
  };

  const handleGenerateOfs = async (bcId: string) => {
    setIsGeneratingOf(bcId);
    try {
      const created = await generateOfsFromBc(bcId);
      toast.success(`${created.length} Ordre(s) de Fabrication généré(s) pour ce BC !`);
    } catch (err: any) {
      toast.error('Erreur génération OFs : ' + err.message);
    } finally {
      setIsGeneratingOf(null);
    }
  };

  const getFilteredArticles = (query: string) => {
    const q = (query || '').toLowerCase().trim();
    if (!q) return articles.slice(0, 15);
    return articles.filter(a => 
      a.reference?.toLowerCase().includes(q) || 
      a.designation?.toLowerCase().includes(q)
    ).slice(0, 15);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-[28px]">receipt_long</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Bons de Commande Internes (BC)</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Gestion des commandes clients multi-articles et génération automatique des Ordres de Fabrication (OF)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePdfUpload}
            accept=".pdf,application/pdf"
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isParsingPdf}
            className="px-4 py-3 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 hover:border-blue-400 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px] text-rose-500">picture_as_pdf</span>
            <span>{isParsingPdf ? 'Lecture PDF...' : 'Importer depuis PDF'}</span>
          </button>

          <button 
            onClick={handleOpenAddModal}
            className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-500/20 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Nouveau Bon de Commande</span>
          </button>
        </div>
      </div>

      {/* Main BC Table */}
      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                <th className="p-4">N° Bon de Commande</th>
                <th className="p-4">Client & Référence</th>
                <th className="p-4">Articles & Lignes Commandées</th>
                <th className="p-4 text-center">Quantité Totale</th>
                <th className="p-4 text-center">Ordres de Fab (OF)</th>
                <th className="p-4">Échéance</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bons_de_commande.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-400 font-medium">
                    Aucun bon de commande enregistré. Cliquez sur "+ Nouveau Bon de Commande" pour commencer.
                  </td>
                </tr>
              ) : (
                bons_de_commande.map((bc) => {
                  const bcItems = (bc.items && bc.items.length > 0) ? bc.items : [
                    {
                      article_reference: bc.article_reference || 'Article',
                      article_designation: bc.article_designation || '',
                      quantity: bc.quantity || 0,
                      unit: 'RLX'
                    }
                  ];

                  const totalQty = bcItems.reduce((acc, it) => acc + (it.quantity || 0), 0);
                  
                  // Comprehensive search for all OFs belonging to this BC
                  const linkedOfs = orders.filter(o => 
                    (bc.id && o.bc_id === bc.id) ||
                    (bc.bc_number && (o.bc_number === bc.bc_number || o.po_number === bc.bc_number)) ||
                    (bc.bc_number && o.observation && o.observation.includes(bc.bc_number))
                  );

                  // All OFs exist
                  const allOfsGenerated = linkedOfs.length >= bcItems.length && bcItems.length > 0;
                  
                  // All OFs are actually finished in the workshop
                  const allOfsFinished = linkedOfs.length > 0 && linkedOfs.every(o => 
                    o.status === 'Completed' || o.status === 'Closed' || (o.quantity_planned || 0) <= 0
                  );

                  const effectiveStatus = (bc.status === 'Terminé' || (allOfsGenerated && allOfsFinished))
                    ? 'Terminé'
                    : (linkedOfs.length > 0 ? 'En cours' : (bc.status || 'En attente'));

                  return (
                    <tr key={bc.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="p-4 font-mono font-black text-blue-900 text-sm">
                        {bc.bc_number}
                        {bc.depot && (
                          <span className="block text-[10px] text-gray-500 font-sans font-normal mt-0.5">
                            📍 {bc.depot}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-gray-900 block">{bc.customer}</span>
                        {bc.reference_client && (
                          <span className="text-[11px] text-gray-500 block font-mono">
                            Réf: {bc.reference_client}
                          </span>
                        )}
                        {bc.attention && (
                          <span className="text-[10px] text-indigo-600 font-semibold block">
                            Attn: {bc.attention}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="space-y-1 max-w-md">
                          {bcItems.map((item, idx) => (
                            <div key={idx} className="bg-gray-50 p-2 rounded-xl border border-gray-200/80 flex items-center justify-between gap-2">
                              <div>
                                <span className="font-mono font-bold text-gray-900">{item.article_reference}</span>
                                {item.article_designation && (
                                  <span className="text-[11px] text-gray-600 block truncate max-w-xs">{item.article_designation}</span>
                                )}
                              </div>
                              <span className="font-mono font-black text-indigo-600 bg-white px-2 py-0.5 rounded-lg border border-gray-200 shrink-0">
                                {item.quantity?.toLocaleString()} {item.unit || 'RLX'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-center font-mono font-black text-gray-900 text-sm">
                        {totalQty.toLocaleString()}
                      </td>
                      <td className="p-4 text-center">
                        {linkedOfs.length > 0 ? (
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="flex flex-wrap justify-center gap-1">
                              {linkedOfs.map(of => {
                                const isDone = of.status === 'Completed' || of.status === 'Closed';
                                return (
                                  <span
                                    key={of.id}
                                    onClick={() => navigate('/admin/ordres-fabrication')}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-colors flex items-center gap-1 border ${
                                      isDone 
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                        : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                                    }`}
                                    title={`Voir cet OF (${of.status})`}
                                  >
                                    <span className="material-symbols-outlined text-[12px]">
                                      {isDone ? 'check_circle' : 'precision_manufacturing'}
                                    </span>
                                    {of.of_number}
                                  </span>
                                );
                              })}
                            </div>
                            {!allOfsGenerated && (
                              <button
                                onClick={() => handleGenerateOfs(bc.id)}
                                disabled={isGeneratingOf === bc.id}
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-bold transition-all shadow-xs flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[12px]">bolt</span>
                                <span>{isGeneratingOf === bc.id ? 'Création...' : `+ Générer reste (${bcItems.length - linkedOfs.length})`}</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleGenerateOfs(bc.id)}
                            disabled={isGeneratingOf === bc.id}
                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-[11px] font-bold transition-all shadow-xs flex items-center gap-1 mx-auto"
                          >
                            <span className="material-symbols-outlined text-[14px]">bolt</span>
                            <span>{isGeneratingOf === bc.id ? 'Création...' : 'Générer OFs'}</span>
                          </button>
                        )}
                      </td>
                      <td className="p-4 font-mono text-gray-600">
                        {bc.due_date ? new Date(bc.due_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 w-fit ${
                          effectiveStatus === 'Terminé' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          effectiveStatus === 'En cours' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          <span className="material-symbols-outlined text-[12px]">
                            {effectiveStatus === 'Terminé' ? 'task_alt' : effectiveStatus === 'En cours' ? 'autorenew' : 'schedule'}
                          </span>
                          {effectiveStatus}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Print BC Button */}
                          <button
                            onClick={() => setPrintBc(bc)}
                            title="Imprimer Bon de Commande Interne"
                            className="p-2 text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-xl transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">print</span>
                          </button>
                          {/* Edit BC Button */}
                          <button
                            onClick={() => handleOpenEditModal(bc)}
                            title="Modifier"
                            className="p-2 text-slate-600 hover:text-gray-900 bg-slate-100 hover:bg-gray-200 rounded-xl transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          {/* Delete BC Button */}
                          <button
                            onClick={() => setDeletingBcId(bc.id)}
                            title="Supprimer"
                            className="p-2 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📝 MULTI-LINE BON DE COMMANDE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-gray-200 max-h-[92vh] flex flex-col overflow-hidden font-sans">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <span className="material-symbols-outlined">description</span>
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900">
                    {editingBcId ? "Modifier le Bon de Commande" : "Nouveau Bon de Commande Interne"}
                  </h2>
                  <p className="text-xs text-gray-500">Saisie multi-articles avec génération individuelle des OFs</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Form Content */}
            <form id="bcMultiForm" onSubmit={handleSubmitForm} className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* 📄 PDF Auto-Fill Quick Action Dropzone */}
              <div 
                onClick={() => modalFileInputRef.current?.click()}
                className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/60 hover:bg-blue-50 p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-4 group shadow-xs"
              >
                <input
                  type="file"
                  ref={modalFileInputRef}
                  onChange={handlePdfUpload}
                  accept=".pdf,application/pdf"
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                    <span className="material-symbols-outlined text-[24px]">upload_file</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-blue-900 uppercase">
                      Remplir automatiquement depuis un fichier PDF
                    </h4>
                    <p className="text-[11px] text-blue-700">
                      Importez votre Bon de Commande PDF pour extraire le N° BC, Client, Date, et tous les articles instantanément
                    </p>
                  </div>
                </div>
                <span className="px-3.5 py-2 bg-blue-600 group-hover:bg-blue-500 text-white rounded-xl text-xs font-black shrink-0 shadow-sm flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                  <span>{isParsingPdf ? 'Lecture...' : 'Choisir PDF'}</span>
                </span>
              </div>

              {/* General Order Information */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200/80">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">N° Bon de Commande *</label>
                  <input
                    required
                    type="text"
                    placeholder="ex: PF26S0374"
                    value={bcNumber}
                    onChange={e => setBcNumber(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm font-bold font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Client *</label>
                  <input
                    required
                    type="text"
                    placeholder="ex: alim.stock"
                    value={customer}
                    onChange={e => setCustomer(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Référence Client</label>
                  <input
                    type="text"
                    placeholder="ex: BC ALIM.STOCK"
                    value={referenceClient}
                    onChange={e => setReferenceClient(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">À l'Attention de (Attention)</label>
                  <input
                    type="text"
                    placeholder="ex: MR AMJAD"
                    value={attention}
                    onChange={e => setAttention(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Dépôt / Destination</label>
                  <input
                    type="text"
                    placeholder="ex: DEPOT SFAX"
                    value={depot}
                    onChange={e => setDepot(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Date de Livraison Souhaitée</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-mono"
                  />
                </div>
              </div>

              {/* 📦 MULTI-LINE ARTICLES SECTION */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600 text-[20px]">category</span>
                    <span>Articles Commandés (Lignes OF) ({items.length})</span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>+ Ajouter un Article sur ce BC</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div 
                      key={index}
                      className="bg-white border-2 border-slate-200 hover:border-blue-300 rounded-2xl p-4 transition-all shadow-xs relative space-y-3"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                          Article #{index + 1}
                        </span>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(index)}
                            className="text-xs font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 hover:bg-rose-50 px-2 py-1 rounded-lg"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            <span>Supprimer</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        {/* Reference with Dropdown */}
                        <div className="sm:col-span-4 relative">
                          <label className="block text-[11px] font-bold text-gray-600 mb-1 uppercase">Référence Article *</label>
                          <input
                            required
                            type="text"
                            placeholder="Rechercher référence..."
                            value={item.article_reference}
                            onFocus={() => {
                              setActiveItemIndex(index);
                              setSearchQuery(item.article_reference);
                            }}
                            onChange={e => {
                              handleItemChange(index, 'article_reference', e.target.value);
                              setSearchQuery(e.target.value);
                              setActiveItemIndex(index);
                            }}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm font-bold font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />

                          {/* Autocomplete Dropdown */}
                          {activeItemIndex === index && (
                            <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-30 max-h-48 overflow-y-auto">
                              {getFilteredArticles(searchQuery).map(art => (
                                <div
                                  key={art.id}
                                  onMouseDown={() => handleSelectArticle(index, art)}
                                  className="p-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
                                >
                                  <div className="font-bold text-gray-900 font-mono text-xs">{art.reference}</div>
                                  <div className="text-[11px] text-gray-500 truncate">{art.designation || (art as any).name || art.reference}</div>
                                </div>
                              ))}
                              {getFilteredArticles(searchQuery).length === 0 && (
                                <div className="p-3 text-center text-xs text-gray-400">Aucun article trouvé</div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Designation */}
                        <div className="sm:col-span-4">
                          <label className="block text-[11px] font-bold text-gray-600 mb-1 uppercase">Désignation</label>
                          <input
                            type="text"
                            placeholder="ex: ROULEAUX P.P TRANSPARENT"
                            value={item.article_designation}
                            onChange={e => handleItemChange(index, 'article_designation', e.target.value)}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        {/* Quantity */}
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-gray-600 mb-1 uppercase">Quantité *</label>
                          <input
                            required
                            type="number"
                            min="1"
                            placeholder="15120"
                            value={item.quantity}
                            onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm font-bold font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        {/* Unit */}
                        <div className="sm:col-span-1">
                          <label className="block text-[11px] font-bold text-gray-600 mb-1 uppercase">Unité</label>
                          <input
                            type="text"
                            placeholder="RLX"
                            value={item.unit}
                            onChange={e => handleItemChange(index, 'unit', e.target.value)}
                            className="w-full border border-gray-300 rounded-xl px-2 py-2 text-sm text-center font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        {/* Colisage */}
                        <div className="sm:col-span-1">
                          <label className="block text-[11px] font-bold text-gray-600 mb-1 uppercase" title="Pièces par carton">Colisage</label>
                          <input
                            type="number"
                            min="1"
                            placeholder="36"
                            value={item.colisage}
                            onChange={e => handleItemChange(index, 'colisage', e.target.value)}
                            className="w-full border border-gray-300 rounded-xl px-2 py-2 text-sm text-center font-bold font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Packaging Specifications & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Type de Mandrin</label>
                  <input
                    type="text"
                    placeholder="Standart Tunisie Tape"
                    value={mandrinType}
                    onChange={e => setMandrinType(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Type de Carton</label>
                  <input
                    type="text"
                    placeholder="Standart Tunisie Tape"
                    value={cartonType}
                    onChange={e => setCartonType(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Taille / Épaisseur</label>
                  <input
                    type="text"
                    placeholder="ex: 40Mu"
                    value={epaisseur}
                    onChange={e => setEpaisseur(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs bg-white"
                  />
                </div>
              </div>

            </form>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold transition-colors"
              >
                Annuler
              </button>
              <button
                form="bcMultiForm"
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>{editingBcId ? 'Enregistrer les Modifications' : 'Créer le Bon de Commande'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 🖨️ OFFICIAL PRINT VIEW MODAL */}
      {printBc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl p-8 space-y-6 text-slate-900 border border-gray-300 font-sans print:p-0 print:border-none print:shadow-none">
            
            {/* Top Print Actions */}
            <div className="flex justify-between items-center pb-4 border-b border-gray-200 print:hidden">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">print</span>
                <h3 className="font-black text-lg">Aperçu Impression Bon de Commande Interne</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md"
                >
                  <span className="material-symbols-outlined text-[18px]">print</span>
                  <span>Imprimer</span>
                </button>
                <button
                  onClick={() => setPrintBc(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold text-xs"
                >
                  Fermer
                </button>
              </div>
            </div>

            {/* Official Printable Header Box */}
            <div className="border-2 border-slate-900 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900 font-serif uppercase">
                  {currentOrg?.name || 'TUNISIE TAPE'}
                </h2>
                <p className="text-[11px] text-slate-600 mt-1 leading-tight">
                  Zone Industrielle Poudrière 1 Sfax<br />
                  Usine : Route Mahdia Km 11 Sfax<br />
                  Dépôt Tunis : Av. Mustapha Mohsen Borj Louzir Ariana Tunis<br />
                  Dépôt Msaken : Route Kairouan Rue Boujneh 4070 Msaken
                </p>
              </div>
              <div className="text-right text-[11px] text-slate-600 leading-tight">
                <p>Tél : 74 287 222 -- Fax : 74 287 016</p>
                <p>Email : commercialsfax@tunisietape.com</p>
                <p>commercialsfax1@tunisietape.com</p>
              </div>
            </div>

            {/* Order & Attention Box */}
            <div className="grid grid-cols-2 gap-4 items-center">
              <div className="space-y-1 text-sm font-serif">
                <p><strong>Date :</strong> {printBc.created_at ? new Date(printBc.created_at).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                <p><strong>Numéro :</strong> {printBc.bc_number}</p>
                <p><strong>Référence :</strong> {printBc.reference_client || `BC ${printBc.customer.toUpperCase()}`}</p>
              </div>

              <div className="border-2 border-slate-900 rounded-2xl p-4 text-center">
                <p className="text-xs font-bold text-slate-600 uppercase">Attention :</p>
                <p className="text-lg font-black text-slate-900 font-serif uppercase mt-1">
                  {printBc.attention || printBc.customer}
                </p>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center pt-2">
              <h1 className="text-2xl font-black uppercase tracking-wider font-serif underline decoration-2 underline-offset-4">
                BON DE COMMANDE INTERNE
              </h1>
              {printBc.depot && (
                <p className="text-sm font-black font-serif mt-1">Dépôt : {printBc.depot}</p>
              )}
            </div>

            {/* Multi-Line Items Table */}
            <div className="border-2 border-slate-900 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs font-serif border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-900 bg-slate-100 text-slate-900 font-bold uppercase">
                    <th className="p-3 border-r border-slate-900">Référence</th>
                    <th className="p-3 border-r border-slate-900">Désignation</th>
                    <th className="p-3 border-r border-slate-900 text-center">Quantité</th>
                    <th className="p-3 border-r border-slate-900 text-center">Unité</th>
                    <th className="p-3 text-center">Colisage</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-slate-900">
                  {((printBc.items && printBc.items.length > 0) ? printBc.items : [
                    {
                      article_reference: printBc.article_reference || '',
                      article_designation: printBc.article_designation || '',
                      quantity: printBc.quantity || 0,
                      unit: 'RLX',
                      colisage: 36
                    }
                  ]).map((it, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-3 font-bold border-r border-slate-900 font-mono">{it.article_reference}</td>
                      <td className="p-3 border-r border-slate-900 uppercase">{it.article_designation}</td>
                      <td className="p-3 text-center font-bold border-r border-slate-900 font-mono text-sm">{it.quantity?.toLocaleString()}</td>
                      <td className="p-3 text-center border-r border-slate-900">{it.unit || 'RLX'}</td>
                      <td className="p-3 text-center font-mono">{it.colisage || 36}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Packaging Specs & Signatures */}
            <div className="border-2 border-slate-900 rounded-xl p-4 text-xs font-serif space-y-1">
              <p><strong>Carton :</strong> {printBc.carton_type || 'Standart Tunisie Tape'}</p>
              <p><strong>Mandrin :</strong> {printBc.mandrin_type || 'Standart Tunisie Tape'}</p>
              {printBc.epaisseur && <p><strong>Taille / Épaisseur :</strong> {printBc.epaisseur}</p>}
            </div>

            <div className="grid grid-cols-2 gap-8 pt-4 text-center text-xs font-serif">
              <div className="border-t border-slate-900 pt-2">
                <p className="font-bold">Visa Responsable Commercial / Dépôt</p>
              </div>
              <div className="border-t border-slate-900 pt-2">
                <p className="font-bold">Visa Responsable Production</p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingBcId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-gray-200 text-center space-y-4 font-sans">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[32px]">warning</span>
            </div>
            <h3 className="text-xl font-black text-gray-900">Supprimer le Bon de Commande ?</h3>
            <p className="text-xs text-gray-500">
              Cette action est irréversible. Les Ordres de Fabrication associés ne seront pas supprimés automatiquement.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeletingBcId(null)}
                className="w-1/2 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition-colors shadow-md shadow-rose-600/20"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
