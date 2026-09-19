import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Database,
  ShieldCheck,
  TrendingDown,
  Users,
  Clock,
  Sparkles,
  ExternalLink,
  Laptop,
} from 'lucide-react';
import { exportPitchDeckPptx } from '../utils/generatePptx';

interface PitchDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PitchDeckModal: React.FC<PitchDeckModalProps> = ({ isOpen, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(true);

  const totalSlides = 10;

  // Keyboard navigation (Arrow keys & Escape)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        e.preventDefault();
        setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, totalSlides, onClose]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await exportPitchDeckPptx();
    } catch (err) {
      console.error('Failed to export PowerPoint:', err);
      alert('Unable to generate PowerPoint deck. Please check console.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Slide content definitions
  const slides = [
    // Slide 1: Cover
    {
      title: 'Traceable Waterfalls',
      subtitle: 'Enterprise Governance & Quantitative Scoping Platform',
      category: 'Executive Pitch Deck',
      speakerNotes:
        'Good morning leadership. Today we are presenting Traceable Waterfalls—a purpose-built enterprise platform that bridges First-Line Risk and Technical Analytics to eliminate spreadsheet risk and deliver audit-proof population exclusion waterfalls for regulatory remediations.',
      renderContent: () => (
        <div className="h-full flex flex-col justify-between bg-slate-900 text-white p-8 md:p-12 rounded-2xl relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -top-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 mb-6 tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5" />
              REGULATORY COMPLIANCE & RECONCILIATION SUITE
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
              Traceable Waterfalls
            </h1>
            <p className="text-slate-300 text-base md:text-lg max-w-2xl leading-relaxed">
              Defensible population exclusion waterfalls, quantitative case scoping, and real-time audit governance for complex regulatory remediations and customer redress.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
            <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-xl">
              <span className="text-emerald-400 font-bold text-sm block mb-1">Dual-Persona Governance</span>
              <span className="text-slate-400 text-xs">Unified workspace for FRC Requirement Owners and Quantitative Data Analysts.</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-xl">
              <span className="text-blue-400 font-bold text-sm block mb-1">Deterministic Funnel</span>
              <span className="text-slate-400 text-xs">Dynamic starting population deductions down to final net in-scope accounts.</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-xl">
              <span className="text-purple-400 font-bold text-sm block mb-1">Zero Audit Finding Risk</span>
              <span className="text-slate-400 text-xs">Immutable event ledger recording actor, rationale changes, and timestamps.</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-800">
            <span>Confidential | Designed for Executive & Audit Committee Review</span>
            <span>Version 2.4 Enterprise Edition</span>
          </div>
        </div>
      ),
    },

    // Slide 2: The Problem
    {
      title: 'The High Cost of Unstructured Remediation Scoping',
      subtitle: 'Why traditional spreadsheet-driven population waterfalls fail regulatory examinations.',
      category: 'Industry Challenge',
      speakerNotes:
        'When large institutions remediate an issue, determining which accounts are impacted requires multi-step exclusion waterfalls. Currently, teams rely on fragmented desktop spreadsheets and email threads. This results in version sprawl, policy translation errors, and weeks of stressful scramble when internal audit or regulators demand proof.',
      renderContent: () => (
        <div className="h-full flex flex-col justify-between bg-white p-6 md:p-10 rounded-2xl border border-stone-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">
            <div className="bg-rose-50/50 border border-rose-200 p-5 rounded-xl">
              <div className="inline-block px-2 py-0.5 bg-rose-100 text-rose-800 text-[11px] font-bold rounded mb-2">
                CRITICAL VULNERABILITY
              </div>
              <h3 className="text-base font-bold text-stone-900 mb-1">Spreadsheet Sprawl & Version Breakage</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Complex exclusion waterfalls reside in multiple desktop Excel workbooks with unversioned formulas. Circulating spreadsheets via email causes discrepancies and total loss of data provenance.
              </p>
            </div>

            <div className="bg-amber-50/50 border border-amber-200 p-5 rounded-xl">
              <div className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded mb-2">
                TRANSLATION FRICTION
              </div>
              <h3 className="text-base font-bold text-stone-900 mb-1">The "Policy to SQL" Disconnect</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Compliance teams formulate rules in legalistic language, while Data Analysts write technical SQL queries. Without a shared structured medium, misunderstandings result in incorrect exclusions.
              </p>
            </div>

            <div className="bg-red-50/50 border border-red-200 p-5 rounded-xl">
              <div className="inline-block px-2 py-0.5 bg-red-100 text-red-800 text-[11px] font-bold rounded mb-2">
                REGULATORY FINDINGS
              </div>
              <h3 className="text-base font-bold text-stone-900 mb-1">Deficient Audit Trails</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Examiners (OCC, CFPB, SEC) routinely cite firms for failing to document why 50,000 accounts were excluded. Retrieving sign-offs requires forensic email reconstruction.
              </p>
            </div>

            <div className="bg-stone-50 border border-stone-200 p-5 rounded-xl">
              <div className="inline-block px-2 py-0.5 bg-stone-200 text-stone-800 text-[11px] font-bold rounded mb-2">
                DELIVERY SLIPPAGE
              </div>
              <h3 className="text-base font-bold text-stone-900 mb-1">Unnotified Mid-Flight Scope Shifts</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                When compliance modifies a rule mid-remediation, analysts often continue working with outdated query criteria, wasting weeks of computation and operational effort.
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-xs text-rose-900">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span><strong>The Bottom Line:</strong> Unstructured scoping leads to millions in over/under remediation and costly consent decree penalties.</span>
          </div>
        </div>
      ),
    },

    // Slide 3: The Solution
    {
      title: 'A Governed Single Source of Truth',
      subtitle: 'Eliminating manual spreadsheets with real-time compliance-to-code synchronisation.',
      category: 'Product Solution',
      speakerNotes:
        'Traceable Waterfalls replaces siloed Excel files with a governed digital workspace. Compliance formulates the business rules, data analysts register the queries and counts, and an automated audit ledger logs every change in real time.',
      renderContent: () => (
        <div className="h-full flex flex-col justify-between bg-white p-6 md:p-10 rounded-2xl border border-stone-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
            <div className="border border-stone-200 rounded-xl p-6 bg-gradient-to-b from-stone-50 to-white flex flex-col justify-between">
              <div>
                <span className="text-3xl font-black text-blue-600 block mb-3">01</span>
                <h3 className="text-base font-bold text-stone-900 mb-2">Governed Formulation</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  First-Line Risk & Compliance (FRC) Owners formulate step-by-step exclusion logic, formal business rationales, and quantitative targets without writing code.
                </p>
              </div>
              <ul className="text-xs text-emerald-700 font-medium space-y-1.5 mt-4 pt-4 border-t border-stone-100">
                <li>✓ Standardized scoping parameters</li>
                <li>✓ Formally signed-off rationale</li>
                <li>✓ Immediate stakeholder alerts</li>
              </ul>
            </div>

            <div className="border border-stone-200 rounded-xl p-6 bg-gradient-to-b from-stone-50 to-white flex flex-col justify-between">
              <div>
                <span className="text-3xl font-black text-emerald-600 block mb-3">02</span>
                <h3 className="text-base font-bold text-stone-900 mb-2">Analytical Execution</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Quantitative analysts execute SQL queries, register data lake repositories, deduplicate accounts vs records, and calculate working days pacing.
                </p>
              </div>
              <ul className="text-xs text-emerald-700 font-medium space-y-1.5 mt-4 pt-4 border-t border-stone-100">
                <li>✓ Dedicated "Start Analytics" gate</li>
                <li>✓ Code and script path registry</li>
                <li>✓ Automated timeline calculation</li>
              </ul>
            </div>

            <div className="border border-stone-200 rounded-xl p-6 bg-gradient-to-b from-stone-50 to-white flex flex-col justify-between">
              <div>
                <span className="text-3xl font-black text-purple-600 block mb-3">03</span>
                <h3 className="text-base font-bold text-stone-900 mb-2">Continuous Audit Trail</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Every parameter adjustment, rule finalization, and modification is immutably logged with actor identity and timestamp for instant regulatory reporting.
                </p>
              </div>
              <ul className="text-xs text-emerald-700 font-medium space-y-1.5 mt-4 pt-4 border-t border-stone-100">
                <li>✓ Zero manual logging required</li>
                <li>✓ 1-Click regulator Excel export</li>
                <li>✓ Complete historical versioning</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 p-3 bg-stone-100 rounded-xl text-center text-xs text-stone-600">
            <strong>Outcome:</strong> Complete transparency across Compliance, Analytics, Project Management, and Internal Audit.
          </div>
        </div>
      ),
    },

    // Slide 4: Dual-Persona Architecture
    {
      title: 'Dual-Persona Collaborative Architecture',
      subtitle: 'Connecting Compliance and Analytics through tailored interfaces over shared data.',
      category: 'System Architecture',
      speakerNotes:
        'Instead of forcing both groups into a one-size-fits-all tool, Traceable Waterfalls provides specialized interfaces tailored to their exact workflows. FRC Owners focus on regulatory policy formulation, while Analysts focus on data lake queries and quantitative verification.',
      renderContent: () => (
        <div className="h-full flex flex-col justify-between bg-white p-6 md:p-10 rounded-2xl border border-stone-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            {/* Persona 1: FRC */}
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-emerald-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">PERSONA 1</span>
                  <h3 className="text-base font-bold text-emerald-950">FRC Requirement Owner</h3>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">
                  Policy & Scoping
                </span>
              </div>
              <ul className="text-xs text-emerald-900 space-y-2.5">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Governs <strong>COE#</strong> and <strong>eGRC#</strong> regulatory project details.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Defines <strong>Starting Population</strong> boundaries and <strong>Exclusion Steps</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Documents mandatory business rationale and regulatory references.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Clicks <strong>Finalize Requirement</strong> to trigger automated stakeholder notifications.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Initiates <strong>Modify Requirement</strong> flow if compliance criteria evolve.</span>
                </li>
              </ul>
            </div>

            {/* Persona 2: Analyst */}
            <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-blue-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider block">PERSONA 2</span>
                  <h3 className="text-base font-bold text-blue-950">Quantitative Data Analyst</h3>
                </div>
                <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                  SQL & Verification
                </span>
              </div>
              <ul className="text-xs text-blue-900 space-y-2.5">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>Unlocks step via dedicated <strong>Start Analytics</strong> control.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>Links data lake artifacts (SQL scripts, Databricks/S3 locations).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>Inputs empirical <strong>Total Records</strong> and <strong>Unique Accounts</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>Calculates net working days saved and critical path pacing.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>Signs off and submits formal analysis review packets.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-4 p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between text-xs text-stone-700">
            <span><strong>Seamless Interoperability:</strong> Role switcher allows executives to view both perspectives instantly.</span>
            <span className="font-semibold text-purple-700">Single Shared State Engine</span>
          </div>
        </div>
      ),
    },

    // Slide 5: FRC UI Snapshot
    {
      title: 'FRC Formulation Workspace & Scoping Controls',
      subtitle: 'Interactive UI snapshot of the First-Line Risk & Compliance workspace.',
      category: 'Product Feature 1',
      speakerNotes:
        'Here is the live FRC Formulation Workspace. Note the clean Issue Details card at the top displaying COE and eGRC identifiers with an audit-tracked Edit button. Below it, compliance officers formulate steps with category badges, business rationales, and finalization actions.',
      renderContent: () => (
        <div className="h-full flex flex-col justify-between bg-white p-6 md:p-8 rounded-2xl border border-stone-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-center">
            {/* Left Mockup View */}
            <div className="lg:col-span-7 bg-stone-100 p-3 rounded-xl border border-stone-300 shadow-xs">
              <div className="bg-white rounded-lg p-3 border border-stone-200 text-xs">
                {/* Simulated UI Window Bar */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100 text-[10px] text-stone-400">
                  <span className="font-mono">https://traceable-waterfalls.internal/frc-workspace</span>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  </div>
                </div>

                {/* Simulated Issue Details Card */}
                <div className="bg-stone-50 border border-stone-200 rounded-lg p-2.5 mb-2.5">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-stone-900 text-[11px]">Issue Details</span>
                    <span className="px-2 py-0.5 bg-white border border-stone-300 rounded text-[10px] font-semibold text-stone-700">Edit</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 text-[10px] text-stone-600">
                    <div>COE#: <span className="font-semibold text-stone-900">COE-2026-8891</span></div>
                    <div>eGRC#: <span className="font-semibold text-stone-900">eGRC-REQ-4421</span></div>
                    <div>FRC: <span className="font-semibold text-stone-900">Sarah Jenkins</span></div>
                    <div>Analyst: <span className="font-semibold text-stone-900">Alex Morgan</span></div>
                  </div>
                </div>

                {/* Simulated Waterfall Step Card */}
                <div className="border border-emerald-200 bg-emerald-50/40 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white font-bold text-[9px] flex items-center justify-center">1</span>
                      <span className="font-bold text-stone-900 text-[11px]">Starting Population: Active Retail Accounts</span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[9px]">Finalized</span>
                  </div>
                  <p className="text-[10px] text-stone-600 mb-2 leading-relaxed">
                    Identifies core retail portfolio accounts impacted by quarterly index adjustment discrepancies.
                  </p>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-emerald-600 text-white rounded text-[9px] font-bold">Finalize Requirement</span>
                    <span className="px-2 py-1 bg-stone-100 border border-stone-300 rounded text-[9px] font-semibold text-stone-700">Modify Requirement</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Callouts */}
            <div className="lg:col-span-5 space-y-3.5">
              <div>
                <span className="text-xs font-bold text-emerald-700 block uppercase tracking-wide">Governance Registry</span>
                <p className="text-xs text-stone-600 mt-0.5">Centralized governance header capturing regulatory tickets, loan portfolios, and accountable leads.</p>
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-700 block uppercase tracking-wide">Standardized Rationales</span>
                <p className="text-xs text-stone-600 mt-0.5">Enforces mandatory justification text before any population reduction is submitted to data teams.</p>
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-700 block uppercase tracking-wide">Active Change Management</span>
                <p className="text-xs text-stone-600 mt-0.5">Formal <strong>Modify Requirement</strong> flow automatically alerts downstream data teams to prevent stale analytics execution.</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Eliminates unstructured email exchanges and establishes formal requirement contracts.</span>
            <span className="font-medium text-emerald-600">FRC View</span>
          </div>
        </div>
      ),
    },

    // Slide 6: Analyst UI Snapshot
    {
      title: 'Analyst Execution & Verification Workspace',
      subtitle: 'Interactive UI snapshot of the Quantitative Analytics table and verification flow.',
      category: 'Product Feature 2',
      speakerNotes:
        'Switching to the Analyst Workspace, data teams have an execution-oriented view. Each row features a dedicated "Start Analytics" trigger to prevent premature queries, empirical input boxes for records vs accounts, and direct links to data artifacts.',
      renderContent: () => (
        <div className="h-full flex flex-col justify-between bg-white p-6 md:p-8 rounded-2xl border border-stone-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-center">
            {/* Left Mockup View */}
            <div className="lg:col-span-7 bg-stone-100 p-3 rounded-xl border border-stone-300 shadow-xs">
              <div className="bg-white rounded-lg p-3 border border-stone-200 text-xs">
                {/* Mockup Top Tabs Bar */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100">
                  <div className="flex gap-2 text-[10px] font-semibold">
                    <span className="px-2 py-1 bg-stone-100 rounded text-stone-900 font-bold">Waterfall Requirements (1)</span>
                    <span className="px-2 py-1 text-stone-500">Analytics Summary</span>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[9px] font-bold">Export Waterfall</span>
                </div>

                {/* Mockup Row Table */}
                <div className="border border-stone-200 rounded-lg p-2.5 bg-stone-50 text-[10px]">
                  <div className="flex justify-between font-bold text-stone-800 pb-1 mb-1 border-b border-stone-200">
                    <span>Step 1: Active Retail Accounts FY26</span>
                    <span className="text-blue-600">Certified by Alex Morgan</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-1 text-stone-600">
                    <div>Starting Records: <strong className="text-stone-900 block">1,450,000</strong></div>
                    <div>Net Accounts: <strong className="text-stone-900 block">855,000</strong></div>
                    <div>Working Days: <strong className="text-stone-900 block">3.5 Days</strong></div>
                  </div>
                  <div className="mt-2 pt-1 border-t border-stone-200 text-[9px] text-stone-500 font-mono">
                    Artifact: /datalake/remediation/loans_fy26_final.sql
                  </div>
                </div>
              </div>
            </div>

            {/* Right Callouts */}
            <div className="lg:col-span-5 space-y-3.5">
              <div>
                <span className="text-xs font-bold text-blue-700 block uppercase tracking-wide">"Start Analytics" Activation</span>
                <p className="text-xs text-stone-600 mt-0.5">Prevents wasted SQL cycles by locking quantitative entry fields until the FRC rule is finalized.</p>
              </div>
              <div>
                <span className="text-xs font-bold text-blue-700 block uppercase tracking-wide">Tri-Metric Accuracy</span>
                <p className="text-xs text-stone-600 mt-0.5">Differentiates raw transaction lines from unique customer accounts to prevent duplicate redress.</p>
              </div>
              <div>
                <span className="text-xs font-bold text-blue-700 block uppercase tracking-wide">Artifact Provenance</span>
                <p className="text-xs text-stone-600 mt-0.5">Directly logs SQL repository files and data lake bucket locations for compliance verification.</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Rigorous quantitative tracking designed for data engineers and financial analysts.</span>
            <span className="font-medium text-blue-600">Analyst View</span>
          </div>
        </div>
      ),
    },

    // Slide 7: Retention Funnel
    {
      title: 'Dynamic Retention Funnel & Rollup Summary',
      subtitle: 'Visualizing population deductions and net in-scope remediation impact.',
      category: 'Analytics & Reporting',
      speakerNotes:
        'The platform includes an automated Retention Funnel and Analytics Summary. Leadership can see the starting population of 1.45 million accounts progressively reduced through legitimate exclusions to 855,000 net in-scope accounts, with working days and efficiency gains calculated automatically.',
      renderContent: () => (
        <div className="h-full flex flex-col justify-between bg-white p-6 md:p-8 rounded-2xl border border-stone-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-center">
            {/* Funnel Visual */}
            <div className="lg:col-span-7 space-y-2">
              <div className="bg-slate-900 text-white p-2.5 rounded-lg text-center font-bold text-xs">
                1. Starting Gross Population (1,450,000 Accounts)
              </div>
              <div className="bg-blue-700 text-white p-2 rounded-lg text-center font-semibold text-xs mx-4">
                2. Exclude: Accounts Closed Prior to 2024 (-320,000)
              </div>
              <div className="bg-blue-600 text-white p-2 rounded-lg text-center font-semibold text-xs mx-8">
                3. Exclude: Commercial & Institutional (-180,000)
              </div>
              <div className="bg-blue-500 text-white p-2 rounded-lg text-center font-semibold text-xs mx-12">
                4. Exclude: Neutral Interest Impact (-95,000)
              </div>
              <div className="bg-emerald-600 text-white p-2.5 rounded-lg text-center font-bold text-xs mx-16 shadow-md">
                5. Final In-Scope Redress Population (855,000 Accounts)
              </div>
            </div>

            {/* KPI Cards */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-stone-500 block">Gross Excluded</span>
                <span className="text-xl font-bold text-stone-900 block mt-1">595,000</span>
                <span className="text-[10px] text-stone-500 block">-41.0% of pool</span>
              </div>

              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">Final In-Scope</span>
                <span className="text-xl font-bold text-emerald-950 block mt-1">855,000</span>
                <span className="text-[10px] text-emerald-700 block">59.0% retained</span>
              </div>

              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-blue-700 block">Time Saved</span>
                <span className="text-xl font-bold text-blue-950 block mt-1">18.5 Days</span>
                <span className="text-[10px] text-blue-700 block">Automated scoping</span>
              </div>

              <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-purple-700 block">Audit Status</span>
                <span className="text-xl font-bold text-purple-950 block mt-1">100%</span>
                <span className="text-[10px] text-purple-700 block">Provable provenance</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
            <span>Includes <strong>1-Click Excel Export (.xlsx)</strong> formatted to regulator audit standards.</span>
            <span className="font-semibold text-emerald-700">Executive Summary Engine</span>
          </div>
        </div>
      ),
    },

    // Slide 8: Audit Trail
    {
      title: 'Continuous Immutable Audit Trail',
      subtitle: 'Complete event traceability satisfying OCC, CFPB, and internal audit mandates.',
      category: 'Governance & Compliance',
      speakerNotes:
        'Compliance cannot exist without an audit trail. Traceable Waterfalls automatically captures every action: when a rule was formulated, who modified it, what the previous value was, and when stakeholders were notified. An auditor can inspect the timeline in seconds.',
      renderContent: () => (
        <div className="h-full flex flex-col justify-between bg-white p-6 md:p-8 rounded-2xl border border-stone-200">
          <div className="flex-1 space-y-4">
            <div className="border border-stone-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Actor & Role</th>
                    <th className="p-3">Audit Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  <tr>
                    <td className="p-3 font-mono text-[11px] text-stone-500">2026-09-19 13:42</td>
                    <td className="p-3"><span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold">Scope Change</span></td>
                    <td className="p-3 font-semibold">Sarah Jenkins (FRC)</td>
                    <td className="p-3">Modified Step 3 exclusion rationale to cover inactive retail products.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-[11px] text-stone-500">2026-09-19 12:15</td>
                    <td className="p-3"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">Requirement Finalized</span></td>
                    <td className="p-3 font-semibold">Sarah Jenkins (FRC)</td>
                    <td className="p-3">Finalized Step 1 baseline starting population and dispatched alert email.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-[11px] text-stone-500">2026-09-19 10:30</td>
                    <td className="p-3"><span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-bold">Analytics Completed</span></td>
                    <td className="p-3 font-semibold">Alex Morgan (Analyst)</td>
                    <td className="p-3">Completed SQL execution on loans_fy26_final.sql (855k accounts verified).</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                <strong className="text-stone-900 block mb-1">Non-Repudiation</strong>
                <span className="text-stone-600">Logs cannot be deleted or edited manually by any role.</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                <strong className="text-stone-900 block mb-1">Field-Level Diffs</strong>
                <span className="text-stone-600">Captures exact before/after parameters for all numbers and titles.</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                <strong className="text-stone-900 block mb-1">Automated Dispatch</strong>
                <span className="text-stone-600">Email alerts triggered automatically upon milestone changes.</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Built-in audit drawer accessible via 1-click on any workspace screen.</span>
            <span className="font-semibold text-stone-800">100% Audit Ready</span>
          </div>
        </div>
      ),
    },

    // Slide 9: ROI & Benefits
    {
      title: 'Measurable Business ROI & Strategic Benefits',
      subtitle: 'Quantifiable operational, compliance, and financial returns on investment.',
      category: 'Value Proposition',
      speakerNotes:
        'To summarize the business value: Traceable Waterfalls achieves 100% audit defensibility, accelerates remediation scoping pacing by up to 50%, protects balance sheets against redress leakage, and provides executive leadership with real-time visibility.',
      renderContent: () => (
        <div className="h-full flex flex-col justify-between bg-white p-6 md:p-8 rounded-2xl border border-stone-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
            <div className="p-5 border border-stone-200 rounded-xl bg-gradient-to-b from-emerald-50/50 to-white flex flex-col justify-between">
              <div>
                <span className="text-3xl font-black text-emerald-600 block mb-2">100%</span>
                <h3 className="text-sm font-bold text-stone-900 mb-1">Audit Defensibility</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Eliminates compliance findings and MRA fines caused by undocumented exclusion logic or unversioned spreadsheet tabs.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 mt-4 block">Zero regulatory gaps</span>
            </div>

            <div className="p-5 border border-stone-200 rounded-xl bg-gradient-to-b from-blue-50/50 to-white flex flex-col justify-between">
              <div>
                <span className="text-3xl font-black text-blue-600 block mb-2">50%</span>
                <h3 className="text-sm font-bold text-stone-900 mb-1">Faster Scoping Pacing</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Replaces weeks of manual email handoffs, version reconciliation, and status calls with a streamlined, structured pipeline.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-blue-700 mt-4 block">Accelerated delivery</span>
            </div>

            <div className="p-5 border border-stone-200 rounded-xl bg-gradient-to-b from-purple-50/50 to-white flex flex-col justify-between">
              <div>
                <span className="text-3xl font-black text-purple-600 block mb-2">$0</span>
                <h3 className="text-sm font-bold text-stone-900 mb-1">Redress Leakage</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Strict account deduplication prevents over-remediation payouts to unaffected accounts and under-remediation penalties.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-purple-700 mt-4 block">Direct capital savings</span>
            </div>

            <div className="p-5 border border-stone-200 rounded-xl bg-gradient-to-b from-amber-50/50 to-white flex flex-col justify-between">
              <div>
                <span className="text-3xl font-black text-amber-600 block mb-2">Real-Time</span>
                <h3 className="text-sm font-bold text-stone-900 mb-1">Executive Visibility</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Leadership and project sponsors view true real-time scoping progress rather than stale weekly PowerPoint status reports.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-amber-700 mt-4 block">Single source of truth</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-stone-100 rounded-xl text-center text-xs text-stone-700">
            <strong>Investment Payoff:</strong> Pays for itself on the very first multi-million dollar remediation or portfolio audit.
          </div>
        </div>
      ),
    },

    // Slide 10: Tech Stack
    {
      title: 'Enterprise Cloud-Native Technology Stack',
      subtitle: 'Engineered for sub-second responsiveness, bulletproof reliability, and zero latency.',
      category: 'Technology & Architecture',
      speakerNotes:
        'Finally, the technology stack. Traceable Waterfalls is engineered using modern React 19, TypeScript, and Vite 6 for high performance, styled with Tailwind CSS v4, and backed by SheetJS and PptxGenJS for instant client-side Excel and PowerPoint reporting.',
      renderContent: () => (
        <div className="h-full flex flex-col justify-between bg-white p-6 md:p-8 rounded-2xl border border-stone-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-blue-600 block">FRONTEND & FRAMEWORK</span>
              <h3 className="text-sm font-bold text-stone-900 mt-0.5">React 19 + TypeScript</h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                End-to-end type safety, deterministic state isolation, and zero runtime crashes for mission-critical enterprise compliance.
              </p>
            </div>

            <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-blue-600 block">BUILD & COMPILATION</span>
              <h3 className="text-sm font-bold text-stone-900 mt-0.5">Vite 6 + ESBuild</h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Sub-second startup times, instantaneous compilation, and ultra-lightweight asset packaging.
              </p>
            </div>

            <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-blue-600 block">DESIGN SYSTEM & ICONS</span>
              <h3 className="text-sm font-bold text-stone-900 mt-0.5">Tailwind CSS v4 + Lucide React</h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Clean, accessible, high-contrast typography, ergonomic layout ratios, and vector iconography.
              </p>
            </div>

            <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-blue-600 block">DATA & REPORTING ENGINES</span>
              <h3 className="text-sm font-bold text-stone-900 mt-0.5">SheetJS (xlsx) + PptxGenJS + Recharts</h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Direct client-side generation of regulator-ready multi-tab Excel workbooks and 16:9 executive PowerPoint decks.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
            <span>Production-ready deployment via <strong>Google Cloud Run</strong> and <strong>GitHub Pages</strong>.</span>
            <span className="font-bold text-emerald-700">Cloud-Native Architecture</span>
          </div>
        </div>
      ),
    },
  ];

  const currentSlideData = slides[currentSlide];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-stone-900 w-full max-w-6xl h-[92vh] max-h-[850px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-stone-800 text-stone-100">
        {/* Top Control Bar */}
        <div className="px-5 py-3.5 bg-stone-950/80 border-b border-stone-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white tracking-wide block">
                Executive Pitch Deck & Product Presentation
              </span>
              <span className="text-[10px] text-stone-400">
                Slide {currentSlide + 1} of {totalSlides}: {currentSlideData.title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Download PPTX Button */}
            <button
              type="button"
              id="btn-download-pptx-modal"
              onClick={handleDownload}
              disabled={isDownloading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              title="Download real 16:9 PowerPoint (.pptx) file for this presentation"
            >
              <Download className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce' : ''}`} />
              <span>{isDownloading ? 'Generating PPT...' : 'Download PPT (.pptx)'}</span>
            </button>

            {/* Speaker Notes Toggle */}
            <button
              type="button"
              onClick={() => setShowSpeakerNotes((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                showSpeakerNotes
                  ? 'bg-stone-800 text-stone-200 border-stone-700'
                  : 'bg-transparent text-stone-400 border-stone-800 hover:text-stone-200'
              }`}
            >
              Speaker Notes
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
              title="Close Presentation (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Stage: Current Slide */}
        <div className="flex-1 p-4 sm:p-6 bg-stone-950 flex flex-col justify-center overflow-hidden">
          <div className="w-full h-full max-w-5xl mx-auto flex flex-col justify-center">
            {currentSlideData.renderContent()}
          </div>
        </div>

        {/* Optional Speaker Notes Panel */}
        {showSpeakerNotes && (
          <div className="px-6 py-3 bg-stone-900 border-t border-stone-800 text-xs flex items-start gap-3 text-stone-300">
            <span className="px-2 py-0.5 bg-stone-800 text-amber-400 font-bold rounded text-[10px] shrink-0 uppercase tracking-wider">
              Speaker Notes
            </span>
            <p className="leading-relaxed line-clamp-2">{currentSlideData.speakerNotes}</p>
          </div>
        )}

        {/* Bottom Navigation & Thumbnails Bar */}
        <div className="px-5 py-3 bg-stone-950 border-t border-stone-800 flex items-center justify-between gap-4">
          {/* Slide Pill Thumbnails */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all ${
                  currentSlide === idx
                    ? 'w-7 bg-blue-500'
                    : 'w-2 bg-stone-700 hover:bg-stone-500'
                }`}
                title={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Next / Previous Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-prev-slide"
              onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 0))}
              disabled={currentSlide === 0}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 disabled:opacity-40 disabled:pointer-events-none text-stone-200 rounded-lg text-xs font-semibold transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="text-xs font-mono text-stone-400 px-2">
              {currentSlide + 1} / {totalSlides}
            </span>

            <button
              type="button"
              id="btn-next-slide"
              onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1))}
              disabled={currentSlide === totalSlides - 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:pointer-events-none text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
