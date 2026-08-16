import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type MaintenanceLog = Database['public']['Tables']['maintenance_logs']['Row'];
type Machine = Database['public']['Tables']['machines']['Row'];

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000000';
const getActiveOrgId = () => typeof localStorage !== 'undefined' ? (localStorage.getItem('active_org_id') || DEFAULT_ORG_ID) : DEFAULT_ORG_ID;

export interface MaintenanceRecordWithMachine extends MaintenanceLog {
  machines?: Pick<Machine, 'name'>;
}

interface MaintenanceStore {
  records: MaintenanceRecordWithMachine[];
  loading: boolean;
  error: string | null;
  fetchRecords: () => Promise<void>;
  addRecord: (data: Partial<MaintenanceLog>) => Promise<void>;
  updateRecordStatus: (id: string, status: string) => Promise<void>;
}

export const useMaintenanceStore = create<MaintenanceStore>((set, get) => ({
  records: [],
  loading: false,
  error: null,

  fetchRecords: async () => {
    set({ loading: true, error: null });
    try {
      const orgId = getActiveOrgId();
      const { data, error } = await (supabase as any)
        .from('maintenance_logs')
        .select(`
          *,
          machines (
            name
          )
        `)
        .eq('organization_id', orgId)
        .order('scheduled_for', { ascending: false });
        
      if (error) throw error;
      
      set({ records: data as any || [] });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  addRecord: async (data: Partial<MaintenanceLog>) => {
    try {
      const orgId = getActiveOrgId();
      const { data: newRecord, error } = await (supabase as any)
        .from('maintenance_logs')
        .insert([{
          ...data,
          organization_id: orgId,
          status: data.status || 'Ouverte'
        } as any])
        .select(`
          *,
          machines (
            name
          )
        `)
        .single();

      if (error) throw error;

      set(state => ({
        records: [newRecord as any, ...state.records]
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  updateRecordStatus: async (id: string, status: string) => {
    try {
      const { error } = await (supabase as any)
        .from('maintenance_logs')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        records: state.records.map(r => r.id === id ? { ...r, status } : r)
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  }
}));
