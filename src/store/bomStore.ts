import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface BomItem {
  id: string;
  article_id: string;
  raw_material_id: string;
  quantity_per_unit: number; // Ratio required per finished unit
  waste_factor_percent: number; // Estimated technical scrap (e.g. 2%)
  notes?: string;
  raw_materials?: {
    id: string;
    reference: string;
    designation: string;
    category: string;
    unit: string;
  };
}

interface BomStore {
  bomItems: Record<string, BomItem[]>; // Keyed by article_id
  loading: boolean;
  fetchBomForArticle: (articleId: string) => Promise<BomItem[]>;
  saveBomItems: (articleId: string, items: Omit<BomItem, 'id'>[]) => Promise<void>;
  calculateRequirements: (articleId: string, orderQuantity: number) => { rawMaterialId: string; reference: string; requiredQuantity: number; unit: string }[];
}

const STORAGE_KEY = 'factoryflow_boms';

export const useBomStore = create<BomStore>((set, get) => {
  // Load saved local formulas
  const loadLocalBoms = (): Record<string, BomItem[]> => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  return {
    bomItems: loadLocalBoms(),
    loading: false,

    fetchBomForArticle: async (articleId: string) => {
      set({ loading: true });
      const current = get().bomItems[articleId] || [];
      set({ loading: false });
      return current;
    },

    saveBomItems: async (articleId: string, items: Omit<BomItem, 'id'>[]) => {
      const withIds: BomItem[] = items.map((item, idx) => ({
        ...item,
        id: `bom-${articleId}-${idx}-${Date.now()}`
      }));

      const next = {
        ...get().bomItems,
        [articleId]: withIds
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      set({ bomItems: next });
    },

    calculateRequirements: (articleId: string, orderQuantity: number) => {
      const items = get().bomItems[articleId] || [];
      return items.map(item => {
        const factor = 1 + ((item.waste_factor_percent || 0) / 100);
        const required = Math.round(orderQuantity * (item.quantity_per_unit || 1) * factor * 100) / 100;
        return {
          rawMaterialId: item.raw_material_id,
          reference: item.raw_materials?.reference || 'Matière',
          requiredQuantity: required,
          unit: item.raw_materials?.unit || 'RLX'
        };
      });
    }
  };
});
