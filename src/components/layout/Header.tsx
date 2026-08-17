import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/auth';
import { useTenantStore } from '../../store/tenantStore';
import { useNotificationStore } from '../../store/notifications';
import { useLanguageStore } from '../../store/language';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function Header() {
  const { employee } = useAuthStore();
  const { currentOrg, fetchTenantData } = useTenantStore();
  const { notifications, fetchNotifications, setupRealtime, markAsRead, markAllAsRead } = useNotificationStore();
  const { language, setLanguage, t } = useLanguageStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTenantData();
    fetchNotifications();
    setupRealtime();
  }, [fetchTenantData, fetchNotifications, setupRealtime]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 h-14 flex justify-between items-center px-6 z-30 bg-white/80 backdrop-blur-md border-b border-zinc-200">
      <div className="flex items-center gap-6">
        <button aria-label="Open menu" className="md:hidden p-1.5 -ml-1.5 text-zinc-500 hover:text-zinc-800 rounded-md hover:bg-zinc-100">
          <span className="material-symbols-outlined text-[20px]">menu</span>
        </button>
        <div className="hidden md:flex items-center gap-2 text-sm font-medium text-zinc-600">
          <span className="text-zinc-900 font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-blue-600">domain</span>
            {currentOrg?.name || 'FactoryFlow TN'}
          </span>
          <span className="text-zinc-300">/</span>
          <span className="font-semibold text-zinc-700">{t.overview}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Developer Space Quick Switcher */}
        <a
          href="/developer"
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-800/80 rounded-lg text-xs font-black transition-all shadow-xs"
          title="Console Développeur & SuperAdmin"
        >
          <span className="material-symbols-outlined text-[14px]">terminal</span>
          <span>Dev Space ⚡</span>
        </a>

        {/* Language Selector */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setLanguage('fr')}
            className={`px-2 py-1 rounded-md transition-all ${language === 'fr' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
          >
            FR
          </button>
          <button
            onClick={() => setLanguage('ar')}
            className={`px-2 py-1 rounded-md transition-all ${language === 'ar' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
          >
            عربي
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-2 py-1 rounded-md transition-all ${language === 'en' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
          >
            EN
          </button>
        </div>

        <div className="relative hidden lg:block">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-[16px]">search</span>
          <input 
            className="pl-9 pr-3 py-1.5 bg-zinc-100 border-none rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white w-52 transition-all" 
            placeholder={t.search} 
            type="text"
          />
        </div>
        
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-1.5 rounded-md transition-colors relative flex items-center justify-center ${showNotifications ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'}`}
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-zinc-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-between items-center p-4 border-b border-zinc-100 bg-zinc-50/50">
                <h3 className="font-bold text-zinc-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => markAllAsRead()}
                    className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Tout marquer comme lu
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-zinc-500">
                    Aucune notification
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100">
                    {notifications.map(notification => (
                      <div 
                        key={notification.id} 
                        onClick={() => {
                          if (!notification.read) markAsRead(notification.id);
                        }}
                        className={`p-4 cursor-pointer transition-colors hover:bg-zinc-50 ${!notification.read ? 'bg-blue-50/30' : ''}`}
                      >
                        <div className="flex justify-between gap-2 mb-1">
                          <h4 className={`text-sm ${!notification.read ? 'font-bold text-zinc-900' : 'font-medium text-zinc-700'}`}>
                            {notification.title}
                          </h4>
                          <span className="text-xs text-zinc-400 whitespace-nowrap">
                            {format(new Date(notification.created_at), 'HH:mm', { locale: fr })}
                          </span>
                        </div>
                        <p className={`text-sm ${!notification.read ? 'text-zinc-800' : 'text-zinc-500'}`}>
                          {notification.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="h-5 w-px bg-zinc-200 mx-1"></div>
        
        <div className="flex items-center gap-2 cursor-pointer hover:bg-zinc-50 p-1 rounded-md transition-colors">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 text-white flex items-center justify-center text-xs font-bold shadow-sm">
            {employee?.first_name?.charAt(0) || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
