import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { useAuthStore } from './store/auth';

// Layouts & Guards
import { Layout } from './components/layout/Layout';
import { TabletLayout } from './components/layout/TabletLayout';
import { ScannerLayout } from './components/layout/ScannerLayout';
import { MechanicLayout } from './components/layout/MechanicLayout';
import { AuthGuard, RoleGuard } from './components/auth/AuthGuard';

import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './ErrorBoundary';

// Marketing Pages
const LandingPage = lazy(() => import('./pages/marketing/LandingPage').then(m => ({ default: m.LandingPage })));
const PricingPage = lazy(() => import('./pages/marketing/PricingPage').then(m => ({ default: m.PricingPage })));
const FeaturesPage = lazy(() => import('./pages/marketing/FeaturesPage').then(m => ({ default: m.FeaturesPage })));
const ContactPage = lazy(() => import('./pages/marketing/ContactPage').then(m => ({ default: m.ContactPage })));
const AboutPage = lazy(() => import('./pages/marketing/AboutPage').then(m => ({ default: m.AboutPage })));
const FaqPage = lazy(() => import('./pages/marketing/FaqPage').then(m => ({ default: m.FaqPage })));

// SaaS Auth & Onboarding
const SignUpPage = lazy(() => import('./pages/auth/SignUpPage').then(m => ({ default: m.SignUpPage })));
const OnboardingWizard = lazy(() => import('./pages/onboarding/OnboardingWizard').then(m => ({ default: m.OnboardingWizard })));

// Application Pages - Named Exports
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Production = lazy(() => import('./pages/Production').then(m => ({ default: m.Production })));
const Machines = lazy(() => import('./pages/Machines').then(m => ({ default: m.Machines })));
const SystemHistory = lazy(() => import('./pages/SystemHistory').then(m => ({ default: m.SystemHistory })));
const Articles = lazy(() => import('./pages/Articles').then(m => ({ default: m.Articles })));
const ManufacturingOrders = lazy(() => import('./pages/ManufacturingOrders').then(m => ({ default: m.ManufacturingOrders })));
const BonsDeCommande = lazy(() => import('./pages/BonsDeCommande').then(m => ({ default: m.BonsDeCommande })));
const Cartons = lazy(() => import('./pages/Cartons').then(m => ({ default: m.Cartons })));
const RawMaterials = lazy(() => import('./pages/RawMaterials').then(m => ({ default: m.RawMaterials })));
const TabletProduction = lazy(() => import('./pages/TabletProduction').then(m => ({ default: m.TabletProduction })));
const ScanQR = lazy(() => import('./pages/ScanQR').then(m => ({ default: m.ScanQR })));
const MechanicDashboard = lazy(() => import('./pages/MechanicDashboard').then(m => ({ default: m.MechanicDashboard })));

// SaaS Settings & Super Admin
const CompanyProfile = lazy(() => import('./pages/settings/CompanyProfile').then(m => ({ default: m.CompanyProfile })));
const SubscriptionSettings = lazy(() => import('./pages/settings/SubscriptionSettings').then(m => ({ default: m.SubscriptionSettings })));
const TenantUsers = lazy(() => import('./pages/settings/TenantUsers').then(m => ({ default: m.TenantUsers })));
const SaasPlatformDashboard = lazy(() => import('./pages/admin/SaasPlatformDashboard').then(m => ({ default: m.SaasPlatformDashboard })));

// Application Pages - Resilient Lazy Exports
const Arrets = lazy(() => import('./pages/Arrets'));
const Qualite = lazy(() => import('./pages/Qualite'));
const Maintenance = lazy(() => import('./pages/Maintenance'));
const Historique = lazy(() => import('./pages/Historique'));
const Rapports = lazy(() => import('./pages/Rapports'));
const Utilisateurs = lazy(() => import('./pages/Utilisateurs').then(m => ({ default: m.default || (m as any).Utilisateurs })));
const Parametres = lazy(() => import('./pages/Parametres'));
const CustomerPortal = lazy(() => import('./pages/CustomerPortal'));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-zinc-50">
    <div className="flex flex-col items-center gap-4">
      <span className="material-symbols-outlined animate-spin text-[48px] text-blue-600">refresh</span>
      <p className="text-zinc-500 font-bold animate-pulse text-sm">Chargement de FactoryFlow TN...</p>
    </div>
  </div>
);

