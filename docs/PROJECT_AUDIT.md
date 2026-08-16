# FACTORYFLOW TN — TECHNICAL PROJECT AUDIT

## 1. Executive Summary

**Project Name:** FactoryFlow TN (Formerly Adpro MES Lite)  
**Original Context:** Production management / Manufacturing Execution System (MES) developed for a family packaging & adhesive tape manufacturing plant in Tunisia.  
**Transformation Objective:** Transform into a robust, secure, scalable **Multi-Tenant SaaS** tailored for Tunisian and MENA small/medium manufacturing plants, while retaining full operational simplicity for tablet-using factory operators.

---

## 2. Codebase & Stack Architecture

| Layer | Technology | State in Codebase |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + TypeScript + Vite 6 | Operational & Modern |
| **Routing** | React Router DOM v7 | Role guards & layout segmentation |
| **Styling** | Tailwind CSS v4 + Vanilla CSS Design System | Clean industrial aesthetic, high contrast |
| **State Management** | Zustand stores (Auth, MES, Maintenance, Audit) | Modular, reactive, cached |
| **Backend & DB** | Supabase (PostgreSQL 17, Auth, RLS, Realtime) | Newly initialized project `FactoryFlow TN` |
| **Document/Labels** | jsPDF + jsPDF-AutoTable, QR Code Generator | Printable Carton QR labels & Production reports |
| **Hardware / Inputs** | HTML5 QR Scanner (`@yudiel/react-qr-scanner`) | Tablet & Mobile scanner for QC / Warehouse |
| **AI Assistant** | Google Gemini API integration (`@google/genai`) | Factory assistant chat widget |

---

## 3. Existing Feature Audit Matrix

| Feature Module | Working State | Assessment & Path to Multi-Tenant SaaS |
| :--- | :--- | :--- |
| **1. Authentication & RBAC** | ✅ Working (Role-based) | Currently maps roles via `employees` / `users`. Needs `organization_id` & `factory_id` scoping in Supabase RLS. |
| **2. Tablet Operator UI (`/tablet`)** | ✅ Working (High Value) | Touch-optimized, large buttons, rapid scrap/good qty logging. Must preserve 100% of simplicity while scoping to active tenant. |
| **3. Manufacturing Orders (OF)** | ✅ Working | Supports priority, article binding, planned quantities, machine assignment, colisage, mandrins. Add tenant isolation. |
| **4. Bons de Commande (Customer Orders)** | ✅ Working | Order creation, tracking, status sync with OFs. Add multi-tenant scoping. |
| **5. Articles & Product Catalog** | ✅ Working | Supports dimensions, categories (Tape, Film, Carton, Mandrin), barcodes. Add tenant isolation. |
| **6. Raw Materials & Stock** | ✅ Working | Stock levels, units, categories. Transform stock modifications into immutable ledger transactions. |
| **7. Machine Management & Downtime** | ✅ Working | Machine statuses (Running, Stopped, Maintenance), stop reasons (panne, réglage, manque matière). |
| **8. Quality Control (`/scanner` & `/admin/qualite`)** | ✅ Working | Conformity inspection, metrology checks (QC métrage, QC poids), lot review & validation. |
| **9. Maintenance (`/admin/maintenance` & `/mechanic`)** | ✅ Working | Work orders, mechanic dashboard, failure reporting. |
| **10. Audit Logging & History** | ✅ Working | PostgreSQL trigger-based audit logs with rollback procedure. Add `organization_id` column. |
| **11. Reporting & Exports** | ✅ Working | PDF and CSV export for production logs and scrap summaries. |
| **12. Realtime Updates** | ✅ Working | Supabase Realtime channel subscriptions for orders, cartons, and machine events. |

---

## 4. Existing Database Analysis

### Existing Tables
- `machines` (id, name, code, status, department, assigned_tablet_id, location)
- `employees` / `users` (id, user_id, first_name, last_name, role, pin_code, email, password)
- `articles` (id, reference, designation, category, width, length, unit, weight, barcode)
- `manufacturing_orders` (id, of_number, customer, article_id, quantity_planned, status, due_date, mandrin_type, planned_axes, planned_cartons, colisage, adhesif_color, carton_model, machine_id, planned_start_date, planned_end_date)
- `bons_de_commande` (id, bc_number, customer, due_date, status, mandrin_type, carton_type, epaisseur, quantity, article_reference, article_designation)
- `production_entries` (id, of_id, machine_id, operator_id, raw_material_id, roll_number, good_quantity, scrap_quantity, jumbo_roll_quantity, axes_quantity, cartons_quantity, qc_metrage, qc_poids, is_conforme, comments)
- `cartons` (id, carton_number, of_id, article_id, quantity, operator_id, qr_payload, status, session_id)
- `raw_materials` (id, reference, designation, category, quantity_in_stock, unit)
- `material_consumptions` (id, production_entry_id, raw_material_id, consumed_quantity, remaining_quantity, yield_percentage, waste_percentage)
- `machine_events` (id, machine_id, status, event_time, operator_id)
- `machine_downtimes` (id, machine_id, reason_id, start_time, end_time, notes)
- `downtime_reasons` (id, name)
- `quality_controls` (id, machine_id, product_id, lot_number, result, defect_description, validated_qty)
- `maintenance_records` (id, machine_id, maintenance_type, technician, notes, status, date)
- `warehouse_movements` (id, carton_id, from_location, to_location, movement_type, operator_id)
- `audit_logs` (id, table_name, record_id, action, old_data, new_data, changed_by, created_at)
- `notifications` (id, title, message, read, created_at)
- `push_subscriptions` (id, endpoint, keys, user_id)

---

## 5. Identified Deficiencies & Opportunities for SaaS Evolution

1. **Single-Tenant Hardcoding:** Tables currently lack an `organization_id` foreign key. An organization must be the root tenant anchor.
2. **Factory Hierarchy:** Multi-factory organizations need `factories` and `production_areas` to separate machine lines across sites.
3. **Immutability of Stock:** Inventory changes should be recorded as `inventory_transactions` (RECEIPT, CONSUMPTION, ADJUSTMENT, RETURN, WASTE, TRANSFER) rather than in-place overwrites.
4. **Scrap Granularity:** Standardize scrap reason codes (`MACHINE_SETUP`, `MATERIAL_DEFECT`, `CUTTING_ERROR`, `OPERATOR_ERROR`, `PRODUCT_DEFECT`, `OTHER`) with tenant metrics.
5. **Multi-Language Support:** UI is primarily French; prepare dictionary-driven i18n supporting French, Arabic (with RTL), and English.
6. **Strict Row Level Security (RLS):** Policies must enforce `organization_id = (SELECT organization_id FROM profiles/employees WHERE user_id = auth.uid())`.
