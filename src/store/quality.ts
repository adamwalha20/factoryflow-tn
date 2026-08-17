import { create } from 'zustand';
import { supabase } from '../lib/supabase';

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000000';
const getActiveOrgId = () => typeof localStorage !== 'undefined' ? (localStorage.getItem('active_org_id') || DEFAULT_ORG_ID) : DEFAULT_ORG_ID;

interface QualityStore {
  inspections: any[];
  loading: boolean;
  error: string | null;
  fetchInspections: () => Promise<void>;
  addInspection: (data: any) => Promise<void>;
}

export const useQualityStore = create<QualityStore>((set, get) => ({
  inspections: [],
  loading: false,
  error: null,

  fetchInspections: async () => {
    set({ loading: true, error: null });
    try {
      const orgId = getActiveOrgId();
      
      // Try quality_controls first
      const { data: qcData, error: qcError } = await (supabase as any)
        .from('quality_controls')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (!qcError && qcData) {
        const normalized = qcData.map((d: any) => ({
          ...d,
          article_id: d.article_id || d.product_id,
          validated_quantity: d.validated_quantity || d.validated_qty
        }));
        set({ inspections: normalized });
        return;
      }

      // Fallback to quality_inspections
      const { data: qiData, error: qiError } = await (supabase as any)
        .from('quality_inspections')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
        
      if (qiError) throw qiError;
      
      set({ inspections: qiData || [] });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  addInspection: async (data: any) => {
    try {
      const orgId = getActiveOrgId();
      const payload = {
        organization_id: orgId,
        product_id: data.article_id || data.product_id,
        lot_number: data.lot_number,
        result: data.result || 'conforme',
        defect_description: data.defect_description || null,
        machine_id: data.machine_id || null,
        validated_qty: data.validated_quantity !== undefined ? data.validated_quantity : data.validated_qty
      };

      // Try quality_controls
      const { data: newQc, error: qcError } = await (supabase as any)
        .from('quality_controls')
        .insert([payload])
        .select()
        .single();

      if (!qcError && newQc) {
        const normalized = {
          ...newQc,
          article_id: newQc.article_id || newQc.product_id,
          validated_quantity: newQc.validated_quantity || newQc.validated_qty
        };
        set(state => ({
          inspections: [normalized, ...state.inspections]
        }));
        return;
      }

      // Fallback to quality_inspections
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
