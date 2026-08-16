import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MarketingNavbar } from '../../components/marketing/Navbar';
import { MarketingFooter } from '../../components/marketing/Footer';

export function LandingPage() {
  const [activeTab, setActiveTab] = useState<'tablet' | 'trs' | 'bom' | 'scanner'>('tablet');
  
  // Interactive Tablet Simulator State
  const [simGoodCount, setSimGoodCount] = useState(144);
  const [simScrapCount, setSimScrapCount] = useState(3);
  const [simColisage, setSimColisage] = useState(36);

  // Interactive ROI Calculator State
  const [calcMachines, setCalcMachines] = useState(6);
  const [calcShifts, setCalcShifts] = useState(2); // 1, 2 or 3 shifts
  const [calcScrapCost, setCalcScrapCost] = useState(180); // TND / day / machine

  // Derived ROI calculations
  const monthlyScrapLoss = calcMachines * calcScrapCost * 26 * (calcShifts / 2);
  const estimatedSavings = Math.round(monthlyScrapLoss * 0.32); // 32% scrap reduction
  const planCost = calcMachines <= 3 ? 149 : calcMachines <= 10 ? 299 : 599;
  const netMonthlyGain = estimatedSavings - planCost;
  const roiMultiplier = Math.max(2, Math.round(estimatedSavings / planCost));

  const features = [
    {
      icon: 'tablet',
      title: 'Interface Tablette Tactile Atelier',
      badge: 'Atelier Connecté',
      description: 'Clavier numérique PIN instantané et boutons tactiles utilisables avec gants. Comptage conforme/rebuts en direct, mode hors-ligne et synchronisation temps réel.',
      image: '/images/shopfloor_tablet_operator.jpg',
      color: 'from-blue-600 to-cyan-600'
    },
    {
      icon: 'qr_code_scanner',
      title: 'Contrôle Qualité & Scanner QR Mobile',
      badge: 'Zéro Défaut',
      description: 'Validation instantanée des cartons par flash QR code. Détection des écarts de quantité et alertes non-conformité en direct.',
      image: '/images/quality_scanner_inspection.jpg',
      color: 'from-emerald-600 to-teal-600'
    },
    {
      icon: 'monitoring',
      title: 'Supervision TRS & Performance Ligne (OEE)',
      badge: 'Temps Réel',
      description: 'Mesure continue de la disponibilité, cadence et qualité. Détection des micro-arrêts, MTBF et alertes mécaniciens automatiques.',
      image: '/images/smart_factory_control_room.jpg',
      color: 'from-indigo-600 to-blue-600'
    },
    {
      icon: 'inventory_2',
      title: 'Nomenclature BOM & Bobines Mères',
      badge: 'Traçabilité Matière',
      description: 'Gestion des Jumbo Rolls et matières premières. Simulateur de consommation théorique vs réelle avec coefficient de perte.',
      image: '/images/factory_hero_smart_plant.jpg',
      color: 'from-purple-600 to-indigo-600'
    },
    {
      icon: 'sync_alt',
      title: 'Connecteurs ERP Sage 100 & Odoo',
      badge: 'Intégration Comptable',
      description: 'Export automatisé des consommations de matières et mouvements de stocks au format comptable tunisien standard.',
      image: '/images/smart_factory_control_room.jpg',
      color: 'from-rose-600 to-pink-600'
    },
    {
      icon: 'shield_person',
      title: 'Isolation Multi-Tenant & Rôles Dédiés',
      badge: 'Sécurité Maximale',
      description: 'Chaque usine dispose de son espace isolé. Codes PIN à 4 chiffres pour les opérateurs et mots de passe chiffrés pour les managers.',
      image: '/images/shopfloor_tablet_operator.jpg',
      color: 'from-amber-500 to-orange-600'
    }
  ];

  const industrialSectors = [
    { name: 'Plasturgie & Injection', icon: 'category', badge: '12 usines équipées' },
    { name: 'Emballage & Conditionnement', icon: 'inventory', badge: '8 lignes actives' },
    { name: 'Câblage & Électronique', icon: 'settings_input_component', badge: '99.4% TRS' },
    { name: 'Agroalimentaire', icon: 'restaurant', badge: 'Traçabilité HACCP' },
    { name: 'Textile & Confection', icon: 'checkroom', badge: 'Rendement élevé' },
    { name: 'Mécanique & Métallurgie', icon: 'hardware', badge: 'Zéro papier' },
  ];

  const testimonials = [
    {
      quote: "FactoryFlow TN nous a permis de réduire notre taux de rebuts de 3.8% à 1.1% en moins de deux mois. La tablette atelier avec code PIN a été adoptée par nos opérateurs dès le premier jour.",
      author: "Kamel Ben Salah",
      role: "Directeur d'Usine Plasturgie",
      location: "Zone Industrielle Ben Arous",
      logo: "SP"
    },
    {
      quote: "L'intégration avec Sage 100 et le calcul automatique du TRS nous font gagner plus de 15 heures de saisie manuelle par semaine. Une visibilité totale en temps réel !",
      author: "Mounir Trabelsi",
      role: "Responsable Production & Lean",
      location: "Zone Industrielle Sousse Sidi Abdelhamid",
      logo: "AT"
    },
    {
      quote: "Le système multi-opérateurs sur machine et les étiquettes QR cartons ont fluidifié notre logistique d'expédition. Fini les erreurs de colisage.",
      author: "Salma Mejdoub",
      role: "Directrice Qualité & Supply Chain",
      location: "Parc Industriel Sfax",
      logo: "PM"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      <MarketingNavbar />

      {/* 🚀 HERO SECTION WITH DYNAMIC VISUALS */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-32 overflow-hidden border-b border-slate-900">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-blue-600/20 via-indigo-500/20 to-purple-600/10 blur-[140px] pointer-events-none rounded-full" />
        <div className="absolute top-10 right-10 w-96 h-96 bg-cyan-500/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-black uppercase tracking-widest backdrop-blur-md shadow-lg shadow-blue-500/5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Le 1er Système MES SaaS Industriel en Tunisie 🇹🇳</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.12]">
              Digitalisez votre Usine.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400">
                Augmentez votre TRS.
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="text-lg sm:text-xl text-slate-300 font-medium leading-relaxed">
              Tablettes tactiles d'atelier, traçabilité QR code, suivi des ordres de fabrication et connecteurs Sage / Odoo. Conçu spécialement pour les industriels tunisiens.
            </p>

            {/* CTA Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                to="/signup?plan=professional"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-base shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 group"
              >
                <span>Démarrer l'Essai Gratuit 14 Jours</span>
                <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </Link>
              
              <Link
                to="/contact"
                className="w-full sm:w-auto px-8 py-4 bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
              >
                <span className="material-symbols-outlined text-[20px] text-blue-400">play_circle</span>
                <span>Demander une Démo Usine</span>
              </Link>
            </div>

            {/* Micro Highlights */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> Sans Carte Bancaire</span>
              <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> Déploiement en 48 Heures</span>
              <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> Support Technique Local en Tunisie</span>
            </div>
          </div>

          {/* 🌟 HERO SHOWCASE WITH REAL INDUSTRIAL PHOTOGRAPHY & FLOATING METRIC CARDS */}
          <div className="mt-14 relative max-w-5xl mx-auto rounded-3xl p-2 bg-gradient-to-b from-blue-500/20 via-slate-800/40 to-slate-900/60 border border-slate-700/80 shadow-2xl backdrop-blur-xl group">
            
            <div className="relative rounded-2xl overflow-hidden aspect-[16/9] border border-slate-800 bg-slate-950">
              <img 
                src="/images/factory_hero_smart_plant.jpg" 
                alt="Usine connectée FactoryFlow TN" 
                className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent"></div>

              {/* Floating Top Status Badge */}
              <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-3 p-3 sm:px-4 sm:py-2.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-2xl">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ligne de Production 04</p>
                  <p className="text-xs sm:text-sm font-black text-white">TRS Global : <span className="text-emerald-400 font-mono">91.4%</span> (Performance Optimale)</p>
                </div>
              </div>

              {/* Floating Bottom Metric Badges */}
              <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 sm:p-4 rounded-xl bg-slate-950/85 border border-slate-800/80 backdrop-blur-md">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Pièces Conformes</p>
                  <p className="text-base sm:text-xl font-black text-white font-mono mt-0.5">14,832 <span className="text-xs text-emerald-400 font-bold">+12%</span></p>
                </div>
                <div className="p-3 sm:p-4 rounded-xl bg-slate-950/85 border border-slate-800/80 backdrop-blur-md">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Taux de Rebuts</p>
                  <p className="text-base sm:text-xl font-black text-emerald-400 font-mono mt-0.5">0.82% <span className="text-xs text-slate-400 font-normal">(-74%)</span></p>
                </div>
                <div className="p-3 sm:p-4 rounded-xl bg-slate-950/85 border border-slate-800/80 backdrop-blur-md">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Cartons Flashés</p>
                  <p className="text-base sm:text-xl font-black text-cyan-400 font-mono mt-0.5">412 Cartons</p>
                </div>
                <div className="p-3 sm:p-4 rounded-xl bg-slate-950/85 border border-slate-800/80 backdrop-blur-md">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Opérateurs Actifs</p>
                  <p className="text-base sm:text-xl font-black text-blue-400 font-mono mt-0.5">24 Connectés</p>
                </div>
              </div>

            </div>
          </div>

          {/* 🏭 INDUSTRIAL SECTORS MARQUEE */}
          <div className="mt-16 pt-8 border-t border-slate-900">
            <p className="text-center text-xs font-black uppercase tracking-widest text-slate-500 mb-6">
              Secteurs Industriels Équipés en Tunisie
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {industrialSectors.map((sec, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col items-center text-center gap-1.5 hover:border-blue-500/40 hover:bg-slate-900 transition-all">
                  <span className="material-symbols-outlined text-blue-400 text-[24px]">{sec.icon}</span>
                  <span className="text-xs font-bold text-slate-200">{sec.name}</span>
                  <span className="text-[9px] font-black text-emerald-400 uppercase">{sec.badge}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* 🎮 INTERACTIVE LIVE MES STUDIO (TABLETTE, SCANNER, SALLE DE CONTRÔLE) */}
      <section className="py-20 bg-slate-900/60 border-b border-slate-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
            <span className="text-xs font-black uppercase tracking-widest text-blue-400 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30">
              Expérience Interactive
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Testez l'Écosystème FactoryFlow
            </h2>
            <p className="text-slate-400 text-sm sm:text-base font-medium">
              Découvrez la simplicité d'utilisation pour vos ouvriers, contrôleurs qualité et managers d'usine.
            </p>
          </div>

          {/* Tabs Selector */}
          <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-2xl mx-auto p-1.5 rounded-2xl bg-slate-950 border border-slate-800">
            <button
              onClick={() => setActiveTab('tablet')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                activeTab === 'tablet'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">tablet</span>
              <span>Tablette Atelier</span>
            </button>
            <button
              onClick={() => setActiveTab('scanner')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                activeTab === 'scanner'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
              <span>Scanner Mobile QR</span>
            </button>
            <button
              onClick={() => setActiveTab('trs')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                activeTab === 'trs'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">monitoring</span>
              <span>Supervision TRS</span>
            </button>
          </div>

          {/* Interactive Stage Panel */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            {activeTab === 'tablet' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 rounded-2xl overflow-hidden border border-slate-800 shadow-xl relative aspect-[4/3]">
                  <img src="/images/shopfloor_tablet_operator.jpg" alt="Tablette Atelier" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md p-4 rounded-xl border border-slate-700/80">
                    <p className="text-xs font-bold text-slate-300">📱 Verrouillé sur la machine : <span className="text-white font-black">EXTRUDEUSE-02</span></p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Équipe connectée : Ahmed K. & Mohamed A. (Code PIN vérifié)</p>
                  </div>
                </div>

                <div className="lg:col-span-6 space-y-6">
                  <div>
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Simulateur Live</span>
                    <h3 className="text-2xl font-black text-white mt-1">Saisie Rapide & Déclaration Carton</h3>
                    <p className="text-slate-400 text-xs sm:text-sm mt-2">
                      Testez le comptage tactile en direct. Chaque fois que le carton est plein, le système génère instantanément l'étiquette QR.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                      <p className="text-xs font-bold text-slate-400">Pièces Conformes</p>
                      <p className="text-3xl font-black text-emerald-400 font-mono mt-1">{simGoodCount}</p>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => setSimGoodCount(prev => prev + 1)} className="flex-1 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 font-bold rounded-lg text-xs">+1</button>
                        <button onClick={() => setSimGoodCount(prev => prev + 10)} className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs">+10</button>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                      <p className="text-xs font-bold text-slate-400">Rebuts / Chutes</p>
                      <p className="text-3xl font-black text-rose-400 font-mono mt-1">{simScrapCount}</p>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => setSimScrapCount(prev => prev + 1)} className="flex-1 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 font-bold rounded-lg text-xs">+1</button>
                        <button onClick={() => setSimScrapCount(0)} className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs">Reset</button>
                      </div>
                    </div>
                  </div>

                  {/* Generated Carton Status */}
                  <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/40 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-blue-300">Cartons Générés ({simColisage} pcs/ctn) :</p>
                      <p className="text-lg font-black text-white font-mono mt-0.5">{Math.floor(simGoodCount / simColisage)} Cartons Complets + {simGoodCount % simColisage} en cours</p>
                    </div>
                    <span className="material-symbols-outlined text-3xl text-blue-400">qr_code_2</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'scanner' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 rounded-2xl overflow-hidden border border-slate-800 shadow-xl relative aspect-[4/3]">
                  <img src="/images/quality_scanner_inspection.jpg" alt="Scanner Mobile QR" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md p-4 rounded-xl border border-slate-700/80">
                    <p className="text-xs font-bold text-emerald-400">⚡ Flash QR Code instantané (Caméra Smartphone / Douchette)</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Validation Qualité & Entrée en Stock automatique</p>
                  </div>
                </div>

                <div className="lg:col-span-6 space-y-6">
                  <div>
                    <span className="text-xs font-black text-cyan-400 uppercase tracking-widest">Traçabilité Sans Papier</span>
                    <h3 className="text-2xl font-black text-white mt-1">Validation Qualité & Expédition</h3>
                    <p className="text-slate-400 text-xs sm:text-sm mt-2">
                      Flashez n'importe quel carton produit pour vérifier son lot, son opérateur et sa conformité avant mise en stock.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 font-mono text-xs">
                    <div className="flex justify-between pb-2 border-b border-slate-800">
                      <span className="text-slate-400">Carton N° :</span>
                      <span className="font-bold text-white">CTN-2026-0816-042</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-slate-800">
                      <span className="text-slate-400">Ordre de Fabrication :</span>
                      <span className="font-bold text-blue-400">OF-2608-019 (Adpro Pack)</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-slate-800">
                      <span className="text-slate-400">Contrôle Qualité :</span>
                      <span className="font-bold text-emerald-400">CONFORME (Passé)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Emplacement Stock :</span>
                      <span className="font-bold text-amber-400">Entrepôt A / Allée 3 / R-12</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      Valider Conforme
                    </button>
                    <button className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px]">warehouse</span>
                      Mise en Stock
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'trs' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 rounded-2xl overflow-hidden border border-slate-800 shadow-xl relative aspect-[4/3]">
                  <img src="/images/smart_factory_control_room.jpg" alt="Salle de Contrôle TRS" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md p-4 rounded-xl border border-slate-700/80">
                    <p className="text-xs font-bold text-blue-400">📊 Suivi TRS (OEE) en Temps Réel</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Disponibilité, Performance de cadence et Taux de Qualité</p>
                  </div>
                </div>

                <div className="lg:col-span-6 space-y-6">
                  <div>
                    <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Indicateurs Lean Manufacturing</span>
                    <h3 className="text-2xl font-black text-white mt-1">Calcul Automatique du TRS (OEE)</h3>
                    <p className="text-slate-400 text-xs sm:text-sm mt-2">
                      Fini les calculs manuels sur Excel en fin de mois. Visualisez instantanément les arrêts de production et les goulots d'étranglement.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Disponibilité</p>
                      <p className="text-xl font-black text-emerald-400 font-mono mt-1">94.2%</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Performance</p>
                      <p className="text-xl font-black text-blue-400 font-mono mt-1">92.0%</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Qualité</p>
                      <p className="text-xl font-black text-cyan-400 font-mono mt-1">99.1%</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-700/50 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-blue-300">TRS Global Usine :</p>
                      <p className="text-2xl font-black text-white font-mono">85.8% <span className="text-xs text-emerald-400 font-bold">(Classe Mondiale)</span></p>
                    </div>
                    <span className="material-symbols-outlined text-4xl text-blue-400">trending_up</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* 🧩 CORE FEATURES GRID WITH RICH VISUALS */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-blue-400 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30">
            Fonctionnalités Clés
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Tout pour Piloter votre Production
          </h2>
          <p className="text-slate-400 text-sm sm:text-base font-medium">
            Une suite modulaire complète pensée pour les contraintes réelles des ateliers de fabrication en Tunisie.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feat, index) => (
            <div
              key={index}
              className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all hover:-translate-y-1 group relative overflow-hidden flex flex-col"
            >
              <div className="rounded-2xl overflow-hidden aspect-[16/10] mb-5 border border-slate-800 bg-slate-950">
                <img src={feat.image} alt={feat.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${feat.color} flex items-center justify-center text-white shadow-md`}>
                  <span className="material-symbols-outlined text-[22px]">{feat.icon}</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {feat.badge}
                </span>
              </div>

              <h3 className="text-lg font-black text-white mb-2">{feat.title}</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mt-auto">
                {feat.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 💰 INTERACTIVE ROI & SAVINGS CALCULATOR (IN TND) */}
      <section className="py-20 bg-slate-900/80 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                Calculateur de Rentabilité (ROI)
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Combien FactoryFlow va faire Économiser à votre Usine ?
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                En digitalisant les déclarations et en identifiant les micro-arrêts en direct, nos clients réduisent leurs rebuts de 25% à 40% dès le premier mois.
              </p>

              {/* Sliders */}
              <div className="space-y-5 pt-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                    <span>Nombre de Machines de Production :</span>
                    <span className="text-blue-400 font-mono text-base font-black">{calcMachines} Machines</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    value={calcMachines}
                    onChange={(e) => setCalcMachines(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                    <span>Équipes / Shifts par jour :</span>
                    <span className="text-blue-400 font-mono text-base font-black">{calcShifts} Équipes ({calcShifts * 8}h/j)</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    value={calcShifts}
                    onChange={(e) => setCalcShifts(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                    <span>Coût moyen estimé des rebuts / jour / machine :</span>
                    <span className="text-rose-400 font-mono text-base font-black">{calcScrapCost} DT / jour</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={500}
                    step={10}
                    value={calcScrapCost}
                    onChange={(e) => setCalcScrapCost(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-600"
                  />
                </div>
              </div>
            </div>

            {/* Results Card */}
            <div className="lg:col-span-6">
              <div className="p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-blue-500/30 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">
                  Impact Financier Estimé sur 1 Mois
                </h3>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400">Pertes de Rebuts Actuelles</span>
                    <span className="text-lg font-black text-rose-400 font-mono">{monthlyScrapLoss.toLocaleString('fr-FR')} TND</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400">Économies Estimées (-32% rebuts)</span>
                    <span className="text-lg font-black text-emerald-400 font-mono">+{estimatedSavings.toLocaleString('fr-FR')} TND / mois</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400">Abonnement FactoryFlow TN</span>
                    <span className="text-sm font-bold text-slate-300 font-mono">{planCost} TND / mois</span>
                  </div>

                  <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-blue-950/60 border border-emerald-500/40 mt-4">
                    <p className="text-xs font-black text-emerald-300 uppercase tracking-wider">Gain Net Mensuel Estimé :</p>
                    <p className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono mt-1">
                      +{netMonthlyGain.toLocaleString('fr-FR')} <span className="text-lg font-sans text-white">TND / mois</span>
                    </p>
                    <p className="text-xs font-bold text-slate-300 mt-2">
                      ⚡ Rentabilisé dès les <span className="text-emerald-300 font-black">premiers {Math.max(3, Math.round(30 / roiMultiplier))} jours</span> d'utilisation !
                    </p>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <Link
                    to="/signup?plan=professional"
                    className="inline-flex items-center justify-center gap-2 w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
                  >
                    <span>Commencer à Économiser dès Aujourd'hui</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 🗣️ TUNISIAN TESTIMONIALS */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-blue-400 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30">
            Témoignages Industriels
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Ils Digitalisent Leurs Lignes avec Nous
          </h2>
          <p className="text-slate-400 text-sm sm:text-base font-medium">
            Découvrez comment les directeurs d'usine en Tunisie transforment leur productivité au quotidien.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, index) => (
            <div
              key={index}
              className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between relative"
            >
              <div className="text-blue-500 text-4xl font-serif">“</div>
              <p className="text-slate-300 text-sm leading-relaxed mb-6 font-medium">
                {t.quote}
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-800/80">
                <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 font-black text-xs flex items-center justify-center border border-blue-500/30">
                  {t.logo}
                </div>
                <div>
                  <p className="text-xs font-black text-white">{t.author}</p>
                  <p className="text-[11px] text-slate-400 font-medium">{t.role}</p>
                  <p className="text-[10px] text-blue-400 font-semibold">{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 🚀 FINAL CALL TO ACTION */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Prêt à Moderniser votre Atelier ?
            </h2>
            <p className="text-blue-100 text-sm sm:text-base max-w-2xl mx-auto font-medium">
              Créez votre compte en 2 minutes, associez vos machines et commencez à déclarer votre production sans aucun frais.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
              <Link
                to="/signup?plan=professional"
                className="px-8 py-4 bg-white hover:bg-slate-100 text-blue-900 rounded-2xl font-black text-base shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <span>Démarrer l'Essai Gratuit 14 Jours</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </Link>
              <Link
                to="/contact"
                className="px-8 py-4 bg-blue-950/40 hover:bg-blue-950/60 text-white border border-white/20 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2"
              >
                <span>Prendre Rendez-vous Démo</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
