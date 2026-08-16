import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface RawMaterial {
  id: string;
  reference: string;
  designation: string;
  category: string;
  quantity_in_stock: number;
  min_stock?: number;
  unit: string;
  supplier?: string;
  lot_number?: string;
  created_at?: string;
}

export interface InventoryTransaction {
  id: string;
  raw_material_id: string;
  transaction_type: 'RECEIPT' | 'CONSUMPTION' | 'ADJUSTMENT' | 'RETURN' | 'WASTE' | 'TRANSFER';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  notes?: string;
  created_at: string;
  raw_materials?: {
    reference: string;
    designation: string;
  };
}

interface RawMaterialsStore {
  materials: RawMaterial[];
  transactions: InventoryTransaction[];
  consumptions: any[];
  loading: boolean;
  error: string | null;
  fetchMaterials: () => Promise<void>;
  fetchTransactions: (materialId?: string) => Promise<void>;
  addMaterial: (data: Partial<RawMaterial>) => Promise<void>;
  updateMaterial: (id: string, data: Partial<RawMaterial>) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  recordTransaction: (params: {
    raw_material_id: string;
    transaction_type: 'RECEIPT' | 'CONSUMPTION' | 'ADJUSTMENT' | 'RETURN' | 'WASTE' | 'TRANSFER';
    quantity: number;
    notes?: string;
  }) => Promise<void>;
}

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000000';
const getActiveOrgId = () => typeof localStorage !== 'undefined' ? (localStorage.getItem('active_org_id') || DEFAULT_ORG_ID) : DEFAULT_ORG_ID;

export const useRawMaterialsStore = create<RawMaterialsStore>((set, get) => ({
  materials: [],
  transactions: [],
  consumptions: [],
  loading: false,
  error: null,

  fetchMaterials: async () => {
    set({ loading: true, error: null });
    try {
      const orgId = getActiveOrgId();
      const [matRes, transRes, consRes] = await Promise.all([
        (supabase as any).from('raw_materials').select('*').eq('organization_id', orgId).order('reference'),
        (supabase as any)
          .from('inventory_transactions')
          .select(`
            *,
            raw_materials (
              reference,
              designation
            )
          `)
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(100),
        (supabase as any)
          .from('material_consumptions')
          .select(`
            id,
            yield_percentage,
            waste_percentage,
            consumed_quantity,
            created_at,
            raw_materials (
              reference,
              designation
            )
          `)
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(50)
      ]);

      if (matRes.error) throw matRes.error;

      set({
        materials: matRes.data || [],
        transactions: transRes.data || [],
        consumptions: consRes.data || []
      });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchTransactions: async (materialId) => {
    try {
      const orgId = getActiveOrgId();
      let query = (supabase as any)
        .from('inventory_transactions')
        .select(`
          *,
          raw_materials (
            reference,
            designation
          )
        `)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (materialId) {
        query = query.eq('raw_material_id', materialId);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      set({ transactions: data || [] });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  addMaterial: async (data) => {
    try {
      const orgId = getActiveOrgId();
      const { data: newMaterial, error } = await (supabase as any)
        .from('raw_materials')
        .insert([{
          organization_id: orgId,
          ...data,
          quantity_in_stock: Number(data.quantity_in_stock) || 0,
          min_stock: Number(data.min_stock) || 0
        }])
        .select()
        .single();

      if (error) throw error;

      // Also record initial transaction if initial stock > 0
      if (Number(data.quantity_in_stock) > 0) {
        await (supabase as any).from('inventory_transactions').insert([{
          organization_id: orgId,
          raw_material_id: newMaterial.id,
          transaction_type: 'RECEIPT',
          quantity: Number(data.quantity_in_stock),
          previous_stock: 0,
          new_stock: Number(data.quantity_in_stock),
          notes: 'Stock initial à la création'
        }]);
      }

      set((state) => ({ materials: [newMaterial, ...state.materials] }));
      get().fetchMaterials();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  updateMaterial: async (id, data) => {
    try {
      const { error } = await (supabase as any)
        .from('raw_materials')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      set((state) => ({
        materials: state.materials.map((m) => (m.id === id ? { ...m, ...data } : m)),
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  deleteMaterial: async (id) => {
    try {
      await (supabase as any).from('material_consumptions').delete().eq('raw_material_id', id);
      await (supabase as any).from('inventory_transactions').delete().eq('raw_material_id', id);

      const { error } = await (supabase as any)
        .from('raw_materials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      set((state) => ({
        materials: state.materials.filter((m) => m.id !== id),
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  recordTransaction: async ({ raw_material_id, transaction_type, quantity, notes }) => {
    try {
      const material = get().materials.find(m => m.id === raw_material_id);
      if (!material) throw new Error('Matière première introuvable');

      const previousStock = Number(material.quantity_in_stock) || 0;
      let newStock = previousStock;

      if (transaction_type === 'RECEIPT' || transaction_type === 'RETURN') {
        newStock += Number(quantity);
      } else if (transaction_type === 'CONSUMPTION' || transaction_type === 'WASTE') {
        newStock = Math.max(0, previousStock - Number(quantity));
      } else if (transaction_type === 'ADJUSTMENT') {
        newStock = Number(quantity);
      }

      // 1. Insert transaction record
      const orgId = getActiveOrgId();
      const { data: newTrans, error: transErr } = await (supabase as any)
        .from('inventory_transactions')
        .insert([{
          organization_id: orgId,
          raw_material_id,
          transaction_type,
          quantity: Number(quantity),
          previous_stock: previousStock,
          new_stock: newStock,
          notes: notes || ''
        }])
        .select()
        .single();

      if (transErr) throw transErr;

      // 2. Update stock in raw_materials
      const { error: updateErr } = await (supabase as any)
        .from('raw_materials')
        .update({ quantity_in_stock: newStock })
        .eq('id', raw_material_id);

      if (updateErr) throw updateErr;

      // 3. Refresh store state
      set(state => ({
        materials: state.materials.map(m => m.id === raw_material_id ? { ...m, quantity_in_stock: newStock } : m),
        transactions: [newTrans, ...state.transactions]
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  }
}));
