import React from 'react';
import { Link } from 'react-router-dom';
import { MarketingNavbar } from '../../components/marketing/Navbar';
import { MarketingFooter } from '../../components/marketing/Footer';
import { useThemeStore } from '../../store/theme';

export function FeaturesPage() {
  const { theme } = useThemeStore();

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
    <div className={`min-h-screen font-sans transition-colors duration-300 ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <MarketingNavbar />

      {/* Header */}
      <section className="pt-16 pb-12 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 relative z-10 space-y-4">
          <span className="text-xs font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/30">
            Plateforme Industrielle Complète
          </span>
          <h1 className={`text-4xl sm:text-6xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
            Des Outils Pensés pour le Terrain
          </h1>
          <p className={`text-base sm:text-lg max-w-2xl mx-auto font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
            Du pupitre de l'opérateur jusqu'au bureau du directeur d'usine : découvrez comment chaque module s'articule pour maximiser votre rendement.
          </p>
        </div>
      </section>

      {/* Feature Deep Dives with Alternating Image Layouts */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {sections.map((section, index) => (
          <div
            key={section.id}
            className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center p-6 sm:p-10 rounded-3xl border transition-all ${
              theme === 'dark'
                ? 'bg-slate-900/60 border-slate-800 backdrop-blur-xl'
                : 'bg-white border-slate-200 shadow-md'
            }`}
          >
            {/* Image / Visual Column */}
            <div className={`lg:col-span-6 ${index % 2 === 1 ? 'lg:order-2' : 'lg:order-1'}`}>
              <div className={`rounded-2xl overflow-hidden border shadow-xl aspect-[16/10] group relative ${
                theme === 'dark' ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-100'
              }`}>
                <img
                  src={section.image}
                  alt={section.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs font-bold">
                  <span className="px-3 py-1 bg-slate-900/90 rounded-lg backdrop-blur-md border border-white/10">
                    {section.badge}
                  </span>
                  <span className="text-emerald-400 font-mono">100% Temps Réel</span>
                </div>
              </div>
            </div>

            {/* Text & Points Column */}
            <div className={`lg:col-span-6 space-y-6 ${index % 2 === 1 ? 'lg:order-1' : 'lg:order-2'}`}>
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-lg text-xs font-black uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[16px]">{section.icon}</span>
                  <span>{section.badge}</span>
                </div>
                <h2 className={`text-2xl sm:text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {section.title}
                </h2>
                <p className={`text-sm sm:text-base leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                  {section.description}
                </p>
              </div>

              {/* Bullet Points */}
              <ul className="space-y-3">
                {section.points.map((pt, i) => (
                  <li key={i} className="flex items-start gap-3 text-xs sm:text-sm font-medium">
                    <span className="material-symbols-outlined text-emerald-500 text-[20px] shrink-0 mt-0.5">
                      check_circle
                    </span>
                    <span className={theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}>
                      {pt}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="pt-2">
                <Link
                  to="/signup?plan=professional"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  <span>Tester ce Module Gratuitement</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </section>

      <MarketingFooter />
    </div>
  );
}
