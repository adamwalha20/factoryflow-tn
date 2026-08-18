import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;

export interface ParsedBcItem {
  article_reference: string;
  article_designation: string;
  quantity: number;
  unit: string;
  colisage: number;
}

export interface ParsedBcData {
  bc_number: string;
  customer: string;
  reference_client: string;
  attention: string;
  depot: string;
  due_date: string;
  mandrin_type: string;
  carton_type: string;
  epaisseur: string;
  items: ParsedBcItem[];
  rawText: string;
}

/**
 * Extracts raw text from a PDF file using pdf.js
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let fullText = '';
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageStrings = textContent.items.map((item: any) => item.str || '');
    fullText += pageStrings.join(' ') + '\n';
  }

  return fullText;
}

/**
 * Parses Bon de Commande fields and multi-line items from raw extracted text
 */
export function parseBcText(text: string): ParsedBcData {
  const cleanText = text.replace(/\s+/g, ' ');

  // 1. Extract N° Bon de Commande (e.g. Numéro : PF26S0374 or Numéro: PF26S0374)
  let bcNumber = '';
  const numMatch = text.match(/Num[ée]ro\s*[:\-]\s*([A-Za-z0-9\-_]+)/i);
  if (numMatch) {
    bcNumber = numMatch[1].trim();
  }

  // 2. Extract Date (e.g. Date : 08/08/26 or 08/08/2026)
  let dueDate = '';
  const dateMatch = text.match(/Date\s*[:\-]\s*(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})/i);
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, '0');
    const month = dateMatch[2].padStart(2, '0');
    let year = dateMatch[3];
    if (year.length === 2) {
      year = `20${year}`;
    }
    dueDate = `${year}-${month}-${day}`;
  }

  // 3. Extract Référence Client (e.g. Référence : BC ALIM.STOCK)
  let referenceClient = '';
  let customer = '';
  const refMatch = text.match(/R[ée]f[ée]rence\s*[:\-]\s*([^\n\r]+?)(?=\s+(?:MR|Attention|D[ée]p[ôo]t|APTA|APHA|[A-Z0-9]{5,})|$)/i);
  if (refMatch) {
    referenceClient = refMatch[1].trim();
    // Derive customer name from reference (e.g. "BC ALIM.STOCK" -> "alim.stock")
    customer = referenceClient.replace(/^(?:BC|BON\s*DE\s*COMMANDE)\s*[:\-]?\s*/i, '').trim();
  }

  // 4. Extract Attention (e.g. Attention : MR AMJAD)
  let attention = '';
  const attnMatch = text.match(/Attention\s*[:\-]\s*([^\n\r]+?)(?=\s+(?:D[ée]p[ôo]t|Référence|BON|$))/i);
  if (attnMatch) {
    attention = attnMatch[1].trim();
  } else {
    // Check for MR NAME
    const mrMatch = text.match(/\b(MR\s+[A-Z\s]+?)(?=\s+(?:D[ée]p[ôo]t|Référence|BON|$))/i);
    if (mrMatch) attention = mrMatch[1].trim();
  }

  // If customer is still empty, derive from Attention or fallback
  if (!customer && attention) {
    customer = attention;
  }
  if (!customer) {
    customer = 'Client Standard';
  }

  // 5. Extract Dépôt (e.g. Dépôt : DEPOT SFAX)
  let depot = 'DEPOT SFAX';
  const depotMatch = text.match(/D[ée]p[ôo]t\s*[:\-]\s*([^\n\r]+?)(?=\s+(?:R[ée]f[ée]rence|Attention|APTA|APHA|BON|$))/i);
  if (depotMatch) {
    depot = depotMatch[1].trim();
  }

  // 6. Extract Mandrin (e.g. Mandrin : Standart Tunisie Tape)
  let mandrinType = 'Standart Tunisie Tape';
  const mandrinMatch = text.match(/Mandrin\s*[:\-]\s*([^\n\r]+?)(?=\s+(?:Carton|Date|Responsable|$))/i);
  if (mandrinMatch) {
    mandrinType = mandrinMatch[1].trim();
  }

  // 7. Extract Carton (e.g. Carton : Standart Tunisie Tape Date/Code Opérateur/Quantité)
  let cartonType = 'Standart Tunisie Tape (Date/Code Opérateur/Quantité)';
  const cartonMatch = text.match(/Carton\s*[:\-]\s*([^\n\r]+?)(?=\s+(?:Mandrin|Date\/Code|Responsable|$))/i);
  if (cartonMatch) {
    cartonType = cartonMatch[1].trim();
  }

  // 8. Extract Items (Articles) Table
  const items: ParsedBcItem[] = [];

  // Regex targeting standard lines:
  // e.g. "APTA070/048ECO ROULEAUX P.P TRANSPARENT 070/048 ACRYLIQUE ECO 15120 RLX"
  // or   "APHA070/048ECO ROULEAUX P.P HAVANE 070/048 ACRYLIQUE ECO 7560 RLX"
  const itemRegex = /\b([A-Z0-9]{4,12}(?:\/[A-Z0-9]+)?(?:ECO)?)\s+([A-Z0-9\s\.\/\-_]+?)\s+(\d{3,7})\s+([A-Z]{2,4})\b/g;

  let match;
  while ((match = itemRegex.exec(text)) !== null) {
    const rawRef = match[1].trim();
    const rawDesig = match[2].trim();
    const rawQty = parseInt(match[3], 10);
    const rawUnit = match[4].trim();

    // Ignore false matches like phone numbers or headers
    if (rawRef.includes('74287') || rawRef.includes('TUNISIE') || rawRef.includes('DEPOT')) {
      continue;
    }

    items.push({
      article_reference: rawRef,
      article_designation: rawDesig,
      quantity: rawQty,
      unit: rawUnit || 'RLX',
      colisage: 36
    });
  }

  // If item regex didn't catch, fallback to matching references followed by numbers
  if (items.length === 0) {
    const fallbackRegex = /([A-Z]{3,5}\d{2,4}\/?\d{0,4}[A-Z]{0,4})\s+([\w\s\.\-]+?)\s+(\d{3,6})\s*([A-Z]{2,4})?/g;
    while ((match = fallbackRegex.exec(text)) !== null) {
      items.push({
        article_reference: match[1].trim(),
        article_designation: match[2].trim(),
        quantity: parseInt(match[3], 10),
        unit: match[4] ? match[4].trim() : 'RLX',
        colisage: 36
      });
    }
  }

  return {
    bc_number: bcNumber || `BC-${Date.now().toString().slice(-6)}`,
    customer,
    reference_client: referenceClient || (bcNumber ? `BC ${bcNumber}` : ''),
    attention,
    depot,
    due_date: dueDate || new Date().toISOString().slice(0, 10),
    mandrin_type: mandrinType,
    carton_type: cartonType,
    epaisseur: '40Mu',
    items: items.length > 0 ? items : [
      {
        article_reference: '',
        article_designation: '',
        quantity: 1000,
        unit: 'RLX',
        colisage: 36
      }
    ],
    rawText: text
  };
}
