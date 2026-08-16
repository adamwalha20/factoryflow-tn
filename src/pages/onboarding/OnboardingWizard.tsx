import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTenantStore } from '../../store/tenantStore';
import { useMesStore } from '../../store/mesStore';
import { useProductionStore } from '../../store/production';
import toast from 'react-hot-toast';

export function OnboardingWizard() {
  const navigate = useNavigate();
  const { currentOrg, fetchTenantData, updateCurrentOrg } = useTenantStore();
  const { addArticle } = useMesStore();
  const { addMachine } = useProductionStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Step 2: Machines State
  const [machinesList, setMachinesList] = useState([
    { name: 'Ligne Bobineuse 01', code: 'M01', department: 'Bobinage' },
    { name: 'Ligne Découpeuse 02', code: 'M02', department: 'Découpe' }
  ]);
  const [newMachine, setNewMachine] = useState({ name: '', code: '', department: 'Production' });

  // Step 3: Workers State
  const [workersList, setWorkersList] = useState([
    { first_name: 'Mohamed', last_name: 'Amine', role: 'Machine Operator', pin_code: '1234' },
    { first_name: 'Tarek', last_name: 'Khaled', role: 'Machine Operator', pin_code: '5678' }
  ]);
  const [newWorker, setNewWorker] = useState({ first_name: '', last_name: '', role: 'Machine Operator', pin_code: '1111' });

  // Step 4: Articles State
  const [articlesList, setArticlesList] = useState([
    { reference: 'RUB-48-100-BR', designation: 'Ruban Adhésif Brun 48mm x 100m', colisage: '36' },
    { reference: 'RUB-48-100-TR', designation: 'Ruban Adhésif Transparent 48mm x 100m', colisage: '36' }
  ]);
  const [newArticle, setNewArticle] = useState({ reference: '', designation: '', colisage: '36' });

  useEffect(() => {
    fetchTenantData();
  }, [fetchTenantData]);

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
    setWorkersList([...workersList, newWorker]);
    setNewWorker({ first_name: '', last_name: '', role: 'Machine Operator', pin_code: '1111' });
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
    <div className="min-h-screen bg-zinc-100 flex flex-col justify-between font-sans">
      
      {/* Top Header */}
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-600/20">
            <span className="material-symbols-outlined text-[24px]">precision_manufacturing</span>
          </div>
          <div>
            <h1 className="text-base font-black text-zinc-900 leading-tight">
              Bienvenue chez {currentOrg?.name || 'Votre Usine'}
            </h1>
            <p className="text-xs text-zinc-500 font-medium">Assistant de démarrage express (5 étapes)</p>
          </div>
        </div>

        <button
          onClick={handleCompleteOnboarding}
          className="text-xs font-bold text-zinc-500 hover:text-zinc-900 px-3 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
        >
          Passer la configuration →
        </button>
      </header>

      {/* Main Wizard Content */}
      <main className="max-w-4xl w-full mx-auto px-4 py-8 flex-1 flex flex-col justify-center">
        
        {/* Progress Bar */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs mb-8">
          <div className="grid grid-cols-5 gap-2 text-center">
            {stepsHeaders.map((st) => (
              <div
                key={st.num}
                className={`py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                  currentStep === st.num
                    ? 'bg-blue-600 text-white shadow-sm'
                    : currentStep > st.num
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-zinc-50 text-zinc-400'
                }`}
              >
                <div className="font-black">{st.num}. {st.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Step Card Container */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-zinc-200 shadow-md">
          
          {/* STEP 1: Factory Profile */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-black text-blue-600 uppercase">Étape 1 sur 5</span>
                <h2 className="text-2xl font-black text-zinc-900 mt-1">Profil & Horaires de l'Usine</h2>
                <p className="text-sm text-zinc-500 font-medium">
                  Vérifiez les paramètres par défaut de votre site de fabrication.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50 p-6 rounded-2xl border border-zinc-200 text-sm">
                <div>
                  <span className="text-xs text-zinc-400 font-bold uppercase block">Nom de l'Usine :</span>
                  <span className="font-black text-zinc-900 text-base">{currentOrg?.name || 'Usine Principale'}</span>
                </div>
                <div>
                  <span className="text-xs text-zinc-400 font-bold uppercase block">Localisation :</span>
                  <span className="font-black text-zinc-900 text-base">{currentOrg?.city || 'Tunisie'} ({currentOrg?.country || 'Tunisia'})</span>
                </div>
                <div>
                  <span className="text-xs text-zinc-400 font-bold uppercase block">Fuseau Horaire :</span>
                  <span className="font-bold text-zinc-700">Africa/Tunis (GMT+1)</span>
                </div>
                <div>
                  <span className="text-xs text-zinc-400 font-bold uppercase block">Langue par défaut :</span>
                  <span className="font-bold text-zinc-700">Français (Arabe RTL disponible)</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-xs text-blue-900 font-medium flex items-center gap-3">
                <span className="material-symbols-outlined text-[24px] text-blue-600 shrink-0">info</span>
                <span>Les shifts d'équipe sont configurés par défaut en 3x8 (Matin 06h-14h, Après-midi 14h-22h, Nuit 22h-06h). Vous pourrez les ajuster à tout moment dans Paramètres.</span>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
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
                <span className="text-xs font-black text-blue-600 uppercase">Étape 2 sur 5</span>
                <h2 className="text-2xl font-black text-zinc-900 mt-1">Parc Machines & Lignes de Production</h2>
                <p className="text-sm text-zinc-500 font-medium">
                  Ajoutez vos premières machines. Les tablettes atelier seront assignées à ces postes.
                </p>
              </div>

              {/* Machine Input Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Nom Machine (ex: Bobineuse M03)"
                    value={newMachine.name}
                    onChange={(e) => setNewMachine({ ...newMachine, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Code (ex: M03)"
                    value={newMachine.code}
                    onChange={(e) => setNewMachine({ ...newMachine, code: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-bold"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddMachine}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-black rounded-xl"
                >
                  + Ajouter
                </button>
              </div>

              {/* Machine Cards List */}
              <div className="space-y-2">
                {machinesList.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 bg-white border border-zinc-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center">
                        {m.code}
                      </span>
                      <div>
                        <p className="text-sm font-black text-zinc-900">{m.name}</p>
                        <p className="text-[11px] text-zinc-400 font-medium">{m.department}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setMachinesList(machinesList.filter((_, i) => i !== idx))}
                      className="text-zinc-400 hover:text-red-500 text-xs font-bold"
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl"
                >
                  ← Précédent
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
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
                <span className="text-xs font-black text-blue-600 uppercase">Étape 3 sur 5</span>
                <h2 className="text-2xl font-black text-zinc-900 mt-1">Opérateurs & Ouvriers Machine</h2>
                <p className="text-sm text-zinc-500 font-medium">
                  Créez les profils des opérateurs qui utiliseront les tablettes tactiles en atelier.
                </p>
              </div>

              {/* Worker Input Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                <div>
                  <input
                    type="text"
                    placeholder="Prénom"
                    value={newWorker.first_name}
                    onChange={(e) => setNewWorker({ ...newWorker, first_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Nom"
                    value={newWorker.last_name}
                    onChange={(e) => setNewWorker({ ...newWorker, last_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="PIN (ex: 1234)"
                    value={newWorker.pin_code}
                    onChange={(e) => setNewWorker({ ...newWorker, pin_code: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-bold"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddWorker}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-black rounded-xl"
                >
                  + Ajouter
                </button>
              </div>

              {/* Worker Cards List */}
              <div className="space-y-2">
                {workersList.map((w, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 bg-white border border-zinc-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">
                        {w.first_name[0]}{w.last_name[0]}
                      </span>
                      <div>
                        <p className="text-sm font-black text-zinc-900">{w.first_name} {w.last_name}</p>
                        <p className="text-[11px] text-zinc-400 font-medium">Rôle : Opérateur Machine • Code PIN : ****</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setWorkersList(workersList.filter((_, i) => i !== idx))}
                      className="text-zinc-400 hover:text-red-500 text-xs font-bold"
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl"
                >
                  ← Précédent
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
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
                <span className="text-xs font-black text-blue-600 uppercase">Étape 4 sur 5</span>
                <h2 className="text-2xl font-black text-zinc-900 mt-1">Articles & Produits Finis</h2>
                <p className="text-sm text-zinc-500 font-medium">
                  Renseignez vos premiers articles pour pouvoir lancer des Ordres de Fabrication (OF).
                </p>
              </div>

              {/* Article Input Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                <div>
                  <input
                    type="text"
                    placeholder="Référence (ex: ART-01)"
                    value={newArticle.reference}
                    onChange={(e) => setNewArticle({ ...newArticle, reference: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-bold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Désignation Produit"
                    value={newArticle.designation}
                    onChange={(e) => setNewArticle({ ...newArticle, designation: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-bold"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddArticle}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-black rounded-xl"
                >
                  + Ajouter
                </button>
              </div>

              {/* Article Cards List */}
              <div className="space-y-2">
                {articlesList.map((a, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 bg-white border border-zinc-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-blue-600">inventory_2</span>
                      <div>
                        <p className="text-sm font-black text-zinc-900">{a.reference}</p>
                        <p className="text-[11px] text-zinc-500 font-medium">{a.designation}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setArticlesList(articlesList.filter((_, i) => i !== idx))}
                      className="text-zinc-400 hover:text-red-500 text-xs font-bold"
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl"
                >
                  ← Précédent
                </button>
                <button
                  onClick={() => setCurrentStep(5)}
                  className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
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
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <span className="material-symbols-outlined text-[48px]">rocket_launch</span>
              </div>

              <div>
                <span className="text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Prêt pour la Production
                </span>
                <h2 className="text-3xl font-black text-zinc-900 mt-3">Votre Usine est Opérationnelle !</h2>
                <p className="text-sm text-zinc-600 font-medium max-w-md mx-auto mt-2">
                  Vos machines, opérateurs et articles sont configurés. Vous bénéficiez de 14 jours d'accès complet.
                </p>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 p-6 rounded-2xl max-w-md mx-auto text-left text-xs text-zinc-700 space-y-2">
                <div className="flex justify-between font-bold">
                  <span>Machines configurées :</span>
                  <span className="text-blue-600">{machinesList.length} machines</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Opérateurs atelier :</span>
                  <span className="text-blue-600">{workersList.length} ouvriers</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Articles au catalogue :</span>
                  <span className="text-blue-600">{articlesList.length} références</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Statut Forfait :</span>
                  <span className="text-emerald-600">Essai Gratuit Actif (14 jours)</span>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={handleCompleteOnboarding}
                  disabled={isSaving}
                  className="px-10 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-base rounded-2xl shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
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
