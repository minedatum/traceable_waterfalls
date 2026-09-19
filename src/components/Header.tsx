import React, { useState, useRef, useEffect } from 'react';
import {
  RotateCcw,
  Briefcase,
  UserCheck,
  PlayCircle,
  RefreshCw,
  Plus,
  FolderPlus,
  MoreVertical,
  Layers,
  Check,
  ChevronDown,
} from 'lucide-react';
import { ProjectAuditReport, UserRole, WaterfallEntity } from '../types';

interface HeaderProps {
  report: ProjectAuditReport;
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onOpenAuditLogs: () => void;
  auditLogsCount: number;
  onFilesSelected: (files: FileList) => void;
  onLoadSample: () => void;
  onOpenRules: () => void;
  onOpenExport: () => void;
  onOpenScaffold: () => void;
  isUsingSample: boolean;
  folderName: string;
  onResetToCleanSlate?: () => void;
  onLoadSampleDemo?: () => void;
  waterfallRowsCount?: number;
  onRefreshData?: () => void;
  onExportExcel?: () => void;
  onOpenAddWaterfall?: () => void;
  onOpenCreateProject?: () => void;
  waterfalls?: WaterfallEntity[];
  activeWaterfallId?: string;
  onSelectWaterfall?: (waterfallId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  report,
  userRole,
  onRoleChange,
  onOpenAuditLogs,
  auditLogsCount,
  onFilesSelected,
  onLoadSample,
  onOpenRules,
  onOpenExport,
  onOpenScaffold,
  isUsingSample,
  folderName,
  onResetToCleanSlate,
  onLoadSampleDemo,
  waterfallRowsCount = 0,
  onRefreshData,
  onExportExcel,
  onOpenAddWaterfall,
  onOpenCreateProject,
  waterfalls = [],
  activeWaterfallId,
  onSelectWaterfall,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const activeWaterfall = waterfalls.find((wf) => wf.id === activeWaterfallId);
  return (
    <header id="header-waterfall-auditor" className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Dual-Role View Segmented Toggle (View / Mode) */}
        <div className="flex items-center">
          <div
            id="role-toggle-container"
            className="inline-flex rounded-xl border border-stone-300 bg-stone-100 p-1 shadow-inner text-xs font-semibold"
          >
            <button
              type="button"
              id="role-btn-frc"
              onClick={() => onRoleChange('frc')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                userRole === 'frc'
                  ? 'bg-white text-emerald-900 font-bold shadow-xs border border-emerald-200/60'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Briefcase className={`w-3.5 h-3.5 ${userRole === 'frc' ? 'text-emerald-600' : 'text-stone-400'}`} />
              FRC Workspace
            </button>

            <button
              type="button"
              id="role-btn-analyst"
              onClick={() => onRoleChange('analyst')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                userRole === 'analyst'
                  ? 'bg-white text-blue-900 font-bold shadow-xs border border-blue-200/60'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <UserCheck className={`w-3.5 h-3.5 ${userRole === 'analyst' ? 'text-blue-600' : 'text-stone-400'}`} />
              Analyst Workspace
            </button>
          </div>
        </div>

        {/* Global Action Controls: Waterfall Selector Menu, Create Project, Refresh Data, Reset */}
        <div className="flex items-center flex-wrap gap-2.5 justify-end">
          {/* Waterfall Dropdown Menu: 'View Waterfalls' */}
          <div className="relative inline-block text-left" ref={menuRef}>
            <button
              id="header-btn-waterfalls-menu"
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-xs border ${
                isMenuOpen
                  ? 'bg-purple-700 text-white border-purple-800'
                  : 'bg-purple-600 hover:bg-purple-700 text-white border-purple-700/50'
              }`}
              title="View all waterfalls in this project or add a new waterfall"
              aria-expanded={isMenuOpen}
              aria-haspopup="true"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>View Waterfalls</span>
              {waterfalls.length > 0 && (
                <span className="bg-purple-800/80 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {waterfalls.length}
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Menu Popup */}
            {isMenuOpen && (
              <div
                id="header-waterfalls-dropdown-panel"
                className="absolute right-0 mt-1.5 w-72 origin-top-right rounded-xl bg-white shadow-xl ring-1 ring-black/10 border border-stone-200 py-1.5 z-50 focus:outline-hidden animate-in fade-in zoom-in-95 duration-150"
              >
                {waterfalls.length > 0 ? (
                  <>
                    {/* Section: List of Existing & Additional Waterfalls */}
                    <div className="px-3 pt-2 pb-1.5 flex items-center justify-between border-b border-stone-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                        Project Waterfalls ({waterfalls.length})
                      </span>
                      {activeWaterfall && (
                        <span className="text-[10px] text-purple-700 font-semibold bg-purple-50 px-1.5 py-0.5 rounded">
                          Current Active
                        </span>
                      )}
                    </div>

                    <div className="max-h-60 overflow-y-auto px-1 py-1 space-y-0.5">
                      {waterfalls.map((wf) => {
                        const isActive = wf.id === activeWaterfallId;
                        return (
                          <button
                            key={wf.id}
                            id={`menu-item-wf-${wf.id}`}
                            type="button"
                            onClick={() => {
                              if (onSelectWaterfall) {
                                onSelectWaterfall(wf.id);
                              }
                              setIsMenuOpen(false);
                            }}
                            className={`w-full text-left flex items-start justify-between gap-2 px-2.5 py-2 text-xs rounded-lg transition-colors ${
                              isActive
                                ? 'bg-purple-50 font-bold text-purple-900 border border-purple-200/70'
                                : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900 font-medium'
                            }`}
                          >
                            <div className="flex items-start gap-2 min-w-0">
                              <Layers
                                className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                                  isActive ? 'text-purple-600' : 'text-stone-400'
                                }`}
                              />
                              <div className="min-w-0">
                                <span className="block truncate">{wf.name}</span>
                                <span className="text-[10px] font-normal text-stone-500 block mt-0.5">
                                  {wf.rows?.length || 0} {wf.rows?.length === 1 ? 'step' : 'steps'}
                                </span>
                              </div>
                            </div>
                            {isActive && <Check className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Action to Add New Waterfall inside dropdown */}
                    {onOpenAddWaterfall && (
                      <div className="px-2 pt-1 pb-0.5 border-t border-stone-100 mt-1">
                        <button
                          id="menu-btn-add-waterfall"
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            onOpenAddWaterfall();
                          }}
                          className="w-full text-left flex items-center gap-2 px-2.5 py-2 text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                        >
                          <Plus className="w-4 h-4 text-purple-600 shrink-0" />
                          <span>Add New Waterfall</span>
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  /* If there are no waterfalls, dropdown provides 'Add New Waterfall' option */
                  <div className="p-2">
                    <div className="px-2 py-1.5 text-xs text-stone-500 italic">
                      No additional waterfalls found
                    </div>
                    {onOpenAddWaterfall && (
                      <button
                        id="menu-btn-add-waterfall-empty"
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenAddWaterfall();
                        }}
                        className="w-full text-left flex items-center gap-2 px-2.5 py-2 text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors mt-1"
                      >
                        <Plus className="w-4 h-4 text-purple-600 shrink-0" />
                        <span>Add New Waterfall</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Option 2: Create Project */}
          {onOpenCreateProject && (
            <button
              id="header-btn-create-project"
              type="button"
              onClick={onOpenCreateProject}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 active:bg-stone-200 border border-stone-300 rounded-lg transition-all shadow-2xs"
              title="Create new project from scratch with new COE#, eGRC#, and details"
            >
              <FolderPlus className="w-3.5 h-3.5 text-blue-600" />
              <span>Create Project</span>
            </button>
          )}

          {/* Option 3: Refresh Data */}
          {onRefreshData && (
            <button
              id="btn-refresh-data"
              type="button"
              onClick={onRefreshData}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-all shadow-xs border border-blue-700/50"
              title="Refresh all analytical steps and notify the Project Team via email"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Data</span>
            </button>
          )}

          {/* Reset Demo back to Clean Slate (shown in FRC view) */}
          {userRole !== 'analyst' && onResetToCleanSlate && (
            <button
              id="btn-reset-clean-slate"
              type="button"
              onClick={() => {
                if (window.confirm('Reset workspace to a 100% clean slate with 0 steps and 0 progress for first-time leadership demo?')) {
                  onResetToCleanSlate();
                }
              }}
              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-rose-700 bg-stone-100 hover:bg-rose-50 border border-stone-200 hover:border-rose-300 rounded-lg transition-colors shadow-2xs"
              title="Reset all steps and progress back to clean first-time use state"
            >
              <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
              <span>Reset Demo</span>
            </button>
          )}

          {/* Optional Load Sample Data for demonstration (shown in FRC view) */}
          {userRole !== 'analyst' && waterfallRowsCount === 0 && onLoadSampleDemo && (
            <button
              id="btn-load-sample-demo"
              type="button"
              onClick={onLoadSampleDemo}
              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-lg transition-colors"
              title="Quickly populate sample waterfall steps to show leadership what completed steps look like"
            >
              <PlayCircle className="w-3.5 h-3.5 text-stone-500" />
              <span>Load Sample Steps</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

