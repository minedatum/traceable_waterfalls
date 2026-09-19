import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  FileQuestion,
  Files,
  ExternalLink,
  ChevronRight,
  Info,
  Calendar,
  Layers,
} from 'lucide-react';
import { DeliverableAuditResult, ScannedFile, PhaseId } from '../types';
import { formatBytes } from '../utils/auditor';

interface DeliverablesTableProps {
  results: DeliverableAuditResult[];
  unmatchedFiles: ScannedFile[];
  activePhase: PhaseId | 'all';
  activeStatusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onSelectDeliverable: (result: DeliverableAuditResult) => void;
  onSelectUnmatchedFile: (file: ScannedFile) => void;
  onUploadFileForDeliverable?: (deliverableId: string) => void;
}

export const DeliverablesTable: React.FC<DeliverablesTableProps> = ({
  results,
  unmatchedFiles,
  activePhase,
  activeStatusFilter,
  onStatusFilterChange,
  onSelectDeliverable,
  onSelectUnmatchedFile,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtered deliverables
  const filteredResults = useMemo(() => {
    return results.filter((res) => {
      // Phase filter
      if (activePhase !== 'all' && res.deliverable.phaseId !== activePhase) {
        return false;
      }
      // Status filter
      if (activeStatusFilter !== 'all' && activeStatusFilter !== 'unmatched') {
        if (res.status !== activeStatusFilter) return false;
      }
      // Search filter
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const matchName = res.deliverable.name.toLowerCase().includes(query);
        const matchCode = res.deliverable.code.toLowerCase().includes(query);
        const matchFile = res.matchedFile?.name.toLowerCase().includes(query) ?? false;
        if (!matchName && !matchCode && !matchFile) return false;
      }
      return true;
    });
  }, [results, activePhase, activeStatusFilter, searchTerm]);

  // Filtered unmatched files
  const filteredUnmatched = useMemo(() => {
    if (searchTerm.trim() === '') return unmatchedFiles;
    const query = searchTerm.toLowerCase();
    return unmatchedFiles.filter(
      (f) => f.name.toLowerCase().includes(query) || f.path.toLowerCase().includes(query)
    );
  }, [unmatchedFiles, searchTerm]);

  const showUnmatchedTab = activeStatusFilter === 'unmatched';

  return (
    <div id="deliverables-audit-table-card" className="bg-white border border-stone-200 rounded-xl shadow-2xs overflow-hidden">
      {/* Controls Header */}
      <div className="p-4 border-b border-stone-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-stone-50/50">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            type="button"
            id="filter-tab-all"
            onClick={() => onStatusFilterChange('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeStatusFilter === 'all'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            All Items ({results.length})
          </button>

          <button
            type="button"
            id="filter-tab-missing"
            onClick={() => onStatusFilterChange('missing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeStatusFilter === 'missing'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
            }`}
          >
            <FileQuestion className="w-3.5 h-3.5" />
            Missing ({results.filter((r) => r.status === 'missing').length})
          </button>

          <button
            type="button"
            id="filter-tab-outdated"
            onClick={() => onStatusFilterChange('outdated')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeStatusFilter === 'outdated'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Outdated ({results.filter((r) => r.status === 'outdated').length})
          </button>

          <button
            type="button"
            id="filter-tab-uptodate"
            onClick={() => onStatusFilterChange('up-to-date')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeStatusFilter === 'up-to-date'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Up to Date ({results.filter((r) => r.status === 'up-to-date').length})
          </button>

          <button
            type="button"
            id="filter-tab-unmatched"
            onClick={() => onStatusFilterChange('unmatched')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeStatusFilter === 'unmatched'
                ? 'bg-stone-700 text-white shadow-xs'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <Files className="w-3.5 h-3.5" />
            Extra Assets ({unmatchedFiles.length})
          </button>
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="search-deliverables"
            placeholder="Search deliverables or files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {!showUnmatchedTab ? (
        <div className="overflow-x-auto">
          {filteredResults.length === 0 ? (
            <div className="py-12 text-center">
              <FileQuestion className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-stone-700">No deliverables match this filter</p>
              <p className="text-xs text-stone-500 mt-1">Try selecting another status tab or clear the search.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100/60 text-stone-600 font-semibold border-b border-stone-200">
                  <th className="py-3 px-4">Code / Deliverable</th>
                  <th className="py-3 px-4">Phase</th>
                  <th className="py-3 px-4">Audit Status</th>
                  <th className="py-3 px-4">Matched File</th>
                  <th className="py-3 px-4">Freshness / Age</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredResults.map((item) => {
                  const isMissing = item.status === 'missing';
                  const isOutdated = item.status === 'outdated';
                  const isUpToDate = item.status === 'up-to-date';

                  return (
                    <tr
                      key={item.deliverable.id}
                      id={`row-deliverable-${item.deliverable.id}`}
                      className="hover:bg-stone-50/70 transition-colors group cursor-pointer"
                      onClick={() => onSelectDeliverable(item)}
                    >
                      {/* Code & Name */}
                      <td className="py-3 px-4 align-top">
                        <div className="flex items-start gap-2">
                          <span className="font-mono text-[11px] font-semibold text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded shrink-0">
                            {item.deliverable.code}
                          </span>
                          <div>
                            <div className="font-semibold text-stone-900 group-hover:text-stone-950 flex items-center gap-1.5">
                              {item.deliverable.name}
                              {item.deliverable.isMandatory ? (
                                <span className="text-[10px] text-rose-700 font-medium bg-rose-50 px-1 rounded">
                                  Mandatory
                                </span>
                              ) : (
                                <span className="text-[10px] text-stone-500 bg-stone-100 px-1 rounded">
                                  Optional
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                              {item.deliverable.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Phase */}
                      <td className="py-3 px-4 align-top text-stone-600 whitespace-nowrap">
                        <span className="inline-flex items-center text-[11px] font-medium text-stone-700">
                          <Layers className="w-3 h-3 mr-1 text-stone-400" />
                          {item.deliverable.phaseId.charAt(0).toUpperCase() +
                            item.deliverable.phaseId.slice(1)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 align-top whitespace-nowrap">
                        {isUpToDate && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                            Up to date
                          </span>
                        )}
                        {isOutdated && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
                            Outdated ({item.daysOld}d)
                          </span>
                        )}
                        {isMissing && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            <FileQuestion className="w-3 h-3 mr-1 text-rose-600" />
                            Missing
                          </span>
                        )}
                      </td>

                      {/* Matched File */}
                      <td className="py-3 px-4 align-top max-w-xs">
                        {item.matchedFile ? (
                          <div>
                            <div className="font-mono text-[11px] font-medium text-stone-800 truncate" title={item.matchedFile.name}>
                              {item.matchedFile.name}
                            </div>
                            <div className="text-[10px] text-stone-400 truncate mt-0.5" title={item.matchedFile.path}>
                              {item.matchedFile.path}
                            </div>
                          </div>
                        ) : (
                          <span className="text-stone-400 italic text-[11px]">No matching file found</span>
                        )}
                      </td>

                      {/* Freshness / Age */}
                      <td className="py-3 px-4 align-top text-stone-600 whitespace-nowrap">
                        {item.matchedFile ? (
                          <div className="flex items-center gap-1 text-[11px]">
                            <Calendar className="w-3 h-3 text-stone-400" />
                            <span>{item.daysOld} days ago</span>
                            <span className="text-stone-400">
                              (limit {item.deliverable.maxAgeDays || 60}d)
                            </span>
                          </div>
                        ) : (
                          <span className="text-stone-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                        <button
                          type="button"
                          className="inline-flex items-center text-xs font-medium text-stone-700 hover:text-stone-900 group-hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDeliverable(item);
                          }}
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* Extra / Unmatched Files View */
        <div className="p-4">
          <div className="mb-3 p-3 bg-stone-50 border border-stone-200 rounded-lg flex items-center justify-between text-xs text-stone-600">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-stone-500 shrink-0" />
              <span>
                These files exist in the project folder but do not map directly to any standard Waterfall deliverable code or pattern.
              </span>
            </div>
            <span className="font-semibold text-stone-800">{filteredUnmatched.length} files found</span>
          </div>

          {filteredUnmatched.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-500">
              No extra files found in the folder.
            </div>
          ) : (
            <div className="divide-y divide-stone-100 border border-stone-200 rounded-lg overflow-hidden">
              {filteredUnmatched.map((file) => (
                <div
                  key={file.id}
                  onClick={() => onSelectUnmatchedFile(file)}
                  className="p-3 hover:bg-stone-50 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Files className="w-4 h-4 text-stone-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-stone-800 truncate">{file.name}</p>
                      <p className="text-[11px] text-stone-400 truncate">{file.path}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-stone-500 shrink-0">
                    <span>{formatBytes(file.size)}</span>
                    <span>{new Date(file.lastModified).toLocaleDateString()}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
