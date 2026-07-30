import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, Upload, Download, CheckCircle, AlertTriangle, XCircle, 
  RefreshCw, Info, ArrowRight, Table, Layers, Users, Building2, Coins, ArrowLeft
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Broker, Project, Property, Sale, Commission, Payment, Customer } from '../types';
import { db } from '../supabaseClient';
import { formatCurrency, formatNumber } from '../utils';

export interface ParsedImportRow {
  rowIndex: number;
  projectName: string;
  personName: string;
  role: string;
  saleValue: number;
  commissionType: 'Percentage' | 'Fixed' | 'Fixed+Percentage';
  rateOrAmount: number;
  gstPercent: number;
  tdsPercent: number;
  paymentStatus: 'Pending' | 'Paid';
  paymentDate: string;
  // Auto-calculated fields
  grossCommission: number;
  gstAmount: number;
  tdsAmount: number;
  netCommission: number;
  // Validation status
  isValid: boolean;
  validationErrors: string[];
}

interface ExcelImportViewProps {
  brokers: Broker[];
  projects: Project[];
  onImportSuccess: () => Promise<void>;
  onCancel?: () => void;
  darkMode: boolean;
}

export function ExcelImportView({ 
  brokers, projects, onImportSuccess, onCancel, darkMode 
}: ExcelImportViewProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedImportRow[]>([]);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<{
    successCount: number;
    skippedCount: number;
    newBrokersCreated: number;
    newProjectsCreated: number;
  } | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'valid' | 'skipped'>('all');
  const [dragOver, setDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. DOWNLOAD SAMPLE TEMPLATE
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Project Name': 'Skyline Heights',
        'Person Name': 'Rajesh Sharma',
        'Role': 'Broker',
        'Sale Value': 8500000,
        'Commission Type': 'Percentage',
        'Commission Rate or Fixed Amount': 2.5,
        'GST %': 18,
        'TDS %': 5,
        'Payment Status': 'Pending',
        'Payment Date': '2026-08-01'
      },
      {
        'Project Name': 'Cyber Plaza',
        'Person Name': 'Priyanka Sen',
        'Role': 'Channel Partner',
        'Sale Value': 12000000,
        'Commission Type': 'Fixed',
        'Commission Rate or Fixed Amount': 150000,
        'GST %': 0,
        'TDS %': 10,
        'Payment Status': 'Paid',
        'Payment Date': '2026-07-15'
      },
      {
        'Project Name': 'Orchard Residences',
        'Person Name': 'Anil Mehta',
        'Role': 'Sales Executive',
        'Sale Value': 6500000,
        'Commission Type': 'Percentage',
        'Commission Rate or Fixed Amount': 3.0,
        'GST %': 18,
        'TDS %': 5,
        'Payment Status': 'Pending',
        'Payment Date': ''
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    
    // Set column widths for clean viewing
    worksheet['!cols'] = [
      { wch: 22 }, // Project Name
      { wch: 20 }, // Person Name
      { wch: 18 }, // Role
      { wch: 14 }, // Sale Value
      { wch: 18 }, // Commission Type
      { wch: 30 }, // Rate or Fixed Amount
      { wch: 10 }, // GST %
      { wch: 10 }, // TDS %
      { wch: 16 }, // Payment Status
      { wch: 14 }  // Payment Date
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Commission_Entries');
    XLSX.writeFile(workbook, 'Commission_Calculator_Sample_Template.xlsx');
  };

  // Helper for flexible object key lookup (case-insensitive & whitespace agnostic)
  const findKey = (row: any, candidates: string[]): any => {
    const keys = Object.keys(row);
    for (const cand of candidates) {
      const match = keys.find(k => k.trim().toLowerCase() === cand.trim().toLowerCase());
      if (match && row[match] !== undefined && row[match] !== null) {
        return row[match];
      }
    }
    return undefined;
  };

  // 2. FILE PARSE HANDLER
  const processFile = (fileObj: File) => {
    setFile(fileObj);
    setIsParsing(true);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const rows: ParsedImportRow[] = rawRows.map((rawRow, idx) => {
          const errors: string[] = [];

          // Parse fields with fallback header names
          const projectNameRaw = findKey(rawRow, ['Project Name', 'Project', 'project_name', 'Property Project']) || '';
          const personNameRaw = findKey(rawRow, ['Person Name', 'Person', 'Broker Name', 'Broker', 'person_name', 'Agent']) || '';
          const roleRaw = findKey(rawRow, ['Role', 'Person Role', 'Designation', 'Category']) || 'Broker';
          
          const saleValueVal = findKey(rawRow, ['Sale Value', 'Sale Amount', 'Value', 'sale_value', 'Price', 'Property Value']);
          const commTypeRaw = findKey(rawRow, ['Commission Type', 'Comm Type', 'Type', 'commission_type']) || 'Percentage';
          const rateOrAmtVal = findKey(rawRow, ['Commission Rate or Fixed Amount', 'Commission Rate', 'Rate', 'Fixed Amount', 'Amount / %', 'Rate / Amount']);
          
          const gstPercentVal = findKey(rawRow, ['GST %', 'GST Percentage', 'GST', 'gst_percent']) || 0;
          const tdsPercentVal = findKey(rawRow, ['TDS %', 'TDS Percentage', 'TDS', 'tds_percent']) || 0;
          
          const statusRaw = findKey(rawRow, ['Payment Status', 'Status', 'Payment State']) || 'Pending';
          const dateRaw = findKey(rawRow, ['Payment Date', 'Date', 'Booking Date', 'payment_date']) || '';

          // Normalize values
          const projectName = String(projectNameRaw).trim();
          const personName = String(personNameRaw).trim();
          const role = String(roleRaw).trim() || 'Broker';
          
          const saleValue = Number(saleValueVal) || 0;
          
          let commissionType: 'Percentage' | 'Fixed' | 'Fixed+Percentage' = 'Percentage';
          const cTypeStr = String(commTypeRaw).trim().toLowerCase();
          if (cTypeStr.includes('fixed') && cTypeStr.includes('percent')) {
            commissionType = 'Fixed+Percentage';
          } else if (cTypeStr.includes('fixed')) {
            commissionType = 'Fixed';
          } else {
            commissionType = 'Percentage';
          }

          const rateOrAmount = Number(rateOrAmtVal) || 0;
          const gstPercent = Number(gstPercentVal) || 0;
          const tdsPercent = Number(tdsPercentVal) || 0;

          const statusStr = String(statusRaw).trim().toLowerCase();
          const paymentStatus: 'Pending' | 'Paid' = statusStr.includes('paid') ? 'Paid' : 'Pending';

          let paymentDate = '';
          if (dateRaw) {
            if (dateRaw instanceof Date) {
              paymentDate = dateRaw.toISOString().split('T')[0];
            } else if (typeof dateRaw === 'string') {
              paymentDate = dateRaw.trim();
            } else if (typeof dateRaw === 'number') {
              // Serial Excel date
              const jsDate = XLSX.SSF.parse_date_code(dateRaw);
              if (jsDate) {
                const yyyy = jsDate.y;
                const mm = String(jsDate.m).padStart(2, '0');
                const dd = String(jsDate.d).padStart(2, '0');
                paymentDate = `${yyyy}-${mm}-${dd}`;
              }
            }
          }

          // Validation Checks
          if (!personName) {
            errors.push('Missing Person Name');
          }
          if (!saleValue || saleValue <= 0) {
            errors.push('Missing/Invalid Sale Value');
          }
          if (rateOrAmount <= 0) {
            errors.push('Missing Commission Rate / Amount');
          }

          // AUTO-CALCULATION ENGINE (exact calculation logic as manual entry)
          let grossCommission = 0;
          if (commissionType === 'Percentage') {
            grossCommission = saleValue * (rateOrAmount / 100);
          } else if (commissionType === 'Fixed') {
            grossCommission = rateOrAmount;
          } else if (commissionType === 'Fixed+Percentage') {
            grossCommission = rateOrAmount + (saleValue * (rateOrAmount / 100));
          }

          const gstAmount = grossCommission * (gstPercent / 100);
          const tdsAmount = grossCommission * (tdsPercent / 100);
          const netCommission = grossCommission - gstAmount - tdsAmount;

          const isValid = errors.length === 0;

          return {
            rowIndex: idx + 1,
            projectName: projectName || 'General Project',
            personName,
            role,
            saleValue,
            commissionType,
            rateOrAmount,
            gstPercent,
            tdsPercent,
            paymentStatus,
            paymentDate,
            grossCommission,
            gstAmount,
            tdsAmount,
            netCommission,
            isValid,
            validationErrors: errors
          };
        });

        setParsedRows(rows);
      } catch (err) {
        console.error("Error reading excel file:", err);
        alert("Failed to parse the file. Please ensure it is a valid .xlsx or .csv document.");
      } finally {
        setIsParsing(false);
      }
    };

    reader.readAsArrayBuffer(fileObj);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Counts
  const validRows = parsedRows.filter(r => r.isValid);
  const skippedRows = parsedRows.filter(r => !r.isValid);

  const displayedRows = filterTab === 'valid' 
    ? validRows 
    : filterTab === 'skipped' 
      ? skippedRows 
      : parsedRows;

  // 3. EXECUTE IMPORT TO SUPABASE / LOCALSTORAGE
  const handleExecuteImport = async () => {
    if (validRows.length === 0) return;

    setIsImporting(true);
    let successCount = 0;
    let createdBrokersCount = 0;
    let createdProjectsCount = 0;

    // Cache local copies of existing brokers and projects to avoid duplicate creation during same loop
    const activeBrokers = [...brokers];
    const activeProjects = [...projects];

    const todayStr = new Date().toISOString().split('T')[0];

    try {
      for (const row of validRows) {
        // 1) Find or Auto-Create Project
        let project = activeProjects.find(
          p => p.name.trim().toLowerCase() === row.projectName.trim().toLowerCase()
        );

        if (!project) {
          const newProjId = `PRJ-${Math.floor(1000 + Math.random() * 9000)}`;
          project = {
            id: newProjId,
            name: row.projectName.trim(),
            area: 'Main City Zone',
            city: 'Metro',
            created_at: new Date().toISOString()
          };
          await db.saveProject(project);
          activeProjects.push(project);
          createdProjectsCount++;
        }

        // 2) Find or Auto-Create Person / Broker
        let broker = activeBrokers.find(
          b => b.name.trim().toLowerCase() === row.personName.trim().toLowerCase()
        );

        if (!broker) {
          const newBrkId = `BRK-${Math.floor(1000 + Math.random() * 9000)}`;
          broker = {
            id: newBrkId,
            name: row.personName.trim(),
            mobile: '9876543210',
            email: `${row.personName.toLowerCase().replace(/\s+/g, '.')}@realty.com`,
            address: 'Registered Agency Address',
            pan_number: '',
            gst_number: row.gstPercent > 0 ? 'AUTO-GST-27XYZ' : '',
            bank_account_name: row.personName.trim(),
            bank_account_number: '50100' + Math.floor(1000000 + Math.random() * 9000000),
            bank_ifsc: 'HDFC0000001',
            commission_type: row.commissionType,
            commission_amount: row.commissionType === 'Fixed' ? row.rateOrAmount : 0,
            commission_percentage: row.commissionType === 'Percentage' ? row.rateOrAmount : 0,
            gst_percentage: row.gstPercent,
            tds_percentage: row.tdsPercent,
            status: 'Active',
            created_at: new Date().toISOString()
          };
          await db.saveBroker(broker);
          activeBrokers.push(broker);
          createdBrokersCount++;
        }

        // 3) Create Property
        const propId = `PROP-${Math.floor(1000 + Math.random() * 9000)}`;
        const flatNum = `U-${Math.floor(100 + Math.random() * 900)}`;
        const newProperty: Property = {
          id: propId,
          project_id: project.id,
          project_name: project.name,
          tower: 'Tower A',
          wing: 'Wing 1',
          floor: '5th',
          flat_number: flatNum,
          area_sqft: 1100,
          property_type: 'Residential',
          property_value: row.saleValue,
          status: 'Sold',
          created_at: new Date().toISOString()
        };
        await db.saveProperty(newProperty);

        // 4) Create Customer
        const custId = `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
        const newCustomer: Customer = {
          id: custId,
          name: `Client of ${row.personName}`,
          mobile: '9123456789',
          created_at: new Date().toISOString()
        };
        await db.saveCustomer(newCustomer);

        // 5) Create Sale
        const saleId = `SALE-${Math.floor(10000 + Math.random() * 90000)}`;
        const bookingDate = row.paymentDate || todayStr;

        const newSale: Sale = {
          id: saleId,
          broker_id: broker.id,
          broker_name: broker.name,
          property_id: propId,
          project_name: project.name,
          flat_number: flatNum,
          sale_amount: row.saleValue,
          booking_date: bookingDate,
          customer_id: custId,
          customer_name: newCustomer.name,
          customer_mobile: newCustomer.mobile,
          gross_commission: row.grossCommission,
          gst_amount: row.gstAmount,
          tds_amount: row.tdsAmount,
          net_commission: row.netCommission,
          created_at: new Date().toISOString()
        };
        await db.saveSale(newSale);

        // 6) Create Commission Entry
        const commId = `COMM-${Math.floor(10000 + Math.random() * 90000)}`;
        const isPaid = row.paymentStatus === 'Paid';

        const newCommission: Commission = {
          id: commId,
          sale_id: saleId,
          broker_id: broker.id,
          net_commission: row.netCommission,
          status: isPaid ? 'Paid' : 'Pending',
          paid_amount: isPaid ? row.netCommission : 0,
          pending_amount: isPaid ? 0 : row.netCommission,
          payment_date: isPaid ? bookingDate : undefined,
          created_at: new Date().toISOString()
        };
        await db.saveCommission(newCommission);

        // 7) Create Payment Entry if Paid
        if (isPaid) {
          const payId = `PAY-${Math.floor(10000 + Math.random() * 90000)}`;
          const newPayment: Payment = {
            id: payId,
            commission_id: commId,
            payment_date: bookingDate,
            amount: row.netCommission,
            reference_number: `EXCEL-IMP-${Math.floor(1000 + Math.random() * 9000)}`,
            payment_mode: 'Bank Transfer',
            notes: 'Batch imported from Excel spreadsheet',
            created_at: new Date().toISOString()
          };
          await db.savePayment(newPayment);
        }

        successCount++;
      }

      setImportResult({
        successCount,
        skippedCount: skippedRows.length,
        newBrokersCreated: createdBrokersCount,
        newProjectsCreated: createdProjectsCount
      });

      // TRIGGER RE-FETCH IMMEDIATELY SO DASHBOARD, KPIS, CHARTS & REPORTS UPDATE
      await onImportSuccess();

    } catch (err: any) {
      console.error("Error executing import:", err);
      alert("An error occurred during import: " + (err.message || err));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className={`p-6 rounded-2xl border space-y-6 ${
      darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
    }`}>
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            {onCancel && (
              <button 
                onClick={onCancel}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Back to Sale Entry"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-teal-600 dark:teal-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Import Commissions from Excel</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload `.xlsx` or `.csv` files to bulk calculate and store sales commissions in one step.
              </p>
            </div>
          </div>
        </div>

        {/* TEMPLATE DOWNLOAD BUTTON */}
        <button
          onClick={handleDownloadTemplate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm shrink-0"
        >
          <Download className="w-4 h-4 text-teal-500" />
          Download Sample Template (.xlsx)
        </button>
      </div>

      {/* UPLOAD BOX SECTION */}
      {!importResult && (
        <div 
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
            dragOver 
              ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30' 
              : parsedRows.length > 0 
                ? 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
                : 'border-slate-300 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-500 bg-slate-50/30 dark:bg-slate-800/20'
          }`}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
          />
          <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-sm">
              {file ? file.name : "Click to select or drag and drop an Excel file"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports .xlsx, .xls, and .csv format with standard commission column headers.
            </p>
          </div>
          {file && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200">
              <CheckCircle className="w-3.5 h-3.5" /> File Loaded & Parsed
            </span>
          )}
        </div>
      )}

      {/* IMPORT SUCCESS RESULT BANNER */}
      {importResult && (
        <div className="p-6 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-teal-500 text-white shrink-0 mt-0.5">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-teal-900 dark:text-teal-200">
                Excel Import Completed Successfully!
              </h3>
              <p className="text-xs text-teal-700 dark:text-teal-300 mt-1">
                All valid rows have been calculated and saved directly into the database. The Dashboard KPI cards, Ledger, and Charts have been re-fetched and updated.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-900 text-center">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Entries Imported</p>
              <p className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-0.5">{importResult.successCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-900 text-center">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Rows Skipped</p>
              <p className="text-2xl font-black text-slate-500 mt-0.5">{importResult.skippedCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-900 text-center">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">New Persons Added</p>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5">{importResult.newBrokersCreated}</p>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-900 text-center">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">New Projects Added</p>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5">{importResult.newProjectsCreated}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setFile(null);
                setParsedRows([]);
                setImportResult(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition-colors"
            >
              Import Another Excel File
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-200 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
              >
                Go Back to Sale Entry
              </button>
            )}
          </div>
        </div>
      )}

      {/* PREVIEW TABLE SECTION */}
      {parsedRows.length > 0 && !importResult && (
        <div className="space-y-4 pt-2">
          
          {/* STATS & SUMMARY NOTICE */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <Table className="w-4 h-4 text-teal-500" />
                <span>Found {parsedRows.length} Rows</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                <span>{validRows.length} Valid</span>
              </div>
              {skippedRows.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{skippedRows.length} Skipped (missing required fields)</span>
                </div>
              )}
            </div>

            {/* FILTER TAB SELECTOR */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200 dark:bg-slate-900 text-xs font-semibold shrink-0">
              <button
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  filterTab === 'all' 
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                All ({parsedRows.length})
              </button>
              <button
                onClick={() => setFilterTab('valid')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  filterTab === 'valid' 
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Valid ({validRows.length})
              </button>
              <button
                onClick={() => setFilterTab('skipped')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  filterTab === 'skipped' 
                    ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs font-bold' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Skipped ({skippedRows.length})
              </button>
            </div>
          </div>

          {/* SKIPPED NOTICE WARNING MESSAGE */}
          {skippedRows.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  <strong>{skippedRows.length} row{skippedRows.length > 1 ? 's' : ''} skipped — missing required fields.</strong> Only valid rows will be imported.
                </span>
              </div>
            </div>
          )}

          {/* PREVIEW DATA TABLE */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 max-h-[420px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className={`sticky top-0 z-10 font-bold uppercase tracking-wider text-[10px] border-b ${
                darkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                <tr>
                  <th className="px-3 py-2.5">Row</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Project Name</th>
                  <th className="px-3 py-2.5">Person / Role</th>
                  <th className="px-3 py-2.5 text-right">Sale Value</th>
                  <th className="px-3 py-2.5">Commission Type</th>
                  <th className="px-3 py-2.5 text-right">Gross Comm</th>
                  <th className="px-3 py-2.5 text-right">GST % (Amt)</th>
                  <th className="px-3 py-2.5 text-right">TDS % (Amt)</th>
                  <th className="px-3 py-2.5 text-right font-black">Net Comm</th>
                  <th className="px-3 py-2.5">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                {displayedRows.map((row) => (
                  <tr 
                    key={row.rowIndex}
                    className={`transition-colors ${
                      !row.isValid 
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/50 dark:hover:bg-amber-950/40' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="px-3 py-2.5 font-bold text-slate-400">{row.rowIndex}</td>
                    
                    {/* Status Badge */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {row.isValid ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                          <CheckCircle className="w-3 h-3" /> Valid
                        </span>
                      ) : (
                        <span 
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
                          title={row.validationErrors.join(', ')}
                        >
                          <AlertTriangle className="w-3 h-3" /> Skipped
                        </span>
                      )}
                    </td>

                    {/* Project Name */}
                    <td className="px-3 py-2.5 font-bold whitespace-nowrap">
                      {row.projectName}
                    </td>

                    {/* Person Name & Role */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="font-bold text-slate-800 dark:text-slate-100">{row.personName || <span className="italic text-red-500">[Missing]</span>}</div>
                      <div className="text-[10px] text-slate-400">{row.role}</div>
                    </td>

                    {/* Sale Value */}
                    <td className="px-3 py-2.5 text-right font-bold whitespace-nowrap">
                      {row.saleValue > 0 ? formatCurrency(row.saleValue) : <span className="italic text-red-500">[Missing]</span>}
                    </td>

                    {/* Commission Type & Rate */}
                    <td className="px-3 py-2.5 whitespace-nowrap text-[11px]">
                      <div>{row.commissionType}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">
                        {row.commissionType === 'Percentage' ? `${row.rateOrAmount}%` : formatCurrency(row.rateOrAmount)}
                      </div>
                    </td>

                    {/* Auto-Calculated Gross Commission */}
                    <td className="px-3 py-2.5 text-right font-bold whitespace-nowrap text-blue-600 dark:text-blue-400">
                      {formatCurrency(row.grossCommission)}
                    </td>

                    {/* GST */}
                    <td className="px-3 py-2.5 text-right whitespace-nowrap text-[11px]">
                      <div>{row.gstPercent}%</div>
                      <div className="text-[10px] text-slate-400">{formatCurrency(row.gstAmount)}</div>
                    </td>

                    {/* TDS */}
                    <td className="px-3 py-2.5 text-right whitespace-nowrap text-[11px]">
                      <div>{row.tdsPercent}%</div>
                      <div className="text-[10px] text-slate-400">{formatCurrency(row.tdsAmount)}</div>
                    </td>

                    {/* Auto-Calculated Net Commission */}
                    <td className="px-3 py-2.5 text-right font-black whitespace-nowrap text-teal-600 dark:text-teal-400 text-sm">
                      {formatCurrency(row.netCommission)}
                    </td>

                    {/* Payment Status */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.paymentStatus === 'Paid' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {row.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ACTION IMPORT BUTTON */}
          <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-500">
              Ready to import <strong className="text-emerald-600 dark:text-emerald-400">{validRows.length} valid entries</strong>. 
              {skippedRows.length > 0 && ` (${skippedRows.length} rows missing required fields will be skipped).`}
            </div>

            <button
              onClick={handleExecuteImport}
              disabled={isImporting || validRows.length === 0}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm text-white transition-all shadow-md ${
                validRows.length === 0 || isImporting
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20 active:scale-95'
              }`}
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving & Re-calculating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Import {validRows.length} Valid Entries Now
                </>
              )}
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
