import React from 'react';
import { Link } from 'react-router-dom';
import { MarketingNavbar } from '../../components/marketing/Navbar';
import { MarketingFooter } from '../../components/marketing/Footer';

export function FeaturesPage() {
  const sections = [
    {
      id: 'atelier',
      badge: 'Atelier & Terrain',
      title: 'Interface Tactile pour Opérateurs',
      description: 'Conçue pour un usage intensif en milieu industriel, l\'interface tablette élimine les fiches papier de suivi d\'OF et les erreurs de saisie manuelle.',
      points: [
        'Sélection rapide de l\'opérateur par PIN et filtrage des rôles machine',
        'Comptage en direct des pièces conformes et rebuts',
        'Contrôle qualité intégré (métrage, poids, conformité bobine)',
        'Conditionnement carton dynamique paramétrable par OF (24, 36, 48, 72 pcs)',
        'Mode hors-ligne avec synchronisation automatique lors du rétablissement du réseau'
      ],
      icon: 'tablet'
    },
    {
      id: 'machines',
      badge: 'Parc Machine & TRS',
      title: 'Suivi Temps Réel & Calcul Automatique du TRS (OEE)',
      description: 'Visualisez instantanément la disponibilité et le rendement de chaque poste de travail pour éliminer les micro-arrêts.',
      points: [
        'Statut en direct : En marche, Arrêt, Changement série, Maintenance',
        'Journalisation des motifs d\'arrêt standardisés (réglage, panne électrique, manque matière)',
        'Calcul continu de l\'OEE/TRS par ligne, shift et période',
        'Score de santé prédictif basé sur l\'historique des arrêts et MTBF'
      ],
      icon: 'precision_manufacturing'
    },
    {
      id: 'production',
      badge: 'Ordres de Fabrication',
      title: 'Planification et Ordonnancement Simplifiés',
      description: 'Fini les fichiers Excel obsolètes. Centralisez vos lancements de production et réagissez aux urgences en un clic.',
      points: [
        'Création d\'OF avec code-barres et statut en temps réel (Brouillon, Lancé, Terminé)',
        'Priorisation visuelle (Haute, Moyenne, Basse)',
        'Reste à produire décrémenté automatiquement à chaque validation opérateur',
        'Génération automatique des étiquettes thermiques pour chaque carton produit'
      ],
      icon: 'assignment'
    },
    {
      id: 'stocks',
      badge: 'Stocks & Traçabilité',
      title: 'Nomenclature Multi-Niveaux (BOM) & Bobines Mères',
      description: 'Maîtrisez vos coûts de matière première avec un simulateur de besoins et une traçabilité lot par lot.',
      points: [
        'Gestion des bobines mères (Jumbo Rolls) et adhésifs',
        'Simulateur de consommation théorique vs réelle avec coefficient de perte',
        'Journal d\'audit immuable de tous les mouvements d\'entrée et sortie de stock',
        'Alertes de stock minimum et seuils de réapprovisionnement'
      ],
      icon: 'inventory_2'
    },
    {
      id: 'rebuts',
      badge: 'Qualité & Déchets',
      title: 'Analyse Pareto des Pertes & Rebuts',
      description: 'Réduisez vos coûts de non-qualité grâce à un diagnostic automatique des causes majeures de gaspillage.',
      points: [
        'Diagramme de Pareto interactif par motif et par machine',
        'Calcul du coût financier estimé des pertes matières en TND',
        'Fiches de non-conformité et traçabilité pour audits ISO 9001',
        'Historique complet des rebuts par opérateur et par article'
      ],
      icon: 'delete_sweep'
    },
    {
      id: 'connecteurs',
      badge: 'Intégration & ERP',
      title: 'Connecteurs Comptabilité Tunisienne (Sage & Odoo)',
      description: 'Exportez vos données de production et vos consommations de stocks sans ressaisie manuelle.',
      points: [
        'Export standardisé Sage 100 (.csv compatible format d\'import stock)',
        'Export JSON structuré pour Odoo MES & Manufacturing API',
        'Webhooks et points d\'intégration prêts pour n8n et Make',
        'Téléchargement des rapports en format Excel et PDF'
      ],
      icon: 'sync_alt'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      <MarketingNavbar />

      {/* Header */}
      <section className="pt-16 pb-12 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 relative z-10 space-y-4">
          <span className="text-xs font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
            Plateforme Industrielle Complète
          </span>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
            Des fonctionnalités pensées pour l'atelier
          </h1>
          <p className="text-base sm:text-lg text-slate-400 font-medium max-w-2xl mx-auto">
            Découvrez comment FactoryFlow TN transforme votre atelier en une usine connectée, performante et sans papier.
          </p>
        </div>
      </section>

      {/* Feature Deep Dives */}
      <section className="py-12 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {sections.map((sec, idx) => {
          const isEven = idx % 2 === 0;
          return (
            <div
              key={sec.id}
              id={sec.id}
              className={`p-8 sm:p-12 rounded-3xl border border-slate-800 bg-slate-900/60 flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-10 items-center`}
            >
              <div className="flex-1 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold">
                  <span className="material-symbols-outlined text-[16px]">{sec.icon}</span>
                  {sec.badge}
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white leading-snug">{sec.title}</h2>
                <p className="text-sm sm:text-base text-slate-400 font-medium leading-relaxed">{sec.description}</p>
                <div className="pt-2 space-y-2.5">
                  {sec.points.map((pt, pidx) => (
                    <div key={pidx} className="flex items-start gap-2.5 text-xs sm:text-sm font-medium text-slate-300">
                      <span className="material-symbols-outlined text-[18px] text-blue-400 shrink-0 mt-0.5">check_circle</span>
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full lg:w-96 aspect-4/3 rounded-2xl bg-gradient-to-tr from-blue-900/80 via-indigo-900/60 to-slate-900 border border-blue-500/30 p-6 text-white flex flex-col justify-between shadow-2xl">
                <span className="material-symbols-outlined text-[48px] text-blue-400">{sec.icon}</span>
                <div>
                  <p className="text-xs uppercase tracking-wider text-blue-300 font-bold">Module FactoryFlow TN</p>
                  <p className="text-xl font-black text-white mt-1">{sec.badge}</p>
                  <p className="text-xs text-slate-400 mt-1 font-medium">Actif dans tous les forfaits avec isolation multi-tenant.</p>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-4">
          <h2 className="text-3xl font-black">Testez ces fonctionnalités dans votre usine dès aujourd'hui</h2>
          <p className="text-blue-100 text-sm">14 jours d'essai gratuit sans engagement ni carte bancaire.</p>
          <div className="pt-2">
            <Link
              to="/signup?plan=professional"
              className="px-8 py-3.5 bg-white text-blue-900 hover:bg-slate-100 font-black rounded-xl text-xs uppercase tracking-wider shadow-xl inline-flex items-center gap-2"
            >
              <span>Créer mon Compte Usine</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
