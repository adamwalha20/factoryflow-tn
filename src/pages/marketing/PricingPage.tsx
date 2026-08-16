import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MarketingNavbar } from '../../components/marketing/Navbar';
import { MarketingFooter } from '../../components/marketing/Footer';
import { useTenantStore } from '../../store/tenantStore';
import type { SubscriptionPlan } from '../../types/saas';

export function PricingPage() {
  const { plans, fetchPlans } = useTenantStore();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const defaultPlans: Partial<SubscriptionPlan>[] = [
    {
      id: '1',
      name: 'Starter',
      slug: 'starter',
      description: 'Idéal pour les ateliers et lignes uniques débutant leur digitalisation zéro papier.',
      monthly_price: 149,
      annual_price: 1490,
      currency: 'TND',
      features: [
        '1 Usine / Site de production',
        'Jusqu\'à 3 Machines actives',
        'Jusqu\'à 10 Opérateurs / Ouvriers',
        'Gestion des Ordres de Fabrication (OF)',
        'Interface Tablette tactile atelier',
        'Tableau de bord & suivi TRS de base',
        'Historique de production 30 jours',
        'Support technique par email'
      ]
    },
    {
      id: '2',
      name: 'Professionnel',
      slug: 'professional',
      description: 'Pour les usines et PME avec gestion avancée des stocks, rebuts et fiches recettes.',
      monthly_price: 299,
      annual_price: 2990,
      currency: 'TND',
      features: [
        '1 Usine / Multi-lignes de production',
        'Jusqu\'à 10 Machines actives',
        'Jusqu\'à 50 Opérateurs / Ouvriers',
        'Nomenclature Multi-Niveaux (BOM)',
        'Gestion Stocks & Bobines Mères (Jumbo)',
        'Analyse des Rebuts & Déchets (Pareto)',
        'Connecteurs Export Sage 100 & Odoo',
        'Historique de production 1 an',
        'Support Prioritaire WhatsApp & Téléphone'
      ]
    },
    {
      id: '3',
      name: 'Entreprise',
      slug: 'enterprise',
      description: 'Pour les groupes multi-sites exigeant une intégration sur mesure et de l\'intelligence artificielle.',
      monthly_price: 599,
      annual_price: 5990,
      currency: 'TND',
      features: [
        'Multi-Usines illimitées',
        'Machines & Postes illimités',
        'Personnel & Utilisateurs illimités',
        'Assistant IA Digest & Maintenance prédictive',
        'Portail Suivi Commandes Clients Dédié',
        'Connecteurs API & Webhooks temps réel',
        'Historique de production illimité',
        'Hébergement dédié & SLA 99.9%',
        'Accompagnement & Déploiement sur site'
      ]
    }
  ];

  const displayPlans = plans.length > 0 ? plans : defaultPlans;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      <MarketingNavbar />

      {/* Pricing Header */}
      <section className="pt-16 pb-12 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 relative z-10 space-y-4">
          <span className="text-xs font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
            Tarifs Transparents en Dinars Tunisiens (TND)
          </span>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
            Des forfaits simples et sans engagement
          </h1>
          <p className="text-base sm:text-lg text-slate-400 font-medium max-w-2xl mx-auto">
            Testez l'application pendant 14 jours gratuitement sur vos machines. Aucun frais de résiliation ni matériel propriétaire imposé.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 p-1.5 bg-slate-900 rounded-2xl border border-slate-800">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Facturation Mensuelle
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                billingCycle === 'annual'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Facturation Annuelle</span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-black rounded-md uppercase border border-emerald-500/30">
                -17% (2 mois offerts)
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {displayPlans.map((plan) => {
            const isPopular = plan.slug === 'professional';
            const price = billingCycle === 'annual' 
              ? Math.round((plan.annual_price || plan.monthly_price! * 10) / 12) 
              : plan.monthly_price;

            return (
              <div
                key={plan.slug}
                className={`rounded-3xl p-8 flex flex-col justify-between transition-all relative ${
                  isPopular
                    ? 'bg-gradient-to-b from-blue-900/90 via-indigo-900/80 to-slate-950 text-white shadow-2xl shadow-blue-500/20 border-2 border-blue-400 scale-105 z-10'
                    : 'bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-slate-200 shadow-sm'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 right-6 px-3.5 py-1 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-[11px] uppercase tracking-wider rounded-full shadow-md">
                    Recommandé pour PME
                  </div>
                )}

                <div>
                  <h3 className="text-2xl font-black text-white">{plan.name}</h3>
                  <p className="text-xs mt-2 leading-relaxed text-slate-400 font-medium">
                    {plan.description}
                  </p>

                  {/* Price display */}
                  <div className="mt-6 mb-6">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-5xl font-black tracking-tight text-white">{price}</span>
                      <span className="text-sm font-bold text-blue-300">
                        {plan.currency || 'TND'} / mois
                      </span>
                    </div>
                    {billingCycle === 'annual' && (
                      <p className="text-xs mt-1 font-semibold text-emerald-400">
                        Facturé {plan.annual_price || plan.monthly_price! * 10} TND / an
                      </p>
                    )}
                  </div>

                  {/* Feature Checklist */}
                  <div className="border-t border-slate-800 pt-6 space-y-3.5">
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                      Inclus dans ce forfait :
                    </p>
                    {plan.features?.map((feature: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm font-medium">
                        <span className={`material-symbols-outlined text-[18px] shrink-0 mt-0.5 ${isPopular ? 'text-emerald-300' : 'text-blue-400'}`}>
                          check_circle
                        </span>
                        <span className="text-slate-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plan CTA button */}
                <div className="mt-8 pt-6 border-t border-slate-800/80">
                  <Link
                    to={`/signup?plan=${plan.slug}`}
                    className={`w-full py-4 rounded-xl text-center text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      isPopular
                        ? 'bg-white hover:bg-slate-100 text-slate-950 shadow-lg'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20'
                    }`}
                  >
                    <span>Démarrer Essai 14 Jours</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enterprise Callout */}
        <div className="mt-16 bg-slate-900/90 border border-slate-800 rounded-3xl p-8 max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div>
            <h4 className="text-xl font-black text-white">Besoin d'un accompagnement sur site ou d'une intégration ERP sur mesure ?</h4>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
              Nos ingénieurs industriels peuvent auditer votre parc machine et déployer FactoryFlow TN directement dans vos ateliers.
            </p>
          </div>
          <Link
            to="/contact"
            className="shrink-0 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-colors shadow-lg"
          >
            Contacter l'Équipe Industrielle
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
