import React from 'react';
import { Link } from 'react-router-dom';
import { MarketingNavbar } from '../../components/marketing/Navbar';
import { MarketingFooter } from '../../components/marketing/Footer';

export function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans">
      <MarketingNavbar />

      <section className="pt-16 pb-20 bg-gradient-to-b from-blue-50/50 via-white to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center">
            <span className="text-xs font-black text-blue-600 uppercase tracking-widest bg-blue-100/80 px-3 py-1 rounded-full border border-blue-200">
              Notre Mission
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-zinc-950 mt-4 tracking-tight">
              Rendre l'excellence industrielle accessible à chaque usine tunisienne
            </h1>
            <p className="text-base sm:text-lg text-zinc-600 font-medium mt-3 leading-relaxed">
              Nous avons conçu FactoryFlow TN pour résoudre un problème critique : les ERPs traditionnels sont trop complexes, trop chers et inadaptés au quotidien des opérateurs en atelier.
            </p>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-8 sm:p-10 space-y-6">
            <h2 className="text-2xl font-black text-zinc-900">Pourquoi FactoryFlow TN ?</h2>
            <p className="text-sm sm:text-base text-zinc-700 leading-relaxed font-medium">
              Dans la plupart des ateliers de fabrication en Tunisie, la production est encore pilotée par des fiches papier, des tableaux blancs et des fichiers Excel mis à jour avec des jours de retard.
            </p>
            <p className="text-sm sm:text-base text-zinc-700 leading-relaxed font-medium">
              Les directeurs d'usine et responsables de production découvrent les pannes, les dérives de cadence et les taux de rebus excessifs trop tard. Les logiciels ERP occidentaux demandent des mois de configuration et des dizaines de milliers de dinars de licences.
            </p>
            <p className="text-sm sm:text-base text-zinc-700 leading-relaxed font-medium">
              <strong>FactoryFlow TN change la donne :</strong> une application SaaS moderne, hébergée sur le cloud, opérationnelle en quelques minutes sur n'importe quelle tablette du marché, avec une tarification mensuelle claire en Dinars Tunisiens (TND).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="p-6 bg-white rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-3xl font-black text-blue-600">100%</span>
              <p className="text-xs font-bold text-zinc-800 uppercase mt-2">Atelier Connecté</p>
              <p className="text-xs text-zinc-500 mt-1">Zéro papier sur les postes de travail</p>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-3xl font-black text-emerald-600">-25%</span>
              <p className="text-xs font-bold text-zinc-800 uppercase mt-2">Rebuts & Pertes</p>
              <p className="text-xs text-zinc-500 mt-1">Grâce à l'analyse Pareto instantanée</p>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-3xl font-black text-indigo-600">&lt; 2 min</span>
              <p className="text-xs font-bold text-zinc-800 uppercase mt-2">Prise en Main</p>
              <p className="text-xs text-zinc-500 mt-1">Pour les opérateurs machine</p>
            </div>
          </div>

          <div className="text-center pt-6">
            <Link
              to="/signup?plan=professional"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-sm shadow-lg transition-all"
            >
              Rejoindre l'Aventure Industrielle (Essai 14 Jours) →
            </Link>
          </div>

        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
