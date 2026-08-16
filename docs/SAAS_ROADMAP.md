# FACTORYFLOW TN — SAAS PRODUCT ROADMAP

## Phase 1: Core Multi-Tenant Architecture & Migration
- [x] **Project Rebranding & Setup**: Transform into `FactoryFlow TN`, establish new Supabase project (`ospxrqlyesznvfajcdhm`).
- [x] **Multi-Tenant Foundation**: Add `organizations`, `factories`, `profiles` and link `organization_id` across all relational tables.
- [x] **Strict Supabase RLS**: Implement tenant-isolated Row Level Security policies so no organization can read/write another tenant's data.
- [x] **Preserve & Enhance Operator UI**: Keep tablet operator touch interface lightning fast with simplified multi-tenant context.
- [x] **Auditing & Traceability**: Ensure tenant-aware audit logging and full order-to-carton lifecycle.

---

## Phase 2: Enhanced Factory Operations & Automation
- [x] **Immutable Inventory Ledger**: `inventory_transactions` tracking (Receipts, Consumptions, Scraps, Transfers) with low-stock triggers.
- [x] **Scrap & Waste Analytics**: Deep drilldown by machine, operator, defect type, and batch.
- [x] **Webhooks & n8n Integration**: Event triggers on PO completion, low raw material, machine breakdowns.
- [x] **Internationalization (i18n)**: French (default), Arabic (RTL support), and English.
- [x] **Offline Sync Capability**: Local storage queue for tablet workstations during intermittent factory WiFi disconnects.

---

## Phase 3: AI Factory Assistant & Intelligence
- [x] **AI Daily Production Digest**: Automated daily KPI synthesis (Target vs Actual, Downtime root cause, Scrap anomalies).
- [x] **AI Troubleshooting Assistant**: Operator and manager prompt assistant grounded on verified database metrics (Gemini-powered).
- [x] **Predictive Maintenance Warnings**: Anomaly alerts based on historical downtime frequency and runtime hours.

---

## Phase 4: Enterprise Scale & Integrations
- [x] **Customer & Subcontractor Portal**: Client tracking of ongoing Bons de Commande and order dispatches.
- [x] **Bill of Materials (BOM) Multi-Stage**: Multi-level recipe and conversion management.
- [x] **ERP & Accounting Connectors**: Export/sync with Tunisian ERPs (Sage, Microsoft Dynamics, Odoo).
- [x] **SaaS Subscription Tiering**: Starter, Professional, and Enterprise quota limits and billing.
