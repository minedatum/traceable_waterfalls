import React, { useState } from 'react';
import { Layers, FolderPlus, X, Hash, ShieldCheck, FileText, UserCheck } from 'lucide-react';
import { ProjectDetails } from '../types';

interface AddWaterfallModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: ProjectDetails;
  onAddWaterfall: (waterfallName: string) => void;
}

export const AddWaterfallModal: React.FC<AddWaterfallModalProps> = ({
  isOpen,
  onClose,
  currentProject,
  onAddWaterfall,
}) => {
  const [waterfallName, setWaterfallName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waterfallName.trim()) return;
    onAddWaterfall(waterfallName.trim());
    setWaterfallName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">Add New Waterfall</h3>
              <p className="text-xs text-stone-500">
                Adds a new waterfall workspace under the current project.
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

        {/* Inherited Project Information Reminder */}
        <div className="mt-4 p-3.5 bg-purple-50/70 rounded-xl border border-purple-200/80 text-xs text-purple-950">
          <p className="font-semibold text-purple-900 mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
            Inherited Project Governance:
          </p>
          <div className="grid grid-cols-2 gap-2 mt-1.5 text-[11px] text-purple-900">
            <div>
              <span className="text-purple-600 font-medium">COE#:</span>{' '}
              <strong className="font-mono">{currentProject.coeNumber || '—'}</strong>
            </div>
            <div>
              <span className="text-purple-600 font-medium">eGRC#:</span>{' '}
              <strong className="font-mono">{currentProject.egrcNumber || '—'}</strong>
            </div>
            <div className="col-span-2 truncate">
              <span className="text-purple-600 font-medium">Issue Title:</span>{' '}
              <strong>{currentProject.issueTitle || '—'}</strong>
            </div>
          </div>
          <p className="text-[11px] text-purple-600/90 mt-2 italic">
            You do not need to re-enter project details; this new waterfall shares the current project governance.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1.5">
              Waterfall Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Q4 Secondary Filter Waterfall or Post-Remediation Scope"
              value={waterfallName}
              onChange={(e) => setWaterfallName(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-2xs font-medium"
            />
            <p className="text-[11px] text-stone-500 mt-1">
              This will also be the sheet name when exported to Excel.
            </p>
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
    coeNumber: '',
    egrcNumber: '',
    issueTitle: '',
    issueDescription: '',
    frcName: '',
    analystName: '',
    waterfallName: 'Initial Waterfall',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.coeNumber.trim() || !formData.issueTitle.trim()) return;
    onCreateProject({
      coeNumber: formData.coeNumber.trim(),
      egrcNumber: formData.egrcNumber.trim(),
      issueTitle: formData.issueTitle.trim(),
      issueDescription: formData.issueDescription?.trim() || '',
      frcName: formData.frcName.trim(),
      analystName: formData.analystName.trim(),
      waterfallName: formData.waterfallName.trim() || 'Initial Waterfall',
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
                Configure a new project starting from COE#, eGRC, issue title, and governance leads.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. COE# */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-stone-400" />
                COE# <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. COE-2026-0922"
                value={formData.coeNumber}
                onChange={(e) => setFormData({ ...formData, coeNumber: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
              />
            </div>

            {/* 2. eGRC# */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                eGRC# <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. eGRC-REQ-5510"
                value={formData.egrcNumber}
                onChange={(e) => setFormData({ ...formData, egrcNumber: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* 3. Issue Title */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              Issue Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Mortgage Escrow Account Annual Adjustment Notice Variance"
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
              placeholder="e.g. Detailed description of the remediation issue..."
              value={formData.issueDescription || ''}
              onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 4. FRC Name */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                FRC Name <span className="text-rose-500">*</span>
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

            {/* 5. Analyst Name */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                Analyst Name <span className="text-rose-500">*</span>
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

          {/* 6. Initial Waterfall Name */}
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
            <p className="text-[11px] text-stone-500 mt-1">
              This will be the default first waterfall workspace and exported sheet name for this project.
            </p>
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
