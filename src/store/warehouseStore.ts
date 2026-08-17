import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface WarehouseLocation {
  id: string;
  organization_id?: string;
  name: string;
  code: string;
  zone?: string;
  is_active?: boolean;
  created_at?: string;
}

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000000';
const getActiveOrgId = () => 
  typeof localStorage !== 'undefined' 
    ? (localStorage.getItem('active_org_id') || DEFAULT_ORG_ID) 
    : DEFAULT_ORG_ID;

const getStorageKey = (orgId: string) => `factoryflow_warehouses_${orgId}`;

const DEFAULT_LOCATIONS: WarehouseLocation[] = [
  { id: 'loc-1', name: 'Entrepôt Principal', code: 'WH-MAIN', zone: 'Magasin Central', is_active: true },
  { id: 'loc-2', name: 'Zone d\'Expédition', code: 'EXP-01', zone: 'Quai Logistique', is_active: true },
  { id: 'loc-3', name: 'Magasin Produits Finis', code: 'PF-MAG', zone: 'Zone Stockage A', is_active: true },
  { id: 'loc-4', name: 'Quai de Chargement', code: 'QUAI-B', zone: 'Zone Extérieure', is_active: true },
];

interface WarehouseStore {
  locations: WarehouseLocation[];
  loading: boolean;
  error: string | null;
  fetchLocations: () => Promise<void>;
  addLocation: (data: Omit<WarehouseLocation, 'id' | 'organization_id' | 'created_at'>) => Promise<WarehouseLocation>;
  updateLocation: (id: string, data: Partial<WarehouseLocation>) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;
}

export const useWarehouseStore = create<WarehouseStore>((set, get) => ({
  locations: [],
  loading: false,
  error: null,

  fetchLocations: async () => {
    set({ loading: true, error: null });
    const orgId = getActiveOrgId();

    try {
      // 1. Try to fetch from Supabase
      const { data, error } = await (supabase as any)
        .from('warehouse_locations')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        set({ locations: data, loading: false });
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(getStorageKey(orgId), JSON.stringify(data));
        }
        return;
      }
    } catch {
      // Ignore network / schema errors and use local storage fallback
    }

    // 2. Fallback to org-scoped localStorage
    try {
      if (typeof localStorage !== 'undefined') {
        const cached = localStorage.getItem(getStorageKey(orgId));
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            set({ locations: parsed, loading: false });
            return;
          }
        }

        // Initialize with default template for this organization
        const initial = DEFAULT_LOCATIONS.map(l => ({ ...l, organization_id: orgId }));
        localStorage.setItem(getStorageKey(orgId), JSON.stringify(initial));
        set({ locations: initial, loading: false });
        return;
      }
    } catch (e: any) {
      set({ error: e.message });
    }

    set({ locations: DEFAULT_LOCATIONS, loading: false });
  },

  addLocation: async (data) => {
    const orgId = getActiveOrgId();
    const newId = 'loc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    const newLocation: WarehouseLocation = {
      id: newId,
      organization_id: orgId,
      name: data.name.trim(),
      code: (data.code || data.name.substring(0, 4).toUpperCase()).trim(),
      zone: data.zone?.trim() || 'Zone Générale',
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: new Date().toISOString()
    };

    // Try Supabase insert
    try {
      const { data: dbItem, error } = await (supabase as any)
        .from('warehouse_locations')
        .insert([newLocation])
        .select()
        .single();
      
      if (!error && dbItem) {
        newLocation.id = dbItem.id;
      }
    } catch {
      // Saved in local cache
    }

    const updated = [...get().locations, newLocation];
    set({ locations: updated });
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(getStorageKey(orgId), JSON.stringify(updated));
    }

    return newLocation;
  },

  updateLocation: async (id, data) => {
    const orgId = getActiveOrgId();
    const updated = get().locations.map(l => l.id === id ? { ...l, ...data } : l);
    set({ locations: updated });

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(getStorageKey(orgId), JSON.stringify(updated));
    }

    try {
      await (supabase as any)
        .from('warehouse_locations')
        .update(data)
        .eq('id', id);
    } catch {}
  },

  deleteLocation: async (id) => {
    const orgId = getActiveOrgId();
    const updated = get().locations.filter(l => l.id !== id);
    set({ locations: updated });

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(getStorageKey(orgId), JSON.stringify(updated));
    }

    try {
      await (supabase as any)
        .from('warehouse_locations')
        .delete()
        .eq('id', id);
    } catch {}
  }
}));
