import { create } from 'zustand';
import { Language, translations } from '../i18n/translations';

interface LanguageStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['fr'];
}

export const useLanguageStore = create<LanguageStore>((set, get) => {
  const savedLang = (localStorage.getItem('factoryflow_lang') as Language) || 'fr';
  
  if (savedLang === 'ar') {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  } else {
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = savedLang;
  }

  return {
    language: savedLang,
    t: translations[savedLang] || translations.fr,
    setLanguage: (lang: Language) => {
      localStorage.setItem('factoryflow_lang', lang);
      if (lang === 'ar') {
        document.documentElement.dir = 'rtl';
        document.documentElement.lang = 'ar';
      } else {
        document.documentElement.dir = 'ltr';
        document.documentElement.lang = lang;
      }
      set({
        language: lang,
        t: translations[lang] || translations.fr
      });
    }
  };
});
