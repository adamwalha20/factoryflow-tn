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
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        localStorage.removeItem('demo_user');
        await resolveUserProfile(session.user, set);
      } else {
        localStorage.removeItem('demo_user');
        set({ user: null, employee: null, isLoading: false });
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT' || !session?.user) {
          localStorage.removeItem('demo_user');
          localStorage.removeItem('active_org_id');
          set({ user: null, employee: null, isLoading: false });
          return;
        }

        if (session?.user) {
          localStorage.removeItem('demo_user');
          await resolveUserProfile(session.user, set);
        }
      });
    } catch (error) {
      console.error('Auth initialization error', error);
      set({ isLoading: false });
    }
  },
  signOut: async () => {
    localStorage.removeItem('demo_user');
    localStorage.removeItem('active_org_id');
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Signout note', e);
    }
    set({ user: null, employee: null, isLoading: false });
  },
  setTestUser: (employee: Employee) => {
    if (employee.organization_id) {
      localStorage.setItem('active_org_id', employee.organization_id);
    }
    set({ 
      user: { id: employee.id, email: employee.email } as User,
      employee,
      isLoading: false 
    });
  }
}));

async function resolveUserProfile(user: User, set: any) {
  try {
    // 1. Strictly look up employee profile matching this exact authenticated user ID or Email
    let { data: employee } = await (supabase as any)
      .from('employees')
      .select('*')
      .or(`user_id.eq.${user.id},email.eq.${user.email}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 2. If not found in employees, check in users table
    if (!employee) {
      const { data: userRow } = await (supabase as any)
        .from('users')
        .select('*')
        .or(`id.eq.${user.id},email.eq.${user.email}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (userRow && userRow.organization_id) {
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

    // 3. If employee exists and is attached to a factory -> Activate their factory context
    if (employee?.organization_id) {
      localStorage.setItem('active_org_id', employee.organization_id);
      set({
        user,
        employee: employee as Employee,
        isLoading: false
      });
      return;
    }

    // 4. NEW user without an existing factory profile in DB -> Clear any old cached org
    localStorage.removeItem('active_org_id');
    set({
      user,
      employee: null,
      isLoading: false
    });
  } catch (err) {
    console.error('Error resolving user profile:', err);
    set({ user, employee: null, isLoading: false });
  }
}