function AppContent() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public Marketing Website */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/faq" element={<FaqPage />} />

        {/* SaaS Auth & Onboarding */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/onboarding" element={<OnboardingWizard />} />

        {/* Customer Portal */}
        <Route path="/portal" element={<CustomerPortal />} />

        {/* Admin Application (MES) - Protected */}
        <Route path="/admin" element={<AuthGuard />}>
          <Route element={<RoleGuard allowedRoles={['Administrator', 'Production Manager']} />}>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="production" element={<Production />} />
              <Route path="machines" element={<Machines />} />
              <Route path="arrets" element={<Arrets />} />
              <Route path="qualite" element={<Qualite />} />
              <Route path="maintenance" element={<Maintenance />} />
              <Route path="historique" element={<Historique />} />
              <Route path="rapports" element={<Rapports />} />
              <Route path="articles" element={<Articles />} />
              <Route path="bons-de-commande" element={<BonsDeCommande />} />
              <Route path="ordres-fabrication" element={<ManufacturingOrders />} />
              <Route path="cartons" element={<Cartons />} />
              <Route path="matieres" element={<RawMaterials />} />
              <Route path="company" element={<CompanyProfile />} />
              <Route path="subscription" element={<SubscriptionSettings />} />
              <Route path="tenant-users" element={<TenantUsers />} />
              
              {/* Administrator ONLY Routes */}
              <Route element={<RoleGuard allowedRoles={['Administrator']} />}>
                <Route path="system-history" element={<SystemHistory />} />
                <Route path="utilisateurs" element={<Utilisateurs />} />
                <Route path="saas" element={<SaasPlatformDashboard />} />
                <Route path="parametres" element={<Parametres />} />
              </Route>
            </Route>
          </Route>
        </Route>

        {/* App Alias Route (/app/* aliases to /admin/*) */}
        <Route path="/app" element={<AuthGuard />}>
          <Route element={<RoleGuard allowedRoles={['Administrator', 'Production Manager']} />}>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="production" element={<Production />} />
              <Route path="machines" element={<Machines />} />
              <Route path="arrets" element={<Arrets />} />
              <Route path="qualite" element={<Qualite />} />
              <Route path="maintenance" element={<Maintenance />} />
              <Route path="historique" element={<Historique />} />
              <Route path="rapports" element={<Rapports />} />
              <Route path="articles" element={<Articles />} />
              <Route path="orders" element={<ManufacturingOrders />} />
              <Route path="cartons" element={<Cartons />} />
              <Route path="materials" element={<RawMaterials />} />
              <Route path="settings/company" element={<CompanyProfile />} />
              <Route path="settings/subscription" element={<SubscriptionSettings />} />
              <Route path="settings/users" element={<TenantUsers />} />
              <Route path="settings" element={<Parametres />} />
            </Route>
          </Route>
        </Route>

        {/* Machine Tablet Application */}
        <Route path="/tablet" element={<AuthGuard />}>
          <Route element={<RoleGuard allowedRoles={['Machine Operator', 'Administrator']} />}>
            <Route element={<TabletLayout />}>
              <Route index element={<TabletProduction />} />
            </Route>
          </Route>
        </Route>

        {/* Scanner Application */}
        <Route path="/scanner" element={<AuthGuard />}>
          <Route element={<RoleGuard allowedRoles={['Quality Controller', 'Warehouse Operator', 'Administrator']} />}>
            <Route element={<ScannerLayout />}>
              <Route index element={<ScanQR />} />
            </Route>
          </Route>
        </Route>

        {/* Mechanic Application */}
        <Route path="/mechanic" element={<AuthGuard />}>
          <Route element={<RoleGuard allowedRoles={['Mechanic', 'Administrator']} />}>
            <Route element={<MechanicLayout />}>
              <Route index element={<MechanicDashboard />} />
            </Route>
          </Route>
        </Route>

        {/* Unauthorized Route */}
        <Route path="/unauthorized" element={
          <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 p-4">
            <div className="bg-white p-8 rounded-3xl shadow-sm text-center max-w-md border border-zinc-200">
              <span className="material-symbols-outlined text-[64px] text-red-500 mb-4">gpp_bad</span>
              <h1 className="text-2xl font-black text-zinc-900 mb-2">Accès Refusé</h1>
              <p className="text-zinc-500 mb-6 text-sm font-medium">Vous n'avez pas la permission d'accéder à cette section.</p>
              <a href="/login" className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-colors text-sm">
                <span className="material-symbols-outlined text-[18px]">lock</span>
                Page de Connexion
              </a>
            </div>
          </div>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <AppContent />
    </BrowserRouter>
  );
}
