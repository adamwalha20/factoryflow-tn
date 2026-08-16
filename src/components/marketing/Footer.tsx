import React from 'react';
import { Link } from 'react-router-dom';
import { useThemeStore } from '../../store/theme';

export function MarketingFooter() {
  const { theme } = useThemeStore();

  return (
    <footer className={`pt-16 pb-12 border-t transition-colors duration-300 ${
      theme === 'dark'
        ? 'bg-slate-950 text-slate-400 border-slate-800'
        : 'bg-slate-50 text-slate-600 border-slate-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b ${
          theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
        }`}>
          
          {/* Company Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-blue-600/30">
                <span className="material-symbols-outlined text-[24px]">precision_manufacturing</span>
              </div>
              <span className={`text-xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                FactoryFlow <span className="text-blue-500 font-extrabold text-sm uppercase">TN</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-sm">
              La plateforme SaaS de gestion de production industrielle conçue pour les PME et usines tunisiennes. Simplifiez vos ateliers sans la lourdeur des ERPs traditionnels.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs font-semibold">
              <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
              }`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Serveurs Sécurisés & RLS Multi-Tenant
              </span>
              <span className={`px-3 py-1.5 rounded-lg border ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
              }`}>
                🇹🇳 Made in Tunisia
              </span>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className={`text-sm font-black uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Produit</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/features" className="hover:text-blue-500 transition-colors">Fonctionnalités MES</Link></li>
              <li><Link to="/pricing" className="hover:text-blue-500 transition-colors">Forfaits & Tarifs TND</Link></li>
              <li><Link to="/features#connecteurs" className="hover:text-blue-500 transition-colors">Connecteurs Sage & Odoo</Link></li>
              <li><Link to="/features#atelier" className="hover:text-blue-500 transition-colors">Tablette Atelier Tactile</Link></li>
              <li><Link to="/features#qualite" className="hover:text-blue-500 transition-colors">Scanner Mobile QR Code</Link></li>
            </ul>
          </div>

          {/* Company & Support */}
          <div>
            <h4 className={`text-sm font-black uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Entreprise</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/about" className="hover:text-blue-500 transition-colors">À Propos</Link></li>
              <li><Link to="/contact" className="hover:text-blue-500 transition-colors">Contact & Démo</Link></li>
              <li><Link to="/faq" className="hover:text-blue-500 transition-colors">FAQ Industrielle</Link></li>
              <li><Link to="/login" className="hover:text-blue-500 transition-colors">Espace Connexion</Link></li>
              <li><Link to="/signup?plan=professional" className="hover:text-blue-500 transition-colors">Créer un Compte Usine</Link></li>
            </ul>
          </div>

          {/* Contact Direct */}
          <div>
            <h4 className={`text-sm font-black uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-blue-500 shrink-0">location_on</span>
                <span>Zone Industrielle Ben Arous / Sousse, Tunisie</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-blue-500 shrink-0">mail</span>
                <a href="mailto:contact@factoryflow.tn" className="hover:text-blue-500 transition-colors">contact@factoryflow.tn</a>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-blue-500 shrink-0">call</span>
                <a href="tel:+21671000000" className="hover:text-blue-500 transition-colors">+216 71 000 000</a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© {new Date().getFullYear()} FactoryFlow TN. Tous droits réservés.</p>
          <div className="flex gap-6">
            <span className="hover:text-blue-500 transition-colors cursor-pointer">Conditions Générales</span>
            <span className="hover:text-blue-500 transition-colors cursor-pointer">Confidentialité</span>
            <span className="hover:text-blue-500 transition-colors cursor-pointer">Sécurité Multi-Tenant</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
