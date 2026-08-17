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

    // 3. If first-time OAuth login and no profile exists at all, auto-provision factory & profile
    if (!employee) {
      const metadata = user.user_metadata || {};
      const fullName = metadata.full_name || metadata.name || user.email?.split('@')[0] || 'Utilisateur';
      const firstName = metadata.given_name || fullName.split(' ')[0] || 'Utilisateur';
      const lastName = metadata.family_name || fullName.split(' ').slice(1).join(' ') || '';

      // Check if active org exists or create a default one
      let orgId = localStorage.getItem('active_org_id');
      if (!orgId) {
        const { data: existingOrg } = await (supabase as any)
          .from('organizations')
          .select('id')
          .limit(1)
          .maybeSingle();

        if (existingOrg) {
          orgId = existingOrg.id;
        } else {
          orgId = crypto.randomUUID();
          await (supabase as any).from('organizations').insert([{
            id: orgId,
            name: `${firstName}'s Factory`,
            slug: `factory-${Math.floor(Math.random() * 10000)}`
          }]);
        }
      }

      const newEmployee = {
        id: crypto.randomUUID(),
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        email: user.email,
        role: 'Administrator' as const,
        organization_id: orgId
      };

      await (supabase as any).from('employees').insert([newEmployee]);
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
