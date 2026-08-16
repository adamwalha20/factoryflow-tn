import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MarketingNavbar } from '../../components/marketing/Navbar';
import { MarketingFooter } from '../../components/marketing/Footer';
import { useThemeStore } from '../../store/theme';

export function FaqPage() {
  const { theme } = useThemeStore();
  const [openIndex, setOpenIndex] = useState<string | null>('0-0');

  const faqs = [
    {
      category: 'Général & Déploiement',
      items: [
        {
          q: 'Qu\'est-ce que FactoryFlow TN exactement ?',
          a: 'FactoryFlow TN est un système d\'exécution de la fabrication (MES) en mode SaaS hébergé dans le cloud. Il connecte en temps réel le management de l\'usine et les opérateurs sur les machines via des tablettes tactiles.'
        },
        {
          q: 'Combien de temps prend le déploiement dans une usine ?',
          a: 'Moins d\'une heure ! Créez votre compte en ligne, ajoutez vos machines et vos articles, positionnez une tablette sur chaque machine avec un QR code ou code PIN, et votre atelier est immédiatement opérationnel.'
        },
        {
          q: 'Y a-t-il un engagement de durée ?',
          a: 'Non. Vous pouvez résilier ou modifier votre abonnement mensuel à tout moment depuis les paramètres de votre compte sans frais de résiliation.'
        }
      ]
    },
    {
      category: 'Atelier & Matériel',
      items: [
        {
          q: 'Faut-il acheter des tablettes spécifiques ?',
          a: 'Non. N\'importe quelle tablette standard Android ou iPad du commerce avec navigateur Google Chrome ou Safari fonctionne parfaitement sans aucun logiciel lourd à installer.'
        },
        {
          q: 'Comment les ouvriers s\'identifient-ils sur les machines ?',
          a: 'Chaque ouvrier dispose d\'un code PIN personnel à 4 chiffres. Ils peuvent travailler en équipe jusqu\'à 4 ouvriers sur la même machine avec comptage direct et traçabilité nominative.'
        },
        {
          q: 'Que se passe-t-il si la connexion Wi-Fi de l\'atelier s\'interrompt ?',
          a: 'Notre technologie Offline Queue enregistre automatiquement les pièces conformes, rebuts et arrêts localement dans la mémoire de la tablette. Dès que le Wi-Fi revient, les données sont synchronisées sans perte.'
        }
      ]
    },
    {
      category: 'Sécurité & Données',
      items: [
        {
          q: 'Mes données de production sont-elles sécurisées et confidentielles ?',
          a: 'Oui. Chaque usine cliente est strictement isolée grâce à des règles PostgreSQL Row Level Security (RLS). Toutes les connexions sont chiffrées en HTTPS/TLS et des sauvegardes automatiques sont effectuées quotidiennement.'
        },
        {
          q: 'Puis-je exporter mes données vers Sage ou Odoo ?',
          a: 'Oui, à tout moment. Vous pouvez exporter vos mouvements de stock et consommations de matières au format compatible Sage 100 et Odoo MES en un clic.'
        }
      ]
    }
  ];

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <MarketingNavbar />

      {/* Header Section */}
      <section className="pt-16 pb-12 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 relative z-10 space-y-4">
          <span className="text-xs font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/30">
            Foire Aux Questions
          </span>
          <h1 className={`text-4xl sm:text-6xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
            Questions Fréquentes
          </h1>
          <p className={`text-base sm:text-lg max-w-2xl mx-auto font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
            Tout ce que vous devez savoir pour digitaliser votre atelier et démarrer avec FactoryFlow TN.
          </p>
        </div>
      </section>

      {/* FAQ Accordion List */}
      <section className="py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 pb-24">
        {faqs.map((cat, catIdx) => (
          <div key={catIdx} className="space-y-4">
            <h2 className={`text-xl font-black tracking-tight ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
              {cat.category}
            </h2>

            <div className="space-y-3">
              {cat.items.map((item, itemIdx) => {
                const key = `${catIdx}-${itemIdx}`;
                const isOpen = openIndex === key;

                return (
                  <div
                    key={itemIdx}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      theme === 'dark'
                        ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                        : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
                    }`}
                  >
                    <button
                      onClick={() => setOpenIndex(isOpen ? null : key)}
                      className="w-full p-5 text-left flex justify-between items-center gap-4 font-bold text-sm sm:text-base"
                    >
                      <span className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>{item.q}</span>
                      <span className={`material-symbols-outlined transition-transform duration-200 text-blue-500 ${isOpen ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    </button>

                    {isOpen && (
                      <div className={`p-5 pt-0 text-xs sm:text-sm leading-relaxed font-medium border-t ${
                        theme === 'dark' ? 'text-slate-300 border-slate-800/60' : 'text-slate-600 border-slate-100'
                      }`}>
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Still have questions CTA */}
        <div className={`p-8 sm:p-10 rounded-3xl border text-center space-y-4 ${
          theme === 'dark'
            ? 'bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border-blue-500/30'
            : 'bg-blue-50 border-blue-200'
        }`}>
          <h3 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Vous avez d'autres questions sur votre atelier ?
          </h3>
          <p className={`text-sm max-w-xl mx-auto ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
            Nos ingénieurs industriels répondent à toutes vos questions par téléphone ou directement sur site.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              to="/contact"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-md transition-all"
            >
              Contactez Notre Équipe
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
