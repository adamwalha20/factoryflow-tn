import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type QualityInspection = Database['public']['Tables']['quality_inspections']['Row'];
const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000000';
const getActiveOrgId = () => typeof localStorage !== 'undefined' ? (localStorage.getItem('active_org_id') || DEFAULT_ORG_ID) : DEFAULT_ORG_ID;

interface QualityStore {
  inspections: QualityInspection[];
  loading: boolean;
  error: string | null;
  fetchInspections: () => Promise<void>;
  addInspection: (data: Partial<QualityInspection>) => Promise<void>;
}

export const useQualityStore = create<QualityStore>((set, get) => ({
  inspections: [],
  loading: false,
  error: null,

  fetchInspections: async () => {
    set({ loading: true, error: null });
    try {
      const orgId = getActiveOrgId();
      const { data, error } = await (supabase as any)
        .from('quality_inspections')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      set({ inspections: data || [] });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  addInspection: async (data: any) => {
    try {
      const orgId = getActiveOrgId();
      const { data: newInspection, error } = await (supabase as any)
        .from('quality_inspections')
        .insert([{
          ...data,
          organization_id: orgId
        }])
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        inspections: [newInspection, ...state.inspections]
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  }
}));
