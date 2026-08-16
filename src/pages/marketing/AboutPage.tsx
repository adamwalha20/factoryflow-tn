import React from 'react';
import { Link } from 'react-router-dom';
import { MarketingNavbar } from '../../components/marketing/Navbar';
import { MarketingFooter } from '../../components/marketing/Footer';

export function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      <MarketingNavbar />

      {/* Header Section */}
      <section className="pt-16 pb-16 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 relative z-10 space-y-4">
          <span className="text-xs font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/30">
            Notre Mission & Vision
          </span>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
            Accélérer l'Industrie 4.0 en Tunisie 🇹🇳
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto font-medium">
            Nous avons créé FactoryFlow TN pour résoudre un problème critique : les logiciels industriels traditionnels sont trop lourds, trop chers et coupés des réalités du terrain.
          </p>
        </div>
      </section>

      {/* Visual & Story Section */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl aspect-[16/10] bg-slate-950">
            <img 
              src="/images/smart_factory_control_room.jpg" 
              alt="Équipe FactoryFlow Tunisie" 
              className="w-full h-full object-cover"
            />
          </div>

          <div className="lg:col-span-6 space-y-6">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Pourquoi FactoryFlow TN ?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Dans la majorité des usines tunisiennes, le suivi de production repose encore sur des fiches papier volantes, des tableaux blancs et des fichiers Excel saisis avec des jours de retard.
            </p>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Les directeurs d'usine et responsables qualité découvrent les dérives de cadence et les surconsommations de matière trop tard.
            </p>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              <strong className="text-white">FactoryFlow TN transforme cette dynamique :</strong> un système MES SaaS ultra-réactif, utilisable en atelier sur de simples tablettes Android/iPad, avec codes PIN ouvriers, synchronisation temps réel et tarifs transparents en Dinars Tunisiens (TND).
            </p>
          </div>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-8 bg-slate-900/60 border border-slate-800 rounded-3xl text-center space-y-2">
            <span className="text-4xl font-black text-blue-400 font-mono">100%</span>
            <p className="text-sm font-black text-white uppercase tracking-wider">Atelier Connecté</p>
            <p className="text-xs text-slate-400">Élimination intégrale du papier sur les postes machines</p>
          </div>
          <div className="p-8 bg-slate-900/60 border border-slate-800 rounded-3xl text-center space-y-2">
            <span className="text-4xl font-black text-emerald-400 font-mono">-32%</span>
            <p className="text-sm font-black text-white uppercase tracking-wider">Rebuts & Pertes</p>
            <p className="text-xs text-slate-400">Grâce à l'analyse Pareto instantanée et alertes pannes</p>
          </div>
          <div className="p-8 bg-slate-900/60 border border-slate-800 rounded-3xl text-center space-y-2">
            <span className="text-4xl font-black text-cyan-400 font-mono">&lt; 48h</span>
            <p className="text-sm font-black text-white uppercase tracking-wider">Mise en Service</p>
            <p className="text-xs text-slate-400">Déploiement immédiat sans modification d'infrastructure</p>
          </div>
        </div>

        {/* Tunisian Industrial Commitment */}
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6 text-center max-w-4xl mx-auto">
          <h3 className="text-2xl font-black text-white">Fabriqué en Tunisie, pour l'Industrie Tunisienne 🇹🇳</h3>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Notre équipe technique et nos ingénieurs support sont basés à Tunis et interviennent directement sur vos sites à Ben Arous, Sfax, Sousse, Bizerte, Nabeul et Zaghouan.
          </p>
          <div className="pt-2">
            <Link
              to="/signup?plan=professional"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-xl shadow-lg transition-all"
            >
              <span>Rejoindre la Communauté Industrielle</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
        </div>

      </section>

      <MarketingFooter />
    </div>
  );
}
