# Raw Materials & Inventory Ledger — FactoryFlow TN

## 1. Materials Management
FactoryFlow TN supports diverse raw materials common in packaging, adhesive converting, and extrusion:
- **Jumbo Rolls / Master Rolls** (BOPP, Aluminium foil, Stretch film rolls)
- **Cores & Mandrins** (Cardboard mandrins 76mm, 50mm, 38mm)
- **Outer Packaging** (Standard corrugated cartons 36-roll, 48-roll, custom printed boxes)
- **Adhesive Glue & Additives** (Solvents, acrylic water-based, hot-melt)

## 2. Transaction Types
All stock movements are stored in `inventory_transactions`:
- `RECEIPT`: Inbound delivery from suppliers with lot tracking.
- `CONSUMPTION`: Material deducted during production runs.
- `WASTE`: Material damaged during setup or machine error.
- `ADJUSTMENT`: Cycle count physical inventory corrections.
- `RETURN`: Unused raw material returned to stock room.
