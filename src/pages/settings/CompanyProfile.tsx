import React, { useState, useEffect } from 'react';
import { useTenantStore } from '../../store/tenantStore';
import { useLanguageStore } from '../../store/language';
import toast from 'react-hot-toast';

export function CompanyProfile() {
  const { currentOrg, updateCurrentOrg } = useTenantStore();
  const { t } = useLanguageStore();

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
  const orgSlug = currentOrg?.slug || currentOrg?.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'usine';

  // Dedicated Terminal Credentials
  const tabletEmail = `tablette.${orgSlug}@factoryflow.tn`;
  const tabletPass = `${orgSlug}2026!`;
  const tabletAutoAuthLink = `${origin}/login?auto_auth=1&email=${encodeURIComponent(tabletEmail)}&password=${encodeURIComponent(tabletPass)}&org=${orgId}&target=/tablet`;

  const scannerEmail = `scanner.${orgSlug}@factoryflow.tn`;
  const scannerPass = `${orgSlug}2026!`;
  const scannerAutoAuthLink = `${origin}/login?auto_auth=1&email=${encodeURIComponent(scannerEmail)}&password=${encodeURIComponent(scannerPass)}&org=${orgId}&target=/scanner`;

  const mechanicEmail = `mecanique.${orgSlug}@factoryflow.tn`;
  const mechanicPass = `${orgSlug}2026!`;
  const mechanicAutoAuthLink = `${origin}/login?auto_auth=1&email=${encodeURIComponent(mechanicEmail)}&password=${encodeURIComponent(mechanicPass)}&org=${orgId}&target=/mechanic`;

  const copyToClipboard = (url: string, label: string) => {
    navigator.clipboard.writeText(url);
    toast.success(`${label} copié dans le presse-papier !`);
  };

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h1 className="text-2xl font-black text-zinc-900 tracking-tight">{t.company_profile}</h1>
        <p className="text-sm text-zinc-500 font-medium mt-1">
          {t.overview}
        </p>
      </div>

      {/* Terminal Access & QR Codes Card */}
      <div className="bg-gradient-to-br from-blue-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-blue-800 shadow-xl space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-lg text-xs font-black uppercase tracking-wider mb-2">
            <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
            Comptes & QR Codes Dédiés aux Postes d'Atelier
          </div>
          <h2 className="text-xl font-black text-white">Accès Postes Tablettes, Scanner & Maintenance</h2>
          <p className="text-xs text-blue-200 mt-1 max-w-2xl leading-relaxed">
            Ces comptes appartiennent aux postes de travail de votre usine (<strong className="text-white">{currentOrg?.name || 'Votre Usine'}</strong>) et sont totalement indépendants de votre compte propriétaire. 
            Les ouvriers s'authentifient ensuite sur place avec leur code PIN à 4 chiffres.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 1. Tablette Atelier */}
          <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-4 shadow-lg">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
                  <span className="material-symbols-outlined text-[22px]">tablet</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  Poste Machine
                </span>
              </div>
              <h3 className="font-bold text-sm text-white">Compte Tablette Atelier</h3>
              <p className="text-xs text-slate-400">Pour le suivi de production, comptage des pièces et conditionnement carton.</p>
            </div>

            {/* Credentials Display */}
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-[11px] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Email :</span>
                <span className="text-blue-300 font-bold select-all truncate max-w-[170px]">{tabletEmail}</span>
                <button onClick={() => copyToClipboard(tabletEmail, 'Email Tablette')} title="Copier" className="text-slate-400 hover:text-white p-1">
                  <span className="material-symbols-outlined text-[13px]">content_copy</span>
                </button>
              </div>
              <div className="flex items-center justify-between border-t border-slate-800/80 pt-1.5">
                <span className="text-slate-400">Pswd :</span>
                <span className="text-emerald-400 font-bold select-all">{tabletPass}</span>
                <button onClick={() => copyToClipboard(tabletPass, 'Mot de passe')} title="Copier" className="text-slate-400 hover:text-white p-1">
                  <span className="material-symbols-outlined text-[13px]">content_copy</span>
                </button>
              </div>
            </div>
            
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex flex-col items-center gap-1.5">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(tabletAutoAuthLink)}`}
                  alt="QR Tablette"
                  className="w-24 h-24 rounded bg-white p-1"
                />
                <span className="text-[10px] text-emerald-400 font-bold">⚡ Flash = Connexion Automatique</span>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => copyToClipboard(tabletAutoAuthLink, 'Lien Automatique')}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">link</span>
                  <span>Copier Lien</span>
                </button>
                <a
                  href={tabletAutoAuthLink}
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
          <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-4 shadow-lg">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl">
                  <span className="material-symbols-outlined text-[22px]">qr_code_scanner</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Magasin / QA
                </span>
              </div>
              <h3 className="font-bold text-sm text-white">Compte Scanner Mobile</h3>
              <p className="text-xs text-slate-400">Pour flasher les étiquettes cartons, validation qualité et mise en stock.</p>
            </div>

            {/* Credentials Display */}
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-[11px] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Email :</span>
                <span className="text-emerald-300 font-bold select-all truncate max-w-[170px]">{scannerEmail}</span>
                <button onClick={() => copyToClipboard(scannerEmail, 'Email Scanner')} title="Copier" className="text-slate-400 hover:text-white p-1">
                  <span className="material-symbols-outlined text-[13px]">content_copy</span>
                </button>
              </div>
              <div className="flex items-center justify-between border-t border-slate-800/80 pt-1.5">
                <span className="text-slate-400">Pswd :</span>
                <span className="text-emerald-400 font-bold select-all">{scannerPass}</span>
                <button onClick={() => copyToClipboard(scannerPass, 'Mot de passe')} title="Copier" className="text-slate-400 hover:text-white p-1">
                  <span className="material-symbols-outlined text-[13px]">content_copy</span>
                </button>
              </div>
            </div>
            
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex flex-col items-center gap-1.5">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(scannerAutoAuthLink)}`}
                  alt="QR Scanner"
                  className="w-24 h-24 rounded bg-white p-1"
                />
                <span className="text-[10px] text-emerald-400 font-bold">⚡ Flash = Connexion Automatique</span>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => copyToClipboard(scannerAutoAuthLink, 'Lien Automatique')}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">link</span>
                  <span>Copier Lien</span>
                </button>
                <a
                  href={scannerAutoAuthLink}
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
          <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-4 shadow-lg">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-2 bg-amber-600/20 text-amber-400 rounded-xl">
                  <span className="material-symbols-outlined text-[22px]">build</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Techniciens
                </span>
              </div>
              <h3 className="font-bold text-sm text-white">Compte Maintenance</h3>
              <p className="text-xs text-slate-400">Pour les alertes d'arrêts machine, interventions et fiches de réparation.</p>
            </div>

            {/* Credentials Display */}
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-[11px] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Email :</span>
                <span className="text-amber-300 font-bold select-all truncate max-w-[170px]">{mechanicEmail}</span>
                <button onClick={() => copyToClipboard(mechanicEmail, 'Email Maintenance')} title="Copier" className="text-slate-400 hover:text-white p-1">
                  <span className="material-symbols-outlined text-[13px]">content_copy</span>
                </button>
              </div>
              <div className="flex items-center justify-between border-t border-slate-800/80 pt-1.5">
                <span className="text-slate-400">Pswd :</span>
                <span className="text-emerald-400 font-bold select-all">{mechanicPass}</span>
                <button onClick={() => copyToClipboard(mechanicPass, 'Mot de passe')} title="Copier" className="text-slate-400 hover:text-white p-1">
                  <span className="material-symbols-outlined text-[13px]">content_copy</span>
                </button>
              </div>
            </div>
            
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex flex-col items-center gap-1.5">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(mechanicAutoAuthLink)}`}
                  alt="QR Maintenance"
                  className="w-24 h-24 rounded bg-white p-1"
                />
                <span className="text-[10px] text-emerald-400 font-bold">⚡ Flash = Connexion Automatique</span>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => copyToClipboard(mechanicAutoAuthLink, 'Lien Automatique')}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">link</span>
                  <span>Copier Lien</span>
                </button>
                <a
                  href={mechanicAutoAuthLink}
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
