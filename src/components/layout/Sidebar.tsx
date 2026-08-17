import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { useLanguageStore } from '../../store/language';

export function Sidebar() {
  const location = useLocation();
  const { signOut, employee } = useAuthStore();
  const { t } = useLanguageStore();

  const navItems = [
    { name: t.dashboard, path: '/admin', icon: 'dashboard', exact: true, allowedRoles: ['Administrator', 'Production Manager'] },
    { name: t.production, path: '/admin/production', icon: 'factory', allowedRoles: ['Administrator', 'Production Manager'] },
    { name: t.machines, path: '/admin/machines', icon: 'precision_manufacturing', allowedRoles: ['Administrator', 'Production Manager'] },
    { name: t.machine_stops, path: '/admin/arrets', icon: 'error', allowedRoles: ['Administrator', 'Production Manager'] },
    { name: t.quality_control, path: '/admin/qualite', icon: 'biotech', allowedRoles: ['Administrator', 'Production Manager'] },
    { name: t.maintenance, path: '/admin/maintenance', icon: 'build', allowedRoles: ['Administrator', 'Production Manager'] },
    { name: t.production_history, path: '/admin/historique', icon: 'history', allowedRoles: ['Administrator', 'Production Manager'] },
    { name: t.reports, path: '/admin/rapports', icon: 'assessment', allowedRoles: ['Administrator', 'Production Manager'] },
    { name: t.articles, path: '/admin/articles', icon: 'inventory_2', allowedRoles: ['Administrator', 'Production Manager'] },
    { name: t.raw_materials, path: '/admin/matieres', icon: 'conveyor_belt', allowedRoles: ['Administrator', 'Production Manager'] },
    { name: t.purchase_orders, path: '/admin/bons-de-commande', icon: 'receipt', allowedRoles: ['Administrator', 'Production Manager'] },
    { name: t.manufacturing_orders, path: '/admin/ordres-fabrication', icon: 'assignment', allowedRoles: ['Administrator', 'Production Manager'] },
    { name: t.cartons_labels, path: '/admin/cartons', icon: 'qr_code_2', allowedRoles: ['Administrator', 'Production Manager'] },
    { name: t.company_profile, path: '/admin/company', icon: 'domain', allowedRoles: ['Administrator', 'Production Manager'] },
    { name: t.team_members, path: '/admin/tenant-users', icon: 'group_add', allowedRoles: ['Administrator'] },
    { name: t.subscription_quotas, path: '/admin/subscription', icon: 'credit_card', allowedRoles: ['Administrator'] },
    { name: t.system_history, path: '/admin/system-history', icon: 'manage_history', allowedRoles: ['Administrator'] },
    { name: t.users, path: '/admin/utilisateurs', icon: 'badge', allowedRoles: ['Administrator'] },
    { name: t.saas_supervision, path: '/admin/saas', icon: 'monitoring', allowedRoles: ['Administrator'], devOnly: true },
    { name: t.settings, path: '/admin/parametres', icon: 'settings', allowedRoles: ['Administrator'] },
  ];

  const activeOrgId = typeof localStorage !== 'undefined' ? localStorage.getItem('active_org_id') : null;
  const isDevUser = 
    employee?.email === 'dev@factoryflow.tn' ||
    employee?.first_name?.toLowerCase() === 'developer' ||
    activeOrgId === '00000000-0000-0000-0000-000000000000';

  return (
    <nav className="fixed left-0 top-0 h-screen flex flex-col z-40 overflow-y-auto bg-slate-900 border-r border-slate-800 w-64 hidden md:flex text-slate-300">
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded flex items-center justify-center text-white font-bold text-sm shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            FF
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-100 tracking-tight">FactoryFlow TN</h1>
            <p className="text-[10px] text-blue-400 font-medium uppercase tracking-widest mt-0.5">SaaS MES</p>
          </div>
        </div>
      </div>

      <div className="flex-1 py-4 px-3 space-y-1">
        {navItems
          .filter(item => employee?.role && item.allowedRoles.includes(employee.role) && (!item.devOnly || isDevUser))
          .map((item) => {
            const isActive = item.exact 
              ? location.pathname === item.path 
              : location.pathname.startsWith(item.path);
          
          if (isActive) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-blue-600/10 to-indigo-600/5 text-blue-400 rounded-lg font-medium shadow-sm transition-all text-sm border border-blue-500/20"
              >
                <span className="material-symbols-outlined icon-fill text-[18px] text-blue-500">{item.icon}</span>
                <span className="text-blue-100">{item.name}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.name}
              to={item.path}
              className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 rounded-lg font-medium transition-all group text-sm"

            >
              <span className="material-symbols-outlined text-[18px] group-hover:text-zinc-300 transition-colors">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center justify-between px-2 py-2 mb-2">
           <div className="flex flex-col">
             <span className="text-sm font-medium text-slate-200">{employee?.first_name} {employee?.last_name}</span>
             <span className="text-xs text-blue-400">{employee?.role}</span>
           </div>
        </div>
        <button 
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors rounded-lg text-sm font-medium"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span>Déconnexion</span>
        </button>
      </div>
    </nav>
  );
}
