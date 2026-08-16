import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export interface QueuedEvent {
  id: string;
  type: 'PRODUCTION_ENTRY' | 'CARTON_CREATE' | 'MACHINE_EVENT' | 'WASTE_RECORD';
  payload: any;
  timestamp: string;
}

const STORAGE_KEY = 'factoryflow_offline_queue';

export const getOfflineQueue = (): QueuedEvent[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const saveOfflineQueue = (queue: QueuedEvent[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
};

export const enqueueOfflineEvent = (type: QueuedEvent['type'], payload: any) => {
  const queue = getOfflineQueue();
  const newEvent: QueuedEvent = {
    id: 'offline-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
    type,
    payload,
    timestamp: new Date().toISOString()
  };
  queue.push(newEvent);
  saveOfflineQueue(queue);
  return newEvent;
};

export const processOfflineSync = async (): Promise<{ synced: number; failed: number }> => {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;
  const remaining: QueuedEvent[] = [];

  for (const item of queue) {
    try {
      if (item.type === 'PRODUCTION_ENTRY') {
        const { pieces_per_carton, carton_capacity, colisage, operator_ids, ...sanitized } = item.payload || {};
        const orgId = sanitized.organization_id || (typeof localStorage !== 'undefined' ? localStorage.getItem('active_org_id') : null) || '00000000-0000-0000-0000-000000000000';
        const payloadToInsert = {
          ...sanitized,
          organization_id: orgId
        };
        const { error } = await (supabase as any).from('production_entries').insert([payloadToInsert]);
        if (error) throw error;
      } else if (item.type === 'CARTON_CREATE') {
        const { error } = await (supabase as any).from('cartons').insert([item.payload]);
        if (error) throw error;
      } else if (item.type === 'MACHINE_EVENT') {
        const { error } = await (supabase as any).from('machine_events').insert([item.payload]);
        if (error) throw error;
      } else if (item.type === 'WASTE_RECORD') {
        const { error } = await (supabase as any).from('waste_records').insert([item.payload]);
        if (error) throw error;
      }
      synced++;
    } catch (err) {
      console.error('Failed to sync item:', item, err);
      failed++;
      remaining.push(item);
    }
  }

  saveOfflineQueue(remaining);

  if (synced > 0) {
    toast.success(`${synced} opération(s) synchronisée(s) avec succès !`);
  }

  return { synced, failed };
};

// Setup automatic listener on reconnection
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    processOfflineSync();
  });
}
