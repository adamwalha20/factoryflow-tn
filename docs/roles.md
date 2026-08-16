# Role-Based Access Control (RBAC) — FactoryFlow TN

## 1. Role Definitions

| Role | Scope | Permissions |
| :--- | :--- | :--- |
| **Owner** | Full Tenant Org | Org settings, subscription, user accounts, all factories, all modules. |
| **Manager / Production Manager** | Factory / Site | Manage OFs, articles, raw materials, machines, workers, reports, view dashboard. |
| **Supervisor** | Production Lines | Monitor machines, assign operators, validate quality/scrap, record machine stops. |
| **Machine Operator** | Assigned Machine | Start/Pause/Finish OF, record good count, record scrap, request mechanic. |
| **Quality Controller** | Inspection & QC | Scan carton QR, conduct metrology tests, validate lot compliance. |
| **Mechanic** | Maintenance | View machine stops, resolve breakdown tickets, perform preventative maintenance. |
| **Warehouse Operator** | Storage & Shipping | Scan carton QR, inbound stock movements, pallet outbound dispatch. |
| **Viewer** | Read-Only | Read-only dashboards and production summaries. |

---

## 2. Route Guard Implementation

Frontend routes are protected using `RoleGuard` in [App.tsx](file:///c:/copie%20of%20existing%20projects/Adpro-mes%20copie/src/App.tsx). If an operator navigates outside `/tablet`, they are redirected automatically to their dedicated screen or an unauthorized screen.
