import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Organization, Subscription, SubscriptionPlan, OrganizationMember, Factory } from '../types/saas';

interface TenantState {
  currentOrg: Organization | null;
  userMemberships: OrganizationMember[];
  currentSubscription: Subscription | null;
  plans: SubscriptionPlan[];
  factories: Factory[];
  isLoading: boolean;
  
  // Resource usage counters for the active tenant
  usage: {
    machinesCount: number;
    workersCount: number;
    usersCount: number;
    factoriesCount: number;
  };

  // Actions
  fetchPlans: () => Promise<SubscriptionPlan[]>;
  fetchTenantData: (orgId?: string) => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
  updateCurrentOrg: (updates: Partial<Organization>) => Promise<void>;
  
  // Plan limits validation helpers
  canCreateMachine: () => { allowed: boolean; max: number; current: number; message?: string };
  canCreateWorker: () => { allowed: boolean; max: number; current: number; message?: string };
  canCreateUser: () => { allowed: boolean; max: number; current: number; message?: string };
  canCreateFactory: () => { allowed: boolean; max: number; current: number; message?: string };
}

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000000';

export const useTenantStore = create<TenantState>((set, get) => ({
  currentOrg: null,
  userMemberships: [],
  currentSubscription: null,
  plans: [],
  factories: [],
  isLoading: false,
  usage: {
    machinesCount: 0,
    workersCount: 0,
    usersCount: 0,
    factoriesCount: 0
  },

  fetchPlans: async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      const plans = data as SubscriptionPlan[];
      set({ plans });
      return plans;
    } catch (err) {
      console.error('Failed to fetch subscription plans', err);
      return [];
    }
  },

  fetchTenantData: async (targetOrgId?: string) => {
    set({ isLoading: true });
    try {
      // 1. Fetch plans if not already loaded
      if (get().plans.length === 0) {
        await get().fetchPlans();
      }

      // 2. Resolve active org ID
      const savedOrgId = localStorage.getItem('active_org_id');
      const orgId = targetOrgId || savedOrgId || DEFAULT_ORG_ID;

      // 3. Fetch Organization
      const { data: orgData } = await (supabase as any)
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();

      // 4. Fetch Active Subscription
      const { data: subData } = await (supabase as any)
        .from('subscriptions')
        .select('*, plan:subscription_plans(*)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // 5. Fetch Factories
      const { data: factoriesData } = await (supabase as any)
        .from('factories')
        .select('*')
        .eq('organization_id', orgId);

      // 6. Fetch Usage Counters
      const [
        { count: machinesCount },
        { count: workersCount },
        { count: usersCount },
        { count: factoriesCount }
      ] = await Promise.all([
        (supabase as any).from('machines').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
        (supabase as any).from('employees').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
        (supabase as any).from('users').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
        (supabase as any).from('factories').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
      ]);

      localStorage.setItem('active_org_id', orgId);

      set({
        currentOrg: orgData || {
          id: DEFAULT_ORG_ID,
          name: 'Adpro Packaging & Tapes',
          slug: 'adpro',
          country: 'Tunisia',
          timezone: 'Africa/Tunis',
          default_language: 'fr',
          onboarding_completed: true,
          onboarding_step: 5,
          created_at: new Date().toISOString()
        },
        currentSubscription: subData || null,
        factories: factoriesData || [],
        usage: {
          machinesCount: machinesCount || 0,
          workersCount: workersCount || 0,
          usersCount: usersCount || 0,
          factoriesCount: factoriesCount || 0
        },
        isLoading: false
      });
    } catch (err) {
      console.error('Failed to fetch tenant data', err);
      set({ isLoading: false });
    }
  },

  switchOrganization: async (orgId: string) => {
    localStorage.setItem('active_org_id', orgId);
    await get().fetchTenantData(orgId);
  },

  updateCurrentOrg: async (updates: Partial<Organization>) => {
    const { currentOrg } = get();
    if (!currentOrg) return;

    try {
      const { data, error } = await (supabase as any)
        .from('organizations')
        .update(updates)
        .eq('id', currentOrg.id)
        .select()
        .single();

      if (error) throw error;
      set({ currentOrg: data });
    } catch (err) {
      console.error('Failed to update organization', err);
      throw err;
    }
  },

  canCreateMachine: () => {
    const { currentSubscription, usage } = get();
    const limits = currentSubscription?.plan?.limits || { max_machines: 10 };
    const max = limits.max_machines ?? 10;
    const current = usage.machinesCount;
    const allowed = current < max;
    return {
      allowed,
      max,
      current,
      message: !allowed ? `Limite atteinte (${current}/${max} machines). Mettez à niveau votre forfait pour ajouter plus de machines.` : undefined
    };
  },

  canCreateWorker: () => {
    const { currentSubscription, usage } = get();
    const limits = currentSubscription?.plan?.limits || { max_workers: 50 };
    const max = limits.max_workers ?? 50;
    const current = usage.workersCount;
    const allowed = current < max;
    return {
      allowed,
      max,
      current,
      message: !allowed ? `Limite atteinte (${current}/${max} ouvriers). Mettez à niveau votre forfait pour ajouter plus d'ouvriers.` : undefined
    };
  },

  canCreateUser: () => {
    const { currentSubscription, usage } = get();
    const limits = currentSubscription?.plan?.limits || { max_users: 10 };
    const max = limits.max_users ?? 10;
    const current = usage.usersCount;
    const allowed = current < max;
    return {
      allowed,
      max,
      current,
      message: !allowed ? `Limite atteinte (${current}/${max} utilisateurs). Mettez à niveau votre forfait pour inviter plus de membres.` : undefined
    };
  },

  canCreateFactory: () => {
    const { currentSubscription, usage } = get();
    const limits = currentSubscription?.plan?.limits || { max_factories: 1 };
    const max = limits.max_factories ?? 1;
    const current = usage.factoriesCount;
    const allowed = current < max;
    return {
      allowed,
      max,
      current,
      message: !allowed ? `Limite atteinte (${current}/${max} usines). Le forfait Entreprise est requis pour le multi-sites.` : undefined
    };
  }
}));
