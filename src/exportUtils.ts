import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatCurrency } from './utils';
import { Broker, Sale, Commission } from './types';

export interface ReportTotals {
  sales: number;
  baseCommission: number;
  gstAmount: number;
  tdsAmount: number;
  finalAmount: number;
  paid: number;
  pending: number;
}

/**
 * Generates and downloads an Excel file of the current report table data.
 */
export function exportToExcel(
  reportTitle: string,
  headers: string[],
  rows: any[],
  totals: ReportTotals
) {
  // Map rows to Excel friendly JSON objects
  const exportRows = rows.map(r => {
    const rowObj: any = {};
    headers.forEach((h, idx) => {
      rowObj[h] = r[idx];
    });
    return rowObj;
  });

  // Create totals row
  const totalRow: any = {};
  headers.forEach((h, idx) => {
    if (idx === 0) {
      totalRow[h] = 'GRAND TOTAL';
    } else if (h.toLowerCase().includes('role')) {
      totalRow[h] = '';
    } else if (h.toLowerCase().includes('sales')) {
      totalRow[h] = totals.sales;
    } else if (h.toLowerCase().includes('base')) {
      totalRow[h] = totals.baseCommission;
    } else if (h.toLowerCase().includes('gst')) {
      totalRow[h] = totals.gstAmount;
    } else if (h.toLowerCase().includes('tds')) {
      totalRow[h] = totals.tdsAmount;
    } else if (h.toLowerCase().includes('final') || h.toLowerCase().includes('commission') || h.toLowerCase().includes('payout')) {
      totalRow[h] = totals.finalAmount;
    } else if (h.toLowerCase().includes('paid')) {
      totalRow[h] = totals.paid;
    } else if (h.toLowerCase().includes('pending')) {
      totalRow[h] = totals.pending;
    } else {
      totalRow[h] = '';
    }
  });
  exportRows.push(totalRow);

  const ws = XLSX.utils.json_to_sheet(exportRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Commission Report');
  
  const fileName = `Commission_Report_${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().substring(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Generates and downloads a PDF file of the current report table data.
 */
/**
 * Procedurally draws the SyncAI Consultancy Pvt. Ltd. brand logo in the PDF.
 * This is 100% vector-crisp, synchronous, and doesn't rely on browser DOM canvas.
 */
export function drawPdfLogo(doc: jsPDF, x: number, y: number) {
  const blueColor = [26, 58, 110]; // #1a3a6e (Deep Blue)
  const tealColor = [15, 155, 142]; // #0f9b8e (Teal)
  const greenColor = [20, 163, 129]; // #14a381 (Green-Teal)

  // 1. Draw S-Shape Network Graph Connection Lines
  doc.setLineWidth(0.35);
  
  // Scale of SVG units to mm (viewBox is 460x190, we map S (0-140) to ~14mm scale)
  const scale = 0.08; 
  const p = (px: number) => x + px * scale;
  const q = (py: number) => y + py * scale;

  // Blue outer track lines
  doc.setDrawColor(blueColor[0], blueColor[1], blueColor[2]);
  doc.line(p(95), q(45), p(70), q(30));
  doc.line(p(70), q(30), p(40), q(45));
  doc.line(p(40), q(45), p(25), q(75));

  // Teal transition track lines
  doc.setDrawColor(tealColor[0], tealColor[1], tealColor[2]);
  doc.line(p(25), q(75), p(60), q(90));
  doc.line(p(60), q(90), p(95), q(105));
  doc.line(p(95), q(105), p(110), q(135));
  doc.line(p(110), q(135), p(85), q(170));

  // Blue bottom track lines
  doc.setDrawColor(blueColor[0], blueColor[1], blueColor[2]);
  doc.line(p(85), q(170), p(55), q(180));
  doc.line(p(55), q(180), p(25), q(165));

  // Inner track stabilizers
  doc.setDrawColor(tealColor[0], tealColor[1], tealColor[2]);
  doc.line(p(95), q(45), p(70), q(55));
  doc.line(p(40), q(45), p(45), q(105));
  doc.line(p(25), q(75), p(45), q(105));
  doc.line(p(60), q(90), p(70), q(55));
  doc.line(p(60), q(90), p(45), q(105));

  doc.setDrawColor(greenColor[0], greenColor[1], greenColor[2]);
  doc.line(p(95), q(105), p(85), q(135));
  doc.line(p(110), q(135), p(85), q(135));
  doc.line(p(85), q(170), p(55), q(150));

  doc.setDrawColor(blueColor[0], blueColor[1], blueColor[2]);
  doc.line(p(25), q(165), p(55), q(150));

  // Draw node circles (filled outer track)
  doc.setFillColor(tealColor[0], tealColor[1], tealColor[2]);
  doc.circle(p(95), q(45), 0.6, 'FD');
  doc.circle(p(60), q(90), 0.6, 'FD');
  doc.circle(p(95), q(105), 0.6, 'FD');
  doc.circle(p(85), q(170), 0.6, 'FD');

  doc.setFillColor(blueColor[0], blueColor[1], blueColor[2]);
  doc.circle(p(70), q(30), 0.7, 'FD');
  doc.circle(p(40), q(45), 0.6, 'FD');
  doc.circle(p(25), q(75), 0.7, 'FD');
  doc.circle(p(55), q(180), 0.7, 'FD');
  doc.circle(p(25), q(165), 0.6, 'FD');

  doc.setFillColor(greenColor[0], greenColor[1], greenColor[2]);
  doc.circle(p(110), q(135), 0.7, 'FD');

  // Inner track helper nodes
  doc.setFillColor(tealColor[0], tealColor[1], tealColor[2]);
  doc.circle(p(70), q(55), 0.45, 'FD');
  doc.circle(p(45), q(105), 0.45, 'FD');
  doc.setFillColor(greenColor[0], greenColor[1], greenColor[2]);
  doc.circle(p(85), q(135), 0.45, 'FD');
  doc.circle(p(55), q(150), 0.45, 'FD');

  // 2. Draw Text Content
  // "ync" part
  doc.setTextColor(blueColor[0], blueColor[1], blueColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16.5);
  doc.text('ync', x + 10.4, y + 8.8);

  // "AI" part
  doc.setTextColor(tealColor[0], tealColor[1], tealColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18.5);
  doc.text('AI', x + 20.4, y + 8.8);

  // Micro circuit cog above AI
  const cx = x + 28.4;
  const cy = y + 3.36;
  doc.setDrawColor(tealColor[0], tealColor[1], tealColor[2]);
  doc.setLineWidth(0.2);
  doc.circle(cx, cy, 0.7, 'S');
  doc.setFillColor(tealColor[0], tealColor[1], tealColor[2]);
  doc.circle(cx, cy, 0.3, 'FD');

  // Circuit terminals (Cardinal)
  doc.line(cx, cy - 0.7, cx, cy - 2.0);
  doc.circle(cx, cy - 2.0, 0.3, 'FD');
  doc.line(cx, cy + 0.7, cx, cy + 2.0);
  doc.circle(cx, cy + 2.0, 0.3, 'FD');
  doc.line(cx - 0.7, cy, cx - 2.0, cy);
  doc.circle(cx - 2.0, cy, 0.3, 'FD');
  doc.line(cx + 0.7, cy, cx + 2.0, cy);
  doc.circle(cx + 2.0, cy, 0.3, 'FD');

  // Consultancy Pvt. Ltd. subtitle
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.text('Consultancy Pvt. Ltd.', x + 10.6, y + 12.8);
}

/**
 * Generates and downloads a PDF file of the current report table data.
 */
export function exportToPDF(
  reportTitle: string,
  headers: string[],
  rows: any[],
  totals: ReportTotals
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Top elegant corporate white header with Brand Logo
  drawPdfLogo(doc, 12, 8);

  doc.setTextColor(26, 58, 110); // Deep Blue #1a3a6e
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('FINANCIAL REPORT', 285, 14, { align: 'right' });

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('SyncAI Commission Ledger & Government TDS Cockpit', 285, 19, { align: 'right' });

  // Subtitle block
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`REPORT LEVEL: ${reportTitle.toUpperCase()}`, 12, 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Generated On: ${new Date().toLocaleString()}`, 12, 33);

  // Divider line
  doc.setDrawColor(226, 232, 240);
  doc.line(12, 36, 285, 36);

  // Prepare table rows by mapping and formatting numerical columns
  const tableRows = rows.map(r => r.map((cell: any) => {
    if (typeof cell === 'number') {
      return formatCurrency(cell);
    }
    return cell;
  }));

  // Add Grand Total row
  const totalRow = headers.map((h, idx) => {
    if (idx === 0) return 'GRAND TOTAL';
    if (h.toLowerCase().includes('role')) return '';
    if (h.toLowerCase().includes('sales')) return formatCurrency(totals.sales);
    if (h.toLowerCase().includes('base')) return formatCurrency(totals.baseCommission);
    if (h.toLowerCase().includes('gst')) return formatCurrency(totals.gstAmount);
    if (h.toLowerCase().includes('tds')) return formatCurrency(totals.tdsAmount);
    if (h.toLowerCase().includes('final') || h.toLowerCase().includes('commission') || h.toLowerCase().includes('payout')) return formatCurrency(totals.finalAmount);
    if (h.toLowerCase().includes('paid')) return formatCurrency(totals.paid);
    if (h.toLowerCase().includes('pending')) return formatCurrency(totals.pending);
    return '';
  });
  tableRows.push(totalRow);

  // Alignments: numbers right-aligned, text left-aligned
  const columnStyles: any = {};
  headers.forEach((h, colIdx) => {
    const lowerHeader = h.toLowerCase();
    if (
      lowerHeader.includes('(₹)') || 
      lowerHeader.includes('sales') || 
      lowerHeader.includes('commission') || 
      lowerHeader.includes('gst') || 
      lowerHeader.includes('tds') || 
      lowerHeader.includes('paid') || 
      lowerHeader.includes('pending') ||
      lowerHeader.includes('payout')
    ) {
      columnStyles[colIdx] = { halign: 'right' };
    } else {
      columnStyles[colIdx] = { halign: 'left' };
    }
  });

  autoTable(doc, {
    startY: 40,
    head: [headers],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [26, 110, 142], // Teal-blue brand color (#1a6e8e)
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles,
    styles: {
      fontSize: 8.5,
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: 15,
      fontStyle: 'bold',
    }
  });

  const fileName = `Financial_Report_SyncAI_${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().substring(0, 10)}.pdf`;
  doc.save(fileName);
}

