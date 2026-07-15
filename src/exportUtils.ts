import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatCurrency } from './utils';

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

  // Header Banner
  doc.setFillColor(37, 99, 235); // Blue #2563EB accent
  doc.rect(0, 0, 297, 15, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('COMMISSION MANAGEMENT SYSTEM - FINANCIAL REPORT', 12, 10);

  // Subtitle block
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`REPORT LEVEL: ${reportTitle.toUpperCase()}`, 12, 24);

  doc.setFont('helvetica', 'normal');
  doc.text(`Generated On: ${new Date().toLocaleString()}`, 12, 29);

  // Divider line
  doc.setDrawColor(220, 220, 220);
  doc.line(12, 33, 285, 33);

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
    // If header has (₹), or is GST, TDS, Payout, Paid, Pending, or any numeric column, align right
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
    startY: 38,
    head: [headers],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [37, 99, 235], // Blue accent
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

  const fileName = `Commission_Report_${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().substring(0, 10)}.pdf`;
  doc.save(fileName);
}
