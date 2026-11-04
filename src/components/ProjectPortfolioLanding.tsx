import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  FolderPlus,
  Layers,
  ArrowRight,
  ShieldCheck,
  Hash,
  RotateCcw,
  LogOut,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Plus,
  CheckCircle2,
  Inbox,
  Lock,
  Unlock,
  User,
  FileSpreadsheet,
  Download,
  Calendar,
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react';
import { ProjectEntity, AuthUser } from '../types';
import { CreateProjectOrWaterfallModal } from './CreateProjectOrWaterfallModal';
import { exportProjectsListToExcel } from '../utils/exportUtils';
import { formatDateDisplay } from '../utils/workingDays';

interface ProjectPortfolioLandingProps {
  currentUser: AuthUser | null;
  projects: ProjectEntity[];
  onOpenProject: (projectId: string, waterfallId?: string) => void;
  onCreateProject: (details: any) => void;
  onAddWaterfallToProject: (projectId: string, waterfallName: string) => void;
  onDeleteProject: (projectId: string) => void;
  onResetToCleanSlate: () => void;
  onLogout: () => void;
}

export const ProjectPortfolioLanding: React.FC<ProjectPortfolioLandingProps> = ({
  currentUser,
  projects,
  onOpenProject,
  onCreateProject,
  onAddWaterfallToProject,
  onDeleteProject,
  onResetToCleanSlate,
  onLogout,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [expandedProjectIds, setExpandedProjectIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [projectToDelete, setProjectToDelete] = useState<ProjectEntity | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset pagination to page 1 whenever search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  // Filter projects by Issue#, Title, Assignee, or leads
  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return projects;

    return projects.filter((proj) => {
      const issueNum = (proj.projectDetails.issueNumber || '').toLowerCase();
      const title = proj.projectDetails.issueTitle.toLowerCase();
      const desc = (proj.projectDetails.issueDescription || '').toLowerCase();
      const frc = proj.projectDetails.frcName.toLowerCase();
      const analyst = proj.projectDetails.analystName.toLowerCase();
      const assigneeName = (proj.projectDetails.assignedToName || '').toLowerCase();
      const assigneeEmail = (proj.projectDetails.assignedToEmail || '').toLowerCase();
      const waterfalls = proj.waterfalls.map((w) => w.name.toLowerCase()).join(' ');

      return (
        issueNum.includes(q) ||
        title.includes(q) ||
        desc.includes(q) ||
        frc.includes(q) ||
        analyst.includes(q) ||
        assigneeName.includes(q) ||
        assigneeEmail.includes(q) ||
        waterfalls.includes(q)
      );
    });
  }, [projects, searchQuery]);

  // Aggregate portfolio metrics
  const totalWaterfalls = useMemo(
    () => projects.reduce((acc, p) => acc + (p.waterfalls?.length || 0), 0),
    [projects]
  );
  const totalSteps = useMemo(
    () =>
      projects.reduce(
        (acc, p) =>
          acc +
          p.waterfalls.reduce((wAcc, w) => wAcc + (w.rows?.length || 0), 0),
        0
      ),
    [projects]
  );

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, currentPage, pageSize]);

  // Toggle row expansion to reveal linked waterfalls
  const toggleProjectExpand = (projectId: string) => {
    setExpandedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  // Check if current user has edit permission for a project
  const checkUserCanEdit = (project: ProjectEntity) => {
    if (!currentUser) return false;
    const userEmail = currentUser.email.toLowerCase();
    const userName = currentUser.name.toLowerCase();

    const assignedEmail = (project.projectDetails.assignedToEmail || '').toLowerCase();
    const assignedName = (project.projectDetails.assignedToName || '').toLowerCase();
    const frcName = (project.projectDetails.frcName || '').toLowerCase();
    const analystName = (project.projectDetails.analystName || '').toLowerCase();

    if (assignedEmail) {
      return assignedEmail === userEmail || assignedName === userName;
    }
    return (
      assignedName === userName ||
      frcName === userName ||
      analystName === userName
    );
  };

  // Prompt suggestions with valid project Issue Numbers
  const validProjectSuggestions = useMemo(() => {
    return projects.map((p) => {
      const issueNum = p.projectDetails.issueNumber || 'ISS-001';
      return {
        id: p.id,
        issueNumber: issueNum,
        title: p.projectDetails.issueTitle,
        assignedToName: p.projectDetails.assignedToName || p.projectDetails.frcName,
        waterfallsCount: p.waterfalls.length,
        activeWaterfallId: p.activeWaterfallId || p.waterfalls[0]?.id,
      };
    });
  }, [projects]);

  const handleSelectSuggestion = (projId: string, waterfallId?: string) => {
    setIsSearchFocused(false);
    onOpenProject(projId, waterfallId);
  };

  const handleApplyFilterChip = (filterText: string) => {
    setSearchQuery(filterText);
    setIsSearchFocused(false);
  };

  const handleExportPortfolio = () => {
    exportProjectsListToExcel(filteredProjects, 'Project_Portfolio_Register.xlsx');
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col text-stone-900 font-sans antialiased">
      {/* Top Navigation Bar */}
      <header className="bg-stone-900 text-white border-b border-stone-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight text-white">
                  Traceable Waterfalls
                </h1>
                <span className="text-[10px] font-semibold bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded-full">
                  Portfolio Hub
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                Enterprise Project &amp; Waterfall Scoping Register
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-stone-800/80 border border-stone-700 text-xs text-stone-300">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  <strong className="text-white font-semibold">{currentUser.name}</strong>
                  <span className="text-stone-400 text-[11px] ml-1">({currentUser.role})</span>
                </span>
              </div>
            )}

            <button
              type="button"
              id="btn-landing-new-project-top"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-xs"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Create Project</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors border border-stone-700"
              title="Sign out and return to corporate authentication"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Hero Banner & Search Section */}
        <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                  Project Governance
                </span>
                <span className="text-xs text-stone-400 font-mono">
                  {projects.length} Active {projects.length === 1 ? 'Project' : 'Projects'} • {totalWaterfalls} Linked Waterfalls
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-stone-900">
                Project &amp; Waterfall Register
              </h2>
              <p className="text-xs text-stone-500 mt-1 max-w-2xl leading-relaxed">
                Find an existing project by Issue Number, Title, or Assignee. Click any project row to inspect its linked waterfalls, review scoping steps, or export the register.
              </p>
            </div>

            {/* Quick Metrics Strip */}
            <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
              <div className="px-3.5 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-700">
                <span className="text-[10px] text-stone-400 block font-medium">Projects</span>
                <span className="font-bold text-stone-900 font-mono text-sm">{projects.length}</span>
              </div>
              <div className="px-3.5 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-700">
                <span className="text-[10px] text-stone-400 block font-medium">Waterfalls</span>
                <span className="font-bold text-purple-700 font-mono text-sm">{totalWaterfalls}</span>
              </div>
              <div className="px-3.5 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-700">
                <span className="text-[10px] text-stone-400 block font-medium">Scoping Steps</span>
                <span className="font-bold text-emerald-700 font-mono text-sm">{totalSteps}</span>
              </div>
            </div>
          </div>

          {/* Interactive Search Bar with Prompt Suggestions */}
          <div ref={searchContainerRef} className="relative max-w-3xl">
            <div className="relative">
              <Search className="w-5 h-5 text-stone-400 absolute left-4 top-3.5 pointer-events-none" />
              <input
                type="text"
                id="input-landing-search"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find existing project by Issue# (e.g. REQ-4421, TEST-001, ISS-1001), Title, or Assignee..."
                className="w-full pl-11 pr-24 py-3 bg-stone-50 hover:bg-stone-50/80 focus:bg-white text-sm text-stone-900 placeholder-stone-400 rounded-2xl border border-stone-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-hidden transition-all shadow-2xs font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 p-1 rounded-lg"
                  title="Clear search query"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Suggestions Dropdown on Focus */}
            {isSearchFocused && validProjectSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-1.5 text-[10px] uppercase font-bold text-stone-400 border-b border-stone-100 flex items-center justify-between">
                  <span>Existing Projects with Valid Issue#</span>
                  <span>{validProjectSuggestions.length} found</span>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-stone-100">
                  {validProjectSuggestions.map((sug) => (
                    <button
                      key={sug.id}
                      type="button"
                      onClick={() => handleSelectSuggestion(sug.id, sug.activeWaterfallId)}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50/60 flex items-center justify-between gap-3 group transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                            {sug.issueNumber}
                          </span>
                          <span className="font-semibold text-stone-800 truncate group-hover:text-blue-900">
                            {sug.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          Assigned to: <strong className="text-stone-600">{sug.assignedToName}</strong> • {sug.waterfallsCount} {sug.waterfallsCount === 1 ? 'waterfall' : 'waterfalls'}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-blue-600 shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Filter Chips */}
          {validProjectSuggestions.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1">
              <span className="text-stone-500 font-medium flex items-center gap-1 mr-1">
                <Hash className="w-3.5 h-3.5 text-stone-400" />
                Quick Issue# suggestions:
              </span>
              {validProjectSuggestions.slice(0, 6).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleApplyFilterChip(p.issueNumber)}
                  className="px-2.5 py-1 rounded-lg bg-stone-50 border border-stone-200 text-stone-700 hover:bg-blue-50 hover:border-blue-300 font-mono text-[11px] font-semibold transition-colors shadow-2xs"
                  title={`Filter by Issue#: ${p.issueNumber}`}
                >
                  {p.issueNumber}
                </button>
              ))}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-2 py-1 text-xs text-rose-600 hover:text-rose-800 font-semibold ml-2"
                >
                  Clear Filter
                </button>
              )}
            </div>
          )}
        </div>

        {/* RESULTS SECTION: CLEAN LIST / TABLE VIEW */}
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs space-y-0">
          {/* List Action Bar: Controls, Count, Export Button */}
          <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-stone-900">
                Projects Register ({filteredProjects.length})
              </span>
              {searchQuery && (
                <span className="text-xs text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 font-medium">
                  Filtered by &quot;{searchQuery}&quot;
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Export Portfolio Button */}
              {filteredProjects.length > 0 && (
                <button
                  type="button"
                  id="btn-export-portfolio-list"
                  onClick={handleExportPortfolio}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors shadow-2xs cursor-pointer"
                  title="Export complete project portfolio register to Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Export Register (.xlsx)</span>
                </button>
              )}

              {/* Reset to Blank Slate Button */}
              <button
                type="button"
                onClick={onResetToCleanSlate}
                className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-stone-800 bg-white hover:bg-stone-100 border border-stone-200 px-2.5 py-1.5 rounded-xl transition-colors shadow-2xs"
                title="Reset portfolio to 0 projects for clean testing"
              >
                <RotateCcw className="w-3 h-3 text-stone-400" />
                <span>Reset to Blank Slate</span>
              </button>
            </div>
          </div>

          {/* 1. BLANK SEARCH RESULT (when query has no matches) */}
          {searchQuery && filteredProjects.length === 0 && (
            <div className="p-12 text-center space-y-4 animate-in fade-in duration-150">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-base font-bold text-stone-900">
                  No projects found matching &quot;{searchQuery}&quot;
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  We checked Issue numbers, titles, and assignee names. No matching records were
                  found. You can create a new project using this Issue Number or clear your search query.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
                >
                  Clear Search
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Create Project with &quot;{searchQuery}&quot;</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. COMPLETELY BLANK PORTFOLIO (0 projects in system) */}
          {!searchQuery && projects.length === 0 && (
            <div className="p-12 text-center space-y-4 animate-in fade-in duration-150">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Inbox className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-base font-bold text-stone-900">
                  Your Project Portfolio is Empty
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  No projects are currently configured. Create a fresh project with an alphanumeric
                  Issue Number to start scoping your requirements waterfall.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs flex items-center gap-2"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Create First Project</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. STRUCTURED PROJECTS LIST / TABLE */}
          {filteredProjects.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200">
                    <th className="py-3 px-3 w-10 text-center"></th>
                    <th className="py-3 px-4 min-w-[220px]">Issue Title</th>
                    <th className="py-3 px-3 w-36 min-w-[130px]">Issue / Project #</th>
                    <th className="py-3 px-3 w-32 min-w-[110px]">Waterfalls</th>
                    <th className="py-3 px-3 w-32 min-w-[110px]">Steps</th>
                    <th className="py-3 px-4 min-w-[180px]">Assigned To</th>
                    <th className="py-3 px-4 w-16 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {paginatedProjects.map((project) => {
                    const isExpanded = expandedProjectIds.has(project.id);
                    const canEdit = checkUserCanEdit(project);
                    const issueNumber = project.projectDetails.issueNumber || 'ISS-1001';
                    const assignedDisplay =
                      project.projectDetails.assignedToName ||
                      project.projectDetails.frcName ||
                      'Designated Assignee';

                    const totalProjSteps = project.waterfalls.reduce(
                      (acc, w) => acc + (w.rows?.length || 0),
                      0
                    );
                    const finalizedSteps = project.waterfalls.reduce(
                      (acc, w) =>
                        acc +
                        (w.rows?.filter(
                          (r) => r.status === 'step_finalized' || r.status === 'signed_off'
                        ).length || 0),
                      0
                    );

                    return (
                      <React.Fragment key={project.id}>
                        {/* Main Project Row */}
                        <tr
                          id={`project-row-${project.id}`}
                          onClick={() => toggleProjectExpand(project.id)}
                          className={`hover:bg-blue-50/40 transition-colors cursor-pointer ${
                            isExpanded ? 'bg-blue-50/25' : 'bg-white'
                          }`}
                        >
                          {/* Col 0: Expand Chevron */}
                          <td className="py-3.5 px-3 text-center align-middle">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleProjectExpand(project.id);
                              }}
                              className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
                              title={isExpanded ? 'Collapse linked waterfalls' : 'Expand linked waterfalls'}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-blue-600" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </td>

                          {/* Col 1: Issue Title (Clicking opens the project) */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  id={`issue-title-${project.id}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenProject(
                                      project.id,
                                      project.activeWaterfallId || project.waterfalls[0]?.id
                                    );
                                  }}
                                  className="font-bold text-stone-900 text-sm hover:text-blue-600 hover:underline transition-colors text-left cursor-pointer flex items-center gap-1.5 group"
                                  title={`Click to open ${project.projectDetails.issueTitle}`}
                                >
                                  <span>{project.projectDetails.issueTitle}</span>
                                  <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-blue-600 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                                </button>
                                {canEdit ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                                    <Unlock className="w-2.5 h-2.5 text-emerald-600" />
                                    Editable
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-semibold border border-amber-200">
                                    <Lock className="w-2.5 h-2.5 text-amber-600" />
                                    View-Only
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-stone-500 line-clamp-1 leading-relaxed">
                                {project.projectDetails.issueDescription ||
                                  'Requirements governance and quantitative verification workspace.'}
                              </p>
                            </div>
                          </td>

                          {/* Col 2: Issue / Project # */}
                          <td className="py-3.5 px-3 align-top">
                            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs inline-block">
                              {issueNumber}
                            </span>
                          </td>

                          {/* Col 3: Waterfalls Count & Names */}
                          <td className="py-3.5 px-3 align-top">
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold">
                                <Layers className="w-3 h-3 text-purple-600" />
                                {project.waterfalls.length}{' '}
                                {project.waterfalls.length === 1 ? 'Waterfall' : 'Waterfalls'}
                              </span>
                              <span className="text-[10px] text-stone-400 block truncate max-w-[130px]">
                                {project.waterfalls[0]?.name || 'Initial Waterfall'}
                              </span>
                            </div>
                          </td>

                          {/* Col 4: Steps Count */}
                          <td className="py-3.5 px-3 align-top">
                            <div>
                              <span className="font-bold text-stone-900 font-mono text-xs">
                                {totalProjSteps} {totalProjSteps === 1 ? 'Step' : 'Steps'}
                              </span>
                              <span className="text-[10px] text-emerald-700 block font-medium">
                                {finalizedSteps} finalized
                              </span>
                            </div>
                          </td>

                          {/* Col 5: Assigned To */}
                          <td className="py-3.5 px-4 align-top">
                            <div>
                              <div className="flex items-center gap-1.5 font-semibold text-stone-800">
                                <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                <span className="truncate max-w-[160px]">{assignedDisplay}</span>
                              </div>
                              <div className="text-[10px] text-stone-400 truncate mt-0.5">
                                FRC: {project.projectDetails.frcName} • Lead: {project.projectDetails.analystName}
                              </div>
                            </div>
                          </td>

                          {/* Col 6: Delete Action */}
                          <td className="py-3.5 px-4 text-right align-middle" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setProjectToDelete(project)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete project"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>

                        {/* Expandable Drawer: Inside Linked Waterfalls List */}
                        {isExpanded && (
                          <tr className="bg-stone-50/80 border-b border-stone-200">
                            <td colSpan={7} className="p-4 sm:p-5">
                              <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-2xs space-y-3.5">
                                <div className="flex items-center justify-between gap-3 border-b border-stone-100 pb-2.5">
                                  <div className="flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-purple-600" />
                                    <h4 className="text-xs font-bold text-stone-900">
                                      Linked Waterfalls in &quot;{project.projectDetails.issueTitle}&quot; (Issue #{issueNumber})
                                    </h4>
                                    <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                                      {project.waterfalls.length} Total
                                    </span>
                                  </div>

                                  {canEdit && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const wfName = prompt(
                                          `Add a new waterfall for project "${project.projectDetails.issueTitle}":\nEnter Waterfall Name:`
                                        );
                                        if (wfName && wfName.trim()) {
                                          onAddWaterfallToProject(project.id, wfName.trim());
                                        }
                                      }}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer"
                                      title="Add an additional waterfall to this project"
                                    >
                                      <Plus className="w-3.5 h-3.5 text-purple-600" />
                                      <span>Add Waterfall</span>
                                    </button>
                                  )}
                                </div>

                                {/* Waterfalls sub-list */}
                                <div className="divide-y divide-stone-100 text-xs">
                                  {project.waterfalls.map((wf, wfIndex) => {
                                    const wfSteps = wf.rows?.length || 0;
                                    const wfFinalized =
                                      wf.rows?.filter(
                                        (r) =>
                                          r.status === 'step_finalized' || r.status === 'signed_off'
                                      ).length || 0;

                                    return (
                                      <div
                                        key={wf.id}
                                        className="py-2.5 px-2 flex items-center justify-between gap-3 hover:bg-stone-50 rounded-xl transition-colors"
                                      >
                                        <div className="flex items-center gap-3 min-w-0">
                                          <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                                            #{wfIndex + 1}
                                          </span>
                                          <div className="min-w-0">
                                            <span className="font-bold text-stone-900 block truncate">
                                              {wf.name}
                                            </span>
                                            <span className="text-[10px] text-stone-400 block">
                                              ID: {wf.id} • Created {formatDateDisplay(wf.createdAt || project.createdAt)}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-4 shrink-0">
                                          <div className="text-right">
                                            <span className="font-mono font-bold text-stone-900 block">
                                              {wfSteps} {wfSteps === 1 ? 'Step' : 'Steps'}
                                            </span>
                                            <span className="text-[10px] text-emerald-700 font-medium">
                                              {wfFinalized} Finalized
                                            </span>
                                          </div>

                                          <button
                                            type="button"
                                            onClick={() => onOpenProject(project.id, wf.id)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-900 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                                            title={`Launch directly into Waterfall: ${wf.name}`}
                                          >
                                            <span>Launch Waterfall</span>
                                            <ArrowRight className="w-3 h-3 text-purple-300" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls Footer */}
          {filteredProjects.length > 0 && (
            <div className="p-4 border-t border-stone-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600">
              <div className="flex items-center gap-3">
                <span>
                  Showing{' '}
                  <strong className="text-stone-900 font-semibold">
                    {(currentPage - 1) * pageSize + 1}
                  </strong>{' '}
                  to{' '}
                  <strong className="text-stone-900 font-semibold">
                    {Math.min(currentPage * pageSize, filteredProjects.length)}
                  </strong>{' '}
                  of{' '}
                  <strong className="text-stone-900 font-semibold">
                    {filteredProjects.length}
                  </strong>{' '}
                  Projects
                </span>

                <div className="flex items-center gap-1 text-[11px] text-stone-500 border-l border-stone-200 pl-3">
                  <span>Show:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="px-2 py-0.5 rounded border border-stone-300 bg-stone-50 text-stone-800 text-xs font-semibold focus:outline-hidden"
                  >
                    <option value={5}>5 / page</option>
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                    <option value={50}>50 / page</option>
                  </select>
                </div>
              </div>

              {/* Next / Previous Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  id="btn-pagination-prev"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                    currentPage <= 1
                      ? 'border-stone-200 text-stone-300 bg-stone-50 cursor-not-allowed'
                      : 'border-stone-300 text-stone-700 hover:bg-stone-100 bg-white cursor-pointer'
                  }`}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                            currentPage === pageNum
                              ? 'bg-stone-900 text-white'
                              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                      return (
                        <span key={pageNum} className="text-stone-400 px-1">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  type="button"
                  id="btn-pagination-next"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                    currentPage >= totalPages
                      ? 'border-stone-200 text-stone-300 bg-stone-50 cursor-not-allowed'
                      : 'border-stone-300 text-stone-700 hover:bg-stone-100 bg-white cursor-pointer'
                  }`}
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Delete Project?</h3>
                <p className="text-xs text-stone-500">
                  Issue #{projectToDelete.projectDetails.issueNumber}
                </p>
              </div>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to delete <strong className="text-stone-900">{projectToDelete.projectDetails.issueTitle}</strong>? All {projectToDelete.waterfalls.length} linked waterfall(s) and their scoping steps will be permanently removed.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteProject(projectToDelete.id);
                  setProjectToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-700">Requirements Waterfall</span>
            <span>•</span>
            <span>Enterprise Project Portfolio &amp; Issue Resolution</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Auditable Governance
            </span>
            <span>•</span>
            <span className="text-stone-600">
              Active Projects: <strong className="font-bold text-stone-800">{projects.length}</strong>
            </span>
          </div>
        </div>
      </footer>

      {/* Unified Create Project / Add Waterfall Modal */}
      <CreateProjectOrWaterfallModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        existingProjects={projects}
        initialQuery={searchQuery}
        onCreateNewProject={onCreateProject}
        onAddWaterfallToExistingProject={onAddWaterfallToProject}
        currentUser={currentUser}
      />
    </div>
  );
};
