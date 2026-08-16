import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

export type ReportType = 'daily' | 'weekly' | 'monthly';

export const generatePdfReport = (
  type: ReportType,
  data: {
    production_entries: any[];
    machines: any[];
  },
  action: 'preview' | 'download' = 'download'
) => {
  const doc = new jsPDF();
  const now = new Date();
  
  // Date ranges
  let startDate = new Date();
  let title = '';
  
  if (type === 'daily') {
    startDate = startOfDay(now);
    title = `Rapport Journalier - ${format(now, 'dd MMMM yyyy', { locale: fr })}`;
  } else if (type === 'weekly') {
    startDate = startOfDay(subDays(now, 7));
    title = `Rapport Hebdomadaire - ${format(startDate, 'dd MMM')} au ${format(now, 'dd MMM yyyy', { locale: fr })}`;
  } else if (type === 'monthly') {
    startDate = startOfDay(subDays(now, 30));
    title = `Rapport Mensuel - ${format(now, 'MMMM yyyy', { locale: fr })}`;
  }

  // Filter data
  const periodEntries = data.production_entries.filter(e => {
    const entryDate = new Date(e.created_at);
    return isWithinInterval(entryDate, { start: startDate, end: endOfDay(now) });
  });

  const totalProd = periodEntries.reduce((acc, e) => acc + (e.good_quantity || 0), 0);
  const totalScrap = periodEntries.reduce((acc, e) => acc + (e.scrap_quantity || 0), 0);
  const totalUnits = totalProd + totalScrap;
  const globalOee = totalUnits > 0 ? ((totalProd / totalUnits) * 100).toFixed(1) : '0';

  // Header
  doc.setFontSize(22);
  doc.setTextColor(11, 61, 145); // primary color
  doc.text('FactoryFlow TN', 14, 20);
  
  doc.setFontSize(16);
  doc.setTextColor(50, 50, 50);
  doc.text(title, 14, 30);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Généré le ${format(now, 'dd/MM/yyyy HH:mm', { locale: fr })}`, 14, 38);

  // Summary KPIs
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Synthèse Globale:`, 14, 50);
  
  autoTable(doc, {
    startY: 55,
    head: [['Production Totale (Conforme)', 'Déchets (Rebut)', 'OEE Global']],
    body: [[`${totalProd} unités`, `${totalScrap} unités`, `${globalOee}%`]],
    theme: 'grid',
    headStyles: { fillColor: [11, 61, 145] },
  });

  // Machine Performance
  doc.text(`Performance par Machine:`, 14, (doc as any).lastAutoTable.finalY + 15);
  
  const machineData = data.machines.map(m => {
    const mEntries = periodEntries.filter(e => e.machine_id === m.id);
    const mProd = mEntries.reduce((acc, e) => acc + (e.good_quantity || 0), 0);
    const mScrap = mEntries.reduce((acc, e) => acc + (e.scrap_quantity || 0), 0);
    const mTotal = mProd + mScrap;
    const mOee = mTotal > 0 ? ((mProd / mTotal) * 100).toFixed(1) : '0';
    const mName = m.code ? `${m.name} (${m.code})` : m.name;
    return [mName, mProd.toString(), mScrap.toString(), `${mOee}%`];
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 20,
    head: [['Machine', 'Production', 'Déchets', 'OEE']],
    body: machineData.length > 0 ? machineData : [['Aucune donnée', '-', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: [70, 70, 70] },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} sur ${pageCount} - FactoryFlow TN`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  // Output
  if (action === 'preview') {
    window.open(doc.output('bloburl'), '_blank');
  } else {
    doc.save(`Rapport_${type}_${format(now, 'yyyyMMdd_HHmm')}.pdf`);
  }
};
