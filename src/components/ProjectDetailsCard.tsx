import React, { useState } from 'react';
import {
  FileText,
  Edit3,
  CheckCircle2,
  X,
  Building2,
  ShieldCheck,
  UserCheck,
  Briefcase,
  Layers,
  Hash,
  Plus,
  Lock,
  Mail,
  User,
} from 'lucide-react';
import { ProjectDetails, UserRole, WaterfallEntity } from '../types';

interface ProjectDetailsCardProps {
  projectDetails: ProjectDetails;
  userRole: UserRole;
  onSaveProjectDetails: (updated: ProjectDetails) => void;
  waterfalls?: WaterfallEntity[];
  activeWaterfallId?: string;
  onSelectWaterfall?: (waterfallId: string) => void;
  onOpenAddWaterfall?: () => void;
  onOpenCreateProject?: () => void;
  onResetToCleanSlate?: () => void;
  isReadOnly?: boolean;
}

export const ProjectDetailsCard: React.FC<ProjectDetailsCardProps> = ({
  projectDetails,
  userRole,
  onSaveProjectDetails,
  waterfalls = [],
  activeWaterfallId,
  onSelectWaterfall,
  onOpenAddWaterfall,
  onOpenCreateProject,
  onResetToCleanSlate,
  isReadOnly = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<ProjectDetails>(projectDetails);

  const displayIssueNumber = projectDetails.issueNumber || '—';

  const handleOpen = () => {
    if (isReadOnly) return;
    setFormData({
      ...projectDetails,
      issueNumber: displayIssueNumber !== '—' ? displayIssueNumber : '',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProjectDetails(formData);
    setIsModalOpen(false);
  };

  return (
    <div
      id="card-project-details"
      className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-4 sm:p-5 transition-all mb-5"
    >
      <div className="flex flex-col gap-2">
        {/* Card Header: Issue Details + Edit Button or View-Only Badge */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-stone-900 tracking-tight">Issue Details</h3>
            {isReadOnly ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                <Lock className="w-3 h-3 text-amber-600" />
                View-Only (Assigned to {projectDetails.assignedToName || projectDetails.assignedToEmail || projectDetails.frcName})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Full Edit Access
              </span>
            )}
          </div>
          {!isReadOnly ? (
            <button
              id="btn-edit-issue-details"
              type="button"
              onClick={handleOpen}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 hover:text-stone-900 shadow-2xs cursor-pointer"
              title="Edit Issue Details"
            >
              <Edit3 className="w-3.5 h-3.5 text-stone-500" />
              <span>Edit Details</span>
            </button>
          ) : (
            <span className="text-[11px] text-stone-400 italic">
              Editing restricted to assignee
            </span>
          )}
        </div>

        {/* Clean Spec List */}
        <div className="text-xs divide-y divide-stone-100">
          {/* 1. Issue Title */}
          <div className="py-2 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
            <span className="font-semibold text-stone-500 sm:w-36 shrink-0">Issue Title:</span>
            <span className="font-bold text-blue-900 text-xs sm:text-sm flex-1 break-words">
              {projectDetails.issueTitle || '—'}
            </span>
          </div>

          {/* 2. Issue Description */}
          <div className="py-2 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
            <span className="font-semibold text-stone-500 sm:w-36 shrink-0 pt-0.5">Issue Description:</span>
            <span className="text-stone-700 leading-relaxed flex-1 break-words">
              {projectDetails.issueDescription || '—'}
            </span>
          </div>

          {/* 3. Issue Number (Generic Alphanumeric) */}
          <div className="py-2 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
            <span className="font-semibold text-stone-500 sm:w-36 shrink-0">Issue Number:</span>
            <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {displayIssueNumber}
            </span>
          </div>

          {/* 4. Assigned Project Lead */}
          <div className="py-2 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
            <span className="font-semibold text-stone-500 sm:w-36 shrink-0">Assigned To:</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-800">
                {projectDetails.assignedToName || projectDetails.frcName || 'Sarah Jenkins'}
              </span>
              {projectDetails.assignedToEmail && (
                <span className="text-stone-500 text-[11px] font-mono">
                  ({projectDetails.assignedToEmail})
                </span>
              )}
            </div>
          </div>

          {/* 5. Requirements Lead (FRC Name) */}
          <div className="py-2 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
            <span className="font-semibold text-stone-500 sm:w-36 shrink-0">Requirements Lead:</span>
            <span className="font-semibold text-emerald-700">{projectDetails.frcName || '—'}</span>
          </div>

          {/* 6. Development Lead (Analyst Name) */}
          <div className="py-2 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
            <span className="font-semibold text-stone-500 sm:w-36 shrink-0">Development Lead:</span>
            <span className="font-semibold text-sky-700">{projectDetails.analystName || '—'}</span>
          </div>

          {/* 7. Waterfall Name */}
          <div className="py-2 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
            <span className="font-semibold text-stone-500 sm:w-36 shrink-0">Waterfall Name:</span>
            <span className="font-bold text-purple-700">{projectDetails.waterfallName || '—'}</span>
          </div>
        </div>
      </div>

      {/* Edit Issue Details Modal Dialog */}
      {isModalOpen && !isReadOnly && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-xl w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    Edit Issue Details
                  </h3>
                  <p className="text-xs text-stone-500">
                    Governance identifiers and issue details. All modifications are captured in audit logs.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              {/* Issue Number */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-blue-600" />
                  Issue Number (Alphanumeric) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. REQ-4421 or ISS-2026-A1"
                  value={formData.issueNumber}
                  onChange={(e) => setFormData({ ...formData, issueNumber: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono font-bold text-blue-800"
                />
              </div>

              {/* Assignee Email & Name */}
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

              {/* Issue Title */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Issue Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Commercial Card Lending Fee Recalculation"
                  value={formData.issueTitle}
                  onChange={(e) => setFormData({ ...formData, issueTitle: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Issue Description */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Issue Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Remediation and historical recalculation of account balances..."
                  value={formData.issueDescription || ''}
                  onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Requirements Lead */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Requirements Lead (FRC Name) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={formData.frcName}
                    onChange={(e) => setFormData({ ...formData, frcName: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Development Lead */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Development Lead (Analyst Name) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={formData.analystName}
                    onChange={(e) => setFormData({ ...formData, analystName: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Waterfall Name */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Waterfall Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Initial Population Scoping Waterfall"
                  value={formData.waterfallName}
                  onChange={(e) => setFormData({ ...formData, waterfallName: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
                >
                  Save Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
