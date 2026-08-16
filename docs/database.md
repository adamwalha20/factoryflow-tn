# Database Architecture & Data Dictionary — FactoryFlow TN

## 1. Relational Schema Map

| Table Name | Primary Purpose | Key Foreign Keys |
| :--- | :--- | :--- |
| `organizations` | Multi-tenant company root | None (Root) |
| `factories` | Physical manufacturing sites | `organization_id -> organizations.id` |
| `employees` | Staff profiles, role assignments & PINs | `organization_id`, `factory_id`, `user_id` |
| `machines` | Machine workstations & lines | `organization_id`, `factory_id` |
| `articles` | Finished products & semi-finished SKU catalog | `organization_id` |
| `raw_materials` | Raw materials inventory (Jumbo rolls, mandrins, cartons, films) | `organization_id` |
| `inventory_transactions` | Immutable ledger of all stock additions, consumptions & adjustments | `organization_id`, `raw_material_id`, `operator_id` |
| `bons_de_commande` | Customer Purchase Orders | `organization_id`, `factory_id` |
| `manufacturing_orders` | Ordres de Fabrication (OF) scheduled on lines | `organization_id`, `factory_id`, `article_id`, `machine_id` |
| `production_entries` | Immutable production shift logs (good qty, scrap, weight, metrage) | `organization_id`, `of_id`, `machine_id`, `operator_id` |
| `waste_records` | Granular defect classification (reasons: setup, defect, cut, etc.) | `organization_id`, `of_id`, `machine_id`, `operator_id` |
| `cartons` | Sequential carton numbers with QR payloads and QC states | `organization_id`, `of_id`, `article_id`, `operator_id` |
| `quality_controls` | Metrological & visual inspection checks | `organization_id`, `machine_id`, `product_id`, `inspector_id` |
| `machine_downtimes` | Machine stop intervals and reason codes | `organization_id`, `machine_id`, `reason_id` |
| `maintenance_records` | Corrective and preventive maintenance work orders | `organization_id`, `machine_id` |
| `audit_logs` | Trigger-based immutable audit trail of table changes | `organization_id`, `changed_by` |
| `notifications` | System & machine alarm notifications | `organization_id`, `user_id` |

---

## 2. Immutability & Ledger Rules

1. **Stock Levels:** Raw material quantity is synchronized with `inventory_transactions`. Every change records transaction type (`RECEIPT`, `CONSUMPTION`, `ADJUSTMENT`, `RETURN`, `WASTE`, `TRANSFER`).
2. **Production Events:** Production logs (`production_entries`) are append-only. They are never overwritten in place, guaranteeing auditable production histories.
