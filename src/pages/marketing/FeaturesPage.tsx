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
      image: '/images/shopfloor_tablet_operator.jpg',
      points: [
        'Sélection instantanée de l\'opérateur par Code PIN à 4 chiffres (sans mot de passe)',
        'Gestion des équipes jusqu\'à 4 ouvriers en simultané sur le poste',
        'Comptage direct des pièces et boutons rapides (+1, +5, +10 Cartons)',
        'Conditionnement carton dynamique paramétrable par OF',
        'Mode hors-ligne avec synchronisation automatique'
      ],
      icon: 'tablet',
      color: 'from-blue-600 to-cyan-600'
    },
    {
      id: 'qualite',
      badge: 'Contrôle Qualité & Traçabilité',
      title: 'Scanner Mobile QR Code & Zéro Papier',
      description: 'Flashez les étiquettes thermiques pour une validation qualité immédiate et une mise en stock guidée sans erreurs de tri.',
      image: '/images/quality_scanner_inspection.jpg',
      points: [
        'Scan ultra-rapide par caméra smartphone ou douchette industrielle',
        'Vérification immédiate du numéro de lot, OF et tolérances matière',
        'Déclaration des non-conformités et motifs de rejet en direct',
        'Mise en stock automatique avec affectation d\'emplacement entrepôt',
        'Traçabilité 100% conforme aux audits ISO 9001 et HACCP'
      ],
      icon: 'qr_code_scanner',
      color: 'from-emerald-600 to-teal-600'
    },
    {
      id: 'machines',
      badge: 'Parc Machine & TRS (OEE)',
      title: 'Supervision en Temps Réel & TRS Automatique',
      description: 'Visualisez instantanément la disponibilité et le rendement de chaque poste de travail pour éliminer les micro-arrêts.',
      image: '/images/smart_factory_control_room.jpg',
      points: [
        'Statut en direct : En production, Arrêt, Réglage série, Maintenance',
        'Journalisation des motifs d\'arrêt standardisés avec chronométrage précis',
        'Calcul continu du TRS (OEE) par ligne, shift et période',
        'Notification instantanée des mécaniciens lors des pannes critiques'
      ],
      icon: 'monitoring',
      color: 'from-indigo-600 to-blue-600'
    },
    {
      id: 'stocks',
      badge: 'Matières & Nomenclatures',
      title: 'Gestion des Jumbo Rolls & Nomenclature (BOM)',
      description: 'Maîtrisez vos coûts de matière première avec un simulateur de besoins et une traçabilité lot par lot.',
      image: '/images/factory_hero_smart_plant.jpg',
      points: [
        'Gestion des bobines mères (Jumbo Rolls), adhésifs et composants',
        'Simulateur de consommation théorique vs réelle avec coefficient de perte',
        'Journal d\'audit immuable de tous les mouvements d\'entrée et sortie de stock',
        'Alertes de stock minimum et seuils de réapprovisionnement'
      ],
      icon: 'inventory_2',
      color: 'from-purple-600 to-indigo-600'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      <MarketingNavbar />

      {/* Header */}
      <section className="pt-16 pb-12 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 relative z-10 space-y-4">
          <span className="text-xs font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/30">
            Plateforme Industrielle Complète
          </span>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
            Des Outils Pensés pour le Terrain
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto font-medium">
            Du pupitre de l'opérateur jusqu'au bureau du directeur d'usine : découvrez comment chaque module s'articule pour maximiser votre rendement.
          </p>
        </div>
      </section>

      {/* Feature Deep Dives with Alternating Image Layouts */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {sections.map((section, index) => (
          <div
            key={section.id}
            className={`grid grid-cols-1 lg:grid-cols-12 gap-12 items-center p-8 sm:p-12 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl ${
              index % 2 === 1 ? 'lg:flex-row-reverse' : ''
            }`}
          >
            {/* Image / Visual Column */}
            <div className={`lg:col-span-6 ${index % 2 === 1 ? 'lg:order-2' : 'lg:order-1'}`}>
              <div className="rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl aspect-[16/10] bg-slate-950 relative group">
                <img
                  src={section.image}
                  alt={section.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between p-3 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Module Actif en Temps Réel
                  </span>
                  <span className="text-[10px] font-black uppercase text-blue-400">{section.badge}</span>
                </div>
              </div>
            </div>

            {/* Content Column */}
            <div className={`lg:col-span-6 space-y-6 ${index % 2 === 1 ? 'lg:order-1' : 'lg:order-2'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${section.color} flex items-center justify-center text-white shadow-lg`}>
                  <span className="material-symbols-outlined text-[26px]">{section.icon}</span>
                </div>
                <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-slate-800 text-blue-400 border border-slate-700">
                  {section.badge}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {section.title}
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                {section.description}
              </p>

              <ul className="space-y-3 pt-2">
                {section.points.map((pt, i) => (
                  <li key={i} className="flex items-start gap-3 text-xs sm:text-sm text-slate-300 font-medium">
                    <span className="material-symbols-outlined text-emerald-400 text-[18px] shrink-0 mt-0.5">check_circle</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-4">
                <Link
                  to="/signup?plan=professional"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-md transition-all"
                >
                  <span>Tester ce Module</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* CTA Section */}
      <section className="py-20 max-w-5xl mx-auto px-4 text-center">
        <div className="p-10 rounded-3xl bg-gradient-to-r from-blue-900/60 via-slate-900 to-indigo-900/60 border border-blue-500/30 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Besoin d'une Démonstration Personnalisée ?
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
            Nos ingénieurs industriels viennent dans votre usine ou organisent une session en visio pour configurer vos premières machines.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/contact"
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-xl shadow-lg transition-all"
            >
              Planifier une Démo
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
