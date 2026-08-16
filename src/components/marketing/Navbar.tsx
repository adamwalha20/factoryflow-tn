import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguageStore } from '../../store/language';
import { useThemeStore } from '../../store/theme';

export function MarketingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { language, setLanguage } = useLanguageStore();
  const { theme, toggleTheme } = useThemeStore();

  const navLinks = [
    { name: 'Fonctionnalités', href: '/features' },
    { name: 'Tarifs & Forfaits', href: '/pricing' },
    { name: 'À Propos', href: '/about' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Contact & Démo', href: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-slate-950/85 border-slate-800 text-slate-100' 
        : 'bg-white/90 border-slate-200 text-slate-900 shadow-xs'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[24px]">precision_manufacturing</span>
            </div>
            <div>
              <span className={`text-lg font-black tracking-tight flex items-center gap-1.5 ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
                FactoryFlow <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/30 font-extrabold uppercase">TN</span>
              </span>
              <p className={`text-[10px] font-medium hidden sm:block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>MES SaaS Industriel Tunisie</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className={`hidden md:flex items-center gap-1 p-1.5 rounded-full border transition-colors ${
            theme === 'dark' ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100/90 border-slate-200'
          }`}>
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  isActive(link.href)
                    ? 'bg-blue-600 text-white shadow-sm'
                    : theme === 'dark'
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            
            {/* 🌙 / ☀️ Dark / Light Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
              className={`p-2 rounded-xl border transition-all flex items-center justify-center ${
                theme === 'dark'
                  ? 'bg-slate-900 border-slate-800 text-amber-400 hover:text-amber-300 hover:bg-slate-800'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {/* Language Selector */}
            <div className={`flex items-center rounded-xl p-1 border text-xs font-bold transition-colors ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}>
              <button
                onClick={() => setLanguage('fr')}
                className={`px-2 py-1 rounded transition-colors ${language === 'fr' ? 'bg-blue-600 text-white font-black' : 'hover:text-blue-500'}`}
              >
                FR
              </button>
              <button
                onClick={() => setLanguage('ar')}
                className={`px-2 py-1 rounded transition-colors ${language === 'ar' ? 'bg-blue-600 text-white font-black' : 'hover:text-blue-500'}`}
              >
                عربي
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded transition-colors ${language === 'en' ? 'bg-blue-600 text-white font-black' : 'hover:text-blue-500'}`}
              >
                EN
              </button>
            </div>

            {/* Login */}
            <Link
              to="/login"
              className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-colors ${
                theme === 'dark' ? 'text-slate-200 hover:text-white hover:bg-slate-900' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
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
              onClick={toggleTheme}
              className={`p-2 rounded-lg border ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800 text-amber-400' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-lg ${
                theme === 'dark' ? 'text-slate-300 hover:text-white hover:bg-slate-900' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className={`md:hidden border-t p-4 space-y-3 ${
          theme === 'dark' ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white shadow-xl'
        }`}>
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-2.5 rounded-xl text-sm font-bold ${
                isActive(link.href) 
                  ? 'bg-blue-600 text-white' 
                  : theme === 'dark' ? 'text-slate-300 hover:bg-slate-900' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className={`pt-2 border-t flex flex-col gap-2 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className={`w-full py-2.5 text-center font-bold text-sm rounded-xl ${
                theme === 'dark' ? 'text-slate-200 bg-slate-900' : 'text-slate-700 bg-slate-100'
              }`}
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
