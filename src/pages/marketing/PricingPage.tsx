import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MarketingNavbar } from '../../components/marketing/Navbar';
import { MarketingFooter } from '../../components/marketing/Footer';
import { useTenantStore } from '../../store/tenantStore';
import { useThemeStore } from '../../store/theme';
import type { SubscriptionPlan } from '../../types/saas';

export function PricingPage() {
  const { theme } = useThemeStore();
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
        'Multi-Usines & Filiales illimitées',
        'Machines & Postes illimités',
        'Opérateurs & Utilisateurs illimités',
        'Assistant IA & Rapports de Synthèse',
        'Connecteurs API & Webhooks temps réel',
        'Historique de production illimité',
        'Hébergement dédié & SLA 99.9%',
        'Accompagnement & Déploiement sur site'
      ]
    }
  ];

  const displayPlans = plans.length > 0 ? plans : defaultPlans;

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <MarketingNavbar />

      {/* Pricing Header */}
      <section className="pt-16 pb-12 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 relative z-10 space-y-4">
          <span className="text-xs font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/30">
            Tarifs Transparents en Dinars Tunisiens (TND)
          </span>
          <h1 className={`text-4xl sm:text-6xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
            Des Forfaits Simples et Sans Engagement
          </h1>
          <p className={`text-base sm:text-lg max-w-2xl mx-auto font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
            Testez l'application pendant 14 jours gratuitement sur vos machines. Aucun frais de résiliation ni matériel propriétaire imposé.
          </p>

          {/* Billing Cycle Toggle */}
          <div className={`mt-8 inline-flex items-center gap-3 p-1.5 rounded-2xl border ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white shadow-md'
                  : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Facturation Mensuelle
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                billingCycle === 'annual'
                  ? 'bg-blue-600 text-white shadow-md'
                  : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Facturation Annuelle</span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-black rounded-md uppercase border border-emerald-500/30">
                -17% (2 mois offerts)
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards Grid */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {displayPlans.map((plan) => {
            const isPopular = plan.slug === 'professional';
            const price = billingCycle === 'monthly' ? plan.monthly_price : Math.round((plan.annual_price || 0) / 12);

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all border ${
                  isPopular
                    ? theme === 'dark'
                      ? 'bg-gradient-to-b from-blue-950/40 via-slate-900 to-slate-900 border-blue-500 shadow-2xl shadow-blue-500/10'
                      : 'bg-white border-blue-500 shadow-2xl shadow-blue-500/10 ring-2 ring-blue-500'
                    : theme === 'dark'
                      ? 'bg-slate-900/60 border-slate-800'
                      : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md">
                    Recommandé pour Usines & PME
                  </div>
                )}

                <div>
                  <h3 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                  <p className={`text-xs mt-2 leading-relaxed min-h-[36px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{plan.description}</p>

                  {/* Price */}
                  <div className={`mt-6 pb-6 border-b flex items-baseline gap-1.5 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
                    <span className={`text-4xl sm:text-5xl font-black font-mono ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
                      {price}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      TND / mois {billingCycle === 'annual' && '(facturé annuellement)'}
                    </span>
                  </div>

                  {/* Features List */}
                  <ul className="mt-6 space-y-3">
                    {plan.features?.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs font-medium">
                        <span className="material-symbols-outlined text-emerald-500 text-[18px] shrink-0 mt-0.5">check_circle</span>
                        <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <div className="mt-8 pt-6">
                  <Link
                    to={`/signup?plan=${plan.slug}`}
                    className={`w-full py-3.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                      isPopular
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                        : theme === 'dark'
                          ? 'bg-slate-800 hover:bg-slate-700 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                    }`}
                  >
                    <span>Démarrer 14 Jours Gratuits</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
