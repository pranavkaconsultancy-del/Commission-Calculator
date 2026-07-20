import React, { useState } from 'react';
import { ShieldAlert, Search, Eye } from 'lucide-react';
import { AuditLog } from '../types';

interface AuditLogsViewProps {
  auditLogs: AuditLog[];
  darkMode: boolean;
}

export function AuditLogsView({ auditLogs, darkMode }: AuditLogsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredLogs = auditLogs.filter(log => 
    log.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.details.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;

  return (
    <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
            Security & Transaction Audit Logs
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">Chronological trail of user actions, database modifications, and payouts logged securely.</p>
        </div>
      </div>

      <div className="relative mb-4">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter audit logs by email, action, or specific details..."
          className={`w-full pl-9 pr-4 py-2 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
            darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={`${darkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-50 text-slate-500'} font-bold`}>
              <th className="p-3">Timestamp (UTC)</th>
              <th className="p-3">User Operator</th>
              <th className="p-3">Action Type</th>
              <th className="p-3">Change Breakdown Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400">No security audit logs captured yet</td>
              </tr>
            ) : (
              paginatedLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                  <td className="p-3 font-mono text-[10px] text-slate-500">{log.created_at.replace('T', ' ').substring(0, 19)}</td>
                  <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{log.user_email}</td>
                  <td className="p-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.action.includes('CREATE') || log.action.includes('SAVE') ? 'bg-blue-100 text-blue-700' :
                      log.action.includes('PAY') ? 'bg-emerald-100 text-emerald-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500 max-w-sm truncate" title={log.details}>{log.details}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 text-xs text-slate-500">
          <p>Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} entries</p>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
