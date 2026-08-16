import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type User = Database['public']['Tables']['users']['Row'];
const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000000';
const getActiveOrgId = () => typeof localStorage !== 'undefined' ? (localStorage.getItem('active_org_id') || DEFAULT_ORG_ID) : DEFAULT_ORG_ID;

interface UsersStore {
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  updateUserStatus: (id: string, status: string) => Promise<void>;
  addOperator: (data: Partial<User>) => Promise<void>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

export const useUsersStore = create<UsersStore>((set, get) => ({
  users: [],
  loading: false,
  error: null,

  fetchUsers: async () => {
    set((state) => ({ 
      loading: state.users.length === 0, 
      error: null 
    }));
    try {
      const orgId = getActiveOrgId();
      const [{ data: usersData, error: usersErr }, { data: employeesData }] = await Promise.all([
        (supabase as any).from('users').select('*').eq('organization_id', orgId).order('name'),
        (supabase as any).from('employees').select('*').eq('organization_id', orgId).order('first_name')
      ]);
        
      if (usersErr) throw usersErr;
      
      const userList = [...(usersData || [])];

      // Merge in employees if they do not yet have a matching user record
      if (employeesData && employeesData.length > 0) {
        for (const emp of employeesData) {
          const alreadyInUsers = userList.some(
            u => u.id === emp.id || u.id === emp.user_id || (u.email && emp.email && u.email.toLowerCase() === emp.email.toLowerCase())
          );
          if (!alreadyInUsers) {
            userList.push({
              id: emp.id,
              organization_id: emp.organization_id,
              name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Opérateur',
              email: emp.email || `${(emp.first_name || 'op').toLowerCase().replace(/\s+/g, '')}@atelier.tn`,
              role: emp.role || 'Machine Operator',
              status: emp.is_active ? 'Actif' : 'Inactif',
              created_at: emp.created_at || new Date().toISOString()
            } as any);
          }
        }
      }
      
      set({ users: userList });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  updateUserStatus: async (id: string, status: string) => {
    try {
      const { error } = await (supabase as any)
        .from('users')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        users: state.users.map(u => u.id === id ? { ...u, status } : u)
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  addOperator: async (data: Partial<User>) => {
    try {
      const orgId = getActiveOrgId();
      const insertPayload: any = {
        name: data.name,
        email: data.email,
        role: data.role || 'Machine Operator',
        phone: (data as any).phone || null,
        password: data.password || '123456',
        pin_code: (data as any).pin_code || '1234',
        status: data.status || 'Actif',
        organization_id: orgId
      };

      const { data: newUser, error } = await (supabase as any)
        .from('users')
        .insert([insertPayload])
        .select()
        .single();
      
      if (error) throw error;

      // Also create matching employee record for tablet & scanner PIN access
      const nameParts = (data.name || '').trim().split(' ');
      const firstName = nameParts[0] || 'Opérateur';
      const lastName = nameParts.slice(1).join(' ') || '';

      await (supabase as any).from('employees').insert([{
        user_id: newUser.id,
        first_name: firstName,
        last_name: lastName,
        email: data.email || null,
        role: data.role || 'Machine Operator',
        pin_code: (data as any).pin_code || '1234',
        is_active: true,
        organization_id: orgId
      }]);
      
      set(state => ({ users: [newUser, ...state.users] }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  updateUser: async (id: string, data: Partial<User>) => {
    try {
      const { error } = await (supabase as any)
        .from('users')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      // If name, email, role or pin_code updated, sync to matching employee
      if (data.name || data.email || data.role || (data as any).pin_code) {
        const updateEmployeePayload: any = {};
        if (data.name) {
          const parts = data.name.trim().split(' ');
          updateEmployeePayload.first_name = parts[0];
          updateEmployeePayload.last_name = parts.slice(1).join(' ');
        }
        if (data.email) updateEmployeePayload.email = data.email;
        if (data.role) updateEmployeePayload.role = data.role;
        if ((data as any).pin_code) updateEmployeePayload.pin_code = (data as any).pin_code;

        await (supabase as any)
          .from('employees')
          .update(updateEmployeePayload)
          .eq('user_id', id);
      }

      set(state => ({
        users: state.users.map(u => u.id === id ? { ...u, ...data } : u)
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  deleteUser: async (id: string) => {
    try {
      // 1. Delete matching employee record first
      await (supabase as any).from('employees').delete().eq('user_id', id);

      // 2. Delete user from users table
      const { error } = await (supabase as any)
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        users: state.users.filter(u => u.id !== id)
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  }
}));
