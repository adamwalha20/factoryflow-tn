import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  organization_id?: string;
  role: 'Administrator' | 'Production Manager' | 'Machine Operator' | 'Quality Controller' | 'Warehouse Operator' | 'Mechanic' | 'Developer' | 'SuperAdmin';
  pin_code?: string;
}

interface AuthState {
  user: User | null;
  employee: Employee | null;
  isLoading: boolean;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  setTestUser: (employee: Employee) => void; // for easy development testing
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  employee: null,
  isLoading: true,
  initialize: async () => {
    try {
      // Check for persisted demo user first
      const demoUser = localStorage.getItem('demo_user');
      if (demoUser) {
        const employee = JSON.parse(demoUser) as Employee;
        set({ 
          user: { id: employee.id } as User, 
          employee, 
          isLoading: false 
        });
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await resolveUserProfile(session.user, set);
      } else {
        set({ user: null, employee: null, isLoading: false });
      }

      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (localStorage.getItem('demo_user')) return;

        if (session?.user) {
          await resolveUserProfile(session.user, set);
        } else {
          set({ user: null, employee: null, isLoading: false });
        }
      });
    } catch (error) {
      console.error('Auth initialization error', error);
      set({ isLoading: false });
    }
  },
  signOut: async () => {
    localStorage.removeItem('demo_user');
    await supabase.auth.signOut();
    set({ user: null, employee: null });
  },
  setTestUser: (employee: Employee) => {
    // For demo/development without actual supabase auth backend populated
    localStorage.setItem('demo_user', JSON.stringify(employee));
    set({ 
      user: { id: employee.id } as User,
      employee,
      isLoading: false 
    });
  }
}));

async function resolveUserProfile(user: User, set: any) {
  try {
    // 1. Check in employees table by user_id or email
    let { data: employee } = await (supabase as any)
      .from('employees')
      .select('*')
      .or(`user_id.eq.${user.id},email.eq.${user.email}`)
      .maybeSingle();

    // 2. If not found in employees, check in users table
    if (!employee) {
      const { data: userRow } = await (supabase as any)
        .from('users')
        .select('*')
        .or(`id.eq.${user.id},email.eq.${user.email}`)
        .maybeSingle();

      if (userRow) {
        employee = {
          id: userRow.id,
          first_name: userRow.name?.split(' ')[0] || 'Admin',
          last_name: userRow.name?.split(' ').slice(1).join(' ') || '',
          email: userRow.email,
          role: userRow.role === 'admin' ? 'Administrator' : (userRow.role || 'Administrator'),
          organization_id: userRow.organization_id
        };
      }
    }

    // 3. If new user (no existing profile in database for this email/id)
    if (!employee) {
      const metadata = user.user_metadata || {};
      const fullName = metadata.full_name || metadata.name || user.email?.split('@')[0] || 'Nouvel Utilisateur';
      const firstName = metadata.given_name || fullName.split(' ')[0] || 'Utilisateur';
      const lastName = metadata.family_name || fullName.split(' ').slice(1).join(' ') || '';

      // ALWAYS create a brand new isolated organization for this new user
      const newOrgId = crypto.randomUUID();
      const orgSlug = `factory-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;

      await (supabase as any).from('organizations').insert([{
        id: newOrgId,
        name: `${firstName} - Usine`,
        slug: orgSlug,
        legal_name: `${firstName} - Usine`,
        city: 'Tunis',
        country: 'Tunisia',
        onboarding_completed: false,
        onboarding_step: 1
      }]);

      // Create subscription trial
      await (supabase as any).from('subscriptions').insert([{
        organization_id: newOrgId,
        plan_id: '2',
        status: 'TRIALING',
        trial_start: new Date().toISOString(),
        trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      }]);

      const newEmployee = {
        id: crypto.randomUUID(),
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        email: user.email,
        role: 'Administrator' as const,
        organization_id: newOrgId
      };

      await (supabase as any).from('employees').insert([newEmployee]);
      await (supabase as any).from('users').insert([{
        id: newEmployee.id,
        organization_id: newOrgId,
        name: `${firstName} ${lastName}`.trim(),
        email: user.email,
        role: 'Administrator',
        status: 'Actif'
      }]);

      employee = newEmployee;
    }

    if (employee?.organization_id) {
      localStorage.setItem('active_org_id', employee.organization_id);
    }

    set({
      user,
      employee: employee as Employee,
      isLoading: false
    });
  } catch (err) {
    console.error('Error resolving user profile:', err);
    set({ user, employee: null, isLoading: false });
  }
}
