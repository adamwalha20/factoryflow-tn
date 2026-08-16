# System Architecture — FactoryFlow TN

## 1. High-Level Overview

FactoryFlow TN is a cloud-native, multi-tenant Manufacturing Execution System (MES) designed for small and medium-sized factories in Tunisia and emerging industrial markets.

```
+-------------------------------------------------------------------------+
|                              CLIENT TIER                                |
|  - Management Web Dashboard (Admin/Manager/Supervisor/Viewer)           |
|  - Tablet Workstation PWA (Shop-floor Machine Operators)                |
|  - Mobile / Handheld Barcode & QR Scanner (QC / Warehouse)              |
+------------------------------------+------------------------------------+
                                     | HTTPS / WSS
+------------------------------------v------------------------------------+
|                         APPLICATION & API LAYER                         |
|  - React 19 + TypeScript + Vite 6 Single Page App                       |
|  - Supabase Realtime Channels (Live OF status, carton counts, alarms)   |
|  - Edge Functions / Webhooks (Alerts, push notifications, n8n triggers) |
+------------------------------------+------------------------------------+
                                     | RLS & PG Connection
+------------------------------------v------------------------------------+
|                           PERSISTENCE TIER                              |
|  - Supabase PostgreSQL 17 Multi-Tenant Schema                           |
|  - Strict Row Level Security (RLS) per Organization (Tenant)            |
|  - Immutable Event & Audit Logs, Inventory Transaction Ledgers          |
|  - Supabase Storage (Labels, attachments, QC photos)                    |
+-------------------------------------------------------------------------+
```

## 2. Multi-Tenant Tenancy Model

1. **Root Organization:** Every company is represented by an `organizations` record with a unique slug and subscription plan (`STARTER`, `PROFESSIONAL`, `ENTERPRISE`).
2. **Factory Sub-Division:** Each organization can have one or more `factories` (sites) with distinct addresses, shift schedules, and default timezone (`Africa/Tunis`).
3. **Data Isolation:** Every business table references `organization_id`. Supabase RLS enforces strict isolation so tenant A can never read, modify, or infer tenant B's data.

## 3. Realtime Synchronization
- WebSockets via Supabase Realtime update the Management Dashboard, Tablet workstation, and Mechanic dashboard within milliseconds when an operator starts a batch or logs a stop reason.
