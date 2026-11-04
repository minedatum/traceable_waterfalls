import React, { useState, useEffect } from 'react';
import {
  FolderPlus,
  Layers,
  X,
  Hash,
  ShieldCheck,
  FileText,
  UserCheck,
  AlertTriangle,
  ArrowRight,
  Info,
  CheckCircle2,
  Mail,
  User,
  Database,
  FileSpreadsheet,
  Workflow,
  GitBranch,
} from 'lucide-react';
import {
  ProjectEntity,
  ProjectDetails,
  AuthUser,
  WaterfallLineage,
  DataSourceType,
  LineageType,
} from '../types';

interface CreateProjectOrWaterfallModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingProjects: ProjectEntity[];
  onCreateNewProject: (details: ProjectDetails) => void;
  onAddWaterfallToExistingProject: (
    projectId: string,
    waterfallName: string,
    lineage?: WaterfallLineage,
    dataSourceType?: DataSourceType,
    dataSourceDetail?: string
  ) => void;
  initialQuery?: string;
  currentUser?: AuthUser | null;
}

export const CreateProjectOrWaterfallModal: React.FC<CreateProjectOrWaterfallModalProps> = ({
  isOpen,
  onClose,
  existingProjects,
  onCreateNewProject,
  onAddWaterfallToExistingProject,
  initialQuery = '',
  currentUser,
}) => {
  const [formData, setFormData] = useState<ProjectDetails>({
    issueNumber: '',
    issueTitle: '',
    issueDescription: '',
    assignedToName: '',
    assignedToEmail: '',
    frcName: '',
    analystName: '',
    waterfallName: 'Initial Scoping Waterfall',
    initialDataSourceType: 'Database',
    initialDataSourceDetail: '',
  });

  // Duplicate resolution mode: 'optionA' = Add Waterfall to existing project; 'optionB' = Create Separate Project / Revision
  const [duplicateOption, setDuplicateOption] = useState<'optionA' | 'optionB'>('optionA');
  const [existingWaterfallName, setExistingWaterfallName] = useState('');
  const [optionALineageType, setOptionALineageType] = useState<LineageType>('cascading');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize or autofill from initialQuery and currentUser if provided
  useEffect(() => {
    if (isOpen) {
      const q = initialQuery.trim();
      const defaultAssigneeName = currentUser?.name || 'Sarah Jenkins';
      const defaultAssigneeEmail = currentUser?.email || 'sarah.jenkins@enterprise.bank';

      setFormData({
        issueNumber: q || '',
        issueTitle: '',
        issueDescription: '',
        assignedToName: defaultAssigneeName,
        assignedToEmail: defaultAssigneeEmail,
        frcName: currentUser?.role === 'FRC Owner' ? defaultAssigneeName : 'Sarah Jenkins',
        analystName: currentUser?.role === 'Analyst' ? defaultAssigneeName : 'Alex Morgan',
        waterfallName: 'Initial Scoping Waterfall',
        initialDataSourceType: 'Database',
        initialDataSourceDetail: '',
      });
      setExistingWaterfallName('New Waterfall Workspace');
      setOptionALineageType('cascading');
      setErrors({});
      setDuplicateOption('optionA');
    }
  }, [isOpen, initialQuery, currentUser]);

  if (!isOpen) return null;

  // Real-time check if entered Issue Number matches an existing project in portfolio
  const trimmedIssueNumber = formData.issueNumber.trim().toUpperCase();

  const duplicateProject = trimmedIssueNumber
    ? existingProjects.find((p) => {
        const pNum = (p.projectDetails.issueNumber || '').trim().toUpperCase();
        return pNum === trimmedIssueNumber;
      })
    : undefined;

  const isDuplicateDetected = Boolean(duplicateProject);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (isDuplicateDetected && duplicateOption === 'optionA') {
      // Option A: Add Waterfall for Existing Project
      if (!existingWaterfallName.trim()) {
        newErrors.existingWaterfallName = 'Please enter a name for the new waterfall.';
        setErrors(newErrors);
        return;
      }
      if (duplicateProject) {
        const parentWf = duplicateProject.waterfalls[duplicateProject.waterfalls.length - 1];
        const parentLastRow = parentWf?.rows?.[parentWf.rows.length - 1];
        const parentFinalPop =
          typeof parentLastRow?.finalPopulation === 'number' ? parentLastRow.finalPopulation : undefined;

        const lineage: WaterfallLineage =
          optionALineageType === 'cascading'
            ? {
                type: 'cascading',
                parentWaterfallId: parentWf?.id,
                parentWaterfallName: parentWf?.name,
                parentStepNumber: parentLastRow?.stepNumber || parentWf?.rows?.length,
                parentStepTitle: parentLastRow?.stepTitle,
                parentFinalPopulation: parentFinalPop,
                notes: `Cascaded starting population from final step of "${parentWf?.name}".`,
              }
            : optionALineageType === 'shared_source'
            ? {
                type: 'shared_source',
                parentWaterfallId: parentWf?.id,
                parentWaterfallName: parentWf?.name,
                notes: `Shares data source with "${parentWf?.name}".`,
              }
            : {
                type: 'independent',
                notes: 'Independent cohort population.',
              };

        onAddWaterfallToExistingProject(
          duplicateProject.id,
          existingWaterfallName.trim(),
          lineage,
          parentWf?.dataSourceType || 'Database',
          parentWf?.dataSourceDetail || 'Enterprise Database'
        );
        onClose();
      }
      return;
    }

    // Validate Issue Number
    if (!formData.issueNumber.trim()) {
      newErrors.issueNumber = 'Issue Number is required (e.g. REQ-4421, ISS-2026-A1)';
    } else {
      // Alphanumeric format acceptance (letters, numbers, hyphens, underscores, dots, slashes)
      const alphanumericRegex = /^[A-Za-z0-9-_./\s]+$/;
      if (!alphanumericRegex.test(formData.issueNumber.trim())) {
        newErrors.issueNumber = 'Issue Number must be alphanumeric (letters, numbers, hyphens, underscores).';
      }
    }

    // STRICT USER REQUIREMENT:
    // "In duplicate ID Option B: Create as Separate Project / Revision, this should not accept same Issue Number for a new project/Issue"
    if (isDuplicateDetected && duplicateOption === 'optionB') {
      const issueExists = existingProjects.some((p) => {
        const pNum = (p.projectDetails.issueNumber || '').trim().toUpperCase();
        return pNum === trimmedIssueNumber;
      });
      if (issueExists) {
        newErrors.issueNumber = `Duplicate Issue Number not permitted: "${formData.issueNumber}" is already registered. A new project/issue must be assigned a unique Issue Number.`;
      }
    }

    if (!formData.issueTitle.trim()) {
      newErrors.issueTitle = 'Issue Title is required';
    }

    if (!formData.assignedToEmail?.trim()) {
      newErrors.assignedToEmail = 'Assigned user email is required for edit permissions';
    }

    if (!formData.frcName.trim()) {
      newErrors.frcName = 'Requirements Lead (FRC Name) is required';
    }
    if (!formData.analystName.trim()) {
      newErrors.analystName = 'Development Lead (Analyst Name) is required';
    }
    if (!formData.waterfallName.trim()) {
      newErrors.waterfallName = 'Initial Waterfall Name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onCreateNewProject({
      issueNumber: formData.issueNumber.trim(),
      issueTitle: formData.issueTitle.trim(),
      issueDescription: formData.issueDescription?.trim() || '',
      assignedToName: formData.assignedToName?.trim() || currentUser?.name || 'Sarah Jenkins',
      assignedToEmail: formData.assignedToEmail?.trim().toLowerCase() || currentUser?.email || 'sarah.jenkins@enterprise.bank',
      frcName: formData.frcName.trim(),
      analystName: formData.analystName.trim(),
      waterfallName: formData.waterfallName.trim(),
      initialDataSourceType: formData.initialDataSourceType || 'Database',
      initialDataSourceDetail:
        formData.initialDataSourceDetail?.trim() ||
        (formData.initialDataSourceType === 'Database'
          ? 'Enterprise Database / EDW Table'
          : 'Flat File provided by stakeholder'),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-2xl w-full my-8 p-6 animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                {isDuplicateDetected ? 'Project Collision Detected' : 'Create New Project'}
              </h3>
              <p className="text-xs text-stone-500">
                Configure project governance identifiers, designate assignee, and initialize the first waterfall workspace.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Issue Number Input */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-blue-600" />
                Issue Number <span className="text-rose-500">*</span>
              </span>
              {duplicateProject ? (
                <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Existing Issue # Detected
                </span>
              ) : (
                <span className="text-[11px] text-stone-400 font-normal">
                  Alphanumeric (e.g. REQ-4421, ISS-2026-A1, TEST-001)
                </span>
              )}
            </label>
            <input
              type="text"
              placeholder="e.g. REQ-4421 or ISS-2026-A1"
              value={formData.issueNumber}
              onChange={(e) => {
                setFormData({ ...formData, issueNumber: e.target.value });
                if (errors.issueNumber) setErrors({ ...errors, issueNumber: '' });
              }}
              className={`w-full text-xs font-mono px-3.5 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 shadow-2xs ${
                errors.issueNumber ? 'border-rose-400 bg-rose-50/40 text-rose-900' : 'border-stone-300'
              }`}
            />
            {errors.issueNumber && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.issueNumber}</p>
            )}
          </div>

          {/* DUPLICATE PROJECT DETECTED BANNER & RADIO WORKFLOW */}
          {isDuplicateDetected && duplicateProject && (
            <div className="p-4 bg-amber-50 border border-amber-200/90 rounded-2xl text-xs space-y-3 animate-in fade-in duration-150">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-900">
                    An existing project with this Issue Number was found:
                  </p>
                  <p className="font-medium text-stone-800">
                    <strong>"{duplicateProject.projectDetails.issueTitle}"</strong>
                  </p>
                  <p className="text-[11px] text-stone-600 font-mono">
                    Issue #: {duplicateProject.projectDetails.issueNumber} · Assigned: {duplicateProject.projectDetails.assignedToName || duplicateProject.projectDetails.frcName} · Waterfalls: {duplicateProject.waterfalls.length}
                  </p>
                </div>
              </div>

              {/* Option Choice Radios */}
              <div className="space-y-2 pt-2 border-t border-amber-200">
                <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                  Select Action for Duplicate Issue #:
                </p>

                {/* Option A: Add Waterfall for Existing Project */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    duplicateOption === 'optionA'
                      ? 'bg-white border-purple-400 shadow-xs ring-1 ring-purple-400'
                      : 'bg-amber-100/40 border-amber-200 hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="duplicateOption"
                    value="optionA"
                    checked={duplicateOption === 'optionA'}
                    onChange={() => setDuplicateOption('optionA')}
                    className="mt-1 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900">
                        Option A: Add Waterfall for Existing Project
                      </span>
                      <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.2 rounded">
                        Recommended
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600">
                      Attach a new waterfall workspace directly under this project's existing governance.
                    </p>

                    {duplicateOption === 'optionA' && (
                      <div className="mt-2.5 pt-2 border-t border-stone-200/60 space-y-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-stone-700 mb-1">
                            New Waterfall Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={existingWaterfallName}
                            onChange={(e) => {
                              setExistingWaterfallName(e.target.value);
                              if (errors.existingWaterfallName) setErrors({ ...errors, existingWaterfallName: '' });
                            }}
                            placeholder="e.g. Q4 Secondary Filter Waterfall"
                            className="w-full text-xs px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                          />
                          {errors.existingWaterfallName && (
                            <p className="text-[11px] text-rose-600 mt-1">{errors.existingWaterfallName}</p>
                          )}
                        </div>

                        {/* Lineage Relationship */}
                        <div>
                          <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                            Population Relationship:
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                            <label
                              className={`p-1.5 rounded border text-[11px] cursor-pointer flex items-center gap-1.5 ${
                                optionALineageType === 'cascading'
                                  ? 'bg-purple-100 border-purple-400 font-bold text-purple-900'
                                  : 'bg-white border-stone-200 text-stone-700'
                              }`}
                            >
                              <input
                                type="radio"
                                name="optionALineageType"
                                value="cascading"
                                checked={optionALineageType === 'cascading'}
                                onChange={() => setOptionALineageType('cascading')}
                                className="text-purple-600"
                              />
                              <span>Cascading (Last Step)</span>
                            </label>

                            <label
                              className={`p-1.5 rounded border text-[11px] cursor-pointer flex items-center gap-1.5 ${
                                optionALineageType === 'shared_source'
                                  ? 'bg-blue-100 border-blue-400 font-bold text-blue-900'
                                  : 'bg-white border-stone-200 text-stone-700'
                              }`}
                            >
                              <input
                                type="radio"
                                name="optionALineageType"
                                value="shared_source"
                                checked={optionALineageType === 'shared_source'}
                                onChange={() => setOptionALineageType('shared_source')}
                                className="text-blue-600"
                              />
                              <span>Shared Source</span>
                            </label>

                            <label
                              className={`p-1.5 rounded border text-[11px] cursor-pointer flex items-center gap-1.5 ${
                                optionALineageType === 'independent'
                                  ? 'bg-emerald-100 border-emerald-400 font-bold text-emerald-900'
                                  : 'bg-white border-stone-200 text-stone-700'
                              }`}
                            >
                              <input
                                type="radio"
                                name="optionALineageType"
                                value="independent"
                                checked={optionALineageType === 'independent'}
                                onChange={() => setOptionALineageType('independent')}
                                className="text-emerald-600"
                              />
                              <span>Independent</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </label>

                {/* Option B: Create as Separate Project / Revision */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    duplicateOption === 'optionB'
                      ? 'bg-white border-blue-400 shadow-xs ring-1 ring-blue-400'
                      : 'bg-amber-100/40 border-amber-200 hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="duplicateOption"
                    value="optionB"
                    checked={duplicateOption === 'optionB'}
                    onChange={() => setDuplicateOption('optionB')}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="space-y-1 flex-1">
                    <span className="font-bold text-stone-900 block">
                      Option B: Create as Separate Project / Revision
                    </span>
                    <p className="text-[11px] text-stone-600">
                      Create an independent project record. Note: Per project policy,{' '}
                      <strong className="text-rose-700">a duplicate Issue Number cannot be reused for a new project/issue</strong>. You must provide a distinct Issue Number.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Standard Project Fields (shown when NOT duplicate, or when Option B selected) */}
          {(!isDuplicateDetected || duplicateOption === 'optionB') && (
            <div className="space-y-4 pt-1">
              {/* Issue Title */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-stone-400" />
                  Issue Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Commercial Card Lending Fee Recalculation & Compliance Reporting"
                  value={formData.issueTitle}
                  onChange={(e) => {
                    setFormData({ ...formData, issueTitle: e.target.value });
                    if (errors.issueTitle) setErrors({ ...errors, issueTitle: '' });
                  }}
                  className={`w-full text-xs px-3.5 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 shadow-2xs ${
                    errors.issueTitle ? 'border-rose-400 bg-rose-50/40' : 'border-stone-300'
                  }`}
                />
                {errors.issueTitle && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.issueTitle}</p>
                )}
              </div>

              {/* Assignee Information (Who has edit permissions) */}
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    Project Assignee (Edit Permissions) <span className="text-rose-500">*</span>
                  </span>
                  <span className="text-[10px] text-blue-700 font-semibold bg-blue-100/70 px-2 py-0.5 rounded">
                    Only Assignee Can Edit
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Assignee Name
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="e.g. Sarah Jenkins"
                        value={formData.assignedToName || ''}
                        onChange={(e) => setFormData({ ...formData, assignedToName: e.target.value })}
                        className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Assignee Corporate Email <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        placeholder="e.g. sarah.jenkins@enterprise.bank"
                        value={formData.assignedToEmail || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, assignedToEmail: e.target.value });
                          if (errors.assignedToEmail) setErrors({ ...errors, assignedToEmail: '' });
                        }}
                        className={`w-full text-xs pl-8 pr-3 py-2 bg-white border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          errors.assignedToEmail ? 'border-rose-400 bg-rose-50/40' : 'border-stone-300'
                        }`}
                      />
                    </div>
                    {errors.assignedToEmail && (
                      <p className="text-[11px] text-rose-600 mt-1">{errors.assignedToEmail}</p>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-blue-800">
                  When a project is opened, only the designated assignee ({formData.assignedToEmail || 'assigned email'}) can edit or finalize steps. All other users will view the project in Read-Only mode.
                </p>
              </div>

              {/* Issue Description */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Issue Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Summary of audit finding, regulatory mandate, or quantitative scope..."
                  value={formData.issueDescription || ''}
                  onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
                  className="w-full text-xs px-3.5 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
              </div>

              {/* Dual Persona Leads */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Requirements Lead (FRC Owner) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Jenkins"
                    value={formData.frcName}
                    onChange={(e) => {
                      setFormData({ ...formData, frcName: e.target.value });
                      if (errors.frcName) setErrors({ ...errors, frcName: '' });
                    }}
                    className={`w-full text-xs px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 shadow-2xs ${
                      errors.frcName ? 'border-rose-400 bg-rose-50/40' : 'border-stone-300'
                    }`}
                  />
                  {errors.frcName && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.frcName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    Development Lead (Analyst) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Alex Morgan"
                    value={formData.analystName}
                    onChange={(e) => {
                      setFormData({ ...formData, analystName: e.target.value });
                      if (errors.analystName) setErrors({ ...errors, analystName: '' });
                    }}
                    className={`w-full text-xs px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 shadow-2xs ${
                      errors.analystName ? 'border-rose-400 bg-rose-50/40' : 'border-stone-300'
                    }`}
                  />
                  {errors.analystName && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.analystName}</p>
                  )}
                </div>
              </div>

              {/* Initial Waterfall Name */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-purple-600" />
                  Initial Waterfall Workspace Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Initial Population Scoping Waterfall"
                  value={formData.waterfallName}
                  onChange={(e) => {
                    setFormData({ ...formData, waterfallName: e.target.value });
                    if (errors.waterfallName) setErrors({ ...errors, waterfallName: '' });
                  }}
                  className={`w-full text-xs px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 shadow-2xs ${
                    errors.waterfallName ? 'border-rose-400 bg-rose-50/40' : 'border-stone-300'
                  }`}
                />
                {errors.waterfallName && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.waterfallName}</p>
                )}
              </div>

              {/* Initial Data Source Provenance Step */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5">
                <label className="block text-xs font-bold text-stone-800">
                  Data Source for Initial Waterfall <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-stone-500">
                  Specify the data source origin to establish the baseline for subsequent process flow connections.
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 text-xs font-semibold ${
                      formData.initialDataSourceType === 'Database'
                        ? 'bg-white border-blue-500 text-blue-900 shadow-2xs ring-1 ring-blue-500'
                        : 'bg-stone-100 border-stone-200 text-stone-700 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="initialDataSourceType"
                      value="Database"
                      checked={formData.initialDataSourceType === 'Database'}
                      onChange={() => setFormData({ ...formData, initialDataSourceType: 'Database' })}
                      className="text-blue-600"
                    />
                    <Database className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>DataBase</span>
                  </label>

                  <label
                    className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 text-xs font-semibold ${
                      formData.initialDataSourceType === 'Flat File'
                        ? 'bg-white border-amber-500 text-amber-900 shadow-2xs ring-1 ring-amber-500'
                        : 'bg-stone-100 border-stone-200 text-stone-700 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="initialDataSourceType"
                      value="Flat File"
                      checked={formData.initialDataSourceType === 'Flat File'}
                      onChange={() => setFormData({ ...formData, initialDataSourceType: 'Flat File' })}
                      className="text-amber-600"
                    />
                    <FileSpreadsheet className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Flat File provided by stakeholder</span>
                  </label>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder={
                      formData.initialDataSourceType === 'Database'
                        ? 'e.g. EDW_BORROWER_FACT or Oracle_GL_Schema'
                        : 'e.g. Stakeholder_Customer_Extract_Q1.csv'
                    }
                    value={formData.initialDataSourceDetail || ''}
                    onChange={(e) => setFormData({ ...formData, initialDataSourceDetail: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors"
            >
              Cancel
            </button>

            {isDuplicateDetected && duplicateOption === 'optionA' ? (
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Add Waterfall to Project</span>
              </button>
            ) : (
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>
                  {isDuplicateDetected && duplicateOption === 'optionB'
                    ? 'Create Independent Revision'
                    : 'Create Project'}
                </span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
