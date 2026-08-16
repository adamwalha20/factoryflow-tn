import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguageStore } from '../../store/language';

export function MarketingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { language, setLanguage } = useLanguageStore();

  const navLinks = [
    { name: 'Fonctionnalités', href: '/features' },
    { name: 'Tarifs & Forfaits', href: '/pricing' },
    { name: 'À Propos', href: '/about' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Contact & Démo', href: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[24px]">precision_manufacturing</span>
            </div>
            <div>
              <span className="text-lg font-black text-white tracking-tight flex items-center gap-1.5">
                FactoryFlow <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/30 font-extrabold uppercase">TN</span>
              </span>
              <p className="text-[10px] font-medium text-slate-400 hidden sm:block">MES SaaS Industriel Tunisie</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-full border border-slate-800">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  isActive(link.href)
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Language Selector */}
            <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800 text-xs font-bold text-slate-300">
              <button
                onClick={() => setLanguage('fr')}
                className={`px-2 py-1 rounded transition-colors ${language === 'fr' ? 'bg-blue-600 text-white font-black' : 'hover:text-white'}`}
              >
                FR
              </button>
              <button
                onClick={() => setLanguage('ar')}
                className={`px-2 py-1 rounded transition-colors ${language === 'ar' ? 'bg-blue-600 text-white font-black' : 'hover:text-white'}`}
              >
                عربي
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded transition-colors ${language === 'en' ? 'bg-blue-600 text-white font-black' : 'hover:text-white'}`}
              >
                EN
              </button>
            </div>

            {/* Client Portal Link */}
            <Link
              to="/portal"
              className="text-xs font-bold text-slate-300 hover:text-blue-400 px-3 py-2 rounded-lg hover:bg-slate-900 transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">local_shipping</span>
              Suivi Client
            </Link>

            {/* Login */}
            <Link
              to="/login"
              className="text-xs font-bold text-slate-200 hover:text-white px-3 py-2 rounded-xl transition-colors"
            >
              Connexion
            </Link>

            {/* CTA Get Started */}
            <Link
              to="/signup?plan=professional"
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
            >
              <span>Essai 14 Jours</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-900"
            >
              <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 p-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-2.5 rounded-xl text-sm font-bold ${
                isActive(link.href) ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 text-center text-slate-200 font-bold text-sm bg-slate-900 rounded-xl"
            >
              Connexion
            </Link>
            <Link
              to="/signup?plan=professional"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 text-center text-white font-black text-sm bg-blue-600 rounded-xl"
            >
              Démarrer l'Essai Gratuit
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