/**
 * Generates a professional PDF statement for a single Broker.
 */
export function generateBrokerStatementPDF(
  companyName: string,
  broker: Broker,
  brokerSales: Sale[]
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Calculate Aggregates
  const totalSalesCount = brokerSales.length;
  const totalSalesAmount = brokerSales.reduce((sum, s) => sum + s.sale_amount, 0);
  const totalGrossCommission = brokerSales.reduce((sum, s) => sum + s.gross_commission, 0);
  const totalGstAmount = brokerSales.reduce((sum, s) => sum + s.gst_amount, 0);
  const totalTdsAmount = brokerSales.reduce((sum, s) => sum + s.tds_amount, 0);
  const totalNetCommission = brokerSales.reduce((sum, s) => sum + s.net_commission, 0);

  // 1. Corporate Identity / Header with Brand Logo
  drawPdfLogo(doc, 15, 15);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Premium Real Estate Brokerage & Commission Services', 15, 33);

  // Title on right side
  doc.setTextColor(26, 58, 110); // Deep Blue #1a3a6e
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('COMMISSION STATEMENT', 130, 22);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Statement Date: ${new Date().toLocaleDateString('en-IN')}`, 130, 26);

  // Horizontal divider
  doc.setDrawColor(226, 232, 240);
  doc.line(15, 37, 195, 37);

  // 2. Information Block (Broker & Company details side-by-side)
  doc.setTextColor(26, 58, 110); // Deep Blue section title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('BROKER DETAILS', 15, 44);

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(broker.name, 15, 50);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Broker ID: ${broker.id}`, 15, 55);
  doc.text(`Mobile: ${broker.mobile}`, 15, 60);
  doc.text(`Email: ${broker.email}`, 15, 65);
  doc.text(`PAN: ${broker.pan_number || 'N/A'}`, 15, 70);
  doc.text(`GSTIN: ${broker.gst_number || 'N/A'}`, 15, 75);

  // Bank Info under broker info or as a separate column on right
  doc.setTextColor(26, 58, 110);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('BANK DETAILS', 115, 44);

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(broker.bank_account_name || broker.name, 115, 50);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Account No: ${broker.bank_account_number || 'N/A'}`, 115, 55);
  doc.text(`IFSC Code: ${broker.bank_ifsc || 'N/A'}`, 115, 60);
  doc.text(`Commission Setup: ${broker.commission_type}`, 115, 65);
  doc.text(`GST Rate: ${broker.gst_percentage}%  |  TDS Rate: ${broker.tds_percentage}%`, 115, 70);
  doc.text(`Status: ${broker.status}`, 115, 75);

  // Horizontal divider
  doc.line(15, 79, 195, 79);

  // 3. Performance Aggregates Callout Box
  doc.setFillColor(248, 250, 252);
  doc.rect(15, 83, 180, 25, 'F');
  doc.setDrawColor(241, 245, 249);
  doc.rect(15, 83, 180, 25, 'S');

  // Box content columns
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('TOTAL SOLD', 20, 89);
  doc.text('TOTAL VALUE', 55, 89);
  doc.text('GROSS COMM.', 95, 89);
  doc.text('TDS & GST DED.', 135, 89);
  doc.text('NET PAYABLE', 168, 89);

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`${totalSalesCount} Flats`, 20, 98);
  doc.text(formatCurrency(totalSalesAmount), 55, 98);
  doc.text(formatCurrency(totalGrossCommission), 95, 98);

  // Deductions calculation (TDS + GST)
  const totalDeductions = totalGstAmount + totalTdsAmount;
  doc.setTextColor(220, 38, 38); // Red for deductions
  doc.text(formatCurrency(totalDeductions), 135, 98);

  doc.setTextColor(15, 155, 142); // Brand Teal for net payable
  doc.text(formatCurrency(totalNetCommission), 168, 98);

  // Label text under totals
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Sales Volume', 20, 103);
  doc.text('Aggregate Sales Value', 55, 103);
  doc.text('Earned Base Amount', 95, 103);
  doc.text(`GST:${formatCurrency(totalGstAmount)} | TDS:${formatCurrency(totalTdsAmount)}`, 135, 103);
  doc.text('Total Net Earnings', 168, 103);

  // 4. Detailed Sales & Commissions Table
  doc.setTextColor(26, 58, 110);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('DETAILED SALES LOG', 15, 116);

  const tableHeaders = ['Date', 'Project / Flat', 'Customer Name', 'Sale Value', 'Gross Comm.', 'GST', 'TDS', 'Net Comm.'];
  const tableRows = brokerSales.map(sale => [
    sale.booking_date,
    `${sale.project_name || 'N/A'}\nFlat: ${sale.flat_number || 'N/A'}`,
    sale.customer_name || 'N/A',
    formatCurrency(sale.sale_amount),
    formatCurrency(sale.gross_commission),
    formatCurrency(sale.gst_amount),
    formatCurrency(sale.tds_amount),
    formatCurrency(sale.net_commission)
  ]);

  autoTable(doc, {
    startY: 121,
    head: [tableHeaders],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [26, 110, 142], // Teal-blue brand color (#1a6e8e)
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 32 },
      2: { cellWidth: 32 },
      3: { halign: 'right', cellWidth: 22 },
      4: { halign: 'right', cellWidth: 22 },
      5: { halign: 'right', cellWidth: 16 },
      6: { halign: 'right', cellWidth: 16 },
      7: { halign: 'right', cellWidth: 22 }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY || 180;

  // 5. Bottom Totals Summary Block
  const blockY = finalY + 8;
  if (blockY < 240) {
    doc.setFillColor(248, 250, 252);
    doc.rect(115, blockY, 80, 25, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(115, blockY, 80, 25, 'S');

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Gross Commission Total:', 118, blockY + 6);
    doc.text('Total GST Component:', 118, blockY + 11);
    doc.text('Total TDS Component:', 118, blockY + 16);

    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text('Net Commission Payable:', 118, blockY + 21);

    // Amounts aligned right
    doc.setFont('helvetica', 'normal');
    doc.text(formatCurrency(totalGrossCommission), 190, blockY + 6, { align: 'right' });
    doc.text(formatCurrency(totalGstAmount), 190, blockY + 11, { align: 'right' });
    doc.text(formatCurrency(totalTdsAmount), 190, blockY + 16, { align: 'right' });
    
    doc.setTextColor(15, 155, 142); // Brand Teal
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(totalNetCommission), 190, blockY + 21, { align: 'right' });

    // Authorized Signature
    doc.setDrawColor(148, 163, 184);
    doc.line(15, blockY + 20, 75, blockY + 20);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Authorized Signatory', 15, blockY + 24);
    doc.text(companyName || 'SyncAI Consultancy Pvt. Ltd.', 15, blockY + 28);
  } else {
    // If not enough space, add a new page for signatures & final totals
    doc.addPage();
    doc.setFillColor(248, 250, 252);
    doc.rect(15, 20, 180, 30, 'F');

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Gross Commission Total:', 20, 28);
    doc.text('Total GST Component:', 20, 34);
    doc.text('Total TDS Component:', 20, 40);
    doc.setFont('helvetica', 'bold');
    doc.text('Net Commission Payable:', 20, 46);

    doc.setFont('helvetica', 'normal');
    doc.text(formatCurrency(totalGrossCommission), 190, 28, { align: 'right' });
    doc.text(formatCurrency(totalGstAmount), 190, 34, { align: 'right' });
    doc.text(formatCurrency(totalTdsAmount), 190, 40, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 155, 142); // Brand Teal
    doc.text(formatCurrency(totalNetCommission), 190, 46, { align: 'right' });

    doc.setDrawColor(148, 163, 184);
    doc.line(15, 80, 85, 80);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Authorized Signatory', 15, 85);
    doc.text(companyName || 'SyncAI Consultancy Pvt. Ltd.', 15, 90);
  }

  // Save the PDF
  const filename = `Commission_Statement_${broker.name.replace(/\s+/g, '_')}_${broker.id}.pdf`;
  doc.save(filename);
}
