import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface NotificationStore {
  notifications: Notification[];
  loading: boolean;
  error: string | null;

  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  setupRealtime: () => void;
}

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000000';
const getActiveOrgId = () => typeof localStorage !== 'undefined' ? (localStorage.getItem('active_org_id') || DEFAULT_ORG_ID) : DEFAULT_ORG_ID;

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  loading: false,
  error: null,

  fetchNotifications: async () => {
    set({ loading: true, error: null });
    try {
      const orgId = getActiveOrgId();
      const { data, error } = await (supabase as any)
        .from('notifications')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      set({ notifications: data || [], loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;
      set(state => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  markAllAsRead: async () => {
    try {
      const unreadIds = get().notifications.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length === 0) return;

      const { error } = await (supabase as any)
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds);

      if (error) throw error;
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, read: true }))
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  setupRealtime: () => {
    const existingChannel = supabase.getChannels().find(c => c.topic === 'realtime:notifications_changes');
    if (existingChannel) return;

    supabase.channel('notifications_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const newNotification = payload.new as Notification;
        set(state => ({
          notifications: [newNotification, ...state.notifications]
        }));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications' }, (payload) => {
        const updatedNotification = payload.new as Notification;
        set(state => ({
          notifications: state.notifications.map(n => n.id === updatedNotification.id ? updatedNotification : n)
        }));
      })
      .subscribe();
  }
}));
