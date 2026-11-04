import React, { useState } from 'react';
import {
  Layers,
  FolderPlus,
  X,
  Hash,
  ShieldCheck,
  FileText,
  UserCheck,
  Mail,
  User,
  Database,
  FileSpreadsheet,
  Workflow,
  GitBranch,
} from 'lucide-react';
import {
  ProjectDetails,
  WaterfallEntity,
  WaterfallLineage,
  DataSourceType,
  LineageType,
} from '../types';

interface AddWaterfallModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: ProjectDetails;
  existingWaterfalls?: WaterfallEntity[];
  onAddWaterfall: (
    waterfallName: string,
    lineage?: WaterfallLineage,
    dataSourceType?: DataSourceType,
    dataSourceDetail?: string
  ) => void;
}

export const AddWaterfallModal: React.FC<AddWaterfallModalProps> = ({
  isOpen,
  onClose,
  currentProject,
  existingWaterfalls = [],
  onAddWaterfall,
}) => {
  const [waterfallName, setWaterfallName] = useState('');
  const [lineageType, setLineageType] = useState<LineageType>('cascading');
  const [selectedParentId, setSelectedParentId] = useState<string>(() => {
    return existingWaterfalls.length > 0 ? existingWaterfalls[existingWaterfalls.length - 1].id : '';
  });
  const [dataSourceType, setDataSourceType] = useState<DataSourceType>('Database');
  const [dataSourceDetail, setDataSourceDetail] = useState('');

  if (!isOpen) return null;

  const parentWf = existingWaterfalls.find((w) => w.id === selectedParentId) || existingWaterfalls[0];
  const parentRows = parentWf?.rows || [];
  const parentLastRow = parentRows.length > 0 ? parentRows[parentRows.length - 1] : null;
  const parentFinalPop =
    parentLastRow && typeof parentLastRow.finalPopulation === 'number'
      ? parentLastRow.finalPopulation
      : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waterfallName.trim()) return;

    let lineage: WaterfallLineage | undefined;

    if (existingWaterfalls.length > 0) {
      if (lineageType === 'cascading') {
        lineage = {
          type: 'cascading',
          parentWaterfallId: parentWf?.id,
          parentWaterfallName: parentWf?.name,
          parentStepNumber: parentLastRow?.stepNumber || parentRows.length,
          parentStepTitle: parentLastRow?.stepTitle,
          parentFinalPopulation: parentFinalPop ?? undefined,
          notes: `Cascaded starting population from final step of "${parentWf?.name}".`,
        };
      } else if (lineageType === 'shared_source') {
        lineage = {
          type: 'shared_source',
          parentWaterfallId: parentWf?.id,
          parentWaterfallName: parentWf?.name,
          notes: `Shares the underlying data source with "${parentWf?.name}".`,
        };
      } else {
        lineage = {
          type: 'independent',
          notes: 'Independent cohort population with distinct data source extraction.',
        };
      }
    }

    const effectiveDsType: DataSourceType =
      lineageType === 'independent' || existingWaterfalls.length === 0
        ? dataSourceType
        : (lineageType === 'shared_source' && parentWf?.dataSourceType)
        ? parentWf.dataSourceType
        : parentWf?.dataSourceType || 'Database';

    const effectiveDsDetail =
      dataSourceDetail.trim() ||
      (effectiveDsType === 'Database'
        ? 'Enterprise Database / EDW Table'
        : 'Flat File provided by stakeholder');

    onAddWaterfall(waterfallName.trim(), lineage, effectiveDsType, effectiveDsDetail);
    setWaterfallName('');
    setDataSourceDetail('');
    onClose();
  };

  const displayIssueNumber = currentProject.issueNumber || '—';

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-xl w-full p-6 my-8 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">Add Waterfall & Configure Lineage</h3>
              <p className="text-xs text-stone-500">
                Create an additional waterfall with population flow connectors and provenance tracking.
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

        {/* Inherited Project Information */}
        <div className="mt-4 p-3 bg-purple-50/70 rounded-xl border border-purple-200/80 text-xs text-purple-950 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0" />
            <span className="truncate">
              Project: <strong>{currentProject.issueTitle || '—'}</strong> ({displayIssueNumber})
            </span>
          </div>
          <span className="text-[10px] text-purple-700 font-semibold bg-white/80 px-2 py-0.5 rounded border border-purple-200 shrink-0">
            {existingWaterfalls.length} Existing {existingWaterfalls.length === 1 ? 'WF' : 'WFs'}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Waterfall Name */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1.5">
              Waterfall Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. WF #2 - Overlimit Sub-Segment Scoping"
              value={waterfallName}
              onChange={(e) => setWaterfallName(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-2xs font-medium"
            />
          </div>

          {/* Population Lineage Relationship (when existing waterfalls exist) */}
          {existingWaterfalls.length > 0 && (
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-stone-800">
                Population Relationship & Process Lineage <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 gap-2.5">
                {/* 1. Cascading Population (Recommended) */}
                <label
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    lineageType === 'cascading'
                      ? 'bg-purple-50/80 border-purple-400 ring-1 ring-purple-400 shadow-2xs'
                      : 'bg-stone-50 border-stone-200 hover:bg-stone-100/70'
                  }`}
                >
                  <input
                    type="radio"
                    name="lineageType"
                    value="cascading"
                    checked={lineageType === 'cascading'}
                    onChange={() => setLineageType('cascading')}
                    className="mt-1 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="space-y-1 text-xs flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900 flex items-center gap-1.5">
                        <Workflow className="w-3.5 h-3.5 text-purple-600" />
                        Cascading Population (SAS Process Flow)
                      </span>
                      <span className="text-[10px] text-purple-700 bg-purple-100 font-bold px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      Starting population is directly fed from the <strong>last step</strong> of the upstream waterfall via visual connector arrow.
                    </p>

                    {/* Upstream Waterfall selector if multiple */}
                    {lineageType === 'cascading' && existingWaterfalls.length > 1 && (
                      <div className="pt-2">
                        <label className="block text-[10px] font-semibold text-stone-600 mb-1">
                          Select Upstream Parent Waterfall:
                        </label>
                        <select
                          value={selectedParentId}
                          onChange={(e) => setSelectedParentId(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg"
                        >
                          {existingWaterfalls.map((w, idx) => (
                            <option key={w.id} value={w.id}>
                              WF #{idx + 1}: {w.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {parentFinalPop !== null && lineageType === 'cascading' && (
                      <div className="mt-1.5 p-2 bg-white rounded-lg border border-purple-200 text-[10px] text-purple-900 flex items-center justify-between">
                        <span>Terminal Output from {parentWf?.name}:</span>
                        <strong className="font-mono text-purple-700 font-bold">
                          {parentFinalPop.toLocaleString()} records
                        </strong>
                      </div>
                    )}
                  </div>
                </label>

                {/* 2. Shared Data Source */}
                <label
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    lineageType === 'shared_source'
                      ? 'bg-blue-50/80 border-blue-400 ring-1 ring-blue-400 shadow-2xs'
                      : 'bg-stone-50 border-stone-200 hover:bg-stone-100/70'
                  }`}
                >
                  <input
                    type="radio"
                    name="lineageType"
                    value="shared_source"
                    checked={lineageType === 'shared_source'}
                    onChange={() => setLineageType('shared_source')}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="space-y-1 text-xs flex-1">
                    <span className="font-bold text-stone-900 flex items-center gap-1.5">
                      <GitBranch className="w-3.5 h-3.5 text-blue-600" />
                      Shared Data Source
                    </span>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      Both waterfalls originate from the same underlying Data Source ({parentWf?.dataSourceType || 'Database'}), branching as a fork in Model View.
                    </p>
                  </div>
                </label>

                {/* 3. Independent Population */}
                <label
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    lineageType === 'independent'
                      ? 'bg-emerald-50/80 border-emerald-400 ring-1 ring-emerald-400 shadow-2xs'
                      : 'bg-stone-50 border-stone-200 hover:bg-stone-100/70'
                  }`}
                >
                  <input
                    type="radio"
                    name="lineageType"
                    value="independent"
                    checked={lineageType === 'independent'}
                    onChange={() => setLineageType('independent')}
                    className="mt-1 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="space-y-1 text-xs flex-1">
                    <span className="font-bold text-stone-900 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-600" />
                      Independent Population Entirely
                    </span>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      A completely standalone population with its own separate Data Source provenance.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Data Source Configuration (Shown if independent or 1st waterfall) */}
          {(lineageType === 'independent' || existingWaterfalls.length === 0) && (
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
              <label className="block text-xs font-bold text-stone-800">
                Data Source Provenance <span className="text-rose-500">*</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label
                  className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 text-xs font-semibold ${
                    dataSourceType === 'Database'
                      ? 'bg-white border-blue-500 text-blue-900 shadow-2xs ring-1 ring-blue-500'
                      : 'bg-stone-100 border-stone-200 text-stone-700 hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="dataSourceType"
                    value="Database"
                    checked={dataSourceType === 'Database'}
                    onChange={() => setDataSourceType('Database')}
                    className="text-blue-600"
                  />
                  <Database className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>DataBase</span>
                </label>

                <label
                  className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 text-xs font-semibold ${
                    dataSourceType === 'Flat File'
                      ? 'bg-white border-amber-500 text-amber-900 shadow-2xs ring-1 ring-amber-500'
                      : 'bg-stone-100 border-stone-200 text-stone-700 hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="dataSourceType"
                    value="Flat File"
                    checked={dataSourceType === 'Flat File'}
                    onChange={() => setDataSourceType('Flat File')}
                    className="text-amber-600"
                  />
                  <FileSpreadsheet className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Flat File provided by stakeholder</span>
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Source Identifier / Feed Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder={
                    dataSourceType === 'Database'
                      ? 'e.g. EDW_BORROWER_FACT or Oracle_GL_Schema'
                      : 'e.g. Stakeholder_Customer_Extract_Q1.csv'
                  }
                  value={dataSourceDetail}
                  onChange={(e) => setDataSourceDetail(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!waterfallName.trim()}
              className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              Create Waterfall
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (details: ProjectDetails) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
}) => {
  const [formData, setFormData] = useState<ProjectDetails>({
    issueNumber: '',
    issueTitle: '',
    issueDescription: '',
    assignedToName: 'Sarah Jenkins',
    assignedToEmail: 'sarah.jenkins@enterprise.bank',
    frcName: '',
    analystName: '',
    waterfallName: 'Initial Waterfall',
    initialDataSourceType: 'Database',
    initialDataSourceDetail: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.issueNumber.trim() || !formData.issueTitle.trim()) return;
    onCreateProject({
      issueNumber: formData.issueNumber.trim(),
      issueTitle: formData.issueTitle.trim(),
      issueDescription: formData.issueDescription?.trim() || '',
      assignedToName: formData.assignedToName?.trim() || 'Sarah Jenkins',
      assignedToEmail: formData.assignedToEmail?.trim() || 'sarah.jenkins@enterprise.bank',
      frcName: formData.frcName.trim(),
      analystName: formData.analystName.trim(),
      waterfallName: formData.waterfallName.trim() || 'Initial Waterfall',
      initialDataSourceType: formData.initialDataSourceType || 'Database',
      initialDataSourceDetail: formData.initialDataSourceDetail?.trim() || (formData.initialDataSourceType === 'Database' ? 'Enterprise Database' : 'Flat File provided by stakeholder'),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-xl w-full p-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">Create New Project</h3>
              <p className="text-xs text-stone-500">
                Configure a new project starting from Issue Number, title, and assigned personnel.
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Issue Number */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-blue-600" />
              Issue Number (Alphanumeric) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. REQ-4421, ISS-2026-A1"
              value={formData.issueNumber}
              onChange={(e) => setFormData({ ...formData, issueNumber: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono font-bold text-blue-800"
            />
          </div>

          {/* Issue Title */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              Issue Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Escrow Account Annual Adjustment Notice Variance"
              value={formData.issueTitle}
              onChange={(e) => setFormData({ ...formData, issueTitle: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Assignee Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-stone-400" />
                Assignee Name
              </label>
              <input
                type="text"
                placeholder="e.g. Sarah Jenkins"
                value={formData.assignedToName || ''}
                onChange={(e) => setFormData({ ...formData, assignedToName: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-stone-400" />
                Assignee Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="e.g. sarah.jenkins@enterprise.bank"
                value={formData.assignedToEmail || ''}
                onChange={(e) => setFormData({ ...formData, assignedToEmail: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Issue Description */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Issue Description
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Detailed description of the remediation issue..."
              value={formData.issueDescription || ''}
              onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Requirements Lead */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Requirements Lead <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Marcus Vance"
                value={formData.frcName}
                onChange={(e) => setFormData({ ...formData, frcName: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Analyst Name */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                Development Lead <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Elena Rostova"
                value={formData.analystName}
                onChange={(e) => setFormData({ ...formData, analystName: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Initial Waterfall Name */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              Initial Waterfall Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Initial Waterfall"
              value={formData.waterfallName}
              onChange={(e) => setFormData({ ...formData, waterfallName: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Initial Data Source Provenance */}
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5">
            <label className="block text-xs font-bold text-stone-800">
              Data Source for Initial Waterfall <span className="text-rose-500">*</span>
            </label>
            <p className="text-[11px] text-stone-500">
              Select the initial cohort origin to anchor the analytical lineage flow.
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

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
