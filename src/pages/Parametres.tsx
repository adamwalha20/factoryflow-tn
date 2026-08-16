import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useLanguageStore } from '../store/language';
import { useMesStore } from '../store/mesStore';
import { useProductionStore } from '../store/production';
import { generateSage100Export, generateOdooJsonExport, downloadFile } from '../utils/erpExport';

export const Parametres = () => {
  const [activeTab, setActiveTab] = useState<'entreprise' | 'erp' | 'subscription' | 'langue'>('entreprise');
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguageStore();
  const { orders, production_entries } = useMesStore();
  const { machines } = useProductionStore();

  // ERP Export state
  const [exportFormat, setExportFormat] = useState<'sage' | 'odoo'>('sage');
  const [exporting, setExporting] = useState(false);

  const handleExportErp = () => {
    setExporting(true);
    try {
      const records = production_entries.map(e => {
        const order = orders.find(o => o.id === e.of_id);
        return {
          date: e.created_at ? e.created_at.substring(0, 10) : new Date().toISOString().substring(0, 10),
          of_number: order?.of_number || `OF-${e.id.substring(0, 6)}`,
          article_ref: order?.article_id || 'ART-STANDARD',
          quantity: e.good_quantity || 0,
          scrap_quantity: e.scrap_quantity || 0,
          lot_number: e.roll_number || undefined
        };
      });

      if (exportFormat === 'sage') {
        const content = generateSage100Export(records);
        const filename = `Sage100_FactoryFlow_${new Date().toISOString().substring(0, 10)}.csv`;
        downloadFile(content, filename, 'text/csv;charset=utf-8;');
        toast.success('Export Sage 100 téléchargé avec succès !');
      } else {
        const content = generateOdooJsonExport(records);
        const filename = `Odoo_MES_Sync_${new Date().toISOString().substring(0, 10)}.json`;
        downloadFile(content, filename, 'application/json');
        toast.success('Synchronisation Odoo JSON générée !');
      }
    } catch (err: any) {
      toast.error('Erreur lors de l\'export : ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Paramètres Système & SaaS</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Configuration générale, connecteurs ERP et gestion de l'abonnement</p>
        </div>

        <a 
          href="/portal" 
          target="_blank" 
          rel="noreferrer"
          className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors border border-blue-200 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[16px]">visibility</span>
          Portail Client Public ➔
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Navigation Menu */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-xs">
            <ul className="flex flex-col text-sm font-medium space-y-1">
              <li>
                <button 
                  onClick={() => setActiveTab('entreprise')} 
                  className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'entreprise' ? 'bg-blue-50 text-blue-700 font-bold shadow-2xs' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  <span className="material-symbols-outlined text-[20px]">domain</span>
                  Profil Entreprise
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveTab('erp')} 
                  className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'erp' ? 'bg-blue-50 text-blue-700 font-bold shadow-2xs' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  <span className="material-symbols-outlined text-[20px]">sync_alt</span>
                  Connecteurs ERP & Sage / Odoo
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveTab('subscription')} 
                  className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'subscription' ? 'bg-blue-50 text-blue-700 font-bold shadow-2xs' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  <span className="material-symbols-outlined text-[20px]">verified_user</span>
                  Abonnement & Quotas SaaS
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveTab('langue')} 
                  className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'langue' ? 'bg-blue-50 text-blue-700 font-bold shadow-2xs' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  <span className="material-symbols-outlined text-[20px]">language</span>
                  Langue & Région
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Main Settings Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            {/* TAB 1: ENTREPRISE */}
            {activeTab === 'entreprise' && (
              <>
                <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-4 mb-6">Informations de l'Entreprise</h3>
                
                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); toast.success('Paramètres entreprise sauvegardés !'); }}>
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl border border-slate-200 bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-md">
                      FF
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-1">Logo et Identité Usine</h4>
                      <p className="text-xs text-slate-500 mb-3">Affiché sur les étiquettes cartons et les bons de livraison.</p>
                      <button onClick={(e) => { e.preventDefault(); toast.success('Logo mis à jour'); }} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors" type="button">
                        Changer le logo
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Raison Sociale</label>
                      <input className="input-base text-sm" defaultValue="Adpro Packaging & Tapes" type="text" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Matricule Fiscal / SIRET</label>
                      <input className="input-base text-sm" defaultValue="1458923/A/M/000" type="text" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Adresse de l'Usine</label>
                      <input className="input-base text-sm" defaultValue="Zone Industrielle Charguia II, 2035 Tunis, Tunisie" type="text" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Devise Principale</label>
                      <select className="input-base text-sm" defaultValue="TND">
                        <option value="TND">Dinar Tunisien (TND)</option>
                        <option value="EUR">Euro (€)</option>
                        <option value="USD">Dollar ($)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Site / Usine Active</label>
                      <input className="input-base text-sm" defaultValue="Usine Principale Tunis" type="text" disabled />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                    <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors">
                      Enregistrer
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* TAB 2: ERP CONNECTORS */}
            {activeTab === 'erp' && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-4">
                  <h3 className="text-lg font-bold text-slate-900">Connecteurs ERP & Comptabilité</h3>
                  <p className="text-xs text-slate-500 mt-1">Exportez les consommations matières et écritures de stocks vers les ERPs tunisiens.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Sage 100 Option */}
                  <div 
                    onClick={() => setExportFormat('sage')}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${exportFormat === 'sage' ? 'border-blue-600 bg-blue-50/50 shadow-xs' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900 text-sm">Sage 100 / 1000 Comptabilité</span>
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${exportFormat === 'sage' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                        {exportFormat === 'sage' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Génère un fichier d'import CSV/TXT standard (Comptes 311000, 355000) pour votre logiciel Sage.
                    </p>
                  </div>

                  {/* Odoo Option */}
                  <div 
                    onClick={() => setExportFormat('odoo')}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${exportFormat === 'odoo' ? 'border-blue-600 bg-blue-50/50 shadow-xs' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900 text-sm">Odoo Manufacturing (JSON Sync)</span>
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${exportFormat === 'odoo' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                        {exportFormat === 'odoo' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Export structuré avec traçabilité des lots et ordres de fabrication terminés.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {production_entries.length} enregistrements de production prêts pour l'export
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Période : Derniers lots validés par le contrôle qualité
                    </span>
                  </div>

                  <button
                    onClick={handleExportErp}
                    disabled={exporting || production_entries.length === 0}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2 shrink-0 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    {exportFormat === 'sage' ? 'Télécharger CSV Sage 100' : 'Générer JSON Odoo'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: SAAS SUBSCRIPTION & QUOTAS */}
            {activeTab === 'subscription' && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Abonnement & Quotas SaaS</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Suivi de la consommation des ressources de votre abonnement</p>
                  </div>
                  <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-full shadow-xs">
                    Plan Professionnel
                  </span>
                </div>

                {/* Quota Gauges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                      <span>Lignes / Machines</span>
                      <span className="text-blue-700">{machines.length} / 10</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${(machines.length / 10) * 100}%` }}></div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">Capacité restante : {10 - machines.length} machines</p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                      <span>OFs Mensuels</span>
                      <span className="text-emerald-700">{orders.length} / Illimité</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full w-1/4"></div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">Volume sans restriction</p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                      <span>Assistant IA & Gemini</span>
                      <span className="text-indigo-700">Actif</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full w-full"></div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">Briefing exécutif & ordonnancement</p>
                  </div>
                </div>

                {/* Features Included List */}
                <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                  <h4 className="font-bold text-xs text-blue-900 uppercase tracking-wider mb-3">Fonctionnalités de votre abonnement Pro</h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                    <li className="flex items-center gap-2">✅ Registre immuable des matières</li>
                    <li className="flex items-center gap-2">✅ Mode Hors-ligne tablettes opérateurs</li>
                    <li className="flex items-center gap-2">✅ Analyse Pareto des déchets & rebus</li>
                    <li className="flex items-center gap-2">✅ Nomenclatures multi-étapes (BOM)</li>
                    <li className="flex items-center gap-2">✅ Portail de suivi client public</li>
                    <li className="flex items-center gap-2">✅ Connecteurs export Sage & Odoo</li>
                  </ul>
                </div>
              </div>
            )}

            {/* TAB 4: LANGUE */}
            {activeTab === 'langue' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-4 mb-6">Paramètres de Langue & Affichage</h3>
                
                <div className="space-y-3">
                  <div 
                    onClick={() => { setLanguage('fr'); toast.success('Langue définie sur Français'); }}
                    className={`p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${language === 'fr' ? 'border-blue-600 bg-blue-50/60 shadow-xs' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🇫🇷</span>
                      <div>
                        <h4 className="font-semibold text-slate-900 text-sm">Français</h4>
                        <p className="text-xs text-slate-500">Interface par défaut</p>
                      </div>
                    </div>
                    <div className={`h-5 w-5 rounded-full border-4 ${language === 'fr' ? 'border-blue-600 bg-white' : 'border-slate-300'}`}></div>
                  </div>

                  <div 
                    onClick={() => { setLanguage('ar'); toast.success('تم تفعيل اللغة العربية'); }}
                    className={`p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${language === 'ar' ? 'border-blue-600 bg-blue-50/60 shadow-xs' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🇹🇳</span>
                      <div>
                        <h4 className="font-semibold text-slate-900 text-sm">العربية (Arabic - RTL)</h4>
                        <p className="text-xs text-slate-500">واجهة كاملة باللغة العربية مع دعم المحاذاة من اليمين إلى اليسار</p>
                      </div>
                    </div>
                    <div className={`h-5 w-5 rounded-full border-4 ${language === 'ar' ? 'border-blue-600 bg-white' : 'border-slate-300'}`}></div>
                  </div>

                  <div 
                    onClick={() => { setLanguage('en'); toast.success('Language switched to English'); }}
                    className={`p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${language === 'en' ? 'border-blue-600 bg-blue-50/60 shadow-xs' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🇬🇧</span>
                      <div>
                        <h4 className="font-semibold text-slate-900 text-sm">English</h4>
                        <p className="text-xs text-slate-500">International factory interface</p>
                      </div>
                    </div>
                    <div className={`h-5 w-5 rounded-full border-4 ${language === 'en' ? 'border-blue-600 bg-white' : 'border-slate-300'}`}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Parametres;
