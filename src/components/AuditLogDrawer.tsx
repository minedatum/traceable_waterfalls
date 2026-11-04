import React, { useState } from 'react';
import {
  X,
  History,
  Download,
  FileSpreadsheet,
  FileText,
  Search,
  Filter,
  UserCheck,
  Briefcase,
  CheckCircle2,
} from 'lucide-react';
import { AuditLogEntry } from '../types';
import { exportAuditLogsToExcel } from '../utils/exportUtils';
import { formatDateTimeDisplay } from '../utils/workingDays';

interface AuditLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLogEntry[];
}

export const AuditLogDrawer: React.FC<AuditLogDrawerProps> = ({ isOpen, onClose, logs }) => {
  const [roleFilter, setRoleFilter] = useState<'all' | 'FRC Owner' | 'Analyst'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    if (roleFilter !== 'all' && log.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${log.user} ${log.action} ${log.details} ${log.rowId || ''}`.toLowerCase();
      return matchText.includes(q);
    }
    return true;
  });

  return (
    <div
      id="audit-log-drawer-backdrop"
      className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="audit-log-drawer"
        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-250 border-l border-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-amber-400 flex items-center justify-center shadow-xs">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                Real-Time Activity Audit Log
                <span className="bg-stone-200 text-stone-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                  {logs.length} events
                </span>
              </h3>
              <p className="text-xs text-stone-500">
                Consolidated audit trail of FRC and Analyst actions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls & Filters */}
        <div className="p-4 border-b border-stone-200 bg-white space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search audit actions, users, rows..."
                className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-stone-900"
              />
            </div>

            <div className="flex rounded-lg border border-stone-200 overflow-hidden bg-stone-100 p-0.5 text-xs font-medium shrink-0">
              <button
                type="button"
                onClick={() => setRoleFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  roleFilter === 'all'
                    ? 'bg-white text-stone-900 font-semibold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('FRC Owner')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  roleFilter === 'FRC Owner'
                    ? 'bg-white text-stone-900 font-semibold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                FRC
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('Analyst')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  roleFilter === 'Analyst'
                    ? 'bg-white text-stone-900 font-semibold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Analyst
              </button>
            </div>
          </div>

          {/* Export Row */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-stone-500 font-medium">
              Showing {filteredLogs.length} of {logs.length} logged events
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => exportAuditLogsToExcel(filteredLogs)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded-lg border border-stone-200 transition-colors text-xs"
                title="Export audit log to Excel workbook format"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                Export to Excel
              </button>
            </div>
          </div>
        </div>

        {/* Audit Log Entries List */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-100 p-4 space-y-3 bg-stone-50/40">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-stone-400">
              <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs font-medium">No activity events found matching criteria</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isFRC = log.role === 'FRC Owner';
              return (
                <div
                  key={log.id}
                  className="bg-white border border-stone-200/90 rounded-xl p-3.5 shadow-xs transition-hover hover:border-stone-300"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                          isFRC
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {isFRC ? <Briefcase className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                        {log.role}
                      </span>
                      {log.rowId && (
                        <span className="font-mono text-[11px] font-bold bg-stone-100 px-1.5 py-0.5 rounded text-stone-700 border border-stone-200">
                          {log.rowId}
                        </span>
                      )}
                      <span className="text-xs font-bold text-stone-900">{log.action}</span>
                    </div>
                    <span className="text-[11px] text-stone-400 font-mono whitespace-nowrap">
                      {formatDateTimeDisplay(log.timestamp)}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed pl-1">{log.details}</p>

                  <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                    <span>
                      Actor: <strong className="text-stone-700">{log.user}</strong>
                    </span>
                    <span className="font-mono text-[10px] text-stone-400">{log.id}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="text-[11px] text-stone-500 font-mono">
            Synced with local target: <code className="font-semibold text-stone-700">H:\My Drive\Waterfall</code>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
