import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  Hash,
  UserCheck,
  Layers,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Briefcase,
  AlertCircle,
  Mail,
  User,
  Database,
  FileSpreadsheet,
} from 'lucide-react';
import { ProjectDetails, UserRole } from '../types';

interface IssueDetailsSetupProps {
  onSubmit: (details: ProjectDetails) => void;
}

export const IssueDetailsSetup: React.FC<IssueDetailsSetupProps> = ({
  onSubmit,
}) => {
  const [formData, setFormData] = useState<ProjectDetails>({
    issueNumber: '',
    issueTitle: '',
    issueDescription: '',
    assignedToName: 'Sarah Jenkins',
    assignedToEmail: 'sarah.jenkins@enterprise.bank',
    frcName: '',
    analystName: '',
    waterfallName: '',
    initialDataSourceType: 'Database',
    initialDataSourceDetail: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const sampleValues: ProjectDetails = {
    issueNumber: 'ISS-4421',
    issueTitle: 'Card Lending Interest Recalibration & Regulatory Reporting',
    issueDescription:
      'Remediation and historical recalculation of account balances and regulatory reporting discrepancies across consumer credit portfolios.',
    assignedToName: 'Sarah Jenkins',
    assignedToEmail: 'sarah.jenkins@enterprise.bank',
    frcName: 'Sarah Jenkins',
    analystName: 'Alex Morgan',
    waterfallName: 'Card Portfolio Remediation Waterfall',
    initialDataSourceType: 'Database',
    initialDataSourceDetail: 'EDW_CREDIT_FACILITY_FACT',
  };

  const handleAutofill = () => {
    setFormData(sampleValues);
    setErrors({});
  };

  const handleClear = () => {
    setFormData({
      issueNumber: '',
      issueTitle: '',
      issueDescription: '',
      assignedToName: '',
      assignedToEmail: '',
      frcName: '',
      analystName: '',
      waterfallName: '',
    });
    setErrors({});
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.issueNumber.trim()) {
      newErrors.issueNumber = 'Issue Number is required';
    } else {
      const alphanumericRegex = /^[A-Za-z0-9-_./\s]+$/;
      if (!alphanumericRegex.test(formData.issueNumber.trim())) {
        newErrors.issueNumber = 'Issue Number must be alphanumeric (letters, numbers, hyphens)';
      }
    }
    if (!formData.issueTitle.trim()) {
      newErrors.issueTitle = 'Issue Title is required';
    }
    if (!formData.assignedToEmail?.trim()) {
      newErrors.assignedToEmail = 'Assignee corporate email is required';
    }
    if (!formData.frcName.trim()) {
      newErrors.frcName = 'Requirements Lead (FRC Name) is required';
    }
    if (!formData.analystName.trim()) {
      newErrors.analystName = 'Development Lead (Analyst Name) is required';
    }
    if (!formData.waterfallName.trim()) {
      newErrors.waterfallName = 'Waterfall Name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl overflow-hidden animate-in fade-in duration-200">
        {/* Actions Bar */}
        <div className="bg-stone-50 border-b border-stone-200 px-6 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-stone-700 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Fill out the project governance specification and assign the project owner.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAutofill}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors shadow-2xs"
              title="Autofill sample banking portfolio details"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Autofill Sample Spec</span>
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white text-stone-600 hover:text-stone-900 border border-stone-200 hover:bg-stone-100 transition-colors shadow-2xs"
              title="Clear all fields"
            >
              <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
              <span>Clear All</span>
            </button>
          </div>
        </div>

        {/* Setup Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* 1. Issue Number */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-blue-600" />
                Issue Number (Alphanumeric) <span className="text-rose-500">*</span>
              </span>
              {errors.issueNumber && (
                <span className="text-rose-600 text-[11px] font-normal flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.issueNumber}
                </span>
              )}
            </label>
            <input
              type="text"
              placeholder="e.g. REQ-4421, ISS-2026-A1, or TEST-001"
              value={formData.issueNumber}
              onChange={(e) => {
                setFormData({ ...formData, issueNumber: e.target.value });
                if (errors.issueNumber) setErrors({ ...errors, issueNumber: '' });
              }}
              className={`w-full text-xs font-mono font-bold px-3.5 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 shadow-2xs ${
                errors.issueNumber
                  ? 'border-rose-300 bg-rose-50/30 text-rose-900'
                  : 'border-stone-300 bg-white text-blue-800 focus:border-blue-500'
              }`}
            />
            <p className="text-[11px] text-stone-500 mt-1">
              Generic alphanumeric identifier used for searching, tracking, and audit indexing.
            </p>
          </div>

          {/* 2. Issue Title */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Issue Title <span className="text-rose-500">*</span>
              </span>
              {errors.issueTitle && (
                <span className="text-rose-600 text-[11px] font-normal flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.issueTitle}
                </span>
              )}
            </label>
            <input
              type="text"
              placeholder="e.g. Commercial Card Lending Overlimit Recalibration & Regulatory Reporting"
              value={formData.issueTitle}
              onChange={(e) => {
                setFormData({ ...formData, issueTitle: e.target.value });
                if (errors.issueTitle) setErrors({ ...errors, issueTitle: '' });
              }}
              className={`w-full text-xs sm:text-sm px-3.5 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 shadow-2xs font-semibold ${
                errors.issueTitle
                  ? 'border-rose-300 bg-rose-50/30'
                  : 'border-stone-300 bg-white text-stone-900 focus:border-blue-500'
              }`}
            />
          </div>

          {/* 3. Assignee Information */}
          <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-600" />
                Project Assignee (Edit Permissions) <span className="text-rose-500">*</span>
              </span>
              <span className="text-[10px] text-blue-700 font-semibold bg-blue-100/70 px-2 py-0.5 rounded">
                Only Assigned User Can Edit
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-stone-400" />
                  Assignee Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Jenkins"
                  value={formData.assignedToName || ''}
                  onChange={(e) => setFormData({ ...formData, assignedToName: e.target.value })}
                  className="w-full text-xs px-3.5 py-2 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-stone-400" />
                  Assignee Corporate Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. sarah.jenkins@enterprise.bank"
                  value={formData.assignedToEmail || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, assignedToEmail: e.target.value });
                    if (errors.assignedToEmail) setErrors({ ...errors, assignedToEmail: '' });
                  }}
                  className={`w-full text-xs px-3.5 py-2 bg-white border rounded-xl focus:ring-2 focus:ring-blue-500 ${
                    errors.assignedToEmail ? 'border-rose-400 bg-rose-50/40' : 'border-stone-300'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* 4. Issue Description */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-stone-400" />
              Issue Description
            </label>
            <textarea
              rows={2}
              placeholder="Detailed description of audit scope and objectives..."
              value={formData.issueDescription || ''}
              onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
              className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs text-stone-800 leading-relaxed"
            />
          </div>

          {/* 5. Requirements Lead and Analyst Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                  Requirements Lead (FRC Name) <span className="text-rose-500">*</span>
                </span>
                {errors.frcName && (
                  <span className="text-rose-600 text-[11px] font-normal">{errors.frcName}</span>
                )}
              </label>
              <input
                type="text"
                placeholder="e.g. Sarah Jenkins"
                value={formData.frcName}
                onChange={(e) => {
                  setFormData({ ...formData, frcName: e.target.value });
                  if (errors.frcName) setErrors({ ...errors, frcName: '' });
                }}
                className={`w-full text-xs px-3.5 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 shadow-2xs font-semibold ${
                  errors.frcName
                    ? 'border-rose-300 bg-rose-50/30 text-rose-900'
                    : 'border-stone-300 bg-white text-emerald-800 focus:border-blue-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                  Development Lead (Analyst Name) <span className="text-rose-500">*</span>
                </span>
                {errors.analystName && (
                  <span className="text-rose-600 text-[11px] font-normal">{errors.analystName}</span>
                )}
              </label>
              <input
                type="text"
                placeholder="e.g. Alex Morgan"
                value={formData.analystName}
                onChange={(e) => {
                  setFormData({ ...formData, analystName: e.target.value });
                  if (errors.analystName) setErrors({ ...errors, analystName: '' });
                }}
                className={`w-full text-xs px-3.5 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 shadow-2xs font-semibold ${
                  errors.analystName
                    ? 'border-rose-300 bg-rose-50/30 text-rose-900'
                    : 'border-stone-300 bg-white text-sky-800 focus:border-blue-500'
                }`}
              />
            </div>
          </div>

          {/* 6. Initial Waterfall Name */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                Initial Waterfall Name <span className="text-rose-500">*</span>
              </span>
              {errors.waterfallName && (
                <span className="text-rose-600 text-[11px] font-normal">{errors.waterfallName}</span>
              )}
            </label>
            <input
              type="text"
              placeholder="e.g. Initial Population Scoping Waterfall"
              value={formData.waterfallName}
              onChange={(e) => {
                setFormData({ ...formData, waterfallName: e.target.value });
                if (errors.waterfallName) setErrors({ ...errors, waterfallName: '' });
              }}
              className={`w-full text-xs px-3.5 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 shadow-2xs font-semibold ${
                errors.waterfallName
                  ? 'border-rose-300 bg-rose-50/30 text-rose-900'
                  : 'border-stone-300 bg-white text-purple-800 focus:border-blue-500'
              }`}
            />
          </div>

          {/* 7. Initial Data Source Provenance */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
            <label className="block text-xs font-bold text-stone-800">
              Data Source for Initial Waterfall <span className="text-rose-500">*</span>
            </label>
            <p className="text-[11px] text-stone-500">
              Specify the foundational data source to anchor process flows and lineage across subsequent waterfalls.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 text-xs font-semibold transition-all ${
                  formData.initialDataSourceType === 'Database'
                    ? 'bg-white border-blue-500 text-blue-900 shadow-2xs ring-1 ring-blue-500'
                    : 'bg-stone-100/70 border-stone-200 text-stone-700 hover:bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="setupDataSourceType"
                  value="Database"
                  checked={formData.initialDataSourceType === 'Database'}
                  onChange={() => setFormData({ ...formData, initialDataSourceType: 'Database' })}
                  className="text-blue-600"
                />
                <Database className="w-4 h-4 text-blue-600 shrink-0" />
                <span>DataBase (EDW / SQL Server / Oracle)</span>
              </label>

              <label
                className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 text-xs font-semibold transition-all ${
                  formData.initialDataSourceType === 'Flat File'
                    ? 'bg-white border-amber-500 text-amber-900 shadow-2xs ring-1 ring-amber-500'
                    : 'bg-stone-100/70 border-stone-200 text-stone-700 hover:bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="setupDataSourceType"
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
                className="w-full text-xs px-3.5 py-2 bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-6 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-xs text-stone-500">
              <span>Once submitted, all details will appear in the </span>
              <strong className="text-stone-800">Issue Details</strong>
              <span> card and open the Requirements / Development workspace.</span>
            </div>

            <button
              type="submit"
              id="btn-submit-issue-details"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <span>Submit &amp; Open Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
