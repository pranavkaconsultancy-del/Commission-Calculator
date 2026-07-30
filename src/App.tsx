import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Coins, ClipboardList, ShieldAlert, Sun, Moon, Bell, Info, 
  Database, RefreshCw, LogIn, UserCheck, Layers, Search, MessageSquare, FileSpreadsheet
} from 'lucide-react';
import { 
  Broker, Project, Property, Sale, Commission, Payment, AuditLog, AppNotification, UserRole 
} from './types';
import { db, isSupabaseConfigured } from './supabaseClient';

// Import Modular Components
import { DashboardView } from './components/DashboardView';
import { BrokersView } from './components/BrokersView';
import { PropertiesView } from './components/PropertiesView';
import { SaleEntryView } from './components/SaleEntryView';
import { HistoryReportsView } from './components/HistoryReportsView';
import { AuditLogsView } from './components/AuditLogsView';
import { NotificationsPanel } from './components/NotificationsPanel';
import { ChatbotPanel } from './components/ChatbotPanel';

export default function App() {
  // 1. Theme and UI State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('re_sys_dark_mode') === 'true';
  });

  // Active Screen Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'brokers' | 'properties' | 'sale_entry' | 'excel_import' | 'ledger_reports' | 'audit_logs'>('dashboard');
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  // Role-Based Auth Simulation (Dropdown Selector)
  const [userRole, setUserRole] = useState<UserRole>('Super Admin');
  const [userEmail, setUserEmail] = useState<string>('admin@realty.com');

  // Database Data States
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Page States
  const [loading, setLoading] = useState<boolean>(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showNotifPanel, setShowNotifPanel] = useState<boolean>(false);

  // Apply Theme class on root element
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('re_sys_dark_mode', String(darkMode));
  }, [darkMode]);

  // Handle userRole sync to email simulation
  useEffect(() => {
    if (userRole === 'Super Admin') {
      setUserEmail('admin@realty.com');
    } else if (userRole === 'Admin') {
      setUserEmail('staff@realty.com');
    } else if (userRole === 'Accountant') {
      setUserEmail('finance@realty.com');
    } else if (userRole === 'Broker') {
      // Find Rajesh Sharma email to let them see their data
      setUserEmail('rajesh.sharma@gmail.com');
    }

    // Reset view if role cannot access it
    if (userRole === 'Broker' && (activeTab === 'sale_entry' || activeTab === 'audit_logs')) {
      setActiveTab('dashboard');
    } else if (userRole === 'Accountant' && activeTab === 'audit_logs') {
      setActiveTab('dashboard');
    }
  }, [userRole, activeTab]);

  // 2. DATA LOAD ENGINE (fetch from dual-persistence client)
  const loadAllData = async (silent = false) => {
    if (!silent) setLoading(true);
    setDbError(null);
    try {
      // Run parallel fetches
      const [
        brokersRes,
        projectsRes,
        propertiesRes,
        salesRes,
        commissionsRes,
        paymentsRes,
        auditLogsRes,
        notificationsRes
      ] = await Promise.all([
        db.fetchBrokers(),
        db.fetchProjects(),
        db.fetchProperties(),
        db.fetchSales(),
        db.fetchCommissions(),
        db.fetchPayments(),
        db.fetchAuditLogs(),
        db.fetchNotifications()
      ]);

      // Check errors
      const firstErr = brokersRes.error || projectsRes.error || propertiesRes.error || 
                       salesRes.error || commissionsRes.error || paymentsRes.error || 
                       auditLogsRes.error || notificationsRes.error;
      
      if (firstErr) {
        // We still have mock fallbacks, so don't completely crash, just set alert status
        console.warn('Database Sync Warning:', firstErr);
      }

      setBrokers(brokersRes.data);
      setProjects(projectsRes.data);
      setProperties(propertiesRes.data);
      setSales(salesRes.data);
      setCommissions(commissionsRes.data);
      setPayments(paymentsRes.data);
      setAuditLogs(auditLogsRes.data);
      setNotifications(notificationsRes.data);

    } catch (err: any) {
      setDbError(err.message || 'Error communicating with persistence layer');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Sync / Refresh Trigger
  const handleSyncData = async () => {
    setIsSyncing(true);
    await loadAllData(true);
    setTimeout(() => setIsSyncing(false), 500);
  };

  // 3. MUTATION HANDLERS (passed to modular sub-components)

  // BROKERS SAVE
  const handleSaveBroker = async (broker: Broker) => {
    const res = await db.saveBroker(broker);
    if (res.error) throw new Error(res.error);
    
    // Log Audit Log
    await db.logAction(
      userEmail, 
      userRole, 
      'BROKER_SAVE', 
      `Registered or updated Broker details for ID: ${broker.id} (${broker.name})`
    );

    // Save automatic alert notification
    await db.saveNotification({
      type: 'Broker Added',
      title: 'Partner Registered',
      message: `Broker partner ${broker.name} has been added/updated successfully.`
    });

    await loadAllData(true);
  };

  // BROKER DELETE
  const handleDeleteBroker = async (id: string) => {
    const res = await db.deleteBroker(id);
    if (res.error) throw new Error(res.error);

    await db.logAction(
      userEmail,
      userRole,
      'BROKER_DELETE',
      `Deleted broker record for ID: ${id}`
    );

    await loadAllData(true);
  };

  // SAVE PROJECT
  const handleSaveProject = async (project: Project) => {
    const res = await db.saveProject(project);
    if (res.error) throw new Error(res.error);

    await db.logAction(
      userEmail,
      userRole,
      'PROJECT_SAVE',
      `Created real estate development project: ${project.name} in ${project.city}`
    );

    await loadAllData(true);
  };

  // SAVE PROPERTY FLAT
  const handleSaveProperty = async (property: Property) => {
    const res = await db.saveProperty(property);
    if (res.error) throw new Error(res.error);

    await db.logAction(
      userEmail,
      userRole,
      'PROPERTY_SAVE',
      `Added property flat ${property.flat_number} to project ID: ${property.project_id}`
    );

    await loadAllData(true);
  };

  // ADD PROPERTY SALE & COMMISSION
  const handleAddSale = async (sale: Sale, commission: Commission) => {
    // 1. Save Sale (automatically marks Property as Sold inside saveSale helper)
    const saleRes = await db.saveSale(sale);
    if (saleRes.error) throw new Error(saleRes.error);

    // 2. Save Commission Invoice
    const commRes = await db.saveCommission(commission);
    if (commRes.error) {
      // Cleanup sale if commission fails
      await db.deleteSale(sale.id);
      throw new Error(commRes.error);
    }

    // 3. Log Audit Trail
    await db.logAction(
      userEmail,
      userRole,
      'SALE_CREATE',
      `Booked flat ${sale.flat_number} in ${sale.project_name} for Customer: ${sale.customer_name}. Net commission: ₹${commission.net_commission} created.`
    );

    // 4. Save notification
    await db.saveNotification({
      type: 'New Sale',
      title: 'New Booking Logged',
      message: `Sale of ${sale.project_name} Flat ${sale.flat_number} (Customer: ${sale.customer_name}) logged for commission credit.`
    });

    await loadAllData(true);
  };

  // BATCH EXCEL IMPORT SUCCESS
  const handleImportSuccess = async () => {
    await db.logAction(
      userEmail,
      userRole,
      'EXCEL_IMPORT',
      `Batch imported commission entries from Excel spreadsheet.`
    );
    await db.saveNotification({
      type: 'Excel Import',
      title: 'Excel Data Imported',
      message: `Successfully processed and imported bulk commission entries into database.`
    });
    await loadAllData(true);
  };

  // DISBURSE PARTIAL OR FULL PAYMENT
  const handleAddPayment = async (payment: Payment, updatedCommission: Commission) => {
    // Save payment (automatically recalculates pending balance & updates commission record inside savePayment helper)
    const res = await db.savePayment(payment);
    if (res.error) throw new Error(res.error);

    // Log Audit
    await db.logAction(
      userEmail,
      userRole,
      'PAYMENT_DISBURSE',
      `Cleared payout of ₹${payment.amount} via ${payment.payment_mode} for Commission ID: ${payment.commission_id}`
    );

    // Save alert notification
    await db.saveNotification({
      type: 'Payment Completed',
      title: 'Payout Disbursed',
      message: `Cleared transaction payout of ₹${payment.amount} using ${payment.payment_mode}. Reference: ${payment.reference_number}`
    });

    await loadAllData(true);
  };

  // NOTIFICATION UTILS
  const handleMarkRead = async (id: string) => {
    // Local state mark as read for responsive feel
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    // Call database / local persistence update
    if (isSupabaseConfigured && db.markAllNotificationsRead) {
      // Just mark all read or we can keep simple local state sync
    }
  };

  const handleMarkAllRead = async () => {
    await db.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unreadNotifCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* 1. HEADER BRANDING & ROLE CONTROL BAR */}
      <header className="sticky top-0 z-40 px-6 py-3.5 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gradient-to-r from-[#0F1F3D] to-[#0EA5B7] border-b border-white/10 text-white shadow-md">
        
        {/* Left Side: Empty or compact layout back-sync */}
        <div className="flex items-center gap-2">
          <div className="bg-white/10 p-1 rounded-lg">
            <Coins className="w-5 h-5 text-teal-300" />
          </div>
          <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">
            Commission cockpit
          </span>
        </div>

        {/* Center: Search Bar with glassy/translucent design */}
        <div className="flex-1 max-w-md mx-4 relative w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search brokers, properties, transactions..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-white/15 backdrop-blur-sm border border-white/25 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20 transition-all rounded-xl"
          />
          <Search className="w-4 h-4 text-white/60 absolute left-3.5 top-2.5" />
        </div>

        {/* Right Side: Glassy system controls, notification and avatar/profile chip */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Refresh / Sync Button */}
          <button 
            onClick={handleSyncData}
            className="p-2 rounded-xl bg-white/10 border border-white/10 text-white hover:bg-white/20 transition-all"
            title="Sync Database"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-teal-300' : ''}`} />
          </button>

          {/* Dark Mode Switcher (glassy look) */}
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl bg-white/10 border border-white/10 text-white hover:bg-white/20 transition-all"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-white" />}
          </button>

          {/* Live Notification Bell */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifPanel(!showNotifPanel)}
              className="p-2 rounded-xl bg-white/10 border border-white/10 text-white hover:bg-white/20 transition-all relative"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-600 text-white rounded-full flex items-center justify-center text-[8px] font-black border-2 border-white animate-pulse">
                  {unreadNotifCount}
                </span>
              )}
            </button>
            {showNotifPanel && (
              <NotificationsPanel 
                notifications={notifications}
                onMarkRead={handleMarkRead}
                onMarkAllRead={handleMarkAllRead}
                onClose={() => setShowNotifPanel(false)}
                darkMode={darkMode}
              />
            )}
          </div>

          {/* USER AVATAR / PROFILE CHIP */}
          <div className="flex items-center gap-2 p-1 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl text-xs text-white transition-all shadow-sm">
            <div className="w-7 h-7 bg-teal-400 text-[#0F1F3D] font-black flex items-center justify-center rounded-lg shadow-inner uppercase">
              {userRole[0] || 'U'}
            </div>
            <div className="text-left hidden sm:block pr-1">
              <p className="text-[7.5px] uppercase font-black tracking-wider text-teal-200">Active Scope</p>
              <select
                value={userRole}
                onChange={(e) => {
                  const role = e.target.value as UserRole;
                  setUserRole(role);
                  if (role === 'Super Admin') setUserEmail('admin@realty.com');
                  else if (role === 'Admin') setUserEmail('manager@realty.com');
                  else if (role === 'Accountant') setUserEmail('finance@realty.com');
                  else if (role === 'Broker') setUserEmail('rajesh@broker.com');
                }}
                className="font-bold text-[10px] focus:outline-none border-none bg-transparent cursor-pointer text-white select-none pr-1 [&>option]:bg-[#0F1F3D] [&>option]:text-white"
              >
                <option value="Super Admin">Super Admin</option>
                <option value="Admin">Admin</option>
                <option value="Accountant">Accountant</option>
                <option value="Broker">Broker (Rajesh)</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN COCKPIT VIEWPORT */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* SIDE NAVIGATION BAR (Always Dark Navy Blue) */}
        <nav className="w-full md:w-64 p-4 md:min-h-screen text-xs flex flex-col justify-between bg-[#0F1F3D] text-white border-r border-[#1e3256] space-y-1.5 shrink-0">
          
          <div className="space-y-1.5 w-full">
            {/* App branding at top of the sidebar */}
            <div className="px-3.5 py-5 border-b border-white/10 mb-5">
              <h1 className="text-base font-bold text-white tracking-tight" id="app-branding-title">
                SyncAI Consultancy Pvt. Ltd.
              </h1>
            </div>

            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-3.5 py-1 mb-2">Navigation Panels</p>
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold transition-all border outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
                activeTab === 'dashboard'
                  ? 'bg-[#1b325f] text-white shadow-md border-l-4 border-l-teal-400 border-t-transparent border-b-transparent border-r-transparent rounded-r-xl rounded-l-none'
                  : 'border-transparent text-slate-300 hover:text-white hover:bg-[#1b325f]/50'
              }`}
            >
              <Layers className="w-4.5 h-4.5" /> Dashboard Overview
            </button>

            <button
              onClick={() => setActiveTab('brokers')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold transition-all border outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
                activeTab === 'brokers'
                  ? 'bg-[#1b325f] text-white shadow-md border-l-4 border-l-teal-400 border-t-transparent border-b-transparent border-r-transparent rounded-r-xl rounded-l-none'
                  : 'border-transparent text-slate-300 hover:text-white hover:bg-[#1b325f]/50'
              }`}
            >
              <Users className="w-4.5 h-4.5" /> Brokers Directory
            </button>

            <button
              onClick={() => setActiveTab('properties')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold transition-all border outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
                activeTab === 'properties'
                  ? 'bg-[#1b325f] text-white shadow-md border-l-4 border-l-teal-400 border-t-transparent border-b-transparent border-r-transparent rounded-r-xl rounded-l-none'
                  : 'border-transparent text-slate-300 hover:text-white hover:bg-[#1b325f]/50'
              }`}
            >
              <Building2 className="w-4.5 h-4.5" /> Properties & Customers
            </button>

            {userRole !== 'Broker' && (
              <>
                <button
                  onClick={() => setActiveTab('sale_entry')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold transition-all border outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
                    activeTab === 'sale_entry'
                      ? 'bg-[#1b325f] text-white shadow-md border-l-4 border-l-teal-400 border-t-transparent border-b-transparent border-r-transparent rounded-r-xl rounded-l-none'
                      : 'border-transparent text-slate-300 hover:text-white hover:bg-[#1b325f]/50'
                  }`}
                >
                  <Coins className="w-4.5 h-4.5" /> Sale Entry & Calculator
                </button>

                <button
                  onClick={() => setActiveTab('excel_import')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold transition-all border outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
                    activeTab === 'excel_import'
                      ? 'bg-[#1b325f] text-white shadow-md border-l-4 border-l-teal-400 border-t-transparent border-b-transparent border-r-transparent rounded-r-xl rounded-l-none'
                      : 'border-transparent text-slate-300 hover:text-white hover:bg-[#1b325f]/50'
                  }`}
                >
                  <FileSpreadsheet className="w-4.5 h-4.5 text-teal-400" /> Excel Import
                </button>
              </>
            )}

            <button
              onClick={() => setActiveTab('ledger_reports')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold transition-all border outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
                activeTab === 'ledger_reports'
                  ? 'bg-[#1b325f] text-white shadow-md border-l-4 border-l-teal-400 border-t-transparent border-b-transparent border-r-transparent rounded-r-xl rounded-l-none'
                  : 'border-transparent text-slate-300 hover:text-white hover:bg-[#1b325f]/50'
              }`}
            >
              <ClipboardList className="w-4.5 h-4.5" /> Financial Ledger
            </button>

            {userRole !== 'Broker' && userRole !== 'Accountant' && (
              <button
                onClick={() => setActiveTab('audit_logs')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold transition-all border outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
                  activeTab === 'audit_logs'
                    ? 'bg-[#1b325f] text-white shadow-md border-l-4 border-l-teal-400 border-t-transparent border-b-transparent border-r-transparent rounded-r-xl rounded-l-none'
                    : 'border-transparent text-slate-300 hover:text-white hover:bg-[#1b325f]/50'
                }`}
              >
                <ShieldAlert className="w-4.5 h-4.5" /> Security Audit Logs
              </button>
            )}

            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold transition-all border outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
                isChatOpen
                  ? 'bg-teal-500 text-slate-900 border-transparent shadow-md'
                  : 'border-transparent text-teal-400 hover:text-white hover:bg-teal-500/10'
              }`}
              id="sidebar-chat-toggle-button"
            >
              <MessageSquare className="w-4.5 h-4.5" /> Interactive AI Chatbot
            </button>
          </div>

          {/* Status Line at the bottom of the sidebar */}
          <div className="pt-6 border-t border-white/10 flex flex-col gap-2.5">
            <div className="flex items-center gap-2 px-1 text-[10px] text-teal-400 font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />
              <span>System Status: Ready</span>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/5 flex flex-col gap-1">
              <Database className="w-3.5 h-3.5 text-teal-400" />
              <div>
                <p className="font-extrabold text-[9px] text-white uppercase tracking-wider">Scope Limits</p>
                <p className="text-[8.5px] text-slate-300 leading-normal mt-0.5">
                  Authorized as <strong>{userRole}</strong>. Module access restricted by role controls.
                </p>
              </div>
            </div>
          </div>
        </nav>

        {/* CONTAINER CONTENT - ALWAYS LIGHT GRAY / WHITE */}
        <main className="flex-1 p-6 overflow-x-hidden bg-slate-50 text-slate-900">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center py-20 gap-3 text-slate-400 text-xs">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="font-bold">Syncing Broker Database...</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Database Status Alert Banner */}
              {dbError && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-xs flex gap-3">
                  <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold">Database Fallback Activated</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      Could not establish network socket with Cloud Supabase: <strong>{dbError}</strong>. Persistent local state fallback has been enabled seamlessly to guarantee complete offline execution. All edits will be preserved in LocalStorage.
                    </p>
                  </div>
                </div>
              )}

              {/* ROUTE MOUNTING SWITCHER */}
              {activeTab === 'dashboard' && (
                <DashboardView 
                  brokers={brokers}
                  properties={properties}
                  sales={sales}
                  commissions={commissions}
                  darkMode={darkMode}
                  onNavigateToImport={() => setActiveTab('excel_import')}
                  onNavigateToSaleEntry={() => setActiveTab('sale_entry')}
                />
              )}

              {activeTab === 'brokers' && (
                <BrokersView 
                  brokers={brokers}
                  sales={sales}
                  commissions={commissions}
                  payments={payments}
                  onSaveBroker={handleSaveBroker}
                  onDeleteBroker={handleDeleteBroker}
                  userRole={userRole}
                  userEmail={userEmail}
                  darkMode={darkMode}
                  companyName="SyncAI Consultancy Pvt. Ltd."
                />
              )}

              {activeTab === 'properties' && (
                <PropertiesView 
                  properties={properties}
                  projects={projects}
                  sales={sales}
                  onSaveProperty={handleSaveProperty}
                  onSaveProject={handleSaveProject}
                  userRole={userRole}
                  darkMode={darkMode}
                />
              )}

              {(activeTab === 'sale_entry' || activeTab === 'excel_import') && (
                <SaleEntryView 
                  brokers={brokers}
                  projects={projects}
                  properties={properties}
                  onAddSale={handleAddSale}
                  onImportSuccess={handleImportSuccess}
                  userRole={userRole}
                  darkMode={darkMode}
                  initialMode={activeTab === 'excel_import' ? 'excel' : 'manual'}
                />
              )}

              {activeTab === 'ledger_reports' && (
                <HistoryReportsView 
                  sales={sales}
                  commissions={commissions}
                  payments={payments}
                  brokers={brokers}
                  projects={projects}
                  onAddPayment={handleAddPayment}
                  userRole={userRole}
                  userEmail={userEmail}
                  darkMode={darkMode}
                />
              )}

              {activeTab === 'audit_logs' && (
                <AuditLogsView 
                  auditLogs={auditLogs}
                  darkMode={darkMode}
                />
              )}

            </div>
          )}
        </main>
      </div>

      {/* FOOTER */}
      <footer className={`py-4 text-center text-[10px] tracking-wide border-t ${
        darkMode ? 'bg-slate-950 border-slate-800 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-400'
      }`}>
        Broker Commission Management System © {new Date().getFullYear()} SyncAI Consultancy Pvt. Ltd. Authorized operators only.
      </footer>

      {/* AI CHATBOT PANEL */}
      <ChatbotPanel
        brokers={brokers}
        projects={projects}
        properties={properties}
        sales={sales}
        commissions={commissions}
        payments={payments}
        isOpen={isChatOpen}
        onToggle={setIsChatOpen}
      />
    </div>
  );
}
