import React, { useState, useEffect } from 'react';
import { useTenantStore } from '../../store/tenantStore';
import toast from 'react-hot-toast';

export function CompanyProfile() {
  const { currentOrg, updateCurrentOrg } = useTenantStore();

  const [formData, setFormData] = useState({
    name: '',
    legal_name: '',
    industry: '',
    tax_id: '',
    address: '',
    city: '',
    governorate: '',
    postal_code: '',
    country: 'Tunisia',
    phone: '',
    email: '',
    website: '',
    timezone: 'Africa/Tunis',
    default_language: 'fr'
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentOrg) {
      setFormData({
        name: currentOrg.name || '',
        legal_name: currentOrg.legal_name || '',
        industry: currentOrg.industry || 'Emballage & Conditionnement',
        tax_id: currentOrg.tax_id || '',
        address: currentOrg.address || '',
        city: currentOrg.city || 'Tunis',
        governorate: currentOrg.governorate || 'Tunis',
        postal_code: currentOrg.postal_code || '1000',
        country: currentOrg.country || 'Tunisia',
        phone: currentOrg.phone || '',
        email: currentOrg.email || '',
        website: currentOrg.website || '',
        timezone: currentOrg.timezone || 'Africa/Tunis',
        default_language: currentOrg.default_language || 'fr'
      });
    }
  }, [currentOrg]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateCurrentOrg(formData);
      toast.success('Profil de l\'entreprise mis à jour avec succès.');
    } catch (err) {
      toast.error('Erreur lors de la sauvegarde du profil.');
    } finally {
      setIsSaving(false);
    }
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const orgId = currentOrg?.id || (typeof localStorage !== 'undefined' ? localStorage.getItem('active_org_id') : '') || '';

  const tabletLink = `${origin}/tablet?org=${orgId}`;
  const scannerLink = `${origin}/scanner?org=${orgId}`;
  const mechanicLink = `${origin}/mechanic?org=${orgId}`;

  const copyToClipboard = (url: string, label: string) => {
    navigator.clipboard.writeText(url);
    toast.success(`Lien ${label} copié !`);
  };

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Profil & Paramètres de l'Usine</h1>
        <p className="text-sm text-zinc-500 font-medium mt-1">
          Coordonnées légales, paramètres régionaux et accès rapides aux terminaux d'atelier.
        </p>
      </div>

      {/* Terminal Access & QR Codes Card */}
      <div className="bg-gradient-to-br from-blue-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-blue-800 shadow-xl space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-lg text-xs font-black uppercase tracking-wider mb-2">
            <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
            Accès Directs Terminaux Usine
          </div>
          <h2 className="text-xl font-black text-white">Liens et QR Codes pour les Tablettes & Mobiles</h2>
          <p className="text-xs text-blue-200 mt-1 max-w-2xl leading-relaxed">
            Ces liens sont automatiquement liés à votre usine (<strong className="text-white">{currentOrg?.name || 'Votre Usine'}</strong>). 
            Les ouvriers et opérateurs accèdent directement aux écrans tactiles et scanners avec leur code PIN sans avoir besoin de mot de passe administrateur.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 1. Tablette Atelier */}
          <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
                  <span className="material-symbols-outlined text-[22px]">tablet</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  Opérateurs
                </span>
              </div>
              <h3 className="font-bold text-sm text-white">Tablette Tactile Atelier</h3>
              <p className="text-xs text-slate-400">Pour le suivi de production en direct, conditionnement et comptage des pièces.</p>
            </div>
            
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(tabletLink)}`}
                  alt="QR Tablette"
                  className="w-24 h-24 rounded"
                />
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => copyToClipboard(tabletLink, 'Tablette')}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">content_copy</span>
                  <span>Copier</span>
                </button>
                <a
                  href={tabletLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </a>
              </div>
            </div>
          </div>

          {/* 2. Scanner Mobile */}
          <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl">
                  <span className="material-symbols-outlined text-[22px]">qr_code_scanner</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Magasinier / QA
                </span>
              </div>
              <h3 className="font-bold text-sm text-white">Scanner Mobile & QR</h3>
              <p className="text-xs text-slate-400">Pour flasher les étiquettes cartons, validation qualité et mise en stock.</p>
            </div>
            
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(scannerLink)}`}
                  alt="QR Scanner"
                  className="w-24 h-24 rounded"
                />
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => copyToClipboard(scannerLink, 'Scanner')}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">content_copy</span>
                  <span>Copier</span>
                </button>
                <a
                  href={scannerLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </a>
              </div>
            </div>
          </div>

          {/* 3. Terminal Maintenance */}
          <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-2 bg-amber-600/20 text-amber-400 rounded-xl">
                  <span className="material-symbols-outlined text-[22px]">build</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Techniciens
                </span>
              </div>
              <h3 className="font-bold text-sm text-white">Terminal Maintenance</h3>
              <p className="text-xs text-slate-400">Pour les alertes d'arrêts machine, interventions et fiches de réparation.</p>
            </div>
            
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(mechanicLink)}`}
                  alt="QR Maintenance"
                  className="w-24 h-24 rounded"
                />
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => copyToClipboard(mechanicLink, 'Maintenance')}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">content_copy</span>
                  <span>Copier</span>
                </button>
                <a
                  href={mechanicLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-sm space-y-6">
        
        <div className="border-b border-zinc-100 pb-4">
          <h2 className="text-base font-bold text-zinc-900">Identification & Légal</h2>
          <p className="text-xs text-zinc-500">Nom commercial et identifiants fiscaux tunisiens.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase mb-1.5">Nom de l'Usine / Marque</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase mb-1.5">Raison Sociale Légale</label>
            <input
              type="text"
              value={formData.legal_name}
              onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
              className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase mb-1.5">Secteur Industriel</label>
            <input
              type="text"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase mb-1.5">Matricule Fiscal (MF)</label>
            <input
              type="text"
              placeholder="Ex: 1234567/A/M/000"
              value={formData.tax_id}
              onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
              className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-mono focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="border-b border-zinc-100 pb-4 pt-2">
          <h2 className="text-base font-bold text-zinc-900">Localisation & Contact</h2>
          <p className="text-xs text-zinc-500">Adresse physique de votre site de production en Tunisie.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-zinc-700 uppercase mb-1.5">Adresse de l'Usine / Zone Industrielle</label>
            <input
              type="text"
              placeholder="Ex: Z.I. Ben Arous, Rue des Usines"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase mb-1.5">Gouvernorat / Ville</label>
            <input
              type="text"
              placeholder="Ex: Ben Arous"
              value={formData.governorate}
              onChange={(e) => setFormData({ ...formData, governorate: e.target.value, city: e.target.value })}
              className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase mb-1.5">Téléphone Standard</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase mb-1.5">Email Officiel</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase mb-1.5">Site Web</label>
            <input
              type="text"
              placeholder="https://..."
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer les Modifications'}
          </button>
        </div>
      </form>
    </div>
  );
}
