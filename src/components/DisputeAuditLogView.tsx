import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  FileCheck2,
  Mail,
  User,
  Shield,
  Layers,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { AuditLogEntry, WaterfallRow } from '../types';
import { exportAuditLogsToExcel } from '../utils/exportUtils';

interface DisputeAuditLogViewProps {
  logs: AuditLogEntry[];
  rows: WaterfallRow[];
  currentRole: 'frc' | 'analyst';
  initialStepFilter?: string;
  className?: string;
}

export const DisputeAuditLogView: React.FC<DisputeAuditLogViewProps> = ({
  logs,
  rows,
  currentRole,
  initialStepFilter = 'all',
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStep, setSelectedStep] = useState<string>(initialStepFilter);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Map row titles for quick lookup
  const rowTitleMap = useMemo(() => {
    const map: Record<string, string> = {};
    rows.forEach((r) => {
      map[r.id] = r.stepTitle;
    });
    return map;
  }, [rows]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Step filter
      if (selectedStep !== 'all' && log.rowId !== selectedStep) {
        return false;
      }

      // Role filter
      if (selectedRole !== 'all') {
        if (selectedRole === 'frc' && log.role !== 'FRC Owner') return false;
        if (selectedRole === 'analyst' && log.role !== 'Analyst') return false;
        if (selectedRole === 'system' && log.role !== 'System') return false;
      }

      // Event type / dispute category filter
      if (selectedEventType !== 'all') {
        const actionLower = log.action.toLowerCase();
        const detailsLower = log.details.toLowerCase();

        if (selectedEventType === 'refinalize') {
          const isRefinalize =
            log.eventType === 'requirement_refinalized' ||
            actionLower.includes('re-finalized') ||
            (actionLower.includes('modified') && actionLower.includes('requirement'));
          if (!isRefinalize) return false;
        } else if (selectedEventType === 'rerun') {
          const isRerun =
            log.eventType === 'analytics_rerun' ||
            actionLower.includes('re-run') ||
            actionLower.includes('analytics started');
          if (!isRerun) return false;
        } else if (selectedEventType === 'finalized') {
          const isFinal =
            log.eventType === 'requirement_finalized' ||
            log.eventType === 'analytics_finalized' ||
            actionLower.includes('finalized') ||
            actionLower.includes('finalised') ||
            actionLower.includes('signed off');
          if (!isFinal) return false;
        } else if (selectedEventType === 'email') {
          const isEmail =
            actionLower.includes('email') ||
            actionLower.includes('alert') ||
            detailsLower.includes('notification dispatched');
          if (!isEmail) return false;
        }
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const stepTitle = log.rowId ? rowTitleMap[log.rowId] || '' : '';
        const match =
          log.action.toLowerCase().includes(query) ||
          log.details.toLowerCase().includes(query) ||
          log.user.toLowerCase().includes(query) ||
          (log.rowId && log.rowId.toLowerCase().includes(query)) ||
          stepTitle.toLowerCase().includes(query);
        if (!match) return false;
      }

      return true;
    });
  }, [logs, selectedStep, selectedRole, selectedEventType, searchTerm, rowTitleMap]);

  // Export to Excel for dispute and audit log
  const handleExportExcel = () => {
    if (filteredLogs.length === 0) return;
    exportAuditLogsToExcel(filteredLogs, `Waterfall_Dispute_Log_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Helper for event tags
  const getDisputeBadge = (log: AuditLogEntry) => {
    const actionLower = log.action.toLowerCase();
    if (
      log.eventType === 'requirement_refinalized' ||
      actionLower.includes('re-finalized') ||
      (actionLower.includes('modified') && actionLower.includes('requirement'))
    ) {
      return (
        <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-300 inline-flex items-center gap-1">
          <AlertCircle className="w-2.5 h-2.5" />
          SCOPE CHURN
        </span>
      );
    }
    if (log.eventType === 'analytics_rerun' || actionLower.includes('re-run')) {
      return (
        <span className="text-[10px] font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded-md border border-blue-300 inline-flex items-center gap-1">
          <RotateCcw className="w-2.5 h-2.5" />
          ANALYTICS RERUN
        </span>
      );
    }
    if (actionLower.includes('finalized') || actionLower.includes('finalised') || actionLower.includes('signed off')) {
      return (
        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md border border-emerald-300 inline-flex items-center gap-1">
          <CheckCircle2 className="w-2.5 h-2.5" />
          FINALIZATION
        </span>
      );
    }
    return null;
  };

  return (
    <div
      id="collaborative-dispute-log-view"
      className={`bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <History className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-stone-900">
                Collaborative Dispute Resolution &amp; Audit Log
              </h3>
              <span className="text-[10px] font-bold bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full border border-stone-300 uppercase tracking-wider">
                Synchronized Across FRC &amp; Analyst Views
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Immutable collaborative ledger tracking who formulated, modified, re-finalized, or re-ran every step. Replaces disconnected Excel versions with unified proof.
            </p>
          </div>
        </div>

        {/* Quick Excel Export */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={filteredLogs.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-stone-800 rounded-xl text-xs font-semibold border border-stone-300 transition-colors shadow-2xs"
            title="Export dispute activity log to formatted Excel workbook (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Export Log (Excel)
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5 bg-stone-50 p-3 rounded-xl border border-stone-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search dispute log by step, action, user, or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-1 focus:ring-stone-900"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Step Filter */}
          <div className="flex items-center gap-1">
            <span className="text-stone-500 font-medium">Step:</span>
            <select
              value={selectedStep}
              onChange={(e) => setSelectedStep(e.target.value)}
              className="bg-white border border-stone-200 rounded-lg px-2 py-1 text-stone-800 focus:ring-1 focus:ring-stone-900 text-xs font-mono"
            >
              <option value="all">All Steps</option>
              {rows.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id}: {r.stepTitle.slice(0, 24)}...
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1">
            <span className="text-stone-500 font-medium">Role:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-white border border-stone-200 rounded-lg px-2 py-1 text-stone-800 focus:ring-1 focus:ring-stone-900 text-xs"
            >
              <option value="all">All Roles</option>
              <option value="frc">FRC Owner</option>
              <option value="analyst">Analyst</option>
              <option value="system">System</option>
            </select>
          </div>

          {/* Dispute Event Type */}
          <div className="flex items-center gap-1">
            <span className="text-stone-500 font-medium">Category:</span>
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="bg-white border border-stone-200 rounded-lg px-2 py-1 text-stone-800 focus:ring-1 focus:ring-stone-900 text-xs"
            >
              <option value="all">All Categories</option>
              <option value="refinalize">Scope Churn (Re-finalized)</option>
              <option value="rerun">Analytics Reruns &amp; Starts</option>
              <option value="finalized">Finalizations &amp; Sign-offs</option>
              <option value="email">Email Dispatches</option>
            </select>
          </div>
        </div>
      </div>

      {/* Log Entries Table */}
      <div className="border border-stone-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center bg-stone-50 text-stone-500 text-xs">
            <History className="w-8 h-8 text-stone-400 mx-auto mb-2" />
            <p className="font-semibold text-stone-700">No matching audit events found</p>
            <p className="mt-0.5 text-stone-400">
              {logs.length === 0
                ? 'Events will be automatically recorded here as FRC and Analyst perform actions.'
                : 'Try adjusting your search query or dropdown filters above.'}
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-stone-200 text-left text-xs">
            <thead className="bg-stone-100 text-stone-700 font-semibold sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-3 w-28">Timestamp</th>
                <th className="py-2.5 px-3 w-20">Step</th>
                <th className="py-2.5 px-3 w-32">Actor</th>
                <th className="py-2.5 px-3">Action &amp; Evidence</th>
                <th className="py-2.5 px-3 w-28 text-right">Dispute Tag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white">
              {filteredLogs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                const badge = getDisputeBadge(log);
                const stepTitle = log.rowId ? rowTitleMap[log.rowId] : null;

                return (
                  <React.Fragment key={log.id}>
                    <tr
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="hover:bg-stone-50/80 cursor-pointer transition-colors"
                    >
                      {/* Timestamp */}
                      <td className="py-2.5 px-3 align-top font-mono text-[11px] text-stone-600">
                        <div>{new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                        <div className="text-[10px] text-stone-400">
                          {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </td>

                      {/* Step ID */}
                      <td className="py-2.5 px-3 align-top">
                        {log.rowId ? (
                          <span className="font-mono font-bold text-[11px] bg-stone-100 text-stone-900 px-1.5 py-0.5 rounded border border-stone-300">
                            {log.rowId}
                          </span>
                        ) : (
                          <span className="text-stone-400 text-[10px] font-mono">Global</span>
                        )}
                      </td>

                      {/* Actor & Role */}
                      <td className="py-2.5 px-3 align-top">
                        <div className="font-semibold text-stone-900">{log.user}</div>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            log.role === 'FRC Owner'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.role === 'Analyst'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {log.role}
                        </span>
                      </td>

                      {/* Action & Preview */}
                      <td className="py-2.5 px-3 align-top">
                        <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                          <span>{log.action}</span>
                          {stepTitle && (
                            <span className="text-stone-400 text-[11px] font-normal truncate max-w-xs">
                              • {stepTitle}
                            </span>
                          )}
                        </div>
                        <p className={`text-stone-600 text-[11px] mt-0.5 leading-relaxed ${isExpanded ? '' : 'line-clamp-1'}`}>
                          {log.details}
                        </p>
                      </td>

                      {/* Dispute Badge */}
                      <td className="py-2.5 px-3 align-top text-right shrink-0">
                        {badge}
                      </td>
                    </tr>

                    {/* Expandable detail row */}
                    {isExpanded && (
                      <tr className="bg-stone-50 border-b border-stone-200">
                        <td colSpan={5} className="p-3.5 space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-stone-500 border-b border-stone-200 pb-1.5">
                            <span>Audit ID: <strong className="font-mono text-stone-800">{log.id}</strong></span>
                            <span>Exact UTC Timestamp: <strong className="font-mono text-stone-800">{log.timestamp}</strong></span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                              Full Evidence Description:
                            </span>
                            <p className="text-xs text-stone-800 font-mono bg-white p-2.5 rounded-lg border border-stone-200 mt-1 whitespace-pre-wrap leading-relaxed">
                              {log.details}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
        <span>Showing {filteredLogs.length} of {logs.length} audit entries</span>
        <span>Click any row to view complete timestamp and un-truncated details</span>
      </div>
    </div>
  );
};
