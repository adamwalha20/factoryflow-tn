import React, { useState } from 'react';
import { MarketingNavbar } from '../../components/marketing/Navbar';
import { MarketingFooter } from '../../components/marketing/Footer';
import { useThemeStore } from '../../store/theme';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export function ContactPage() {
  const { theme } = useThemeStore();
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    factory_size: '1-5 machines',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.company || !formData.email) {
      toast.error('Veuillez renseigner votre nom, entreprise et email.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await (supabase as any).from('leads').insert([
        {
          name: formData.name,
          company: formData.company,
          email: formData.email,
          phone: formData.phone || null,
          factory_size: formData.factory_size,
          message: formData.message || null,
          status: 'NEW'
        }
      ]);

      if (error) throw error;

      setIsSuccess(true);
      toast.success('Votre demande a été envoyée avec succès ! Un conseiller vous contactera sous 24h.');
    } catch (err: any) {
      console.error('Lead submission failed', err);
      toast.error('Erreur lors de l\'envoi. Veuillez réessayer ou nous contacter par téléphone.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <MarketingNavbar />

      <section className="pt-16 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/30">
              Support & Démonstration Usine
            </span>
            <h1 className={`text-4xl sm:text-5xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
              Parlons de votre Atelier
            </h1>
            <p className={`text-sm sm:text-base font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              Une question technique, un besoin d'intégration ERP ou une demande de démo sur site en Tunisie ? Notre équipe vous répond immédiatement.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Contact Direct Cards */}
            <div className="lg:col-span-5 space-y-6">
              <div className={`p-6 sm:p-8 rounded-3xl border ${
                theme === 'dark' ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <h3 className={`text-lg font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Coordonnées Directes
                </h3>
                <div className="space-y-4 text-xs sm:text-sm font-medium">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-blue-500 text-[20px] shrink-0 mt-0.5">location_on</span>
                    <div>
                      <p className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Siège & Support Technique</p>
                      <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>Zone Industrielle Ben Arous / Sousse, Tunisie</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-emerald-500 text-[20px] shrink-0">call</span>
                    <div>
                      <p className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Téléphone / WhatsApp</p>
                      <p className="text-blue-500 font-mono font-bold">+216 71 000 000</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-cyan-500 text-[20px] shrink-0">mail</span>
                    <div>
                      <p className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Email Professionnel</p>
                      <p className="text-blue-500 font-mono">contact@factoryflow.tn</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assistance Rapide WhatsApp */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/40 text-emerald-100 space-y-3">
                <div className="flex items-center gap-2 font-black text-sm text-emerald-400">
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                  <span>Assistance WhatsApp Directe</span>
                </div>
                <p className="text-xs text-slate-300 font-medium">
                  Envoyez-nous un message pour fixer un créneau de visite en usine avec l'un de nos consultants Lean Manufacturing.
                </p>
                <a
                  href="https://wa.me/21671000000"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  Ouvrir WhatsApp
                </a>
              </div>
            </div>

            {/* Form Column */}
            <div className="lg:col-span-7">
              <div className={`p-6 sm:p-10 rounded-3xl border ${
                theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xl'
              }`}>
                {isSuccess ? (
                  <div className="text-center py-10 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                      <span className="material-symbols-outlined text-[36px]">check_circle</span>
                    </div>
                    <h3 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
                      Demande Bien Reçue !
                    </h3>
                    <p className={`text-sm max-w-md mx-auto ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                      Merci pour votre intérêt. Notre équipe industrielle à Tunis prend contact avec vous sous 24h.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                          Votre Nom & Prénom *
                        </label>
                        <input
                          required
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                            theme === 'dark'
                              ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-500'
                              : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                          }`}
                          placeholder="Ex: Mohamed Ben Salem"
                        />
                      </div>

                      <div>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                          Nom de l'Usine / Entreprise *
                        </label>
                        <input
                          required
                          type="text"
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                            theme === 'dark'
                              ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-500'
                              : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                          }`}
                          placeholder="Ex: Plastik Tunisie SARL"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                          Email Professionnel *
                        </label>
                        <input
                          required
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                            theme === 'dark'
                              ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-500'
                              : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                          }`}
                          placeholder="m.bensalem@plastik.tn"
                        />
                      </div>

                      <div>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                          Numéro de Téléphone
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                            theme === 'dark'
                              ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-500'
                              : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                          }`}
                          placeholder="+216 20 000 000"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                        Taille du Parc Machine
                      </label>
                      <select
                        value={formData.factory_size}
                        onChange={(e) => setFormData({ ...formData, factory_size: e.target.value })}
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          theme === 'dark'
                            ? 'bg-slate-950 border-slate-800 text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      >
                        <option value="1-5 machines">1 à 5 Machines (Starter)</option>
                        <option value="6-15 machines">6 à 15 Machines (Professionnel)</option>
                        <option value="15+ machines">Plus de 15 Machines (Entreprise)</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                        Message ou Besoins Particuliers
                      </label>
                      <textarea
                        rows={3}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          theme === 'dark'
                            ? 'bg-slate-950 border-slate-800 text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                        placeholder="Ex: Nous souhaitons remplacer nos fiches suiveuses papier et intégrer les données avec notre Sage 100..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm rounded-xl shadow-lg transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? 'Envoi en cours...' : 'Envoyer ma Demande de Démo'}
                    </button>
                  </form>
                )}
              </div>
            </div>

          </div>

        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
