import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data: any;
  new_data: any;
  changed_by: string | null;
  created_at: string;
  user_email?: string;
}

interface AuditStore {
  logs: AuditLog[];
  loading: boolean;
  error: string | null;
  fetchLogs: () => Promise<void>;
  undoChange: (logId: string) => Promise<void>;
  subscribeToLogs: () => (() => void);
}

export const useAuditStore = create<AuditStore>((set, get) => ({
  logs: [],
  loading: false,
  error: null,

  fetchLogs: async () => {
    set((state) => ({ loading: state.logs.length === 0, error: null }));
    try {
      const orgId = typeof localStorage !== 'undefined' 
        ? (localStorage.getItem('active_org_id') || '00000000-0000-0000-0000-000000000000') 
        : '00000000-0000-0000-0000-000000000000';

      // 1. Fetch Audit Logs for this tenant only
      const { data: logsData, error: logsError } = await (supabase as any)
        .from('audit_logs')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) throw logsError;

      // 2. Fetch employees map to resolve actor name for this tenant
      const { data: employeesData } = await (supabase as any)
        .from('employees')
        .select('id, first_name, last_name, role')
        .eq('organization_id', orgId);

      const actorMap = new Map<string, string>();
      (employeesData || []).forEach((e: any) => {
        actorMap.set(e.id, `${e.first_name || ''} ${e.last_name || ''}`.trim() || e.role);
      });

      // 3. Format Data
      const formattedData: AuditLog[] = (logsData || []).map((log: any) => ({
        ...log,
        user_email: log.changed_by ? (actorMap.get(log.changed_by) || 'Administrateur') : 'Système'
      }));

      set({ logs: formattedData, loading: false });
    } catch (err: any) {
      console.error('Error fetching audit logs:', err);
      const errMsg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      set({ error: errMsg, loading: false });
    }
  },

  undoChange: async (logId: string) => {
    try {
      const log = get().logs.find(l => l.id === logId);
      const { error } = await (supabase as any).rpc('revert_audit_log', { p_log_id: logId });
      
      if (error) throw error;

      // Handle side effects for cartons
      if (log && log.table_name === 'cartons') {
        const carton = log.action === 'DELETE' ? log.old_data : log.new_data;
        
        if (carton && carton.of_id && carton.quantity) {
          const { data: order } = await (supabase as any).from('manufacturing_orders').select('quantity_planned, status').eq('id', carton.of_id).single();
          
          if (order) {
            let newQty = Number(order.quantity_planned);
            let newStatus = order.status;
            
            if (log.action === 'DELETE') {
              newQty = Math.max(0, newQty - Number(carton.quantity));
              if (newQty === 0) newStatus = 'Completed';
              else if (newStatus === 'Completed') newStatus = 'In Production';
              
              await (supabase as any).from('production_entries').insert({
                machine_id: carton.machine_id || null,
                article_id: carton.article_id,
                of_id: carton.of_id,
                operator_id: carton.operator_id || null,
                good_quantity: carton.quantity,
                scrap_quantity: 0,
                created_at: carton.created_at
              });
            } else if (log.action === 'INSERT') {
              newQty = newQty + Number(carton.quantity);
              if (newQty > 0 && newStatus === 'Completed') newStatus = 'In Production';
              
              await (supabase as any).from('production_entries')
                .delete()
                .eq('of_id', carton.of_id)
                .eq('good_quantity', carton.quantity);
            }
            
            await (supabase as any).from('manufacturing_orders')
              .update({ quantity_planned: newQty, status: newStatus })
              .eq('id', carton.of_id);
          }
        }
      }
      
      await get().fetchLogs();
    } catch (err: any) {
      throw new Error(err?.message || 'Erreur lors de l\'annulation');
    }
  },

  subscribeToLogs: () => {
    const channelName = 'audit_logs_realtime_' + Date.now();
    const channel = supabase.channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, () => {
        get().fetchLogs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}));
