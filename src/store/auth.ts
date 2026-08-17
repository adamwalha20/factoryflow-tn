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
        return; // Skip supabase auth
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: employee } = await (supabase as any).from('employees')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        set({ user: session.user, employee: employee as unknown as Employee, isLoading: false });
      } else {
        set({ user: null, employee: null, isLoading: false });
      }

      supabase.auth.onAuthStateChange(async (_event, session) => {
        // Only process supabase auth if we aren't in demo mode
        if (localStorage.getItem('demo_user')) return;

        if (session?.user) {
          const { data: employee } = await (supabase as any).from('employees')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          set({ user: session.user, employee: employee as unknown as Employee, isLoading: false });
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
