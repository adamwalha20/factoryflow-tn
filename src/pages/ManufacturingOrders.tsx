import React, { useState, useEffect } from 'react';
import { useMesStore } from '../store/mesStore';
import { useProductionStore } from '../store/production';
import { useLanguageStore } from '../store/language';
import toast from 'react-hot-toast';
import { scheduleOrders } from '../lib/ai';

export function ManufacturingOrders() {
  const { orders, articles, production_entries, bons_de_commande, loading, error, fetchInitialData, addOrder, updateOrder, deleteOrder, updateOrderStatus, generateOfsFromBc } = useMesStore();
  const { machines, fetchInitialData: fetchProductionData } = useProductionStore();
  const { t } = useLanguageStore();

  const initialFormState = {
    of_number: '',
    po_number: '',
    customer: '',
    article_id: '',
    quantity_planned: '',
    priority: 'Moyenne',
    due_date: '',
    observation: '',
    mandrin_type: '',
    planned_axes: '',
    planned_cartons: '',
    colisage: '',
    adhesif_color: '',
    carton_model: '',
    palettisation: '',
    machine_id: '',
    planned_start_date: '',
    planned_end_date: ''
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialFormState);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);

  useEffect(() => {
    fetchInitialData();
    fetchProductionData();
  }, [fetchInitialData, fetchProductionData]);

  const handleAISchedule = async () => {
    const pendingOrders = orders.filter(o => o.status === 'Draft' || o.status === 'Planned');
    if (pendingOrders.length === 0) {
      toast('Aucun ordre en attente à planifier.', { icon: 'ℹ️' });
      return;
    }

    setIsScheduling(true);
    const toastId = toast.loading('Calcul du planning optimal par IA...');
    try {
      const scheduleData = await scheduleOrders(pendingOrders, machines, articles);
      
      let count = 0;
      for (const item of scheduleData.schedule || []) {
        if (item.of_id && item.machine_id) {
          await updateOrder(item.of_id, {
            machine_id: item.machine_id,
            planned_start_date: item.planned_start_date || null,
            planned_end_date: item.planned_end_date || null,
            status: 'Planned'
          });
          count++;
        }
      }
      toast.success(`Planification IA réussie : ${count} ordres assignés !`, { id: toastId });
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setIsScheduling(false);
    }
  };

  if (loading) {
    return <div className="p-6">Chargement des Ordres de Fabrication...</div>;
  }

  if (error) {
    return <div className="p-6 text-error">Erreur: {error}</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-700 border border-gray-200';
      case 'Planned': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'In Production': return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
      case 'Completed': return 'bg-green-50 text-green-700 border border-green-200';
      case 'Closed': return 'bg-red-50 text-red-700 border border-red-200';
      default: return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Draft': return 'Brouillon';
      case 'Planned': return 'Planifié';
      case 'In Production': return 'En Production';
      case 'Completed': return 'Terminé';
      case 'Closed': return 'Clôturé';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Basse': return 'bg-gray-100 text-gray-700 border border-gray-200';
      case 'Moyenne': return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
      case 'Haute': return 'bg-red-50 text-red-700 border border-red-200';
      default: return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  const handleDeleteConfirm = async () => {
    if (deletingOrderId) {
      try {
        await deleteOrder(deletingOrderId);
        toast.success('Ordre de fabrication supprimé !');
      } catch (err: any) {
        toast.error('Erreur lors de la suppression');
      } finally {
        setDeletingOrderId(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        of_number: formData.of_number,
        po_number: formData.po_number || null,
        customer: formData.customer,
        article_id: formData.article_id,
        quantity_planned: Number(formData.quantity_planned) || 0,
        priority: formData.priority as any,
        due_date: formData.due_date || null,
        observation: formData.observation || null,
        mandrin_type: formData.mandrin_type || null,
        planned_axes: formData.planned_axes ? Number(formData.planned_axes) : null,
        planned_cartons: formData.planned_cartons ? Number(formData.planned_cartons) : null,
        colisage: formData.colisage || null,
        adhesif_color: formData.adhesif_color || null,
        carton_model: formData.carton_model || null,
        palettisation: formData.palettisation ? Number(formData.palettisation) : null,
        machine_id: formData.machine_id || null,
        planned_start_date: formData.planned_start_date ? new Date(formData.planned_start_date).toISOString() : null,
        planned_end_date: formData.planned_end_date ? new Date(formData.planned_end_date).toISOString() : null
      };

      if (editingOrderId) {
        await updateOrder(editingOrderId, payload);
        toast.success('Ordre de fabrication mis à jour !');
      } else {
        await addOrder({ ...payload, status: payload.machine_id ? 'Planned' : 'Draft' });
        toast.success('Ordre de fabrication créé !');
      }
      setIsModalOpen(false);
      setEditingOrderId(null);
      setFormData(initialFormState);
    } catch (err: any) {
      console.error(err);
      toast.error('Erreur: ' + err.message);
    }
  };

  const handleStartOrder = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'In Production');
      toast.success('Ordre de fabrication démarré !');
    } catch (error) {
      toast.error('Erreur lors du démarrage');
    }
  };

  const handleEditClick = (order: any) => {
    setEditingOrderId(order.id);
    setFormData({
      of_number: order.of_number,
      po_number: order.po_number || '',
      customer: order.customer || '',
      article_id: order.article_id || '',
      quantity_planned: order.quantity_planned?.toString() || '',
      priority: order.priority || 'Moyenne',
      due_date: order.due_date ? order.due_date.split('T')[0] : '',
      observation: order.observation || '',
      mandrin_type: order.mandrin_type || '',
      planned_axes: order.planned_axes?.toString() || '',
      planned_cartons: order.planned_cartons?.toString() || '',
      colisage: order.colisage || '',
      adhesif_color: order.adhesif_color || '',
      carton_model: order.carton_model || '',
      palettisation: order.palettisation?.toString() || '',
      machine_id: order.machine_id || '',
      planned_start_date: order.planned_start_date ? new Date(order.planned_start_date).toISOString().slice(0, 16) : '',
      planned_end_date: order.planned_end_date ? new Date(order.planned_end_date).toISOString().slice(0, 16) : ''
    });
    setIsModalOpen(true);
  };

  const generateNextOfNumber = (ordersList: any[]) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    const prefix = `OF-${dateStr}-`;

    let maxSeq = 0;
    (ordersList || []).forEach(order => {
      const ofNum = (order.of_number || '').trim();
      if (ofNum.startsWith(prefix)) {
        const seqPart = parseInt(ofNum.substring(prefix.length), 10);
        if (!isNaN(seqPart) && seqPart > maxSeq) {
          maxSeq = seqPart;
        }
      } else if (ofNum.includes(dateStr)) {
        const parts = ofNum.split('-');
        const last = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(last) && last > maxSeq) {
          maxSeq = last;
        }
      }
    });

    const nextSeq = String(maxSeq + 1).padStart(3, '0');
    return `${prefix}${nextSeq}`;
  };

  const handleAddClick = () => {
    setEditingOrderId(null);
    const nextOf = generateNextOfNumber(orders);

    setFormData({
      ...initialFormState,
      of_number: nextOf
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t.manufacturing_orders}</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">{t.overview}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleAISchedule}
            disabled={isScheduling}
            className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 px-4 py-2 rounded-md font-bold text-sm transition-colors flex items-center gap-2 shadow-sm"
          >
            {isScheduling ? (
              <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
            ) : (
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            )}
            {t.dash_ai_btn}
          </button>
          <button 
            onClick={handleAddClick}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            {t.add}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden card-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 table-header-sticky">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.order}</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.purchase_orders}</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.articles}</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.machine}</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.status}</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.target}</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-on-surface-variant">
                    Aucun ordre de fabrication trouvé.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const article = articles.find(a => a.id === order.article_id);
                  const machine = machines.find(m => m.id === order.machine_id);
                  const isRunning = order.status === 'In Production' || order.status === 'Completed' || order.status === 'Closed';
                  
                  // In this system, quantity_planned is actually mutated to represent the remaining quantity
                  const remaining = order.quantity_planned || 0;

                  return (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors text-sm group">
                      <td className="p-4 font-bold text-gray-900">{order.of_number}</td>
                      <td className="p-4 font-medium text-gray-500">
                        {order.bc_number ? (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-mono text-xs font-bold">
                            {order.bc_number}
                          </span>
                        ) : order.po_number ? (
                          order.po_number
                        ) : '-'}
                      </td>
                      <td className="p-4 font-semibold text-gray-700">{order.customer}</td>
                      <td className="p-4 text-gray-600">{article?.reference || 'N/A'}</td>
                      <td className="p-4">
                        {machine ? (
                          <span className="px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-xs font-bold">
                            {machine.name} {machine.code ? `(${machine.code})` : ''}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-xs">Non planifié</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-gray-900">{remaining} restants</span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => !isRunning && handleStartOrder(order.id)} 
                            disabled={isRunning}
                            className={`p-1.5 rounded transition-colors ${isRunning ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                            title={isRunning ? "L'ordre a déjà démarré" : "Démarrer l'ordre"}
                          >
                            <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                          </button>
                          <button onClick={() => handleEditClick(order)} className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors rounded hover:bg-gray-100">
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button onClick={() => setDeletingOrderId(order.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded hover:bg-red-50">
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-0 w-full max-w-4xl shadow-2xl border border-gray-200 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-2xl font-bold text-gray-900">{editingOrderId ? "Modifier l'Ordre" : "Créer un Ordre de Fabrication & Planning"}</h2>
            </div>
            
            <form id="ofForm" onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-8 grow">
              
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-primary flex items-center gap-2 border-b border-gray-100 pb-2">
                  <span className="material-symbols-outlined">receipt_long</span>
                  1. Bon de Commande Interne (BC)
                </h3>
                
                {/* BC Selector and details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Sélectionner un Bon de Commande</label>
                    <select 
                      value={formData.po_number} 
                      onChange={e => {
                        const selectedBc = bons_de_commande.find(bc => bc.bc_number === e.target.value);
                        const bcItems = (selectedBc?.items && selectedBc.items.length > 0)
                          ? selectedBc.items
                          : (selectedBc ? [{
                              article_reference: selectedBc.article_reference || '',
                              article_designation: selectedBc.article_designation || '',
                              quantity: selectedBc.quantity || 0,
                              unit: 'RLX',
                              colisage: 36,
                              mandrin_type: selectedBc.mandrin_type || '',
                              carton_type: selectedBc.carton_type || '',
                              epaisseur: selectedBc.epaisseur || ''
                            }] : []);

                        const firstItem = bcItems[0];
                        let matchedArticleId = formData.article_id;
                        
                        if (firstItem && firstItem.article_reference) {
                          const article = articles.find(a => a.reference === firstItem.article_reference);
                          if (article) matchedArticleId = article.id;
                        }

                        setFormData({
                          ...formData, 
                          po_number: e.target.value,
                          customer: selectedBc ? selectedBc.customer : formData.customer,
                          due_date: selectedBc && selectedBc.due_date ? selectedBc.due_date.split('T')[0] : formData.due_date,
                          article_id: matchedArticleId,
                          quantity_planned: firstItem ? String(firstItem.quantity || 0) : (selectedBc && selectedBc.quantity ? selectedBc.quantity.toString() : formData.quantity_planned),
                          colisage: firstItem && firstItem.colisage ? String(firstItem.colisage) : formData.colisage,
                          mandrin_type: (firstItem && firstItem.mandrin_type) || (selectedBc && selectedBc.mandrin_type) || formData.mandrin_type,
                          carton_model: (firstItem && firstItem.carton_type) || (selectedBc && selectedBc.carton_type) || formData.carton_model
                        });
                      }} 
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary font-bold"
                    >
                      <option value="">-- Sans Bon de Commande --</option>
                      {bons_de_commande.map(bc => {
                        const count = bc.items && bc.items.length > 0 ? bc.items.length : 1;
                        return (
                          <option key={bc.id} value={bc.bc_number}>
                            {bc.bc_number} - {bc.customer} ({count} article{count > 1 ? 's' : ''})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Client *</label>
                    <input required type="text" placeholder="ex: AFRICA TRADE" value={formData.customer} onChange={e => setFormData({...formData, customer: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary font-bold" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Date de livraison prévue</label>
                    <input type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary" />
                  </div>
                </div>

                {/* If selected BC has items, show item selector & 1-click batch generator */}
                {(() => {
                  const selectedBc = bons_de_commande.find(bc => bc.bc_number === formData.po_number);
                  const bcItems = selectedBc?.items && selectedBc.items.length > 0 ? selectedBc.items : null;
                  if (!selectedBc || !bcItems) return null;

                  return (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[18px] text-blue-600">format_list_bulleted</span>
                            <span>Articles présents sur ce Bon de Commande ({bcItems.length})</span>
                          </h4>
                          <p className="text-[11px] text-blue-700 mt-0.5">
                            Sélectionnez l'article spécifique pour cet OF ou générez tous les OFs du BC d'un coup.
                          </p>
                        </div>

                        {bcItems.length > 1 && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const created = await generateOfsFromBc(selectedBc.id);
                                toast.success(`${created.length} Ordres de Fabrication créés automatiquement pour chaque article !`);
                                setIsModalOpen(false);
                              } catch (err: any) {
                                toast.error('Erreur : ' + err.message);
                              }
                            }}
                            className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-black shadow-md flex items-center gap-1.5 shrink-0"
                          >
                            <span className="material-symbols-outlined text-[16px]">bolt</span>
                            <span>Créer les {bcItems.length} OFs en 1 Clic</span>
                          </button>
                        )}
                      </div>

                      {/* Select which specific article line of this BC to build this OF for */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {bcItems.map((item, idx) => {
                          const isSelected = articles.find(a => a.id === formData.article_id)?.reference === item.article_reference && formData.quantity_planned === String(item.quantity);
                          return (
                            <button
                              type="button"
                              key={idx}
                              onClick={() => {
                                let matchedId = formData.article_id;
                                const art = articles.find(a => a.reference === item.article_reference);
                                if (art) matchedId = art.id;

                                setFormData({
                                  ...formData,
                                  article_id: matchedId,
                                  quantity_planned: String(item.quantity || 0),
                                  colisage: item.colisage ? String(item.colisage) : formData.colisage,
                                  mandrin_type: item.mandrin_type || selectedBc.mandrin_type || formData.mandrin_type,
                                  carton_model: item.carton_type || selectedBc.carton_type || formData.carton_model,
                                  observation: `Article #${idx + 1} du BC ${selectedBc.bc_number}`
                                });
                              }}
                              className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                                isSelected
                                  ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                                  : 'bg-white text-slate-900 border-blue-200 hover:border-blue-400'
                              }`}
                            >
                              <div>
                                <span className={`text-[10px] font-mono font-bold block ${isSelected ? 'text-blue-200' : 'text-blue-600'}`}>
                                  LIGNE #{idx + 1}
                                </span>
                                <span className="font-mono font-bold text-xs">{item.article_reference}</span>
                                {item.article_designation && (
                                  <span className={`text-[11px] block truncate max-w-xs ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                                    {item.article_designation}
                                  </span>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <span className={`font-mono font-black text-sm block ${isSelected ? 'text-white' : 'text-blue-900'}`}>
                                  {item.quantity?.toLocaleString()} {item.unit || 'RLX'}
                                </span>
                                <span className={`text-[10px] ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                                  Colisage: {item.colisage || 36}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-primary flex items-center gap-2 border-b border-gray-100 pb-2">
                  <span className="material-symbols-outlined">inventory_2</span>
                  2. Spécifications Produit & Emballage
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Article / Produit *</label>
                    <select required value={formData.article_id} onChange={e => setFormData({...formData, article_id: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary">
                      <option value="">-- Sélectionner l'Article --</option>
                      {articles.map(a => (
                        <option key={a.id} value={a.id}>{a.reference} - {a.designation}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Observation</label>
                    <input type="text" placeholder="ex: MANDRIN BLANC 40 MICRONS..." value={formData.observation} onChange={e => setFormData({...formData, observation: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Type de Mandrin</label>
                    <input type="text" placeholder="ex: BLANC" value={formData.mandrin_type} onChange={e => setFormData({...formData, mandrin_type: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Couleur Adhésif Carton</label>
                    <input type="text" placeholder="ex: TRANSPARENT" value={formData.adhesif_color} onChange={e => setFormData({...formData, adhesif_color: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Modèle d'Écriture Carton</label>
                    <input type="text" placeholder="ex: MODELE N° 15" value={formData.carton_model} onChange={e => setFormData({...formData, carton_model: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Colisage</label>
                    <input type="text" placeholder="ex: 60 RLX/CTS" value={formData.colisage} onChange={e => setFormData({...formData, colisage: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Palettisation (sur Bases)</label>
                    <input type="number" placeholder="ex: 15" value={formData.palettisation} onChange={e => setFormData({...formData, palettisation: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-primary flex items-center gap-2 border-b border-gray-100 pb-2">
                  <span className="material-symbols-outlined">straighten</span>
                  3. Quantités Demandées
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Quantité Totale (Unité) *</label>
                    <input required type="number" placeholder="ex: 2400" value={formData.quantity_planned} onChange={e => setFormData({...formData, quantity_planned: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre d'Axes/Tubes</label>
                    <input type="number" placeholder="ex: 56" value={formData.planned_axes} onChange={e => setFormData({...formData, planned_axes: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre de Cartons</label>
                    <input type="number" placeholder="ex: 40" value={formData.planned_cartons} onChange={e => setFormData({...formData, planned_cartons: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-primary flex items-center gap-2 border-b border-gray-100 pb-2">
                  <span className="material-symbols-outlined">calendar_month</span>
                  4. Planning de Production
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">N° Ordre de Fabrication *</label>
                    <input 
                      required 
                      type="text" 
                      value={formData.of_number} 
                      onChange={e => setFormData({...formData, of_number: e.target.value})} 
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-900 font-mono font-bold focus:ring-1 focus:ring-primary focus:border-primary" 
                      placeholder="ex: OF-20260816-001" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Priorité</label>
                    <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary">
                      <option value="Basse">Basse</option>
                      <option value="Moyenne">Moyenne</option>
                      <option value="Haute">Haute (1)</option>
                    </select>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Assigner à une Machine</label>
                    <select value={formData.machine_id} onChange={e => setFormData({...formData, machine_id: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary">
                      <option value="">-- Ne pas assigner pour le moment --</option>
                      {machines.map(m => (
                        <option key={m.id} value={m.id}>{m.name} {m.code ? `(${m.code})` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Date/Heure de Début Prévue</label>
                    <input type="datetime-local" value={formData.planned_start_date} onChange={e => setFormData({...formData, planned_start_date: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Date/Heure de Fin Prévue</label>
                    <input type="datetime-local" value={formData.planned_end_date} onChange={e => setFormData({...formData, planned_end_date: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary" />
                  </div>
                </div>
              </div>

            </form>

            <div className="p-6 border-t border-gray-100 shrink-0 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-700 font-bold hover:bg-gray-200 rounded-lg transition-colors">
                Annuler
              </button>
              <button form="ofForm" type="submit" className="px-5 py-2.5 bg-primary text-white font-bold hover:bg-primary/90 rounded-lg transition-colors shadow-md flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">save</span>
                {editingOrderId ? 'Enregistrer les modifications' : 'Créer l\'OF & Planifier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingOrderId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm border border-gray-200 shadow-2xl">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <span className="material-symbols-outlined text-3xl">warning</span>
              <h2 className="font-bold text-xl text-gray-900">Confirmer</h2>
            </div>
            <p className="text-gray-600 mb-6 font-medium">
              Voulez-vous vraiment supprimer cet Ordre de Fabrication ?
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeletingOrderId(null)} className="px-4 py-2 text-gray-700 font-bold hover:bg-gray-100 rounded-md transition-colors">Annuler</button>
              <button onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 text-white font-bold hover:bg-red-700 rounded-md transition-colors shadow-sm">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
