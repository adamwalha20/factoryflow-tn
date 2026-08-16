import React, { useState } from 'react';
import { MarketingNavbar } from '../../components/marketing/Navbar';
import { MarketingFooter } from '../../components/marketing/Footer';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export function ContactPage() {
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
      // 1. Insert into Supabase leads table
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
    <div className="min-h-screen bg-white text-zinc-900 font-sans">
      <MarketingNavbar />

      <section className="pt-16 pb-20 bg-gradient-to-b from-blue-50/50 via-white to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-black text-blue-600 uppercase tracking-widest bg-blue-100/80 px-3 py-1 rounded-full border border-blue-200">
              Support & Démonstration
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-zinc-950 mt-4 tracking-tight">
              Contactez notre équipe industrielle
            </h1>
            <p className="text-base text-zinc-600 font-medium mt-3">
              Vous souhaitez une démonstration personnalisée ou une étude d'intégration pour votre usine ? Laissez-nous vos coordonnées.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
            
            {/* Contact Details Column */}
            <div className="lg:col-span-2 space-y-8 bg-zinc-900 text-white p-8 rounded-3xl">
              <div>
                <h3 className="text-xl font-black text-white">Bureau & Support Local</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Une équipe d'ingénieurs basée en Tunisie à votre écoute du lundi au samedi.
                </p>
              </div>

              <div className="space-y-6 text-sm text-zinc-300">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-blue-400 shrink-0">location_on</span>
                  <div>
                    <strong className="block text-white">Siège & Déploiement</strong>
                    <span>Zone Industrielle Ben Arous / Sousse, Tunisie</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-blue-400 shrink-0">call</span>
                  <div>
                    <strong className="block text-white">Téléphone & WhatsApp</strong>
                    <span>+216 71 000 000 / +216 98 000 000</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-blue-400 shrink-0">mail</span>
                  <div>
                    <strong className="block text-white">Email Commercial</strong>
                    <span>contact@factoryflow.tn</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-blue-400 shrink-0">schedule</span>
                  <div>
                    <strong className="block text-white">Horaires Support Atelier</strong>
                    <span>Lun - Sam : 07h00 - 19h00 (Heure de Tunis)</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-800 rounded-2xl border border-zinc-700 text-xs text-zinc-300">
                💡 <strong>Démonstration sur site :</strong> Nous pouvons nous déplacer dans votre usine pour une démonstration avec vos propres machines et opérateurs.
              </div>
            </div>

            {/* Form Column */}
            <div className="lg:col-span-3 bg-white p-8 rounded-3xl border-2 border-zinc-200 shadow-sm">
              {isSuccess ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-[36px]">check</span>
                  </div>
                  <h3 className="text-2xl font-black text-zinc-900">Demande Transmise !</h3>
                  <p className="text-sm text-zinc-600 max-w-sm mx-auto font-medium">
                    Merci <strong>{formData.name}</strong>. Un ingénieur de FactoryFlow TN prendra contact avec vous d'ici 24 heures ouvrées.
                  </p>
                  <button
                    onClick={() => {
                      setIsSuccess(false);
                      setFormData({
                        name: '',
                        company: '',
                        email: '',
                        phone: '',
                        factory_size: '1-5 machines',
                        message: ''
                      });
                    }}
                    className="mt-4 px-6 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xl"
                  >
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 uppercase mb-1.5">
                        Nom & Prénom <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Sami Ben Salem"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 uppercase mb-1.5">
                        Nom de l'Usine / Entreprise <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Plastique Nord SA"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
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
                        placeholder="sami@entreprise.tn"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 uppercase mb-1.5">
                        Numéro Téléphone
                      </label>
                      <input
                        type="tel"
                        placeholder="+216 98 123 456"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase mb-1.5">
                      Taille du Parc Machine
                    </label>
                    <select
                      value={formData.factory_size}
                      onChange={(e) => setFormData({ ...formData, factory_size: e.target.value })}
                      className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                    >
                      <option value="1-3 machines">1 à 3 Machines (Atelier / Forfait Starter)</option>
                      <option value="4-10 machines">4 à 10 Machines (PME / Forfait Professionnel)</option>
                      <option value="10+ machines">Plus de 10 Machines (Groupe Industriel / Entreprise)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase mb-1.5">
                      Vos besoins ou questions spécifiques
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Décrivez votre type de fabrication (emballage, injection plastique, assemblage...) ou vos besoins d'intégration..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <span>Envoi en cours...</span>
                    ) : (
                      <>
                        <span>Envoyer ma Demande</span>
                        <span className="material-symbols-outlined text-[18px]">send</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
