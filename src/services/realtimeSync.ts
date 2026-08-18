import { supabase } from '../lib/supabase';
import { useMesStore } from '../store/mesStore';
import { useProductionStore } from '../store/production';
import { useStopsStore } from '../store/stops';
import { useUsersStore } from '../store/users';
import { useRawMaterialsStore } from '../store/rawMaterials';
import { useWarehouseStore } from '../store/warehouseStore';
import { useAuditStore } from '../store/audit';
import { useNotificationStore } from '../store/notifications';
import { useTenantStore } from '../store/tenantStore';

let activeRealtimeChannel: any = null;
let isInitialized = false;
let debounceTimers: Record<string, any> = {};

function debouncedDispatch(key: string, callback: () => void, delayMs = 150) {
  if (debounceTimers[key]) {
    clearTimeout(debounceTimers[key]);
  }
  debounceTimers[key] = setTimeout(() => {
    try {
      callback();
    } catch (err) {
      console.warn(`[RealtimeSync] Error dispatching ${key}:`, err);
    }
  }, delayMs);
}

/**
 * Initializes global real-time synchronization across all tables and stores
 */
export function initGlobalRealtimeSync(organizationId?: string) {
  const activeOrgId = organizationId || (typeof localStorage !== 'undefined' ? localStorage.getItem('active_org_id') : null) || 'global';

  // Clean up any existing channel
  if (activeRealtimeChannel) {
    try {
      supabase.removeChannel(activeRealtimeChannel);
    } catch {}
    activeRealtimeChannel = null;
  }

  const channelName = `factoryflow_realtime_${activeOrgId}_${Date.now()}`;
  console.log(`[RealtimeSync] Connecting to real-time channel: ${channelName}`);

  const channel = supabase.channel(channelName)
    // 1. Manufacturing Orders & Production Work Orders
    .on('postgres_changes', { event: '*', schema: 'public', table: 'manufacturing_orders' }, () => {
      debouncedDispatch('mes_orders', () => useMesStore.getState().fetchInitialData());
    })
    // 2. Production Entries (Piece counters, rolls, cartons generated)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'production_entries' }, () => {
      debouncedDispatch('mes_entries', () => useMesStore.getState().fetchInitialData());
    })
    // 3. Cartons & Pallets
    .on('postgres_changes', { event: '*', schema: 'public', table: 'cartons' }, () => {
      debouncedDispatch('mes_cartons', () => useMesStore.getState().fetchInitialData());
    })
    // 4. Articles & Catalog
    .on('postgres_changes', { event: '*', schema: 'public', table: 'articles' }, () => {
      debouncedDispatch('mes_articles', () => useMesStore.getState().fetchInitialData());
    })
    // 5. Purchase Orders (Bons de Commande)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bons_de_commande' }, () => {
      debouncedDispatch('mes_bcs', () => useMesStore.getState().fetchInitialData());
    })
    // 6. Machines & Equipment
    .on('postgres_changes', { event: '*', schema: 'public', table: 'machines' }, () => {
      debouncedDispatch('prod_machines', () => {
        useProductionStore.getState().fetchInitialData();
        useTenantStore.getState().fetchTenantData();
      });
    })
    // 7. Production Sessions (Active shifts & operator assignments)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'production_sessions' }, () => {
      debouncedDispatch('prod_sessions', () => useProductionStore.getState().fetchInitialData());
    })
    // 8. Machine Stops & Breakdowns (Arrêts & Pannes)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'machine_stops' }, () => {
      debouncedDispatch('stops_all', () => {
        useStopsStore.getState().fetchStops();
        useProductionStore.getState().fetchInitialData();
      });
    })
    // 9. Raw Materials & Jumbo Rolls Stock
    .on('postgres_changes', { event: '*', schema: 'public', table: 'raw_materials' }, () => {
      debouncedDispatch('raw_materials', () => {
        useRawMaterialsStore.getState().fetchMaterials();
        useMesStore.getState().fetchInitialData();
      });
    })
    // 10. Inventory Transactions & Stock Adjustments
    .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_transactions' }, () => {
      debouncedDispatch('inventory_tx', () => {
        useRawMaterialsStore.getState().fetchMaterials();
        useRawMaterialsStore.getState().fetchTransactions();
      });
    })
    // 11. Material Consumptions
    .on('postgres_changes', { event: '*', schema: 'public', table: 'material_consumptions' }, () => {
      debouncedDispatch('mat_consumptions', () => useRawMaterialsStore.getState().fetchMaterials());
    })
    // 12. Quality Controls & Inspections
    .on('postgres_changes', { event: '*', schema: 'public', table: 'quality_controls' }, () => {
      debouncedDispatch('quality_inspections', () => useMesStore.getState().fetchInitialData());
    })
    // 13. Users & Employees / Workers PINs
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
      debouncedDispatch('users_table', () => {
        useUsersStore.getState().fetchUsers();
        useProductionStore.getState().fetchInitialData();
      });
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => {
      debouncedDispatch('employees_table', () => {
        useUsersStore.getState().fetchUsers();
        useProductionStore.getState().fetchInitialData();
      });
    })
    // 14. Warehouse Locations & Movements
    .on('postgres_changes', { event: '*', schema: 'public', table: 'warehouse_locations' }, () => {
      debouncedDispatch('warehouse_locs', () => useWarehouseStore.getState().fetchLocations());
    })
    // 15. Audit Logs
    .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, () => {
      debouncedDispatch('audit_logs', () => useAuditStore.getState().fetchLogs?.());
    })
    // 16. In-App Notifications
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
      debouncedDispatch('notifs', () => useNotificationStore.getState().fetchNotifications?.());
    })
    // 17. Organizations & Tenant Subscriptions
    .on('postgres_changes', { event: '*', schema: 'public', table: 'organizations' }, () => {
      debouncedDispatch('tenant_org', () => useTenantStore.getState().fetchTenantData());
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions' }, () => {
      debouncedDispatch('tenant_sub', () => useTenantStore.getState().fetchTenantData());
    })
    .subscribe((status) => {
      console.log(`[RealtimeSync] Subscription status: ${status}`);
    });

  activeRealtimeChannel = channel;

  // Window Focus & Network Reconnect automatic sync
  if (!isInitialized && typeof window !== 'undefined') {
    isInitialized = true;

    const refreshAllStores = () => {
      debouncedDispatch('global_focus_refresh', () => {
        useMesStore.getState().fetchInitialData();
        useProductionStore.getState().fetchInitialData();
        useStopsStore.getState().fetchStops();
        useUsersStore.getState().fetchUsers();
        useRawMaterialsStore.getState().fetchMaterials();
        useTenantStore.getState().fetchTenantData();
      }, 300);
    };

    window.addEventListener('focus', refreshAllStores);
    window.addEventListener('online', refreshAllStores);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        refreshAllStores();
      }
    });
  }

  return () => {
    if (activeRealtimeChannel) {
      try {
        supabase.removeChannel(activeRealtimeChannel);
      } catch {}
      activeRealtimeChannel = null;
    }
  };
}
