export interface ErpExportRecord {
  date: string;
  of_number: string;
  article_ref: string;
  quantity: number;
  scrap_quantity: number;
  lot_number?: string;
  cost_estimate?: number;
}

export function generateSage100Export(records: ErpExportRecord[]): string {
  // Sage 100 standard format (Journal des Opérations Diverses / Mouvements de Stock)
  const header = "JOURNAL;DATE;N_PIECE;COMPTE_GEN;LIBELLE;DEBIT;CREDIT;REF_INTERNE";
  
  const lines = records.map(r => {
    const d = r.date.replace(/-/g, '').substring(2); // YYMMDD
    const piece = r.of_number.replace(/[^a-zA-Z0-9]/g, '');
    const debitPF = (r.quantity * 2.5).toFixed(3); // Demo estimation in TND
    const creditMP = (r.quantity * 1.8).toFixed(3);

    // Ligne Débit Produit Fini (Compte 355000)
    const linePF = `STK;${d};${piece};355000;Prod ${r.article_ref};${debitPF};0.000;${r.of_number}`;
    // Ligne Crédit Matière (Compte 311000)
    const lineMP = `STK;${d};${piece};311000;Conso ${r.article_ref};0.000;${creditMP};${r.of_number}`;
    
    return `${linePF}\n${lineMP}`;
  });

  return `${header}\n${lines.join('\n')}`;
}

export function generateOdooJsonExport(records: ErpExportRecord[]): string {
  const odooPayload = {
    sync_source: "FactoryFlow TN MES SaaS",
    exported_at: new Date().toISOString(),
    manufacturing_orders: records.map(r => ({
      mrp_production_name: r.of_number,
      product_code: r.article_ref,
      product_qty: r.quantity,
      qty_producing: r.quantity,
      scrap_qty: r.scrap_quantity,
      lot_producing_id: r.lot_number || `LOT-${r.of_number}`,
      state: "done"
    }))
  };

  return JSON.stringify(odooPayload, null, 2);
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
