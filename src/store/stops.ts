import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

export interface MachineStop {
  id: string;
  organization_id?: string;
  machine_id: string;
  reason: string;
  start_time: string;
  end_time?: string | null;
  operator_id?: string | null;
  comments?: string | null;
  status?: string | null;
  created_at?: string;
}

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000000';
const getActiveOrgId = () => typeof localStorage !== 'undefined' ? (localStorage.getItem('active_org_id') || DEFAULT_ORG_ID) : DEFAULT_ORG_ID;

interface StopsStore {
  stops: MachineStop[];
  loading: boolean;
  error: string | null;
  fetchStops: () => Promise<void>;
  declareStop: (data: Partial<MachineStop>) => Promise<void>;
  resolveStop: (id: string) => Promise<void>;
}

export const useStopsStore = create<StopsStore>((set, get) => ({
  stops: [],
  loading: false,
  error: null,

  fetchStops: async () => {
    set({ loading: true, error: null });
    try {
      const orgId = getActiveOrgId();
      const { data, error } = await (supabase as any)
        .from('machine_stops')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      set({ stops: data || [] });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  declareStop: async (data: any) => {
    try {
      const orgId = getActiveOrgId();
      const payload: any = {
        organization_id: orgId,
        machine_id: data.machine_id,
        reason: data.reason,
        status: data.status || 'En cours',
        comments: data.comments || null,
        start_time: data.start_time || new Date().toISOString()
      };
      if (data.operator_id) {
        payload.operator_id = data.operator_id;
      }

      const { data: newStop, error } = await (supabase as any)
        .from('machine_stops')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      // Update machine status based on the reason
      const newStatus = data.reason === 'Maintenance' ? 'Maintenance' : 'En panne';
      await (supabase as any).from('machines').update({ status: newStatus }).eq('id', data.machine_id);

      // Trigger push notification to mechanics
      try {
        const { data: machine } = await (supabase as any).from('machines').select('name').eq('id', data.machine_id).single();
        await supabase.functions.invoke('notify-mechanics', {
          body: {
            machineName: machine?.name || 'Machine Inconnue',
            reason: data.reason
          }
        });
      } catch (notifyErr) {
        console.warn('Failed to send mechanic notification:', notifyErr);
      }

      set(state => ({
        stops: [newStop, ...state.stops]
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  resolveStop: async (id: string) => {
    try {
      const { data: stopData, error } = await (supabase as any)
        .from('machine_stops')
        .update({
          end_time: new Date().toISOString(),
          status: 'Résolu'
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (stopData?.machine_id) {
        await (supabase as any).from('machines').update({ status: 'Inactif' }).eq('id', stopData.machine_id);
      }

      set(state => ({
        stops: state.stops.map(s => s.id === id ? stopData : s)
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  }
}));
