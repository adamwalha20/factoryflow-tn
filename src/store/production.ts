import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type ProductionSession = Database['public']['Tables']['production_sessions']['Row'];
type Machine = Database['public']['Tables']['machines']['Row'];
type Article = Database['public']['Tables']['articles']['Row'];
type Operator = Database['public']['Tables']['users']['Row'];

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000000';

interface ProductionStore {
  sessions: ProductionSession[];
  machines: Machine[];
  articles: Article[];
  operators: Operator[];
  loading: boolean;
  error: string | null;
  fetchInitialData: () => Promise<void>;
  startSession: (data: Partial<ProductionSession>) => Promise<any>;
  updateSessionStatus: (id: string, status: string, endTime?: string) => Promise<void>;
  addMachine: (data: Partial<Machine>) => Promise<void>;
  updateMachine: (id: string, data: Partial<Machine>) => Promise<void>;
  deleteMachine: (id: string) => Promise<void>;
  setupRealtime: () => void;
}

let isRealtimeSubscribed = false;

export const useProductionStore = create<ProductionStore>((set, get) => ({
  sessions: [],
  machines: [],
  articles: [],
  operators: [],
  loading: false,
  error: null,

  fetchInitialData: async () => {
    set((state) => ({ 
      loading: state.machines.length === 0 && state.sessions.length === 0, 
      error: null 
    }));
    try {
      const orgId = typeof localStorage !== 'undefined' ? (localStorage.getItem('active_org_id') || DEFAULT_ORG_ID) : DEFAULT_ORG_ID;

      // 1. Fetch Machines for this tenant
      const machinesRes = await (supabase as any).from('machines').select('*').eq('organization_id', orgId).order('name');
      const machines = machinesRes.data || [];

      // 2. Fetch Sessions for this tenant
      const sessionsRes = await (supabase as any).from('production_sessions').select('*').eq('organization_id', orgId).order('created_at', { ascending: false });
      const sessions = sessionsRes.data || [];

      // 3. Fetch Articles with pagination for this tenant
      let allArticles: any[] = [];
      let hasMore = true;
      let from = 0;
      let to = 999;
      while (hasMore) {
        const { data, error } = await (supabase as any)
          .from('articles')
          .select('*')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .order('id', { ascending: true })
          .range(from, to);
        if (error) throw error;
        if (data && data.length > 0) {
          allArticles = [...allArticles, ...data];
          from += 1000;
          to += 1000;
        }
        if (!data || data.length < 1000) {
          hasMore = false;
        }
      }

      // 4. Fetch Operators & attach PIN codes
      const [{ data: usersData }, { data: employeesData }] = await Promise.all([
        (supabase as any).from('users').select('*').eq('organization_id', orgId).order('name'),
        (supabase as any).from('employees').select('*').eq('organization_id', orgId).order('first_name')
      ]);

      const empMap = new Map<string, any>();
      (employeesData || []).forEach((e: any) => {
        if (e.id) empMap.set(e.id, e);
        if (e.user_id) empMap.set(e.user_id, e);
        if (e.email) empMap.set(e.email.toLowerCase(), e);
      });

      const operators: any[] = (usersData || []).map((u: any) => {
        const matchingEmp = empMap.get(u.id) || (u.email ? empMap.get(u.email.toLowerCase()) : null);
        return {
          ...u,
          pin_code: matchingEmp?.pin_code || (u as any).pin_code || '1111'
        };
      });

      // Append any employees who might not have a user entry yet
      (employeesData || []).forEach((emp: any) => {
        const exists = operators.some(o => o.id === emp.id || o.id === emp.user_id || (o.email && emp.email && o.email.toLowerCase() === emp.email.toLowerCase()));
        if (!exists) {
          operators.push({
            id: emp.id,
            name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Opérateur',
            email: emp.email,
            role: emp.role || 'Machine Operator',
            pin_code: emp.pin_code || '1111',
            organization_id: orgId
          });
        }
      });

      // Filter to ONLY include shopfloor operators (excluding admins, owners, managers)
      const isShopfloorOperator = (role: string) => {
        const r = (role || '').toLowerCase();
        const isManagerOrAdmin = r.includes('admin') || r.includes('owner') || r.includes('manager') || r.includes('directeur');
        return !isManagerOrAdmin;
      };

      const filteredOperators = operators.filter(o => isShopfloorOperator(o.role || ''));

      set({
        machines,
        sessions,
        articles: allArticles,
        operators: filteredOperators,
        loading: false,
        error: null
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  startSession: async (data: Partial<ProductionSession> & { operator_ids?: string[] }) => {
    try {
      const orgId = typeof localStorage !== 'undefined' ? (localStorage.getItem('active_org_id') || DEFAULT_ORG_ID) : DEFAULT_ORG_ID;
      const operatorIds = (data as any).operator_ids && (data as any).operator_ids.length > 0 
        ? (data as any).operator_ids 
        : (data.operator_id ? [data.operator_id] : []);

      const { data: newSession, error } = await (supabase as any)
        .from('production_sessions')
        .insert([{
          organization_id: orgId,
          machine_id: data.machine_id,
          article_id: data.article_id,
          operator_id: data.operator_id || operatorIds[0] || null,
          operator_ids: operatorIds,
          lot_number: data.lot_number || `LOT-${Date.now()}`,
          status: 'En cours',
          start_time: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        sessions: [newSession, ...state.sessions]
      }));

      return newSession;
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  updateSessionStatus: async (id: string, status: string, endTime?: string) => {
    try {
      const updateData: any = { status };
      if (endTime) updateData.end_time = endTime;

      const { data: updatedSession, error } = await (supabase as any)
        .from('production_sessions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        sessions: state.sessions.map((s) => (s.id === id ? updatedSession : s))
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  addMachine: async (data: Partial<Machine>) => {
    try {
      const orgId = typeof localStorage !== 'undefined' ? (localStorage.getItem('active_org_id') || DEFAULT_ORG_ID) : DEFAULT_ORG_ID;
      const { oee, ...sanitizedData } = data as any;
      const insertPayload = {
        organization_id: orgId,
        department: data.department || (data as any).location || 'Production',
        location: (data as any).location || 'Atelier',
        status: data.status || 'Active',
        ...sanitizedData
      };

      const { data: newMachine, error } = await (supabase as any)
        .from('machines')
        .insert([insertPayload])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        machines: [...state.machines, newMachine]
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  deleteMachine: async (id: string) => {
    try {
      await (supabase as any).from('production_sessions').update({ machine_id: null }).eq('machine_id', id);
      await (supabase as any).from('production_entries').update({ machine_id: null }).eq('machine_id', id);
      await (supabase as any).from('machine_stops').delete().eq('machine_id', id);
      try { await (supabase as any).from('quality_controls').delete().eq('machine_id', id); } catch {}
      try { await (supabase as any).from('quality_inspections').delete().eq('machine_id', id); } catch {}

      const { error } = await (supabase as any)
        .from('machines')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        machines: state.machines.filter((m) => m.id !== id)
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  updateMachine: async (id: string, data: Partial<Machine>) => {
    try {
      const updatePayload: any = {
        name: data.name,
        code: data.code !== undefined ? data.code : undefined,
        department: data.department !== undefined ? data.department : (data as any).location,
        status: data.status !== undefined ? data.status : undefined,
        oee: (data as any).oee !== undefined ? (data as any).oee : undefined
      };

      Object.keys(updatePayload).forEach((k) => updatePayload[k] === undefined && delete updatePayload[k]);

      const { data: updatedMachine, error } = await (supabase as any)
        .from('machines')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        machines: state.machines.map((m) => (m.id === id ? updatedMachine : m))
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  setupRealtime: () => {
    if (isRealtimeSubscribed) return;
    isRealtimeSubscribed = true;

    supabase
      .channel('production_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'machines' }, () => {
        get().fetchInitialData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'production_sessions' }, () => {
        get().fetchInitialData();
      })
      .subscribe();
  }
}));
