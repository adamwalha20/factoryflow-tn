import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTenantStore } from '../../store/tenantStore';
import { useAuthStore } from '../../store/auth';
import toast from 'react-hot-toast';

export function SignUpPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { plans, fetchPlans } = useTenantStore();
  const { setTestUser } = useAuthStore();

  const initialPlanSlug = searchParams.get('plan') || 'professional';
  const [selectedPlanSlug, setSelectedPlanSlug] = useState(initialPlanSlug);

  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: User Account Form
  const [accountForm, setAccountForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    phone: ''
  });

  // Step 2: Factory & Organization Form
  const [factoryForm, setFactoryForm] = useState({
    company_name: '',
    legal_name: '',
    industry: 'Emballage & Conditionnement',
    tax_id: '', // Matricule Fiscal
    address: '',
    city: 'Tunis',
    governorate: 'Tunis',
    postal_code: '1000',
    country: 'Tunisia',
    phone: '',
    email: '',
    website: '',
    employee_count: 15,
    machine_count: 3,
    production_type: 'Bobinage & Découpe',
    timezone: 'Africa/Tunis',
    default_language: 'fr'
  });

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const selectedPlan = plans.find(p => p.slug === selectedPlanSlug) || {
    name: selectedPlanSlug === 'starter' ? 'Starter' : selectedPlanSlug === 'enterprise' ? 'Entreprise' : 'Professionnel',
    monthly_price: selectedPlanSlug === 'starter' ? 149 : selectedPlanSlug === 'enterprise' ? 599 : 299,
    currency: 'TND'
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountForm.first_name || !accountForm.last_name || !accountForm.email || !accountForm.password) {
      toast.error('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (accountForm.password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (accountForm.password !== accountForm.confirm_password) {
      toast.error('Les mots de passe ne correspondent pas.');
      return;
    }

    // Pre-populate factory contact with account details if empty
    setFactoryForm(prev => ({
      ...prev,
      email: prev.email || accountForm.email,
      phone: prev.phone || accountForm.phone
    }));

    setStep(2);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factoryForm.company_name) {
      toast.error('Veuillez renseigner le nom de votre usine.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Generate Organization UUID
      const orgId = crypto.randomUUID();
      const orgSlug = factoryForm.company_name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);

      // 2. Create Supabase Auth User or Local Auth Session
      let authUserId = crypto.randomUUID() as string;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: accountForm.email,
        password: accountForm.password,
        options: {
          data: {
            first_name: accountForm.first_name,
            last_name: accountForm.last_name,
            phone: accountForm.phone,
            organization_id: orgId
          }
        }
      });

      if (authData?.user) {
        authUserId = authData.user.id as string;
      } else if (authError) {
        console.warn('Supabase auth warning, proceeding with localized tenant provisioning', authError);
      }

      // 3. Insert Organization in DB
      const { data: orgData, error: orgError } = await (supabase as any)
        .from('organizations')
        .insert([
          {
            id: orgId,
            name: factoryForm.company_name,
            slug: orgSlug,
            legal_name: factoryForm.legal_name || factoryForm.company_name,
            industry: factoryForm.industry,
            tax_id: factoryForm.tax_id,
            address: factoryForm.address,
            city: factoryForm.city,
            governorate: factoryForm.governorate,
            postal_code: factoryForm.postal_code,
            country: 'Tunisia',
            phone: factoryForm.phone || accountForm.phone,
            email: factoryForm.email || accountForm.email,
            website: factoryForm.website,
            employee_count: factoryForm.employee_count,
            machine_count: factoryForm.machine_count,
            production_type: factoryForm.production_type,
            timezone: 'Africa/Tunis',
            default_language: 'fr',
            onboarding_completed: false,
            onboarding_step: 1
          }
        ])
        .select()
        .single();

      if (orgError) throw orgError;

      // 4. Create Initial Factory for this Organization
      await (supabase as any).from('factories').insert([
        {
          organization_id: orgId,
          name: `Usine Principale (${factoryForm.city})`,
          code: 'SITE-01',
          location: factoryForm.city,
          address: factoryForm.address
        }
      ]);

      // 5. Create Owner Profile & User record
      await (supabase as any).from('users').insert([
        {
          id: authUserId,
          organization_id: orgId,
          email: accountForm.email,
          name: `${accountForm.first_name} ${accountForm.last_name}`,
          role: 'Administrator',
          phone: accountForm.phone,
          status: 'Active'
        }
      ]);

      // 6. Create Organization Membership (Role = OWNER)
      await (supabase as any).from('organization_members').insert([
        {
          organization_id: orgId,
          user_id: authUserId,
          role: 'OWNER',
          status: 'ACTIVE'
        }
      ]);

      // 7. Find Plan ID & Create 14-Day Trial Subscription
      const matchedPlan = plans.find(p => p.slug === selectedPlanSlug);
      const planId = matchedPlan?.id || null;

      await (supabase as any).from('subscriptions').insert([
        {
          organization_id: orgId,
          plan_id: planId,
          status: 'TRIALING',
          billing_cycle: 'monthly',
          trial_start: new Date().toISOString(),
          trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          start_date: new Date().toISOString()
        }
      ]);

      // 8. Set Active Tenant State in App
      localStorage.setItem('active_org_id', orgId);
      setTestUser({
        id: authUserId,
        first_name: accountForm.first_name,
        last_name: accountForm.last_name,
        role: 'Administrator'
      });

      toast.success('Compte usine créé avec succès ! Bienvenue sur FactoryFlow TN.');
      navigate('/onboarding');

    } catch (err: any) {
      console.error('Signup failed', err);
      toast.error('Erreur lors de la création du compte : ' + (err.message || 'Vérifiez vos informations'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-between font-sans">
      
      {/* Top Bar */}
      <header className="bg-white border-b border-zinc-200 px-4 py-4 sm:px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-600/20">
            <span className="material-symbols-outlined text-[22px]">precision_manufacturing</span>
          </div>
          <span className="text-lg font-black text-zinc-900 tracking-tight">
            FactoryFlow <span className="text-blue-600 font-extrabold text-xs">TN</span>
          </span>
        </Link>
        <div className="flex items-center gap-3 text-xs font-bold text-zinc-600">
          <span>Déjà inscrit ?</span>
          <Link to="/login" className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-lg transition-colors">
            Connexion
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12">
        
        {/* Plan Header Card */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-zinc-200 shadow-xs mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined text-[28px]">verified</span>
            </div>
            <div>
              <p className="text-xs font-black text-blue-600 uppercase">Forfait Sélectionné :</p>
              <h2 className="text-xl font-black text-zinc-900 flex items-center gap-2">
                {selectedPlan.name}
                <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold">
                  14 Jours Gratuits
                </span>
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-black text-zinc-900">{selectedPlan.monthly_price} <span className="text-xs font-bold text-zinc-500">{selectedPlan.currency || 'TND'} / mois</span></p>
              <p className="text-[11px] text-zinc-400 font-medium">Facturé après les 14 jours d'essai</p>
            </div>
            <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200 text-xs font-bold">
              {['starter', 'professional', 'enterprise'].map((slug) => (
                <button
                  key={slug}
                  type="button"
                  onClick={() => setSelectedPlanSlug(slug as any)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${selectedPlanSlug === slug ? 'bg-white text-blue-700 shadow-xs font-black' : 'text-zinc-600'}`}
                >
                  {slug === 'professional' ? 'Pro' : slug}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black ${step === 1 ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-white text-zinc-600 border border-zinc-200'}`}>
            <span>1</span>
            <span>Compte Administrateur</span>
          </div>
          <span className="text-zinc-300">→</span>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black ${step === 2 ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-white text-zinc-600 border border-zinc-200'}`}>
            <span>2</span>
            <span>Profil de l'Usine</span>
          </div>
        </div>

        {/* Forms */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl border-2 border-zinc-200 shadow-sm">
          
          {step === 1 ? (
            <form onSubmit={handleStep1Next} className="space-y-6">
              <div>
                <h3 className="text-2xl font-black text-zinc-900">Créez votre compte Administrateur</h3>
                <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-1">
                  Ce compte sera le propriétaire (OWNER) de l'espace usine avec tous les privilèges de gestion.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1.5">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Mohamed"
                    value={accountForm.first_name}
                    onChange={(e) => setAccountForm({ ...accountForm, first_name: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1.5">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Ben Amor"
                    value={accountForm.last_name}
                    onChange={(e) => setAccountForm({ ...accountForm, last_name: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1.5">
                    Email Professionnel <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="directeur@usine.tn"
                    value={accountForm.email}
                    onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1.5">
                    Téléphone Direct
                  </label>
                  <input
                    type="tel"
                    placeholder="+216 98 000 000"
                    value={accountForm.phone}
                    onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1.5">
                    Mot de passe <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={accountForm.password}
                    onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1.5">
                    Confirmer le mot de passe <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={accountForm.confirm_password}
                    onChange={(e) => setAccountForm({ ...accountForm, confirm_password: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Continuer vers les Informations de l'Usine</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleFinalSubmit} className="space-y-6">
              <div>
                <h3 className="text-2xl font-black text-zinc-900">Informations sur votre Usine</h3>
                <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-1">
                  Ces informations permettent de paramétrer votre tenant d'entreprise et vos rapports industriels.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1.5">
                    Nom Commercial de l'Usine <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Plastique Moderne Tunisie"
                    value={factoryForm.company_name}
                    onChange={(e) => setFactoryForm({ ...factoryForm, company_name: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1.5">
                    Raison Sociale / Société Légale
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Société PMT SARL"
                    value={factoryForm.legal_name}
                    onChange={(e) => setFactoryForm({ ...factoryForm, legal_name: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1.5">
                    Secteur d'Activité
                  </label>
                  <select
                    value={factoryForm.industry}
                    onChange={(e) => setFactoryForm({ ...factoryForm, industry: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                  >
                    <option value="Emballage & Conditionnement">Emballage & Conditionnement</option>
                    <option value="Plasturgie & Injection">Plasturgie & Injection</option>
                    <option value="Textile & Habillement">Textile & Habillement</option>
                    <option value="Agroalimentaire">Agroalimentaire</option>
                    <option value="Mécanique & Métallurgie">Mécanique & Métallurgie</option>
                    <option value="Électronique & Câblage">Électronique & Câblage</option>
                    <option value="Autre Industrie">Autre Industrie</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1.5">
                    Matricule Fiscal (Optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="1234567/A/M/000"
                    value={factoryForm.tax_id}
                    onChange={(e) => setFactoryForm({ ...factoryForm, tax_id: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1.5">
                    Gouvernorat (Tunisie)
                  </label>
                  <select
                    value={factoryForm.governorate}
                    onChange={(e) => setFactoryForm({ ...factoryForm, governorate: e.target.value, city: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                  >
                    {['Tunis', 'Ben Arous', 'Ariana', 'Manouba', 'Nabeul', 'Bizerte', 'Sousse', 'Monastir', 'Sfax', 'Kairouan', 'Gabès', 'Béja', 'Jendouba', 'Autre'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1.5">
                    Adresse / Zone Industrielle
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Z.I. Mghira 2, Lot 45"
                    value={factoryForm.address}
                    onChange={(e) => setFactoryForm({ ...factoryForm, address: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1.5">
                    Nombre de Machines Estimé
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={factoryForm.machine_count}
                    onChange={(e) => setFactoryForm({ ...factoryForm, machine_count: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-sm rounded-xl transition-colors"
                >
                  ← Retour
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <span>Création du Tenant Usine en cours...</span>
                  ) : (
                    <>
                      <span>Activer mon Espace Usine (14 Jours Gratuits)</span>
                      <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-zinc-400 border-t border-zinc-200">
        © {new Date().getFullYear()} FactoryFlow TN — Sécurisé par Supabase & PostgreSQL Multi-Tenant.
      </footer>
    </div>
  );
}
