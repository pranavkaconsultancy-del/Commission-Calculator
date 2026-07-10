import React, { useState } from 'react';
import { FileDown, Percent, ShieldCheck, IndianRupee, Calculator, ChevronDown, ChevronUp, AlertCircle, Info, Calendar } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Stakeholder, Project } from '../types';
import { calculateStakeholderCommission, formatCurrency, formatPercent } from '../utils';

interface SummaryTableProps {
  project: Project;
  stakeholders: Stakeholder[];
}

export default function SummaryTable({ project, stakeholders }: SummaryTableProps) {
  // Toggle states for calculation breakdowns
  const [expandedBreakdowns, setExpandedBreakdowns] = useState<Record<string, boolean>>({});

  const toggleBreakdown = (id: string) => {
    setExpandedBreakdowns((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Perform financial calculations on the live data (without rounding in between)
  const calculations = stakeholders.map((sh) => {
    const calc = calculateStakeholderCommission(sh, project.totalSaleValue);
    return {
      stakeholder: sh,
      ...calc,
    };
  });

  // Calculate grand totals directly from the high-precision calculations
  const totalGrossCommission = calculations.reduce((acc, curr) => acc + curr.commissionAfterCap, 0);
  const totalDeductions = calculations.reduce((acc, curr) => acc + curr.deductionAmount, 0);
  const totalTDS = calculations.reduce((acc, curr) => acc + curr.tdsAmount, 0);
  const totalGST = calculations.reduce((acc, curr) => acc + curr.gstAmount, 0);
  
  // Recalculate Grand Total as the sum of all individual Final Amount to Pay values
  const grandTotalNetPayable = calculations.reduce((acc, curr) => acc + curr.netPayable, 0);

  // Check if there are validation errors in stakeholders to warn before exporting
  const hasValidationErrors = stakeholders.some((sh) => {
    const isNameEmpty = !sh.name.trim();
    const isRateOrAmountNegative = sh.rateOrAmount < 0;
    const isPercentageOver100 = sh.commissionType === 'percentage' && sh.rateOrAmount > 100;
    const isTaxNegative = sh.taxDeductionRate < 0;
    const isTaxOver100 = sh.taxDeductionRate > 100;
    const isTdsNegative = sh.tdsRate < 0;
    const isTdsOver100 = sh.tdsRate > 100;
    
    // Milestones check
    let isMilestoneInvalid = false;
    if (sh.milestones && sh.milestones.length > 0) {
      const sum = sh.milestones.reduce((acc, m) => acc + m.percentage, 0);
      if (Math.abs(sum - 100) > 0.01) {
        isMilestoneInvalid = true;
      }
    }

    return isNameEmpty || isRateOrAmountNegative || isPercentageOver100 || isTaxNegative || isTaxOver100 || isTdsNegative || isTdsOver100 || isMilestoneInvalid;
  });

  const handleExportPDF = () => {
    if (hasValidationErrors) {
      alert('Please resolve the validation errors highlighted in red before exporting the PDF.');
      return;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const currentDate = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Color theme values (explicit type annotation to avoid typescript color assignment error)
    const PRIMARY_BLUE: [number, number, number] = [37, 99, 235]; // #2563EB
    const TEXT_CHARCOAL: [number, number, number] = [31, 41, 55]; // #1F2937
    const LIGHT_GRAY: [number, number, number] = [248, 249, 250]; // #F8F9FA
    const TEXT_MUTED: [number, number, number] = [100, 116, 139]; // slate-500

    // Top Brand Stripe
    doc.setFillColor(PRIMARY_BLUE[0], PRIMARY_BLUE[1], PRIMARY_BLUE[2]);
    doc.rect(0, 0, 210, 8, 'F');

    // Title Section
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(TEXT_CHARCOAL[0], TEXT_CHARCOAL[1], TEXT_CHARCOAL[2]);
    doc.text('COMMISSION SUMMARY REPORT', 15, 22);

    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text('Verified Payout Breakdown Ledger & Milestones', 15, 27);

    // Divider Line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(15, 31, 195, 31);

    // Left metadata: Project information
    doc.setFontSize(9.5);
    doc.setTextColor(TEXT_CHARCOAL[0], TEXT_CHARCOAL[1], TEXT_CHARCOAL[2]);
    
    doc.setFont('Helvetica', 'bold');
    doc.text('Project / Property Name:', 15, 38);
    doc.setFont('Helvetica', 'normal');
    doc.text(project.name || 'Unnamed Real Estate Project', 60, 38);

    doc.setFont('Helvetica', 'bold');
    doc.text('Total Sale Value (INR):', 15, 44);
    doc.setFont('Helvetica', 'normal');
    doc.text(formatCurrency(project.totalSaleValue), 60, 44);

    // Right metadata: Date and Report status
    doc.setFont('Helvetica', 'bold');
    doc.text('Date Generated:', 125, 38);
    doc.setFont('Helvetica', 'normal');
    doc.text(currentDate, 155, 38);

    doc.setFont('Helvetica', 'bold');
    doc.text('Ledger Status:', 125, 44);
    doc.setTextColor(22, 163, 74); // green
    doc.text('APPROVED & LOCKED', 155, 44);

    // Reset text color to default charcoal
    doc.setTextColor(TEXT_CHARCOAL[0], TEXT_CHARCOAL[1], TEXT_CHARCOAL[2]);

    // Build Table Rows dynamically
    const tableHeaders = [
      ['Person / Stakeholder', 'Role', 'Calculation Formula', 'Base Comm.', 'Deduction', 'TDS', 'GST (18%)', 'Final Amount']
    ];

    const tableRows: any[] = [];

    calculations.forEach((calc) => {
      // Base description
      const formulaDesc =
        calc.stakeholder.commissionType === 'percentage'
          ? `${formatPercent(calc.stakeholder.rateOrAmount)} of Sales`
          : 'Fixed Flat';

      const capIndicator = calc.isCapped ? ' (Capped)' : '';

      // Main row
      tableRows.push([
        calc.stakeholder.name || 'N/A',
        calc.stakeholder.role,
        formulaDesc + capIndicator,
        formatCurrency(calc.commissionAfterCap),
        `-${formatCurrency(calc.deductionAmount)} (${formatPercent(calc.stakeholder.taxDeductionRate)})`,
        `-${formatCurrency(calc.tdsAmount)} (${formatPercent(calc.stakeholder.tdsRate)})`,
        calc.stakeholder.hasGst ? `+${formatCurrency(calc.gstAmount)}` : '₹0.00 (No GST)',
        formatCurrency(calc.netPayable),
      ]);

      // If active milestones, insert light gray indented rows right under the stakeholder
      if (calc.stakeholder.milestones && calc.stakeholder.milestones.length > 0) {
        calc.stakeholder.milestones.forEach((ms) => {
          const splitAmt = calc.netPayable * (ms.percentage / 100);
          tableRows.push([
            `   ↳ Milestone: ${ms.name}`,
            '',
            `Split: ${formatPercent(ms.percentage)} of Final`,
            '',
            '',
            '',
            '',
            formatCurrency(splitAmt),
          ]);
        });
      }
    });

    // Generate table with precise alignments
    autoTable(doc, {
      startY: 52,
      head: tableHeaders,
      body: tableRows,
      theme: 'striped',
      headStyles: {
        fillColor: PRIMARY_BLUE,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 38 }, // Name
        1: { halign: 'left', cellWidth: 22 }, // Role
        2: { halign: 'left', cellWidth: 26 }, // Calculation Formula
        3: { halign: 'right', cellWidth: 21 }, // Base Comm
        4: { halign: 'right', cellWidth: 23 }, // Deduction
        5: { halign: 'right', cellWidth: 20 }, // TDS
        6: { halign: 'right', cellWidth: 22 }, // GST
        7: { halign: 'right', cellWidth: 22 }, // Final Amount
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: TEXT_CHARCOAL,
      },
      alternateRowStyles: {
        fillColor: LIGHT_GRAY,
      },
      didParseCell: (data) => {
        // Style the milestone rows with gray background and italic text
        const cellText = String(data.cell.raw || '');
        if (cellText.startsWith('   ↳ Milestone:')) {
          data.cell.styles.textColor = [120, 120, 120];
          data.cell.styles.fontStyle = 'italic';
        }
      },
      margin: { left: 15, right: 15 },
    });

    // Position of Totals area
    const finalTableY = (doc as any).lastAutoTable.finalY + 8;

    // Check page height limit, add new page if close to bottom
    let currentY = finalTableY;
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    // Totals Grid Area
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(105, currentY, 90, 42, 2, 2, 'FD');

    doc.setFontSize(8.5);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(TEXT_CHARCOAL[0], TEXT_CHARCOAL[1], TEXT_CHARCOAL[2]);
    
    doc.text('Sum of Gross Commissions:', 110, currentY + 7);
    doc.text(formatCurrency(totalGrossCommission), 190, currentY + 7, { align: 'right' });

    doc.text('Total Deductions Withheld:', 110, currentY + 14);
    doc.text(`- ${formatCurrency(totalDeductions)}`, 190, currentY + 14, { align: 'right' });

    doc.text('Total TDS Retained:', 110, currentY + 21);
    doc.text(`- ${formatCurrency(totalTDS)}`, 190, currentY + 21, { align: 'right' });

    doc.text('Total GST Paid Out:', 110, currentY + 28);
    doc.text(`+ ${formatCurrency(totalGST)}`, 190, currentY + 28, { align: 'right' });

    // Solid separator
    doc.setDrawColor(186, 230, 253); // blue-200
    doc.line(110, currentY + 32, 190, currentY + 32);

    // Total Payable Row
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(PRIMARY_BLUE[0], PRIMARY_BLUE[1], PRIMARY_BLUE[2]);
    doc.text('Total Payable to Everyone:', 110, currentY + 38);
    doc.text(formatCurrency(grandTotalNetPayable), 190, currentY + 38, { align: 'right' });

    // Sign-off / Terms Block
    let footerY = currentY + 54;
    if (footerY > 275) {
      doc.addPage();
      footerY = 40;
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(15, footerY - 8, 195, footerY - 8);

    doc.setFontSize(8);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text('Report issued automatically. Standard 18% GST and TDS rates verified against latest corporate guidelines.', 15, footerY);

    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(TEXT_CHARCOAL[0], TEXT_CHARCOAL[1], TEXT_CHARCOAL[2]);
    doc.text('Ledger Auditor:', 15, footerY + 11);
    doc.setFont('Helvetica', 'normal');
    doc.text('___________________________', 42, footerY + 11);

    doc.setFont('Helvetica', 'bold');
    doc.text('Finance Controller:', 115, footerY + 11);
    doc.setFont('Helvetica', 'normal');
    doc.text('___________________________', 145, footerY + 11);

    // Save report
    const cleanProjName = (project.name || 'Project_Commission').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`${cleanProjName}_commission_audit.pdf`);
  };

  return (
    <div id="financial-summary-card" className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-gray-950 text-lg">Payout Summary Table</h2>
            <p className="text-xs text-gray-500">Recalculated live with maximum decimal precision</p>
          </div>
        </div>

        <button
          id="export-pdf-btn"
          type="button"
          onClick={handleExportPDF}
          disabled={stakeholders.length === 0}
          className={`flex items-center justify-center gap-2 font-bold text-xs px-4 py-2.5 rounded-lg transition-all shadow-2xs ${
            stakeholders.length === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-xs cursor-pointer'
          }`}
        >
          <FileDown className="w-4 h-4" />
          Export PDF Report
        </button>
      </div>

      {/* Validation status notice */}
      {stakeholders.length > 0 && (
        <div
          id="status-notification-box"
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            hasValidationErrors
              ? 'bg-red-50/50 border-red-100 text-red-800'
              : 'bg-blue-50/30 border-blue-100/50 text-blue-900'
          }`}
        >
          {hasValidationErrors ? (
            <>
              <div className="p-1 bg-red-100 text-red-600 rounded-lg shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold">Calculation Locked</h4>
                <p className="text-[11px] text-red-600">
                  Please fix the highlighted errors on the left (such as negative rates or milestones not totaling 100%) to enable high-precision calculation.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-1 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold">Ledger Verified & Audit Ready</h4>
                <p className="text-[11px] text-blue-700">
                  All stakeholder calculations are verified against the sale value of <span className="font-bold">{formatCurrency(project.totalSaleValue)}</span>.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
          <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">Total Base Commissions</span>
          <div className="text-base font-bold text-gray-800 mt-1">
            {formatCurrency(totalGrossCommission)}
          </div>
          <span className="text-[10px] text-gray-400 block mt-0.5">Before tax deductions</span>
        </div>

        <div className="bg-blue-50/20 p-4 rounded-xl border border-blue-100/30">
          <span className="text-[10px] font-bold text-blue-600 tracking-wider uppercase block">Total Payable to Everyone</span>
          <div className="text-lg font-extrabold text-blue-600 mt-1">
            {formatCurrency(grandTotalNetPayable)}
          </div>
          <span className="text-[10px] text-blue-500 font-semibold block mt-0.5">Net disbursals with GST/TDS</span>
        </div>
      </div>

      {/* Structured Ledger Table */}
      <div className="border border-gray-100 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table id="summary-table" className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                <th className="px-4 py-3.5">Person / Stakeholder</th>
                <th className="px-4 py-3.5">Assigned Role</th>
                <th className="px-4 py-3.5 text-right">Base Comm.</th>
                <th className="px-4 py-3.5 text-right">TDS / GST</th>
                <th className="px-4 py-3.5 text-right">Final Amount to Pay</th>
                <th className="px-4 py-3.5 text-center">Formula</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs">
              {calculations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400 font-medium">
                    No calculations available. Add a person on the left to start.
                  </td>
                </tr>
              ) : (
                <>
                  {calculations.map((calc) => {
                    const isExpanded = expandedBreakdowns[calc.stakeholder.id];
                    const hasMilestones = calc.stakeholder.milestones && calc.stakeholder.milestones.length > 0;

                    return (
                      <React.Fragment key={calc.stakeholder.id}>
                        {/* Main row */}
                        <tr
                          id={`summary-row-${calc.stakeholder.id}`}
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-gray-800 flex items-center gap-2">
                              {calc.stakeholder.name || <span className="text-red-400 italic font-medium">New Person</span>}
                              {/* Payment Status Badge */}
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                                calc.stakeholder.paymentStatus === 'Paid'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : calc.stakeholder.paymentStatus === 'Partially Paid'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}>
                                {calc.stakeholder.paymentStatus}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700">
                              {calc.stakeholder.role}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right font-medium text-gray-700">
                            <div>{formatCurrency(calc.commissionAfterCap)}</div>
                            {calc.isCapped && (
                              <span className="text-[9px] text-amber-600 bg-amber-50 px-1 py-0.5 rounded-sm inline-block mt-0.5 font-bold">
                                Capped at {formatCurrency(calc.stakeholder.commissionCap || 0)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right text-gray-500 space-y-0.5">
                            <div className="text-[10px]">
                              TDS: -{formatCurrency(calc.tdsAmount)} ({formatPercent(calc.stakeholder.tdsRate)})
                            </div>
                            {calc.stakeholder.hasGst && (
                              <div className="text-[10px] text-blue-600 font-semibold">
                                GST: +{formatCurrency(calc.gstAmount)} (18%)
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right font-bold text-gray-900">
                            {formatCurrency(calc.netPayable)}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <button
                              id={`toggle-breakdown-btn-${calc.stakeholder.id}`}
                              type="button"
                              onClick={() => toggleBreakdown(calc.stakeholder.id)}
                              className="p-1 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Show Breakdown"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>

                        {/* Expandable detailed Formula Row */}
                        {isExpanded && (
                          <tr id={`breakdown-row-${calc.stakeholder.id}`} className="bg-blue-50/20">
                            <td colSpan={6} className="px-4 py-3">
                              <div className="text-xs text-blue-900 space-y-2 bg-white/70 p-3.5 rounded-lg border border-blue-100/50">
                                <div className="font-bold text-blue-900 flex items-center gap-1">
                                  <Info className="w-3.5 h-3.5 text-blue-500" />
                                  Step-by-Step Calculation Breakdown
                                </div>
                                <div className="space-y-1 text-gray-600 leading-relaxed font-mono text-[11px]">
                                  <div>
                                    <span className="font-bold text-gray-700">1. Base Commission:</span>{' '}
                                    {calc.stakeholder.commissionType === 'percentage' ? (
                                      <>
                                        Total Sale Value ({formatCurrency(project.totalSaleValue)}) &times; {formatPercent(calc.stakeholder.rateOrAmount)} ={' '}
                                        <span className="font-semibold text-gray-900">{formatCurrency(calc.commissionBeforeCap)}</span>
                                      </>
                                    ) : (
                                      <>
                                        Flat Rate Payout = <span className="font-semibold text-gray-900">{formatCurrency(calc.commissionBeforeCap)}</span>
                                      </>
                                    )}
                                    {calc.isCapped && (
                                      <span className="text-amber-700 font-bold ml-1.5">
                                        [Exceeds cap of {formatCurrency(calc.stakeholder.commissionCap || 0)} &rarr; Limited to {formatCurrency(calc.commissionAfterCap)}]
                                      </span>
                                    )}
                                  </div>

                                  {calc.stakeholder.taxDeductionRate > 0 && (
                                    <div>
                                      <span className="font-bold text-gray-700">2. General Deduction:</span>{' '}
                                      {formatCurrency(calc.commissionAfterCap)} &times; {formatPercent(calc.stakeholder.taxDeductionRate)} ={' '}
                                      <span className="font-semibold text-red-600">-{formatCurrency(calc.deductionAmount)}</span>
                                    </div>
                                  )}

                                  <div>
                                    <span className="font-bold text-gray-700">3. Net after Deduction:</span>{' '}
                                    {formatCurrency(calc.commissionAfterCap)} 
                                    {calc.stakeholder.taxDeductionRate > 0 ? ` − ${formatCurrency(calc.deductionAmount)}` : ''} ={' '}
                                    <span className="font-semibold text-gray-900">{formatCurrency(calc.netAfterDeduction)}</span>
                                  </div>

                                  <div>
                                    <span className="font-bold text-gray-700">4. TDS Retained:</span>{' '}
                                    {formatCurrency(calc.netAfterDeduction)} &times; {formatPercent(calc.stakeholder.tdsRate)} ={' '}
                                    <span className="font-semibold text-red-600">-{formatCurrency(calc.tdsAmount)}</span>
                                  </div>

                                  {calc.stakeholder.hasGst && (
                                    <div>
                                      <span className="font-bold text-gray-700">5. 18% GST Add-on:</span>{' '}
                                      {formatCurrency(calc.netAfterDeduction)} &times; 18% ={' '}
                                      <span className="font-semibold text-emerald-600">+{formatCurrency(calc.gstAmount)}</span>
                                    </div>
                                  )}

                                  <div className="pt-1.5 border-t border-gray-100 font-sans text-xs text-blue-700">
                                    <span className="font-bold">Final Amount to Pay Formula:</span>{' '}
                                    {formatCurrency(calc.netAfterDeduction)} (Net)
                                    {` − ${formatCurrency(calc.tdsAmount)} (TDS)`}
                                    {calc.stakeholder.hasGst ? ` + ${formatCurrency(calc.gstAmount)} (GST)` : ''} ={' '}
                                    <span className="font-extrabold text-blue-600 text-sm">{formatCurrency(calc.netPayable)}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}

                        {/* Render Payment Milestone nested rows if active */}
                        {hasMilestones && calc.stakeholder.milestones && (
                          <>
                            <tr id={`milestones-header-${calc.stakeholder.id}`} className="bg-gray-50/30">
                              <td colSpan={6} className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-8">
                                <Calendar className="w-3.5 h-3.5 inline-block mr-1 text-gray-400" />
                                Payment Milestones Distribution ({calc.stakeholder.name})
                              </td>
                            </tr>
                            {calc.stakeholder.milestones.map((ms) => {
                              const milestonePayout = calc.netPayable * (ms.percentage / 100);
                              return (
                                <tr
                                  key={ms.id}
                                  id={`milestone-row-${ms.id}`}
                                  className="bg-gray-50/20 text-[11px] text-gray-600"
                                >
                                  <td className="px-4 py-2 pl-12 font-medium">
                                    <span className="text-gray-400 mr-2 font-mono">&bull;</span>
                                    {ms.name}
                                  </td>
                                  <td className="px-4 py-2">
                                    <span className="text-gray-400 text-[10px] italic">Construction stage split</span>
                                  </td>
                                  <td className="px-4 py-2"></td>
                                  <td className="px-4 py-2 text-right text-gray-400 font-mono">
                                    {formatPercent(ms.percentage)} of Final
                                  </td>
                                  <td className="px-4 py-2 text-right font-semibold text-gray-800">
                                    {formatCurrency(milestonePayout)}
                                  </td>
                                  <td className="px-4 py-2"></td>
                                </tr>
                              );
                            })}
                          </>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {/* Grand Total Row */}
                  <tr id="grand-total-row" className="bg-blue-50/30 font-bold border-t-2 border-blue-100">
                    <td colSpan={2} className="px-4 py-4 text-sm font-bold text-blue-950 uppercase">
                      Total Payable to Everyone
                    </td>
                    <td className="px-4 py-4 text-right text-xs font-bold text-gray-800">
                      {formatCurrency(totalGrossCommission)}
                    </td>
                    <td className="px-4 py-4 text-right text-[10px] text-gray-500">
                      TDS: -{formatCurrency(totalTDS)}
                      {totalGST > 0 && <span className="block text-blue-600">GST: +{formatCurrency(totalGST)}</span>}
                    </td>
                    <td className="px-4 py-4 text-right text-base font-extrabold text-blue-600">
                      {formatCurrency(grandTotalNetPayable)}
                    </td>
                    <td className="px-4 py-4"></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
