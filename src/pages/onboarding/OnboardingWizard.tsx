import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTenantStore } from '../../store/tenantStore';
import { useMesStore } from '../../store/mesStore';
import { useProductionStore } from '../../store/production';
import { useThemeStore } from '../../store/theme';
import toast from 'react-hot-toast';

export function OnboardingWizard() {
  const navigate = useNavigate();
  const { currentOrg, fetchTenantData, updateCurrentOrg } = useTenantStore();
  const { addArticle } = useMesStore();
  const { addMachine } = useProductionStore();
  const { theme, toggleTheme } = useThemeStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Step 1: Factory Details State
  const [factoryProfile, setFactoryProfile] = useState({
    name: '',
    legal_name: '',
    industry: 'Emballage & Conditionnement',
    city: 'Tunis',
    governorate: 'Tunis',
    tax_id: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    if (currentOrg) {
      setFactoryProfile({
        name: currentOrg.name || '',
        legal_name: currentOrg.legal_name || currentOrg.name || '',
        industry: currentOrg.industry || 'Emballage & Conditionnement',
        city: currentOrg.city || 'Tunis',
        governorate: currentOrg.governorate || 'Tunis',
        tax_id: currentOrg.tax_id || '',
        phone: currentOrg.phone || '',
        email: currentOrg.email || ''
      });
    }
  }, [currentOrg]);

  // Step 2: Machines State (Blank by default, user adds manually or uses suggestions)
  const [machinesList, setMachinesList] = useState<{ name: string; code: string; department: string }[]>([]);
  const [newMachine, setNewMachine] = useState({ name: '', code: '', department: 'Production' });

  // Step 3: Workers State (Blank by default)
  const [workersList, setWorkersList] = useState<{ first_name: string; last_name: string; role: string; pin_code: string }[]>([]);
  const [newWorker, setNewWorker] = useState({ first_name: '', last_name: '', role: 'Machine Operator', pin_code: '' });

  // Step 4: Articles State (Blank by default)
  const [articlesList, setArticlesList] = useState<{ reference: string; designation: string; colisage: string }[]>([]);
  const [newArticle, setNewArticle] = useState({ reference: '', designation: '', colisage: '36' });

  useEffect(() => {
    fetchTenantData();
  }, [fetchTenantData]);

  const loadMachineSuggestions = () => {
    setMachinesList([
      { name: 'Ligne Bobineuse 01', code: 'M01', department: 'Bobinage' },
      { name: 'Ligne Découpeuse 02', code: 'M02', department: 'Découpe' }
    ]);
    toast.success('Exemples de machines ajoutés.');
  };

  const loadWorkerSuggestions = () => {
    setWorkersList([
      { first_name: 'Mohamed', last_name: 'Amine', role: 'Machine Operator', pin_code: '1234' },
      { first_name: 'Tarek', last_name: 'Khaled', role: 'Machine Operator', pin_code: '5678' }
    ]);
    toast.success('Exemples d\'opérateurs ajoutés.');
  };

  const loadArticleSuggestions = () => {
    setArticlesList([
      { reference: 'RUB-48-100-BR', designation: 'Ruban Adhésif Brun 48mm x 100m', colisage: '36' },
      { reference: 'RUB-48-100-TR', designation: 'Ruban Adhésif Transparent 48mm x 100m', colisage: '36' }
    ]);
    toast.success('Exemples d\'articles ajoutés.');
  };

  const handleAddMachine = () => {
    if (!newMachine.name || !newMachine.code) {
      toast.error('Indiquez le nom et le code machine.');
      return;
    }
    setMachinesList([...machinesList, newMachine]);
    setNewMachine({ name: '', code: '', department: 'Production' });
  };

  const handleAddWorker = () => {
    if (!newWorker.first_name || !newWorker.last_name) {
      toast.error('Indiquez le nom et prénom de l\'ouvrier.');
      return;
    }
    setWorkersList([...workersList, { ...newWorker, pin_code: newWorker.pin_code || '1234' }]);
    setNewWorker({ first_name: '', last_name: '', role: 'Machine Operator', pin_code: '' });
  };

  const handleAddArticle = () => {
    if (!newArticle.reference || !newArticle.designation) {
      toast.error('Indiquez la référence et la désignation de l\'article.');
      return;
    }
    setArticlesList([...articlesList, newArticle]);
    setNewArticle({ reference: '', designation: '', colisage: '36' });
  };

  const handleCompleteOnboarding = async () => {
    setIsSaving(true);
    const orgId = currentOrg?.id || localStorage.getItem('active_org_id');

    try {
      if (orgId) {
        // 1. Insert Initial Machines
        for (const m of machinesList) {
          try {
            await (supabase as any).from('machines').insert([{
              organization_id: orgId,
              name: m.name,
              code: m.code,
              department: m.department,
              status: 'Active',
              location: currentOrg?.city || 'Atelier'
            }]);
          } catch (e) {
            console.warn('Machine insert note', e);
          }
        }

        // 2. Insert Initial Workers (into both users and employees)
        for (const w of workersList) {
          try {
            const workerId = crypto.randomUUID();
            const fullName = `${w.first_name} ${w.last_name}`;
            const generatedEmail = `${w.first_name.toLowerCase().replace(/\s+/g, '')}@atelier.tn`;

            // Insert into users table
            await (supabase as any).from('users').insert([{
              id: workerId,
              organization_id: orgId,
              name: fullName,
              email: generatedEmail,
              role: w.role || 'Machine Operator',
              status: 'Actif'
            }]);

            // Insert into employees table
            await (supabase as any).from('employees').insert([{
              id: workerId,
              user_id: workerId,
              organization_id: orgId,
              first_name: w.first_name,
              last_name: w.last_name,
              email: generatedEmail,
              role: w.role || 'Machine Operator',
              pin_code: w.pin_code,
              is_active: true
            }]);
          } catch (e) {
            console.warn('Worker insert note', e);
          }
        }

        // 3. Insert Initial Articles
        for (const a of articlesList) {
          try {
            await (supabase as any).from('articles').insert([{
              organization_id: orgId,
              reference: a.reference,
              designation: a.designation,
              category: 'Produit Fini',
              unit: 'Rouleau'
            }]);
          } catch (e) {
            console.warn('Article insert note', e);
          }
        }

        // 4. Mark Onboarding as Completed on Organization
        await updateCurrentOrg({ onboarding_completed: true, onboarding_step: 5 });
      }

      toast.success('Configuration terminée avec succès ! Votre usine est prête.');
      navigate('/app/dashboard');
    } catch (err: any) {
      console.error('Failed to complete onboarding', err);
      navigate('/app/dashboard');
    } finally {
      setIsSaving(false);
    }
  };

  const stepsHeaders = [
    { num: 1, label: 'Usine & Paramètres' },
    { num: 2, label: 'Parc Machines' },
    { num: 3, label: 'Opérateurs & Ouvriers' },
    { num: 4, label: 'Articles & Produits' },
    { num: 5, label: 'Lancement' }
  ];

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 flex flex-col justify-between ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Top Header */}
      <header className={`px-6 py-4 flex items-center justify-between border-b transition-colors ${
        theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-600/20">
            <span className="material-symbols-outlined text-[24px]">precision_manufacturing</span>
          </div>
          <div>
            <h1 className={`text-base font-black leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Bienvenue chez {currentOrg?.name || 'Votre Usine'}
            </h1>
            <p className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Assistant de démarrage express (5 étapes)
            </p>
          </div>
        </div>

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
          <button
            onClick={handleCompleteOnboarding}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Passer la configuration →
          </button>
        </div>
      </header>

      {/* Main Wizard Content */}
      <main className="max-w-4xl w-full mx-auto px-4 py-8 flex-1 flex flex-col justify-center">
        
        {/* Progress Bar */}
        <div className={`p-4 rounded-2xl border transition-colors mb-8 ${
          theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="grid grid-cols-5 gap-2 text-center">
            {stepsHeaders.map((st) => (
              <div
                key={st.num}
                className={`py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                  currentStep === st.num
                    ? 'bg-blue-600 text-white shadow-sm'
                    : currentStep > st.num
                    ? theme === 'dark'
                      ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : theme === 'dark'
                      ? 'bg-slate-950 text-slate-500'
                      : 'bg-slate-100 text-slate-400'
                }`}
              >
                <div className="font-black">{st.num}. {st.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Step Card Container */}
        <div className={`p-8 sm:p-10 rounded-3xl border transition-all ${
          theme === 'dark'
            ? 'bg-slate-900/90 border-slate-800 shadow-2xl backdrop-blur-xl'
            : 'bg-white border-slate-200 shadow-md'
        }`}>
          
          {/* STEP 1: Factory Profile */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-black text-blue-500 uppercase tracking-wider">Étape 1 sur 5</span>
                <h2 className={`text-2xl font-black mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Profil & Informations de l'Usine
                </h2>
                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Renseignez les détails de votre site de fabrication pour initialiser votre espace.
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
                    value={factoryProfile.name}
                    onChange={(e) => setFactoryProfile({ ...factoryProfile, name: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium border focus:outline-none focus:border-blue-500 transition-all ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    Raison Sociale Légale
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: PMT SARL"
                    value={factoryProfile.legal_name}
                    onChange={(e) => setFactoryProfile({ ...factoryProfile, legal_name: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium border focus:outline-none focus:border-blue-500 transition-all ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    Secteur d'Activité
                  </label>
                  <select
                    value={factoryProfile.industry}
                    onChange={(e) => setFactoryProfile({ ...factoryProfile, industry: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium border focus:outline-none focus:border-blue-500 transition-all ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="Emballage & Conditionnement">Emballage & Conditionnement</option>
                    <option value="Plasturgie & Injection">Plasturgie & Injection</option>
                    <option value="Textile & Confection">Textile & Confection</option>
                    <option value="Agroalimentaire">Agroalimentaire</option>
                    <option value="Métallurgie & Mécanique">Métallurgie & Mécanique</option>
                    <option value="Autre Industrie">Autre Industrie</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    Ville / Gouvernorat
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Sousse, Ben Arous, Sfax"
                    value={factoryProfile.city}
                    onChange={(e) => setFactoryProfile({ ...factoryProfile, city: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium border focus:outline-none focus:border-blue-500 transition-all ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    Matricule Fiscal (MF)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 1234567/A/M/000"
                    value={factoryProfile.tax_id}
                    onChange={(e) => setFactoryProfile({ ...factoryProfile, tax_id: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium border focus:outline-none focus:border-blue-500 transition-all ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    Téléphone Usine
                  </label>
                  <input
                    type="tel"
                    placeholder="+216 71 000 000"
                    value={factoryProfile.phone}
                    onChange={(e) => setFactoryProfile({ ...factoryProfile, phone: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium border focus:outline-none focus:border-blue-500 transition-all ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className={`p-4 rounded-xl text-xs font-medium flex items-center gap-3 border ${
                theme === 'dark'
                  ? 'bg-blue-950/40 border-blue-800 text-blue-200'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}>
                <span className="material-symbols-outlined text-[24px] text-blue-500 shrink-0">info</span>
                <span>Les shifts d'équipe sont configurés par défaut en 3x8 (Matin 06h-14h, Après-midi 14h-22h, Nuit 22h-06h). Vous pourrez les ajuster à tout moment dans Paramètres.</span>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={async () => {
                    if (!factoryProfile.name) {
                      toast.error("Veuillez indiquer le nom de votre usine.");
                      return;
                    }
                    await updateCurrentOrg(factoryProfile);
                    setCurrentStep(2);
                  }}
                  className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  <span>Continuer : Ajouter des Machines</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Add Machines */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-black text-blue-500 uppercase tracking-wider">Étape 2 sur 5</span>
                <h2 className={`text-2xl font-black mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Parc Machines & Lignes de Production
                </h2>
                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Ajoutez vos premières machines. Les tablettes atelier seront assignées à ces postes.
                </p>
              </div>

              {/* Machine Input Bar */}
              <div className={`grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-2xl border ${
                theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Nom Machine (ex: Bobineuse M03)"
                    value={newMachine.name}
                    onChange={(e) => setNewMachine({ ...newMachine, name: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Code (ex: M03)"
                    value={newMachine.code}
                    onChange={(e) => setNewMachine({ ...newMachine, code: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddMachine}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl transition-all"
                >
                  + Ajouter
                </button>
              </div>

              {/* Machine Cards List */}
              {machinesList.length === 0 ? (
                <div className={`p-6 border border-dashed rounded-2xl text-center space-y-3 ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-300'
                }`}>
                  <span className="material-symbols-outlined text-slate-400 text-[32px]">precision_manufacturing</span>
                  <p className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Aucune machine ajoutée pour l'instant. Saisissez vos machines ci-dessus ou chargez des exemples.
                  </p>
                  <button
                    type="button"
                    onClick={loadMachineSuggestions}
                    className={`px-4 py-2 text-xs font-bold rounded-xl border transition-colors ${
                      theme === 'dark'
                        ? 'bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 border-blue-800'
                        : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                    }`}
                  >
                    💡 Charger 2 exemples de machines
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {machinesList.map((m, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-3.5 border rounded-xl transition-all ${
                        theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-500 font-black text-xs flex items-center justify-center">
                          {m.code}
                        </span>
                        <div>
                          <p className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{m.name}</p>
                          <p className={`text-[11px] font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{m.department}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setMachinesList(machinesList.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-red-500 text-xs font-bold"
                      >
                        Supprimer
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center pt-4">
                <button
                  onClick={() => setCurrentStep(1)}
                  className={`px-6 py-3 font-bold text-xs rounded-xl transition-colors ${
                    theme === 'dark'
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  ← Précédent
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  <span>Continuer : Ouvriers & Opérateurs</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Add Workers */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-black text-blue-500 uppercase tracking-wider">Étape 3 sur 5</span>
                <h2 className={`text-2xl font-black mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Opérateurs & Ouvriers Machine
                </h2>
                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Créez les profils des opérateurs qui utiliseront les tablettes tactiles en atelier.
                </p>
              </div>

              {/* Worker Input Bar */}
              <div className={`grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-2xl border ${
                theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <input
                    type="text"
                    placeholder="Prénom"
                    value={newWorker.first_name}
                    onChange={(e) => setNewWorker({ ...newWorker, first_name: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Nom"
                    value={newWorker.last_name}
                    onChange={(e) => setNewWorker({ ...newWorker, last_name: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    maxLength={4}
                    inputMode="numeric"
                    placeholder="1234"
                    value={newWorker.pin_code}
                    onChange={(e) => setNewWorker({ ...newWorker, pin_code: e.target.value.replace(/[^0-9]/g, '').slice(0, 4) })}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold font-mono text-blue-500 border transition-all ${
                      theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'
                    }`}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddWorker}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl transition-all"
                >
                  + Ajouter
                </button>
              </div>

              {/* Worker Cards List */}
              {workersList.length === 0 ? (
                <div className={`p-6 border border-dashed rounded-2xl text-center space-y-3 ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-300'
                }`}>
                  <span className="material-symbols-outlined text-slate-400 text-[32px]">badge</span>
                  <p className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Aucun ouvrier ajouté pour l'instant. Saisissez vos opérateurs ci-dessus ou chargez des exemples.
                  </p>
                  <button
                    type="button"
                    onClick={loadWorkerSuggestions}
                    className={`px-4 py-2 text-xs font-bold rounded-xl border transition-colors ${
                      theme === 'dark'
                        ? 'bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 border-blue-800'
                        : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                    }`}
                  >
                    💡 Charger 2 exemples d'opérateurs
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {workersList.map((w, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-3.5 border rounded-xl transition-all ${
                        theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center">
                          {w.first_name[0] || 'O'}{w.last_name[0] || 'P'}
                        </span>
                        <div>
                          <p className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            {w.first_name} {w.last_name}
                          </p>
                          <p className={`text-[11px] font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                            Rôle : Opérateur Machine • Code PIN : •••• {w.pin_code}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setWorkersList(workersList.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-red-500 text-xs font-bold"
                      >
                        Supprimer
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center pt-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  className={`px-6 py-3 font-bold text-xs rounded-xl transition-colors ${
                    theme === 'dark'
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  ← Précédent
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  <span>Continuer : Articles & Produits</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Add Products */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-black text-blue-500 uppercase tracking-wider">Étape 4 sur 5</span>
                <h2 className={`text-2xl font-black mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Articles & Produits Finis
                </h2>
                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Renseignez vos premiers articles pour pouvoir lancer des Ordres de Fabrication (OF).
                </p>
              </div>

              {/* Article Input Bar */}
              <div className={`grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-2xl border ${
                theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <input
                    type="text"
                    placeholder="Référence (ex: ART-01)"
                    value={newArticle.reference}
                    onChange={(e) => setNewArticle({ ...newArticle, reference: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Désignation Produit"
                    value={newArticle.designation}
                    onChange={(e) => setNewArticle({ ...newArticle, designation: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddArticle}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl transition-all"
                >
                  + Ajouter
                </button>
              </div>

              {/* Article Cards List */}
              {articlesList.length === 0 ? (
                <div className={`p-6 border border-dashed rounded-2xl text-center space-y-3 ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-300'
                }`}>
                  <span className="material-symbols-outlined text-slate-400 text-[32px]">inventory_2</span>
                  <p className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Aucun article ajouté pour l'instant. Saisissez vos produits ci-dessus ou chargez des exemples.
                  </p>
                  <button
                    type="button"
                    onClick={loadArticleSuggestions}
                    className={`px-4 py-2 text-xs font-bold rounded-xl border transition-colors ${
                      theme === 'dark'
                        ? 'bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 border-blue-800'
                        : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                    }`}
                  >
                    💡 Charger 2 exemples d'articles
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {articlesList.map((a, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-3.5 border rounded-xl transition-all ${
                        theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-blue-500">inventory_2</span>
                        <div>
                          <p className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{a.reference}</p>
                          <p className={`text-[11px] font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{a.designation}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setArticlesList(articlesList.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-red-500 text-xs font-bold"
                      >
                        Supprimer
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center pt-4">
                <button
                  onClick={() => setCurrentStep(3)}
                  className={`px-6 py-3 font-bold text-xs rounded-xl transition-colors ${
                    theme === 'dark'
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  ← Précédent
                </button>
                <button
                  onClick={() => setCurrentStep(5)}
                  className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  <span>Continuer : Finaliser le Démarrage</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Launch Factory */}
          {currentStep === 5 && (
            <div className="space-y-6 text-center py-6">
              <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 border border-emerald-500/30">
                <span className="material-symbols-outlined text-[48px]">rocket_launch</span>
              </div>

              <div>
                <span className="text-xs font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                  Prêt pour la Production
                </span>
                <h2 className={`text-3xl font-black mt-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Votre Usine est Opérationnelle !
                </h2>
                <p className={`text-sm font-medium max-w-md mx-auto mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  Vos machines, opérateurs et articles sont configurés. Vous bénéficiez de 14 jours d'accès complet.
                </p>
              </div>

              <div className={`border p-6 rounded-2xl max-w-md mx-auto text-left text-xs space-y-2 ${
                theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div className="flex justify-between font-bold">
                  <span>Machines configurées :</span>
                  <span className="text-blue-500">{machinesList.length} machines</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Opérateurs atelier :</span>
                  <span className="text-blue-500">{workersList.length} ouvriers</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Articles au catalogue :</span>
                  <span className="text-blue-500">{articlesList.length} références</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Statut Forfait :</span>
                  <span className="text-emerald-500">Essai Gratuit Actif (14 jours)</span>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={handleCompleteOnboarding}
                  disabled={isSaving}
                  className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black text-base rounded-2xl shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <span>Ouverture de l'Usine...</span>
                  ) : (
                    <>
                      <span>Accéder au Tableau de Bord</span>
                      <span className="material-symbols-outlined text-[20px]">dashboard</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

    </div>
  );
}
