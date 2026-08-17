import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTenantStore } from '../../store/tenantStore';
import { useAuthStore } from '../../store/auth';
import { useThemeStore } from '../../store/theme';
import toast from 'react-hot-toast';

export function SignUpPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { plans, fetchPlans } = useTenantStore();
  const { setTestUser } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

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

  const planOptions = [
    {
      slug: 'starter',
      name: 'Starter',
      price: 149,
      badge: 'Atelier Débutant',
      capacity: '1 Usine • Jusqu\'à 3 Machines',
      workers: '10 Opérateurs • Tablettes tactiles',
      popular: false,
      color: 'blue'
    },
    {
      slug: 'professional',
      name: 'Professionnel',
      price: 299,
      badge: 'Recommandé Usines & PME',
      capacity: '1 Usine • Jusqu\'à 10 Machines',
      workers: '50 Opérateurs • Nomenclatures BOM',
      popular: true,
      color: 'indigo'
    },
    {
      slug: 'enterprise',
      name: 'Entreprise',
      price: 599,
      badge: 'Multi-Sites & IA',
      capacity: 'Multi-Usines • Machines Illimitées',
      workers: 'Opérateurs Illimités • ERP Sage & Odoo',
      popular: false,
      color: 'purple'
    }
  ];

  const currentPlan = planOptions.find(p => p.slug === selectedPlanSlug) || planOptions[1];

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

    setFactoryForm(prev => ({
      ...prev,
      email: prev.email || accountForm.email,
      phone: prev.phone || accountForm.phone
    }));

    setStep(2);
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/onboarding`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google signup error:', err);
      toast.error(err.message || "Erreur lors de l'inscription Google");
      setIsLoading(false);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factoryForm.company_name) {
      toast.error('Veuillez renseigner le nom de votre usine.');
      return;
    }

    setIsLoading(true);
    try {
      const orgId = crypto.randomUUID();
      const orgSlug = factoryForm.company_name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);

      // 1. Strictly register user in Supabase auth.users
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

      if (authError) {
        throw new Error(authError.message || "Erreur lors de la création de l'utilisateur dans Supabase Auth.");
      }

      const authUserId = authData?.user?.id || crypto.randomUUID();

      // 2. Create organization in public.organizations
      await (supabase as any)
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
            timezone: factoryForm.timezone,
            default_language: factoryForm.default_language,
            onboarding_completed: false,
            onboarding_step: 1
          }
        ]);

      // 3. Create employee profile in public.employees (linked to auth.users.id)
      await (supabase as any).from('employees').insert([
        {
          id: crypto.randomUUID(),
          user_id: authUserId,
          organization_id: orgId,
          first_name: accountForm.first_name,
          last_name: accountForm.last_name,
          email: accountForm.email,
          role: 'Administrator',
          is_active: true
        }
      ]);

      // 4. Create user profile in public.users (backward compatibility, no passwords stored in public)
      await (supabase as any).from('users').insert([
        {
          id: authUserId,
          organization_id: orgId,
          name: `${accountForm.first_name} ${accountForm.last_name}`,
          email: accountForm.email,
          role: 'Administrator',
          status: 'Actif'
        }
      ]);

      const planDb = plans.find(p => p.slug === selectedPlanSlug);
      const planId = planDb?.id || '2';

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
    <div className={`min-h-screen font-sans transition-colors duration-300 flex flex-col justify-between ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Top Bar */}
      <header className={`px-4 py-4 sm:px-8 flex items-center justify-between border-b transition-colors ${
        theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-600/20">
            <span className="material-symbols-outlined text-[22px]">precision_manufacturing</span>
          </div>
          <span className={`text-lg font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            FactoryFlow <span className="text-blue-500 font-extrabold text-xs">TN</span>
          </span>
        </Link>
        
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Mode Clair' : 'Mode Sombre'}
            className={`p-2 rounded-xl border transition-all ${
              theme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          <div className={`flex items-center gap-2 text-xs font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            <span className="hidden sm:inline">Déjà inscrit ?</span>
            <Link
              to="/login"
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                theme === 'dark'
                  ? 'bg-slate-800 hover:bg-slate-700 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
              }`}
            >
              Connexion
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 sm:py-12 space-y-8">
        
        {/* BIG & VISIBLE PLAN SELECTION CARDS */}
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <span className="text-xs font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-4 py-1 rounded-full border border-blue-500/20">
              Étape 0 : Choisissez votre Forfait
            </span>
            <h1 className={`text-2xl sm:text-4xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
              Sélectionnez votre Pack Usine (14 Jours Gratuits)
            </h1>
            <p className={`text-xs sm:text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Aucun paiement requis aujourd'hui. Vous pouvez changer ou résilier votre forfait à tout moment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {planOptions.map((plan) => {
              const isSelected = selectedPlanSlug === plan.slug;
              return (
                <div
                  key={plan.slug}
                  onClick={() => setSelectedPlanSlug(plan.slug)}
                  className={`cursor-pointer rounded-2xl p-5 sm:p-6 transition-all relative border-2 flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-500 ring-4 ring-blue-500/20 shadow-xl ' + (theme === 'dark' ? 'bg-slate-900' : 'bg-blue-50/50')
                      : theme === 'dark'
                        ? 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                        : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md">
                      Le Plus Choisi en Tunisie 🇹🇳
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {plan.badge}
                      </span>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-slate-400/40 text-transparent'
                      }`}>
                        <span className="material-symbols-outlined text-[16px]">check</span>
                      </div>
                    </div>

                    <h3 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      Pack {plan.name}
                    </h3>

                    <div className="mt-3 pb-3 border-b border-slate-700/30 flex items-baseline gap-1">
                      <span className={`text-3xl font-black font-mono ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
                        {plan.price}
                      </span>
                      <span className="text-xs font-bold text-slate-400">TND / mois</span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs font-medium">
                      <p className={`flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                        <span className="material-symbols-outlined text-blue-500 text-[16px]">precision_manufacturing</span>
                        <span>{plan.capacity}</span>
                      </p>
                      <p className={`flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                        <span className="material-symbols-outlined text-emerald-500 text-[16px]">group</span>
                        <span>{plan.workers}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-700/20">
                    <span className={`text-xs font-black block text-center py-2 rounded-xl transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md'
                        : theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {isSelected ? '✓ Pack Sélectionné' : 'Choisir ce Pack'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
            step === 1
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : theme === 'dark' ? 'bg-slate-900 text-slate-400 border border-slate-800' : 'bg-white text-slate-600 border border-slate-200'
          }`}>
            <span>1</span>
            <span>Compte Administrateur</span>
          </div>
          <span className="text-slate-500">→</span>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
            step === 2
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : theme === 'dark' ? 'bg-slate-900 text-slate-400 border border-slate-800' : 'bg-white text-slate-600 border border-slate-200'
          }`}>
            <span>2</span>
            <span>Profil de l'Usine</span>
          </div>
        </div>

        {/* Registration Form Container */}
        <div className={`p-6 sm:p-10 rounded-3xl border transition-all ${
          theme === 'dark'
            ? 'bg-slate-900/90 border-slate-800 shadow-2xl backdrop-blur-xl'
            : 'bg-white border-slate-200 shadow-xl'
        }`}>
          
          {step === 1 ? (
            <form onSubmit={handleStep1Next} className="space-y-6">
              <div>
                <h3 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
                  1. Créez votre compte Administrateur
                </h3>
                <p className={`text-xs sm:text-sm font-medium mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Ce compte sera le propriétaire (OWNER) de l'espace usine avec tous les accès de supervision.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold uppercase mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Mohamed"
                    value={accountForm.first_name}
                    onChange={(e) => setAccountForm({ ...accountForm, first_name: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium border focus:outline-none focus:border-blue-500 transition-all ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold uppercase mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Ben Amor"
                    value={accountForm.last_name}
                    onChange={(e) => setAccountForm({ ...accountForm, last_name: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium border focus:outline-none focus:border-blue-500 transition-all ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold uppercase mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    Email Professionnel <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="directeur@usine.tn"
                    value={accountForm.email}
                    onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium border focus:outline-none focus:border-blue-500 transition-all ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold uppercase mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    Téléphone Direct
                  </label>
                  <input
                    type="tel"
                    placeholder="+216 98 000 000"
                    value={accountForm.phone}
                    onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium border focus:outline-none focus:border-blue-500 transition-all ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold uppercase mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    Mot de passe <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={accountForm.password}
                    onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium border focus:outline-none focus:border-blue-500 transition-all ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold uppercase mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    Confirmer le mot de passe <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={accountForm.confirm_password}
                    onChange={(e) => setAccountForm({ ...accountForm, confirm_password: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium border focus:outline-none focus:border-blue-500 transition-all ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Continuer vers les Informations de l'Usine</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>

              {/* Social Auth Divider */}
              <div className="relative flex items-center justify-center pt-2">
                <div className={`border-t w-full ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}></div>
                <span className={`px-3 text-[11px] font-bold uppercase ${theme === 'dark' ? 'bg-slate-900 text-slate-500' : 'bg-white text-slate-400'}`}>
                  OU
                </span>
                <div className={`border-t w-full ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}></div>
              </div>

              {/* Google OAuth Quick Sign Up */}
              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={isLoading}
                className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-3 shadow-xs ${
                  theme === 'dark'
                    ? 'bg-slate-950 border-slate-800 text-slate-200 hover:bg-slate-800'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>S'inscrire avec Google</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleFinalSubmit} className="space-y-6">
              <div>
                <h3 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
                  2. Informations sur votre Usine ({currentPlan.name})
                </h3>
                <p className={`text-xs sm:text-sm font-medium mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Ces informations permettent de configurer votre tenant d'entreprise et vos indicateurs TRS.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold uppercase mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    Nom Commercial de l'Usine <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Plastique Moderne Tunisie"
                    value={factoryForm.company_name}
                    onChange={(e) => setFactoryForm({ ...factoryForm, company_name: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium border focus:outline-none focus:border-blue-500 transition-all ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold uppercase mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    Raison Sociale / Société Légale
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Société PMT SARL"
                    value={factoryForm.legal_name}
                    onChange={(e) => setFactoryForm({ ...factoryForm, legal_name: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium border focus:outline-none focus:border-blue-500 transition-all ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-xs font-bold uppercase mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    Secteur d'Activité
                  </label>
                  <select
                    value={factoryForm.industry}
                    onChange={(e) => setFactoryForm({ ...factoryForm, industry: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium border focus:outline-none focus:border-blue-500 transition-all ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
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
                  <label className={`block text-xs font-bold uppercase mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    Matricule Fiscal (Optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="1234567/A/M/000"
                    value={factoryForm.tax_id}
                    onChange={(e) => setFactoryForm({ ...factoryForm, tax_id: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium border focus:outline-none focus:border-blue-500 transition-all ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    Gouvernorat (Tunisie)
                  </label>
                  <select
                    value={factoryForm.governorate}
                    onChange={(e) => setFactoryForm({ ...factoryForm, governorate: e.target.value, city: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium border focus:outline-none focus:border-blue-500 transition-all ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    {['Tunis', 'Ben Arous', 'Ariana', 'Manouba', 'Nabeul', 'Bizerte', 'Sousse', 'Monastir', 'Sfax', 'Kairouan', 'Gabès', 'Béja', 'Jendouba', 'Autre'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold uppercase mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    Adresse / Zone Industrielle
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Z.I. Mghira 2, Lot 45"
                    value={factoryForm.address}
                    onChange={(e) => setFactoryForm({ ...factoryForm, address: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium border focus:outline-none focus:border-blue-500 transition-all ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold uppercase mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    Nombre de Machines Estimé
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={factoryForm.machine_count}
                    onChange={(e) => setFactoryForm({ ...factoryForm, machine_count: parseInt(e.target.value) || 1 })}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium border focus:outline-none focus:border-blue-500 transition-all ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={`px-6 py-4 rounded-xl font-bold text-sm transition-colors ${
                    theme === 'dark'
                      ? 'bg-slate-800 hover:bg-slate-700 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  ← Retour
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
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
      <footer className={`text-center py-6 text-xs border-t transition-colors ${
        theme === 'dark' ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'
      }`}>
        © {new Date().getFullYear()} FactoryFlow TN — Sécurisé par Supabase & PostgreSQL Multi-Tenant.
      </footer>
    </div>
  );
}
