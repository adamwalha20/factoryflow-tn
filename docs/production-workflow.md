# Production & Tablet Workflows — FactoryFlow TN

## 1. Production Order (OF) Lifecycle

```
[ DRAFT ] ---> [ PLANNED ] ---> [ IN PRODUCTION ] ---> [ COMPLETED ] ---> [ CLOSED ]
                   |
             Assigned to Machine
             & Target Quantity
```

1. **Creation:** Manager creates OF with SKU, target quantity, priority, due date, mandrin type, and colisage.
2. **Assignment:** OF is assigned to a specific production line/machine (e.g. M01 - Bobineuse Ruban).
3. **Execution:** Operator sees active OF on tablet screen with progress bar.
4. **Output Capture:** Operator logs produced units (cartons, rolls) and scrap quantity with one tap.
5. **Completion:** System verifies completed quantity against target and flags order as `Completed`.

---

# Machine & Tablet Operator Workflow

## 1. Tablet Station UX Principles
- **Touch-First:** High-contrast buttons minimum 48px height for finger tapping.
- **Minimal Virtual Typing:** Numerical increment buttons (+1, +5, +10, +50, +100).
- **Instant Status Switching:** Toggle between RUNNING, PAUSED, and STOPPED in 1 tap.
- **Problem Reporting:** Operator taps "Signaler Arrêt", picks reason (Panne mécanique, Manque matière, etc.), which instantly notifies the maintenance team and supervisor.
