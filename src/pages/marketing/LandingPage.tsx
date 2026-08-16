import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MarketingNavbar } from '../../components/marketing/Navbar';
import { MarketingFooter } from '../../components/marketing/Footer';

export function LandingPage() {
  const [activeTab, setActiveTab] = useState<'tablet' | 'trs' | 'bom' | 'pareto'>('tablet');
  
  // Interactive Tablet Simulator State
  const [simGoodCount, setSimGoodCount] = useState(144);
  const [simScrapCount, setSimScrapCount] = useState(3);
  const [simColisage, setSimColisage] = useState(36);

  // Interactive ROI Calculator State
  const [calcMachines, setCalcMachines] = useState(4);
  const [calcShifts, setCalcShifts] = useState(2); // 1, 2 or 3 shifts
  const [calcScrapCost, setCalcScrapCost] = useState(150); // TND / day / machine

  // Derived ROI calculations
  const monthlyScrapLoss = calcMachines * calcScrapCost * 26 * (calcShifts / 2);
  const estimatedSavings = Math.round(monthlyScrapLoss * 0.28); // 28% scrap reduction
  const planCost = calcMachines <= 3 ? 149 : calcMachines <= 10 ? 299 : 599;
  const netMonthlyGain = estimatedSavings - planCost;
  const roiMultiplier = Math.max(2, Math.round(estimatedSavings / planCost));

  const features = [
    {
      icon: 'tablet',
      title: 'Interface Tablette Tactile Atelier',
      badge: 'Atelier Connecté',
      description: 'Boutons tactiles géants utilisables avec gants. Comptage conforme/rebuts en direct, mode hors-ligne et synchronisation temps réel.',
      color: 'from-blue-600 to-cyan-600'
    },
    {
      icon: 'precision_manufacturing',
      title: 'Suivi Parc Machine & TRS (OEE)',
      badge: 'Performance Ligne',
      description: 'Mesure continue de la disponibilité, cadence et qualité. Détection immédiate des micro-arrêts et historique MTBF.',
      color: 'from-emerald-600 to-teal-600'
    },
    {
      icon: 'assignment',
      title: 'Ordres de Fabrication & Colisage',
      badge: 'Ordonnancement',
      description: 'Lancement d\'OFs en un clic, reste à produire décrémenté en direct et génération instantanée d\'étiquettes cartons QR code.',
      color: 'from-indigo-600 to-blue-600'
    },
    {
      icon: 'inventory_2',
      title: 'Nomenclature BOM & Bobines Mères',
      badge: 'Traçabilité Stocks',
      description: 'Gestion des Jumbo Rolls et matières premières. Simulateur de consommation théorique vs réelle avec coefficient de perte.',
      color: 'from-purple-600 to-indigo-600'
    },
    {
      icon: 'delete_sweep',
      title: 'Analyse Pareto des Rebuts',
      badge: 'Qualité & Coûts',
      description: 'Diagramme Pareto automatique des causes de gaspillage (réglage, défaut matière, casse) et chiffrage des pertes en Dinars (TND).',
      color: 'from-amber-500 to-orange-600'
    },
    {
      icon: 'sync_alt',
      title: 'Connecteurs Sage 100 & Odoo',
      badge: 'Intégration ERP',
      description: 'Export automatisé des consommations de matières et mouvements de stocks au format comptable tunisien standard.',
      color: 'from-rose-600 to-pink-600'
    }
  ];

  const industrialSectors = [
    { name: 'Plasturgie & Injection', icon: 'category' },
    { name: 'Emballage & Conditionnement', icon: 'inventory' },
    { name: 'Câblage & Électronique', icon: 'settings_input_component' },
    { name: 'Agroalimentaire', icon: 'restaurant' },
    { name: 'Textile & Confection', icon: 'checkroom' },
    { name: 'Mécanique & Métallurgie', icon: 'hardware' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      <MarketingNavbar />

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-32 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-blue-600/20 via-indigo-500/20 to-purple-600/10 blur-[130px] pointer-events-none rounded-full" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-blue-500/10 blur-[90px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-black uppercase tracking-widest backdrop-blur-md shadow-lg shadow-blue-500/5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Le 1er Système MES SaaS Industriel en Tunisie</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.12]">
              Digitalisez votre atelier.{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300">
                Éliminez le papier et les fiches Excel.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto">
              Connectez vos machines et tablettes opérateurs en temps réel. Suivez vos Ordres de Fabrication (OF), le TRS (OEE), vos rebus et vos stocks sans installer de serveur local.
            </p>

            {/* CTA Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup?plan=professional"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2.5 group"
              >
                <span>Démarrer l'Essai Gratuit (14 Jours)</span>
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </Link>
              
              <Link
                to="/contact"
                className="w-full sm:w-auto px-6 py-4 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 backdrop-blur-md"
              >
                <span className="material-symbols-outlined text-[18px] text-blue-400">calendar_month</span>
                <span>Demander une Démo sur Site</span>
              </Link>
            </div>

            {/* Trust Points */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-400 text-[16px]">check_circle</span>
                <span>14 Jours d'essai complet</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-400 text-[16px]">check_circle</span>
                <span>Sans carte bancaire</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-400 text-[16px]">check_circle</span>
                <span>Tarifs en Dinars Tunisiens (TND)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-400 text-[16px]">check_circle</span>
                <span>Déploiement en &lt; 1 heure</span>
              </div>
            </div>
          </div>

          {/* INTERACTIVE LIVE WORKSHOP SHOWCASE */}
          <div className="mt-14 max-w-5xl mx-auto">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl overflow-hidden backdrop-blur-xl">
              
              {/* Window Bar & Tabs */}
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                  </div>
                  <span className="text-xs font-black text-slate-400 ml-2">FactoryFlow Live Demo — Usine Active</span>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                  <button
                    onClick={() => setActiveTab('tablet')}
                    className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      activeTab === 'tablet' ? 'bg-blue-600 text-white shadow-md font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">tablet</span>
                    <span>1. Tablette Atelier</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('trs')}
                    className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      activeTab === 'trs' ? 'bg-blue-600 text-white shadow-md font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">precision_manufacturing</span>
                    <span>2. Suivi TRS (OEE)</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('bom')}
                    className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      activeTab === 'bom' ? 'bg-blue-600 text-white shadow-md font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">inventory_2</span>
                    <span>3. Stocks & Bobines</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('pareto')}
                    className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      activeTab === 'pareto' ? 'bg-blue-600 text-white shadow-md font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                    <span>4. Pareto Rebuts</span>
                  </button>
                </div>
              </div>

              {/* TAB 1: Live Interactive Tablet Terminal */}
              {activeTab === 'tablet' && (
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <span className="material-symbols-outlined">badge</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase block">Opérateur Connecté</span>
                        <span className="font-black text-white text-sm">Mohamed Amine (Code PIN: 1234)</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-black uppercase">
                        Machine : Ligne Bobineuse M01
                      </span>
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-black uppercase flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        En Marche
                      </span>
                    </div>
                  </div>

                  {/* Production Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                      <span className="text-xs font-bold text-slate-400 uppercase">Pièces Conformes</span>
                      <p className="text-3xl font-black text-emerald-400 mt-1">{simGoodCount} <span className="text-xs text-slate-500">pcs</span></p>
                      <div className="mt-3 flex gap-1.5">
                        <button
                          onClick={() => setSimGoodCount(c => c + 1)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-lg"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => setSimGoodCount(c => c + 5)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-lg"
                        >
                          +5
                        </button>
                        <button
                          onClick={() => setSimGoodCount(c => c + 36)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-lg"
                        >
                          +36 (+1 Carton)
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                      <span className="text-xs font-bold text-slate-400 uppercase">Rebuts / Déchets</span>
                      <p className="text-3xl font-black text-rose-400 mt-1">{simScrapCount} <span className="text-xs text-slate-500">pcs</span></p>
                      <div className="mt-3 flex gap-1.5">
                        <button
                          onClick={() => setSimScrapCount(c => c + 1)}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-lg"
                        >
                          +1 Rebut
                        </button>
                        <button
                          onClick={() => setSimScrapCount(c => c + 3)}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-lg"
                        >
                          +3 Défaut
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                      <span className="text-xs font-bold text-slate-400 uppercase">Colisage Carton (Pièces/Carton)</span>
                      <p className="text-2xl font-black text-blue-400 mt-1">{simColisage} <span className="text-xs text-slate-500">pcs/carton</span></p>
                      <div className="mt-3 flex gap-1">
                        {[24, 36, 48, 72].map(qty => (
                          <button
                            key={qty}
                            onClick={() => setSimColisage(qty)}
                            className={`px-2 py-1 rounded-lg text-xs font-black transition-all ${
                              simColisage === qty ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                            }`}
                          >
                            {qty}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 text-center italic">
                    💡 Cliquez sur les boutons ci-dessus pour tester l'enregistrement instantané et la génération de cartons en direct.
                  </p>
                </div>
              )}

              {/* TAB 2: Live OEE / TRS Gauge */}
              {activeTab === 'trs' && (
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-center">
                      <span className="text-xs font-bold text-slate-400 uppercase">TRS / OEE Global</span>
                      <p className="text-4xl font-black text-emerald-400 mt-2">87.4%</p>
                      <span className="text-[11px] text-emerald-500 font-bold">Standard Industriel Classe A</span>
                    </div>

                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-center">
                      <span className="text-xs font-bold text-slate-400 uppercase">Disponibilité (D)</span>
                      <p className="text-3xl font-black text-blue-400 mt-2">92.1%</p>
                      <span className="text-[11px] text-slate-400">Temps net de marche</span>
                    </div>

                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-center">
                      <span className="text-xs font-bold text-slate-400 uppercase">Performance (P)</span>
                      <p className="text-3xl font-black text-indigo-400 mt-2">96.8%</p>
                      <span className="text-[11px] text-slate-400">Cadence nominale atteinte</span>
                    </div>

                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-center">
                      <span className="text-xs font-bold text-slate-400 uppercase">Qualité (Q)</span>
                      <p className="text-3xl font-black text-purple-400 mt-2">98.2%</p>
                      <span className="text-[11px] text-slate-400">Taux de pièces bonnes</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <span className="text-xs font-bold text-slate-400 uppercase block">Journal des Arrêts Machines du Shift</span>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                        <span className="text-amber-400 font-bold">Panne Électrique M02 (18 min)</span>
                        <span className="text-slate-400">Résolu par Équipe Maintenance</span>
                      </div>
                      <div className="flex justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                        <span className="text-blue-400 font-bold">Changement de Bobine Mère (12 min)</span>
                        <span className="text-slate-400">Procédure standard</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: BOM Simulator */}
              {activeTab === 'bom' && (
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-black text-white">Nomenclature : Ruban Adhésif Brun 48mm x 100m</h4>
                        <p className="text-xs text-slate-400">Recette de découpe et de bobinage multi-étapes</p>
                      </div>
                      <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-bold">
                        BOM Active
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block">Bobine Mère (Jumbo) :</span>
                        <strong className="text-white text-sm">BOPP 1280mm x 4000m</strong>
                        <span className="text-emerald-400 block mt-1">26 rouleaux finis / refente</span>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block">Mandrins Carton 3 pouces :</span>
                        <strong className="text-white text-sm">Tube Kraft 48mm</strong>
                        <span className="text-blue-400 block mt-1">1 mandrin / rouleau</span>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block">Emballage & Étui :</span>
                        <strong className="text-white text-sm">Carton Cannelure B</strong>
                        <span className="text-purple-400 block mt-1">1 carton pour 36 rouleaux</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Pareto Rebuts */}
              {activeTab === 'pareto' && (
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-black text-white">Diagnostic Pareto des Rebuts (Mois en Cours)</h4>
                        <p className="text-xs text-slate-400">80% des pertes financières proviennent des 2 causes majeures</p>
                      </div>
                      <span className="text-xs font-black text-rose-400 bg-rose-500/10 px-3 py-1 rounded-lg border border-rose-500/20">
                        Pertes Estimées : 840 TND
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-slate-300">1. Décalage Centrage Bobineuse (54% des pertes)</span>
                          <span className="text-rose-400">453 TND</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-500 rounded-full" style={{ width: '54%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-slate-300">2. Épaisseur Colle Non-Conforme (28% des pertes)</span>
                          <span className="text-amber-400">235 TND</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: '28%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-slate-300">3. Casse Film Amorçage (18% des pertes)</span>
                          <span className="text-blue-400">152 TND</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: '18%' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </section>

      {/* INDUSTRIAL SECTORS STRIP */}
      <section className="py-10 border-y border-slate-800/80 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-black uppercase tracking-widest text-slate-500 mb-6">
            Déployé dans les zones industrielles de Ben Arous, Sousse, Sfax, Nabeul et Bizerte
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {industrialSectors.map((s, idx) => (
              <div key={idx} className="flex items-center gap-2 p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-slate-300 text-xs font-bold justify-center">
                <span className="material-symbols-outlined text-[18px] text-blue-400">{s.icon}</span>
                <span>{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES GRID SECTION */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
            Plateforme Complète
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Tous les modules indispensables pour piloter votre usine
          </h2>
          <p className="text-base text-slate-400 font-medium">
            Une suite d'outils unifiée conçue spécifiquement pour le terrain et la direction de production.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all hover:-translate-y-1 group relative overflow-hidden flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${feat.color} flex items-center justify-center text-white shadow-lg`}>
                  <span className="material-symbols-outlined text-[24px]">{feat.icon}</span>
                </div>
                <span className="text-[11px] font-black text-blue-400 uppercase tracking-wider block">{feat.badge}</span>
                <h3 className="text-xl font-black text-white group-hover:text-blue-300 transition-colors">{feat.title}</h3>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">{feat.description}</p>
              </div>
              <div className="pt-6">
                <Link to="/features" className="text-xs font-black text-blue-400 hover:text-blue-300 inline-flex items-center gap-1">
                  En savoir plus →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* INTERACTIVE ROI CALCULATOR SECTION */}
      <section className="py-20 bg-gradient-to-b from-slate-900/80 to-slate-950 border-y border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Calculateur de Rentabilité
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Calculez vos Économies Mensuelles en TND</h2>
            <p className="text-sm text-slate-400 font-medium">
              Voyez combien FactoryFlow TN vous fait économiser en réduisant les rebuts et les temps d'arrêt.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-900 p-8 sm:p-12 rounded-3xl border border-slate-800 shadow-2xl">
            
            {/* Sliders */}
            <div className="lg:col-span-7 space-y-6">
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-black text-slate-300 uppercase">Nombre de Machines de Production :</label>
                  <span className="px-3 py-1 bg-blue-600 text-white font-black text-sm rounded-lg">{calcMachines} Machines</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={calcMachines}
                  onChange={(e) => setCalcMachines(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-black text-slate-300 uppercase">Équipes de Travail (Shifts) :</label>
                  <span className="px-3 py-1 bg-indigo-600 text-white font-black text-sm rounded-lg">{calcShifts} Équipes / Jour</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  value={calcShifts}
                  onChange={(e) => setCalcShifts(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-black text-slate-300 uppercase">Coût Estimé des Rebuts & Déchets par Machine :</label>
                  <span className="px-3 py-1 bg-purple-600 text-white font-black text-sm rounded-lg">{calcScrapCost} TND / jour</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="25"
                  value={calcScrapCost}
                  onChange={(e) => setCalcScrapCost(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

            </div>

            {/* Results Box */}
            <div className="lg:col-span-5 bg-gradient-to-br from-blue-900/50 via-indigo-900/40 to-slate-950 p-6 sm:p-8 rounded-2xl border-2 border-blue-500/40 text-center space-y-4 shadow-xl">
              <span className="text-xs font-bold text-blue-300 uppercase tracking-wider block">Économies Nettes Estimées</span>
              <div className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                +{estimatedSavings.toLocaleString()} <span className="text-lg text-blue-400 font-bold">TND / mois</span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Soit un retour sur investissement estimé de <strong className="text-emerald-400 font-black">{roiMultiplier}x</strong> le coût de votre abonnement ({planCost} TND/mois).
              </p>
              <div className="pt-2">
                <Link
                  to="/signup?plan=professional"
                  className="w-full py-3.5 bg-white hover:bg-slate-100 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all inline-block"
                >
                  Activer mon Usine et Réduire mes Pertes →
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* COMPARISON TABLE: OLD METHOD VS FACTORYFLOW */}
      <section className="py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl font-black text-white">Pourquoi les usines abandonnent Excel</h2>
          <p className="text-sm text-slate-400 font-medium">Comparatif direct entre la gestion artisanale et notre système MES cloud.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-8 rounded-3xl bg-rose-950/20 border border-rose-500/20 space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-black text-sm uppercase">
              <span className="material-symbols-outlined">cancel</span>
              <span>Méthode Traditionnelle (Papier & Excel)</span>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-300 font-medium">
              <li className="flex items-start gap-2">❌ Fiches d'OF manuscrites perdues ou illisibles</li>
              <li className="flex items-start gap-2">❌ Retard de plusieurs jours sur la connaissance des rebuts</li>
              <li className="flex items-start gap-2">❌ Erreurs humaines répétées lors de la saisie comptable</li>
              <li className="flex items-start gap-2">❌ Pas de traçabilité instantanée pour les audits clients</li>
            </ul>
          </div>

          <div className="p-8 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-emerald-400 font-black text-sm uppercase">
              <span className="material-symbols-outlined">check_circle</span>
              <span>Avec FactoryFlow TN (MES Cloud)</span>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-200 font-medium">
              <li className="flex items-start gap-2">✅ Saisie tactile opérateur en direct sur tablette atelier</li>
              <li className="flex items-start gap-2">✅ Calcul automatique du TRS et des arrêts machines</li>
              <li className="flex items-start gap-2">✅ Étiquetage cartons QR code conforme immédiat</li>
              <li className="flex items-start gap-2">✅ Export Sage 100 et Odoo sans ressaisie</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION BANNER */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-10 sm:p-16 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white text-center space-y-6 shadow-2xl relative overflow-hidden">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              Prêt à moderniser la production de votre usine ?
            </h2>
            <p className="text-base text-blue-100 max-w-xl mx-auto font-medium">
              Rejoignez les usines tunisiennes qui gagnent en productivité chaque jour avec FactoryFlow TN.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/signup?plan=professional"
                className="px-8 py-4 bg-white hover:bg-slate-100 text-blue-900 font-black text-sm rounded-2xl shadow-xl transition-all"
              >
                Commencer 14 Jours d'Essai Gratuit
              </Link>
              <Link
                to="/contact"
                className="px-8 py-4 bg-blue-950/60 hover:bg-blue-950 border border-blue-300/30 text-white font-bold text-sm rounded-2xl transition-colors"
              >
                Contacter notre Équipe Déploiement
              </Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
