import React, { useState } from 'react';
import { CommissionEntry, Project, Person } from '../types';
import { calculateCommission, formatCurrency } from '../utils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Calendar,
  Users,
  Building,
  CheckCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface ReportsManagerProps {
  entries: CommissionEntry[];
  projects: Project[];
  people: Person[];
}

type ReportType = 'executive' | 'broker' | 'project' | 'monthly';

export default function ReportsManager({ entries, projects, people }: ReportsManagerProps) {
  const [activeReport, setActiveReport] = useState<ReportType>('executive');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Compute calculated values per entry
  const enrichedEntries = entries.map((entry) => {
    const project = projects.find((p) => p.id === entry.projectId);
    const person = people.find((p) => p.id === entry.personId);
    const calc = calculateCommission(entry, entry.propertyValue);
    return {
      entry,
      project,
      person,
      calc,
    };
  });

  // 1. Compute Employee-wise report
  const getEmployeeReport = () => {
    const executives = people.filter((p) => p.type === 'Executive');
    const rows = executives.map((exec) => {
      const records = enrichedEntries.filter((e) => e.entry.personId === exec.id);
      const totalSales = records.length;
      const totalPropertyVal = records.reduce((sum, r) => sum + r.entry.propertyValue, 0);
      const totalBaseComm = records.reduce((sum, r) => sum + r.calc.eligibleCommissionCapped, 0);
      const totalBonus = records.reduce((sum, r) => sum + r.calc.bonusAmount, 0);
      const totalTds = records.reduce((sum, r) => sum + r.calc.tdsAmount, 0);
      const totalGst = records.reduce((sum, r) => sum + r.calc.gstAmount, 0);
      const totalNetComm = records.reduce((sum, r) => sum + r.calc.netCommission, 0);
      const totalPaid = records.reduce((sum, r) => sum + r.calc.totalPaid, 0);
      const totalPending = records.reduce((sum, r) => sum + r.calc.pendingAmount, 0);

      return {
        id: exec.id,
        name: exec.name,
        employeeId: exec.employeeId || 'N/A',
        totalSales,
        totalPropertyVal,
        totalBaseComm,
        totalBonus,
        totalTds,
        totalGst,
        totalNetComm,
        totalPaid,
        totalPending,
      };
    });

    // Remove rows with zero sales to keep report clean, or show all. Let's filter out 0 sales to highlight active.
    return rows.filter((r) => r.totalSales > 0);
  };

  // 2. Compute Broker-wise report
  const getBrokerReport = () => {
    const brokers = people.filter((p) => p.type === 'Broker');
    const rows = brokers.map((b) => {
      const records = enrichedEntries.filter((e) => e.entry.personId === b.id);
      const totalSales = records.length;
      const totalPropertyVal = records.reduce((sum, r) => sum + r.entry.propertyValue, 0);
      const totalBaseComm = records.reduce((sum, r) => sum + r.calc.eligibleCommissionCapped, 0);
      const totalBonus = records.reduce((sum, r) => sum + r.calc.bonusAmount, 0);
      const totalTds = records.reduce((sum, r) => sum + r.calc.tdsAmount, 0);
      const totalGst = records.reduce((sum, r) => sum + r.calc.gstAmount, 0);
      const totalNetComm = records.reduce((sum, r) => sum + r.calc.netCommission, 0);
      const totalPaid = records.reduce((sum, r) => sum + r.calc.totalPaid, 0);
      const totalPending = records.reduce((sum, r) => sum + r.calc.pendingAmount, 0);

      return {
        id: b.id,
        name: b.name,
        reraId: b.employeeId || 'N/A',
        totalSales,
        totalPropertyVal,
        totalBaseComm,
        totalBonus,
        totalTds,
        totalGst,
        totalNetComm,
        totalPaid,
        totalPending,
      };
    });

    return rows.filter((r) => r.totalSales > 0);
  };

  // 3. Compute Project-wise report
  const getProjectReport = () => {
    const rows = projects.map((p) => {
      const records = enrichedEntries.filter((e) => e.entry.projectId === p.id);
      const totalSales = records.length;
      const totalPropertyVal = records.reduce((sum, r) => sum + r.entry.propertyValue, 0);
      const totalBaseComm = records.reduce((sum, r) => sum + r.calc.eligibleCommissionCapped, 0);
      const totalBonus = records.reduce((sum, r) => sum + r.calc.bonusAmount, 0);
      const totalTds = records.reduce((sum, r) => sum + r.calc.tdsAmount, 0);
      const totalGst = records.reduce((sum, r) => sum + r.calc.gstAmount, 0);
      const totalNetComm = records.reduce((sum, r) => sum + r.calc.netCommission, 0);
      const totalPaid = records.reduce((sum, r) => sum + r.calc.totalPaid, 0);
      const totalPending = records.reduce((sum, r) => sum + r.calc.pendingAmount, 0);

      return {
        id: p.id,
        name: p.name,
        type: p.type,
        totalSales,
        totalPropertyVal,
        totalBaseComm,
        totalBonus,
        totalTds,
        totalGst,
        totalNetComm,
        totalPaid,
        totalPending,
      };
    });

    return rows.filter((r) => r.totalSales > 0);
  };

  // 4. Compute Monthly report
  const getMonthlyReport = () => {
    const monthlyMap: Record<string, any> = {};

    enrichedEntries.forEach((e) => {
      if (!e.entry.bookingDate) return;
      const date = new Date(e.entry.bookingDate);
      if (isNaN(date.getTime())) return;
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthLabel = `${monthNames[month]} ${year}`;
      const monthSortKey = `${year}-${String(month + 1).padStart(2, '0')}`;

      if (!monthlyMap[monthSortKey]) {
        monthlyMap[monthSortKey] = {
          sortKey: monthSortKey,
          period: monthLabel,
          totalSales: 0,
          totalPropertyVal: 0,
          totalBaseComm: 0,
          totalBonus: 0,
          totalTds: 0,
          totalGst: 0,
          totalNetComm: 0,
          totalPaid: 0,
          totalPending: 0,
        };
      }

      const item = monthlyMap[monthSortKey];
      item.totalSales += 1;
      item.totalPropertyVal += e.entry.propertyValue;
      item.totalBaseComm += e.calc.eligibleCommissionCapped;
      item.totalBonus += e.calc.bonusAmount;
      item.totalTds += e.calc.tdsAmount;
      item.totalGst += e.calc.gstAmount;
      item.totalNetComm += e.calc.netCommission;
      item.totalPaid += e.calc.totalPaid;
      item.totalPending += e.calc.pendingAmount;
    });

    return Object.values(monthlyMap).sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  };

  // Active Report calculation cache
  const reportRows = (() => {
    switch (activeReport) {
      case 'executive':
        return getEmployeeReport();
      case 'broker':
        return getBrokerReport();
      case 'project':
        return getProjectReport();
      case 'monthly':
        return getMonthlyReport();
    }
  })();

  // Grand totals of the computed table
  const totals = reportRows.reduce(
    (acc, row) => ({
      sales: acc.sales + row.totalSales,
      propertyVal: acc.propertyVal + row.totalPropertyVal,
      baseComm: acc.baseComm + row.totalBaseComm,
      bonus: acc.bonus + row.totalBonus,
      tds: acc.tds + row.totalTds,
      gst: acc.gst + row.totalGst,
      netComm: acc.netComm + row.totalNetComm,
      paid: acc.paid + row.totalPaid,
      pending: acc.pending + row.totalPending,
    }),
    { sales: 0, propertyVal: 0, baseComm: 0, bonus: 0, tds: 0, gst: 0, netComm: 0, paid: 0, pending: 0 }
  );

  // --- EXCEL EXPORT (using SheetJS xlsx) ---
  const handleExportExcel = () => {
    let exportData: any[] = [];
    const headers = getReportHeaders();

    if (activeReport === 'executive') {
      exportData = reportRows.map((r) => ({
        [headers[0]]: r.name,
        [headers[1]]: r.employeeId,
        [headers[2]]: r.totalSales,
        [headers[3]]: r.totalPropertyVal,
        [headers[4]]: r.totalBaseComm,
        [headers[5]]: r.totalBonus,
        [headers[6]]: r.totalTds,
        [headers[7]]: r.totalGst,
        [headers[8]]: r.totalNetComm,
        [headers[9]]: r.totalPaid,
        [headers[10]]: r.totalPending,
      }));
    } else if (activeReport === 'broker') {
      exportData = reportRows.map((r) => ({
        [headers[0]]: r.name,
        [headers[1]]: r.reraId,
        [headers[2]]: r.totalSales,
        [headers[3]]: r.totalPropertyVal,
        [headers[4]]: r.totalBaseComm,
        [headers[5]]: r.totalBonus,
        [headers[6]]: r.totalTds,
        [headers[7]]: r.totalGst,
        [headers[8]]: r.totalNetComm,
        [headers[9]]: r.totalPaid,
        [headers[10]]: r.totalPending,
      }));
    } else if (activeReport === 'project') {
      exportData = reportRows.map((r) => ({
        [headers[0]]: r.name,
        [headers[1]]: r.type,
        [headers[2]]: r.totalSales,
        [headers[3]]: r.totalPropertyVal,
        [headers[4]]: r.totalNetComm,
        [headers[5]]: r.totalPaid,
        [headers[6]]: r.totalPending,
      }));
    } else if (activeReport === 'monthly') {
      exportData = reportRows.map((r) => ({
        [headers[0]]: r.period,
        [headers[1]]: r.totalSales,
        [headers[2]]: r.totalPropertyVal,
        [headers[3]]: r.totalNetComm,
        [headers[4]]: r.totalPaid,
        [headers[5]]: r.totalPending,
      }));
    }

    // Add total row at end
    const totalRow: any = {};
    headers.forEach((h, idx) => {
      if (idx === 0) {
        totalRow[h] = 'GRAND TOTAL';
      } else if (idx === 1) {
        totalRow[h] = '';
      } else if (h === 'Bookings Count' || h === 'Sales Count') {
        totalRow[h] = totals.sales;
      } else if (h === 'Total Property Sales (₹)') {
        totalRow[h] = totals.propertyVal;
      } else if (h === 'Eligible Base Comm (₹)') {
        totalRow[h] = totals.baseComm;
      } else if (h === 'Total Bonus (₹)') {
        totalRow[h] = totals.bonus;
      } else if (h === 'TDS Withheld (₹)') {
        totalRow[h] = totals.tds;
      } else if (h === 'GST Added (₹)') {
        totalRow[h] = totals.gst;
      } else if (h === 'Net Commission (₹)') {
        totalRow[h] = totals.netComm;
      } else if (h === 'Paid Out (₹)') {
        totalRow[h] = totals.paid;
      } else if (h === 'Pending Amount (₹)') {
        totalRow[h] = totals.pending;
      }
    });
    exportData.push(totalRow);

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Commission Report');
    
    const fileName = `Commission_Report_${activeReport.toUpperCase()}_${new Date().toISOString().substring(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // --- PDF EXPORT (using jsPDF + jspdf-autotable) ---
  const handleExportPdf = () => {
    setPdfLoading(true);
    setPdfError(null);

    setTimeout(() => {
      try {
        const doc = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4',
        });

        // 1. Add Decorative Elements & Header
        doc.setFillColor(37, 99, 235); // Blue #2563EB accent
        doc.rect(0, 0, 297, 15, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('REAL ESTATE COMMISSION MANAGEMENT SYSTEM - AUDIT REPORT', 12, 10);

        // Subtitle block
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        const reportTitle = getReportTitleString();
        doc.text(`REPORT LEVEL: ${reportTitle.toUpperCase()}`, 12, 24);

        doc.setFont('helvetica', 'normal');
        doc.text(`Generated On: ${new Date().toLocaleString()}`, 12, 29);
        doc.text(`Current Active Record Filter Scope Count: ${entries.length} listings`, 12, 34);

        // Divider line
        doc.setDrawColor(220, 220, 220);
        doc.line(12, 38, 285, 38);

        // Prepare autotable parameters
        const tableHeaders = getReportHeaders();
        const tableRows: any[] = [];

        if (activeReport === 'executive') {
          reportRows.forEach((r) => {
            tableRows.push([
              r.name,
              r.employeeId,
              r.totalSales.toString(),
              formatCurrency(r.totalPropertyVal),
              formatCurrency(r.totalBaseComm),
              formatCurrency(r.totalBonus),
              formatCurrency(r.totalGst),
              formatCurrency(r.totalTds),
              formatCurrency(r.totalNetComm),
              formatCurrency(r.totalPaid),
              formatCurrency(r.totalPending),
            ]);
          });
          // Add totals row
          tableRows.push([
            'GRAND TOTAL',
            '',
            totals.sales.toString(),
            formatCurrency(totals.propertyVal),
            formatCurrency(totals.baseComm),
            formatCurrency(totals.bonus),
            formatCurrency(totals.gst),
            formatCurrency(totals.tds),
            formatCurrency(totals.netComm),
            formatCurrency(totals.paid),
            formatCurrency(totals.pending),
          ]);
        } else if (activeReport === 'broker') {
          reportRows.forEach((r) => {
            tableRows.push([
              r.name,
              r.reraId,
              r.totalSales.toString(),
              formatCurrency(r.totalPropertyVal),
              formatCurrency(r.totalBaseComm),
              formatCurrency(r.totalBonus),
              formatCurrency(r.totalGst),
              formatCurrency(r.totalTds),
              formatCurrency(r.totalNetComm),
              formatCurrency(r.totalPaid),
              formatCurrency(r.totalPending),
            ]);
          });
          // Add totals row
          tableRows.push([
            'GRAND TOTAL',
            '',
            totals.sales.toString(),
            formatCurrency(totals.propertyVal),
            formatCurrency(totals.baseComm),
            formatCurrency(totals.bonus),
            formatCurrency(totals.gst),
            formatCurrency(totals.tds),
            formatCurrency(totals.netComm),
            formatCurrency(totals.paid),
            formatCurrency(totals.pending),
          ]);
        } else if (activeReport === 'project') {
          reportRows.forEach((r) => {
            tableRows.push([
              r.name,
              r.type,
              r.totalSales.toString(),
              formatCurrency(r.totalPropertyVal),
              formatCurrency(r.totalNetComm),
              formatCurrency(r.totalPaid),
              formatCurrency(r.totalPending),
            ]);
          });
          // Add totals row
          tableRows.push([
            'GRAND TOTAL',
            '',
            totals.sales.toString(),
            formatCurrency(totals.propertyVal),
            formatCurrency(totals.netComm),
            formatCurrency(totals.paid),
            formatCurrency(totals.pending),
          ]);
        } else if (activeReport === 'monthly') {
          reportRows.forEach((r) => {
            tableRows.push([
              r.period,
              r.totalSales.toString(),
              formatCurrency(r.totalPropertyVal),
              formatCurrency(r.totalNetComm),
              formatCurrency(r.totalPaid),
              formatCurrency(r.totalPending),
            ]);
          });
          // Add totals
          tableRows.push([
            'GRAND TOTAL',
            totals.sales.toString(),
            formatCurrency(totals.propertyVal),
            formatCurrency(totals.netComm),
            formatCurrency(totals.paid),
            formatCurrency(totals.pending),
          ]);
        }

        // Alignments: numbers right-aligned, text left-aligned
        // Columns index 2 and above are numbers in all tables
        const columnStyles: any = {};
        tableHeaders.forEach((_, colIndex) => {
          if (colIndex >= 2) {
            columnStyles[colIndex] = { halign: 'right' };
          } else {
            columnStyles[colIndex] = { halign: 'left' };
          }
        });
        // Special override for monthly where index 1 is also a number (sales count)
        if (activeReport === 'monthly') {
          columnStyles[1] = { halign: 'right' };
        }

        autoTable(doc, {
          startY: 44,
          head: [tableHeaders],
          body: tableRows,
          theme: 'striped',
          headStyles: {
            fillColor: [30, 41, 59], // Dark charcoal gray for professional look
            textColor: 255,
            fontSize: 8.5,
            fontStyle: 'bold',
          },
          bodyStyles: {
            fontSize: 8,
          },
          footStyles: {
            fillColor: [243, 244, 246],
            textColor: 30,
            fontSize: 8,
            fontStyle: 'bold',
          },
          columnStyles: columnStyles,
          didParseCell: (data) => {
            // style the last row (Grand Total) specially
            if (data.row.index === tableRows.length - 1) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [243, 244, 246]; // gray 100 background
            }
          }
        });

        const periodStr = new Date().toISOString().substring(0, 7); // e.g. "2026-07"
        const fileName = `Commission_Report_${activeReport.toUpperCase()}_${periodStr}.pdf`;
        
        doc.save(fileName);
        setPdfLoading(false);
      } catch (err: any) {
        setPdfLoading(false);
        setPdfError(err?.message || 'Error occurred generating layout PDF. Please retry.');
      }
    }, 800); // UI breathing room for the loading state spinner to show up cleanly!
  };

  const getReportHeaders = () => {
    switch (activeReport) {
      case 'executive':
        return [
          'Executive Name',
          'Employee ID',
          'Bookings Count',
          'Total Property Sales (₹)',
          'Eligible Base Comm (₹)',
          'Total Bonus (₹)',
          'GST Added (₹)',
          'TDS Withheld (₹)',
          'Net Commission (₹)',
          'Paid Out (₹)',
          'Pending Amount (₹)',
        ];
      case 'broker':
        return [
          'Broker Name',
          'Broker RERA ID',
          'Sales Count',
          'Total Property Sales (₹)',
          'Eligible Base Comm (₹)',
          'Total Bonus (₹)',
          'GST Added (₹)',
          'TDS Withheld (₹)',
          'Net Commission (₹)',
          'Paid Out (₹)',
          'Pending Amount (₹)',
        ];
      case 'project':
        return [
          'Project Name',
          'Classification',
          'Units Booked',
          'Total Property Sales (₹)',
          'Net Commission (₹)',
          'Paid Out (₹)',
          'Pending Amount (₹)',
        ];
      case 'monthly':
        return [
          'Calendar Month',
          'Bookings Count',
          'Total Property Sales (₹)',
          'Net Commission (₹)',
          'Paid Out (₹)',
          'Pending Amount (₹)',
        ];
    }
  };

  const getReportTitleString = () => {
    switch (activeReport) {
      case 'executive':
        return 'Employee-wise Commission Statement';
      case 'broker':
        return 'Broker & Channel Partner Statement';
      case 'project':
        return 'Project Portfolio Commission Overview';
      case 'monthly':
        return 'Monthly Sales Volume Ledger';
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Selection Tabs */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-4.5 flex items-center justify-between flex-wrap gap-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveReport('executive')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeReport === 'executive'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50 border border-gray-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Sales Executives
          </button>
          <button
            onClick={() => setActiveReport('broker')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeReport === 'broker'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50 border border-gray-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Brokers & CPs
          </button>
          <button
            onClick={() => setActiveReport('project')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeReport === 'project'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50 border border-gray-100'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            Project Portfolios
          </button>
          <button
            onClick={() => setActiveReport('monthly')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeReport === 'monthly'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50 border border-gray-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Monthly Audits
          </button>
        </div>

        {/* Exports Buttons */}
        <div className="flex items-center gap-2">
          {/* Excel Export Button */}
          <button
            onClick={handleExportExcel}
            disabled={reportRows.length === 0}
            className="flex items-center gap-1 px-3.5 py-2 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 border border-emerald-200 rounded-lg cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Excel Export
          </button>

          {/* PDF Export Button with loading state */}
          <button
            onClick={handleExportPdf}
            disabled={reportRows.length === 0 || pdfLoading}
            className="flex items-center gap-1 px-3.5 py-2 text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 border border-blue-200 rounded-lg cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pdfLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                PDF Export
              </>
            )}
          </button>
        </div>
      </div>

      {/* PDF Generation Error notifications */}
      {pdfError && (
        <div className="bg-red-50 border border-red-200 p-3.5 rounded-lg flex items-center gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{pdfError}</span>
        </div>
      )}

      {/* Report Table Display */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <h3 className="font-extrabold text-gray-800 text-xs uppercase tracking-wider">
            {getReportTitleString()}
          </h3>
        </div>

        {reportRows.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <Users className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-xs text-gray-500 font-bold">No matching data fits this audit type</p>
            <p className="text-[11px] text-gray-400">
              Ensure you have created active bookings that map to this stakeholder classification.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100/50 border-b border-gray-200">
                  {getReportHeaders().map((h, i) => (
                    <th
                      key={h}
                      className={`p-3 font-bold text-gray-500 uppercase tracking-wider text-[9px] ${
                        i >= 2 ? 'text-right' : 'text-left'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {/* 1. RENDER EMPLOYEE OR BROKER REPORTS */}
                {(activeReport === 'executive' || activeReport === 'broker') &&
                  reportRows.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors font-medium text-gray-700">
                      <td className="p-3 font-bold text-gray-900">{r.name}</td>
                      <td className="p-3 text-gray-400 font-bold">{'employeeId' in r ? r.employeeId : r.reraId}</td>
                      <td className="p-3 text-right text-gray-900 font-bold">{r.totalSales}</td>
                      <td className="p-3 text-right font-mono text-gray-500">{formatCurrency(r.totalPropertyVal)}</td>
                      <td className="p-3 text-right font-mono text-gray-500">{formatCurrency(r.totalBaseComm)}</td>
                      <td className="p-3 text-right font-mono text-emerald-600">{formatCurrency(r.totalBonus)}</td>
                      <td className="p-3 text-right font-mono text-blue-600">{formatCurrency(r.totalGst)}</td>
                      <td className="p-3 text-right font-mono text-red-500">{formatCurrency(r.totalTds)}</td>
                      <td className="p-3 text-right font-mono text-blue-700 font-extrabold">{formatCurrency(r.totalNetComm)}</td>
                      <td className="p-3 text-right font-mono text-emerald-600 font-bold">{formatCurrency(r.totalPaid)}</td>
                      <td className="p-3 text-right font-mono text-amber-600 font-bold">{formatCurrency(r.totalPending)}</td>
                    </tr>
                  ))}

                {/* 2. RENDER PROJECT REPORT */}
                {activeReport === 'project' &&
                  reportRows.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors font-medium text-gray-700">
                      <td className="p-3 font-bold text-gray-900">{r.name}</td>
                      <td className="p-3">
                        <span className="bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-md text-[10px] font-bold">
                          {r.type}
                        </span>
                      </td>
                      <td className="p-3 text-right text-gray-900 font-bold">{r.totalSales}</td>
                      <td className="p-3 text-right font-mono text-gray-500">{formatCurrency(r.totalPropertyVal)}</td>
                      <td className="p-3 text-right font-mono text-blue-700 font-extrabold">{formatCurrency(r.totalNetComm)}</td>
                      <td className="p-3 text-right font-mono text-emerald-600 font-bold">{formatCurrency(r.totalPaid)}</td>
                      <td className="p-3 text-right font-mono text-amber-600 font-bold">{formatCurrency(r.totalPending)}</td>
                    </tr>
                  ))}

                {/* 3. RENDER MONTHLY REPORT */}
                {activeReport === 'monthly' &&
                  reportRows.map((r) => (
                    <tr key={r.sortKey} className="hover:bg-gray-50/50 transition-colors font-medium text-gray-700">
                      <td className="p-3 font-bold text-gray-900">{r.period}</td>
                      <td className="p-3 text-right text-gray-900 font-bold">{r.totalSales}</td>
                      <td className="p-3 text-right font-mono text-gray-500">{formatCurrency(r.totalPropertyVal)}</td>
                      <td className="p-3 text-right font-mono text-blue-700 font-extrabold">{formatCurrency(r.totalNetComm)}</td>
                      <td className="p-3 text-right font-mono text-emerald-600 font-bold">{formatCurrency(r.totalPaid)}</td>
                      <td className="p-3 text-right font-mono text-amber-600 font-bold">{formatCurrency(r.totalPending)}</td>
                    </tr>
                  ))}

                {/* GRAND TOTAL ROW */}
                <tr className="bg-gray-100/80 font-extrabold text-gray-900 border-t border-gray-300">
                  <td className="p-3 uppercase">Grand Total</td>
                  {activeReport !== 'monthly' && <td className="p-3"></td>}
                  <td className="p-3 text-right">{totals.sales}</td>
                  <td className="p-3 text-right font-mono">{formatCurrency(totals.propertyVal)}</td>
                  
                  {/* Executive/Broker has columns for base, bonus, gst, tds */}
                  {(activeReport === 'executive' || activeReport === 'broker') && (
                    <>
                      <td className="p-3 text-right font-mono">{formatCurrency(totals.baseComm)}</td>
                      <td className="p-3 text-right font-mono">{formatCurrency(totals.bonus)}</td>
                      <td className="p-3 text-right font-mono">{formatCurrency(totals.gst)}</td>
                      <td className="p-3 text-right font-mono">{formatCurrency(totals.tds)}</td>
                    </>
                  )}

                  <td className="p-3 text-right font-mono text-blue-700">{formatCurrency(totals.netComm)}</td>
                  <td className="p-3 text-right font-mono text-emerald-600">{formatCurrency(totals.paid)}</td>
                  <td className="p-3 text-right font-mono text-amber-600">{formatCurrency(totals.pending)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
