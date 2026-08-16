import React from 'react';
import { Link } from 'react-router-dom';
import { MarketingNavbar } from '../../components/marketing/Navbar';
import { MarketingFooter } from '../../components/marketing/Footer';

export function FaqPage() {
  const faqs = [
    {
      category: 'Général & Déploiement',
      items: [
        {
          q: 'Qu\'est-ce que FactoryFlow TN exactement ?',
          a: 'FactoryFlow TN est un système d\'exécution de la fabrication (MES) en mode SaaS (Software-as-a-Service) hébergé dans le cloud. Il connecte en temps réel le management de l\'usine et les opérateurs sur les machines via des tablettes tactiles.'
        },
        {
          q: 'Combien de temps prend le déploiement dans une usine ?',
          a: 'Moins d\'une heure ! Créez votre compte en ligne, ajoutez vos machines et vos articles, positionnez une tablette sur chaque machine, et votre atelier est immédiatement opérationnel.'
        },
        {
          q: 'Y a-t-il un engagement de durée ?',
          a: 'Non. Vous pouvez résilier votre abonnement mensuel à tout moment en un clic depuis les paramètres de votre compte sans pénalité.'
        }
      ]
    },
    {
      category: 'Atelier & Matériel',
      items: [
        {
          q: 'Faut-il acheter des tablettes spécifiques ?',
          a: 'Non. N\'importe quelle tablette standard Android ou iPad du commerce (à partir de 250 TND) avec navigateur Google Chrome ou Safari fonctionne parfaitement.'
        },
        {
          q: 'Comment les ouvriers s\'identifient-ils sur les machines ?',
          a: 'Chaque ouvrier dispose d\'un code PIN personnel à 4 chiffres ou d\'un badge QR code. La saisie est conçue pour des boutons tactiles extra-larges utilisables avec des gants industriels.'
        },
        {
          q: 'Que se passe-t-il si la connexion Wi-Fi de l\'atelier s\'interrompt ?',
          a: 'Notre technologie Offline Queue enregistre automatiquement les pièces conformes, rebuts et arrêts localement dans la mémoire de la tablette. Dès que le Wi-Fi revient, les données sont synchronisées sur le serveur sans aucune perte.'
        }
      ]
    },
    {
      category: 'Sécurité & Données',
      items: [
        {
          q: 'Mes données de production sont-elles sécurisées et confidentielles ?',
          a: 'Oui. Chaque usine cliente est strictement isolée grâce à des règles PostgreSQL Row Level Security (RLS). Toutes les connexions sont chiffrées en HTTPS/TLS de niveau bancaire et des sauvegardes automatiques sont effectuées quotidiennement.'
        },
        {
          q: 'Puis-je exporter mes données si je souhaite changer de logiciel ?',
          a: 'Oui, à tout moment. Vous pouvez exporter l\'intégralité de vos historiques de production, stocks, et nomenclatures au format Excel, CSV ou JSON.'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans">
      <MarketingNavbar />

      <section className="pt-16 pb-20 bg-gradient-to-b from-blue-50/50 via-white to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center">
            <span className="text-xs font-black text-blue-600 uppercase tracking-widest bg-blue-100/80 px-3 py-1 rounded-full border border-blue-200">
              Foire Aux Questions
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-zinc-950 mt-4 tracking-tight">
              Tout ce que vous devez savoir sur FactoryFlow TN
            </h1>
            <p className="text-base sm:text-lg text-zinc-600 font-medium mt-3">
              Des réponses claires à vos questions techniques, opérationnelles et financières.
            </p>
          </div>

          <div className="space-y-10">
            {faqs.map((cat) => (
              <div key={cat.category} className="space-y-4">
                <h2 className="text-xl font-black text-blue-800 border-b border-blue-100 pb-2">
                  {cat.category}
                </h2>
                <div className="space-y-4">
                  {cat.items.map((item) => (
                    <div key={item.q} className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 shadow-xs">
                      <h3 className="text-base font-black text-zinc-900">{item.q}</h3>
                      <p className="text-sm text-zinc-600 mt-2 font-medium leading-relaxed">{item.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-zinc-900 text-white rounded-3xl p-8 text-center space-y-4">
            <h3 className="text-xl font-black">Vous avez une question spécifique à votre secteur ?</h3>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              Nos consultants industriels sont à votre disposition pour analyser vos processus de fabrication.
            </p>
            <div className="pt-2">
              <Link
                to="/contact"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 font-bold rounded-xl text-sm transition-colors inline-block"
              >
                Parler à un Spécialiste
              </Link>
            </div>
          </div>

        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
