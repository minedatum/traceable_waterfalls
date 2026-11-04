import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  FolderArchive,
  UploadCloud,
  CheckCircle2,
  FolderOpen,
  Layers,
  FileCheck2,
  FolderSync,
} from 'lucide-react';
import {
  ScannedFile,
  ExpectedDeliverable,
  DeliverableAuditResult,
  PhaseId,
  UserRole,
  AnalystTab,
  WaterfallRow,
  WaterfallStepVersion,
  AuditLogEntry,
  ProjectDetails,
  WaterfallEntity,
  ProjectEntity,
  AuthUser,
  StepAttachment,
  WaterfallLineage,
  DataSourceType,
  LineageType,
} from './types';
import {
  DEFAULT_DELIVERABLES,
  SAMPLE_WATERFALL_FILES,
} from './data/waterfallTemplate';
import {
  INITIAL_WATERFALL_ROWS,
  INITIAL_AUDIT_LOGS,
  DEMO_WATERFALL_ROWS,
  DEMO_AUDIT_LOGS,
} from './data/waterfallData';
import { calculateWorkingDays } from './utils/workingDays';
import { performAudit } from './utils/auditor';
import { exportAnalystViewToExcel } from './utils/exportUtils';
import { Header } from './components/Header';
import { FRCWorkspace } from './components/FRCWorkspace';
import { AnalystWorkspace } from './components/AnalystWorkspace';
import { AuditLogDrawer } from './components/AuditLogDrawer';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { PhasePipeline } from './components/PhasePipeline';
import { DeliverablesTable } from './components/DeliverablesTable';
import { DeliverableModal } from './components/DeliverableModal';
import { ReportExportModal } from './components/ReportExportModal';
import { RulesEditorModal } from './components/RulesEditorModal';
import { ScaffoldModal } from './components/ScaffoldModal';
import { RefreshDataModal } from './components/RefreshDataModal';
import { AddWaterfallModal, CreateProjectModal } from './components/CreateWaterfallModals';
import { IssueDetailsSetup } from './components/IssueDetailsSetup';
import { AuthScreen } from './components/AuthScreen';
import { ProjectPortfolioLanding } from './components/ProjectPortfolioLanding';
import { SAMPLE_PORTFOLIO_PROJECTS } from './data/sampleProjects';

export const BLANK_PROJECT_DETAILS: ProjectDetails = {
  issueNumber: '',
  issueTitle: '',
  issueDescription: '',
  assignedToName: '',
  assignedToEmail: '',
  frcName: '',
  analystName: '',
  waterfallName: '',
};

export default function App() {
  // User Authentication State (persisted in localStorage)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('gov_auth_user') || localStorage.getItem('egrc_auth_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  // Dual-Role State (persisted in localStorage)
  const [userRole, setUserRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem('gov_user_role') || localStorage.getItem('egrc_user_role');
      if (saved === 'frc' || saved === 'analyst') return saved;
    } catch {
      // ignore
    }
    return 'frc';
  });

  // Active Analyst Tab (persisted in localStorage)
  const [analystTab, setAnalystTab] = useState<AnalystTab>(() => {
    try {
      const saved = localStorage.getItem('gov_analyst_tab') || localStorage.getItem('egrc_analyst_tab');
      if (saved === 'table' || saved === 'start' || saved === 'complete' || saved === 'evolving') return saved as AnalystTab;
    } catch {
      // ignore
    }
    return 'table';
  });

  // Waterfall Scoping Rows (starts completely empty with 0 steps for fresh testing)
  const [waterfallRows, setWaterfallRows] = useState<WaterfallRow[]>(() => {
    try {
      const cleanInit = localStorage.getItem('gov_demo_blank_v2');
      if (!cleanInit) {
        localStorage.removeItem('gov_waterfall_rows');
        localStorage.removeItem('gov_audit_logs');
        localStorage.removeItem('gov_project_details');
        localStorage.removeItem('gov_waterfalls_list');
        localStorage.removeItem('gov_active_waterfall_id');
        localStorage.setItem('gov_demo_blank_v2', 'true');
        return [];
      }
      const saved = localStorage.getItem('gov_waterfall_rows') || localStorage.getItem('egrc_waterfall_rows');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  // Consolidated Activity Audit Logs (starts clean with 0 entries for fresh testing)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const cleanInit = localStorage.getItem('gov_demo_blank_v2');
      if (!cleanInit) {
        return [];
      }
      const saved = localStorage.getItem('gov_audit_logs') || localStorage.getItem('egrc_audit_logs');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  // Mandatory Project Governance Details (starts completely blank for live demo show)
  const [projectDetails, setProjectDetails] = useState<ProjectDetails>(() => {
    try {
      const cleanInit = localStorage.getItem('gov_demo_blank_v2');
      if (!cleanInit) {
        return BLANK_PROJECT_DETAILS;
      }
      const saved = localStorage.getItem('gov_project_details') || localStorage.getItem('egrc_project_details');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed.issueTitle === 'Card Lending Overlimit Interest Recalibration & Regulatory Reporting'
        ) {
          return BLANK_PROJECT_DETAILS;
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return BLANK_PROJECT_DETAILS;
  });

  // Secondary sub-view toggle: Show Deliverables File Gate Auditor
  const [showFileGatesAuditor, setShowFileGatesAuditor] = useState<boolean>(false);

  // Multi-Waterfall & Project Management State (starts empty until issue details entered)
  const [waterfalls, setWaterfalls] = useState<WaterfallEntity[]>(() => {
    try {
      const saved = localStorage.getItem('gov_waterfalls_list') || localStorage.getItem('egrc_waterfalls_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.name !== 'Q3 Card Portfolio Remediation Waterfall') {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [activeWaterfallId, setActiveWaterfallId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('gov_active_waterfall_id') || localStorage.getItem('egrc_active_waterfall_id');
      if (saved && saved !== 'wf-default-1') return saved;
    } catch {
      // ignore
    }
    return '';
  });

  // Project Portfolio List (persisted in localStorage)
  // Filters out built-in demo projects and retains any user-created testing projects
  const [projects, setProjects] = useState<ProjectEntity[]>(() => {
    try {
      const saved =
        localStorage.getItem('gov_projects_portfolio_v4') ||
        localStorage.getItem('egrc_projects_portfolio_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const userProjects = parsed
            .filter((p: any) => {
              const id = p.id || '';
              const title = p.projectDetails?.issueTitle || '';
              const isDemo =
                id === 'proj-card-lending-001' ||
                id === 'proj-mortgage-escrow-002' ||
                id === 'proj-commercial-kyc-003' ||
                title.includes('Card Lending Overlimit') ||
                title.includes('Mortgage Escrow') ||
                title.includes('Commercial KYC');
              return !isDemo;
            })
            .map((p: any) => {
              const issueNum = p.projectDetails?.issueNumber || 'TEST-001';
              return {
                ...p,
                projectDetails: {
                  ...p.projectDetails,
                  issueNumber: issueNum,
                  assignedToEmail:
                    p.projectDetails?.assignedToEmail ||
                    p.projectDetails?.frcEmail ||
                    'sarah.jenkins@enterprise.bank',
                  assignedToName:
                    p.projectDetails?.assignedToName ||
                    p.projectDetails?.frcName ||
                    'Sarah Jenkins',
                },
              };
            });
          return userProjects;
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Active Project ID (null indicates user is on Project Portfolio Landing Page)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('gov_active_project_id_v4') || localStorage.getItem('egrc_active_project_id_v3');
      if (saved) return saved;
    } catch {
      // ignore
    }
    return null;
  });

  useEffect(() => {
    try {
      localStorage.setItem('gov_projects_portfolio_v4', JSON.stringify(projects));
      localStorage.setItem('egrc_projects_portfolio_v3', JSON.stringify(projects));
    } catch {
      // ignore
    }
  }, [projects]);

  useEffect(() => {
    try {
      if (activeProjectId) {
        localStorage.setItem('gov_active_project_id_v4', activeProjectId);
        localStorage.setItem('egrc_active_project_id_v3', activeProjectId);
      } else {
        localStorage.removeItem('gov_active_project_id_v4');
        localStorage.removeItem('egrc_active_project_id_v3');
      }
    } catch {
      // ignore
    }
  }, [activeProjectId]);

  // Issue Details configuration check
  const isIssueDetailsConfigured = Boolean(
    projectDetails.issueTitle?.trim() && projectDetails.issueNumber?.trim()
  );

  // Check if current logged-in user is the assigned user for the opened project
  const isProjectAssignedToCurrentUser = useMemo(() => {
    if (!currentUser) return false;
    const userEmail = (currentUser.email || '').trim().toLowerCase();
    const userName = (currentUser.name || '').trim().toLowerCase();

    const assignedEmail = (projectDetails.assignedToEmail || '').trim().toLowerCase();
    const assignedName = (projectDetails.assignedToName || '').trim().toLowerCase();
    const frcName = (projectDetails.frcName || '').trim().toLowerCase();
    const analystName = (projectDetails.analystName || '').trim().toLowerCase();

    if (assignedEmail) {
      return assignedEmail === userEmail || assignedName === userName;
    }
    if (assignedName) {
      return assignedName === userName || assignedName === userEmail;
    }
    if (frcName && (frcName === userName || frcName === userEmail)) return true;
    if (analystName && (analystName === userName || analystName === userEmail)) return true;

    return false;
  }, [currentUser, projectDetails]);

  const isReadOnly = !isProjectAssignedToCurrentUser;

  const [isAddWaterfallOpen, setIsAddWaterfallOpen] = useState<boolean>(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState<boolean>(false);

  // Drawer / Modals State
  const [isAuditLogOpen, setIsAuditLogOpen] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [showScaffoldModal, setShowScaffoldModal] = useState<boolean>(false);
  const [showRefreshModal, setShowRefreshModal] = useState<boolean>(false);

  // Deliverables Auditor File State
  const [files, setFiles] = useState<ScannedFile[]>(SAMPLE_WATERFALL_FILES);
  const [deliverables, setDeliverables] = useState<ExpectedDeliverable[]>(DEFAULT_DELIVERABLES);
  const [targetPath, setTargetPath] = useState<string>('H:\\My Drive\\Waterfall');
  const [folderName, setFolderName] = useState<string>('H:\\My Drive\\Waterfall');
  const [isUsingSample, setIsUsingSample] = useState<boolean>(true);

  // Filters & Selected states for Deliverables Table
  const [selectedPhase, setSelectedPhase] = useState<PhaseId | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [inspectedItem, setInspectedItem] = useState<DeliverableAuditResult | null>(null);

  // Drag & drop state
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('gov_user_role', userRole);
    } catch {
      // ignore
    }
  }, [userRole]);

  useEffect(() => {
    try {
      localStorage.setItem('gov_analyst_tab', analystTab);
    } catch {
      // ignore
    }
  }, [analystTab]);

  useEffect(() => {
    try {
      localStorage.setItem('gov_waterfall_rows', JSON.stringify(waterfallRows));
    } catch {
      // ignore
    }
  }, [waterfallRows]);

  useEffect(() => {
    try {
      localStorage.setItem('gov_audit_logs', JSON.stringify(auditLogs));
    } catch {
      // ignore
    }
  }, [auditLogs]);

  useEffect(() => {
    try {
      localStorage.setItem('gov_project_details', JSON.stringify(projectDetails));
    } catch {
      // ignore
    }
  }, [projectDetails]);

  useEffect(() => {
    try {
      localStorage.setItem('gov_waterfalls_list', JSON.stringify(waterfalls));
    } catch {
      // ignore
    }
  }, [waterfalls]);

  useEffect(() => {
    try {
      localStorage.setItem('gov_active_waterfall_id', activeWaterfallId);
    } catch {
      // ignore
    }
  }, [activeWaterfallId]);

  // Append new audit log helper
  const addAuditLog = useCallback(
    (
      action: string,
      role: 'FRC Owner' | 'Analyst' | 'System',
      user: string,
      details: string,
      rowId?: string,
      eventType?: AuditLogEntry['eventType'],
      disputeCategory?: AuditLogEntry['disputeCategory']
    ) => {
      const target = rowId ? waterfallRows.find((r) => r.id === rowId) : undefined;
      const newEntry: AuditLogEntry = {
        id: `LOG-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        user,
        role,
        action,
        rowId,
        stepTitle: target?.stepTitle,
        details,
        eventType: eventType || 'general',
        disputeCategory,
      };
      setAuditLogs((prev) => [newEntry, ...prev]);
    },
    [waterfallRows]
  );

  // Handle Role Change
  const handleRoleChange = (newRole: UserRole) => {
    setUserRole(newRole);
    addAuditLog(
      `Workspace View Switched to ${newRole === 'frc' ? 'Requirements' : 'Development'}`,
      newRole === 'frc' ? 'FRC Owner' : 'Analyst',
      newRole === 'frc' ? 'Sarah Jenkins' : 'Alex Morgan',
      `User toggled view in header to ${newRole === 'frc' ? 'Requirements' : 'Development'}.`
    );
  };

  // Handle Authentication
  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setUserRole(user.persona);
    try {
      localStorage.setItem('gov_auth_user', JSON.stringify(user));
      localStorage.setItem('gov_user_role', user.persona);
    } catch {
      // ignore
    }
    addAuditLog(
      `User Authenticated (${user.name})`,
      user.role,
      user.name,
      `User signed in with corporate email ${user.email}. Role: ${user.role}.`
    );
  };

  const handleLogout = () => {
    if (currentUser) {
      addAuditLog(
        `User Signed Out (${currentUser.name})`,
        currentUser.role,
        currentUser.name,
        `Session terminated. Returned to login portal.`
      );
    }
    setCurrentUser(null);
    setActiveProjectId(null);
    try {
      localStorage.removeItem('gov_auth_user');
      localStorage.removeItem('gov_active_project_id_v4');
      localStorage.removeItem('egrc_auth_user');
      localStorage.removeItem('egrc_active_project_id_v3');
    } catch {
      // ignore
    }
  };

  // FRC: Add New Step
  const handleAddStep = (
    newRowData: Omit<WaterfallRow, 'id' | 'stepNumber' | 'versions' | 'lastUpdated'>
  ) => {
    const nextNum = waterfallRows.length + 1;
    const newId = `WF-0${nextNum}`;
    const initialVersion: WaterfallStepVersion = {
      versionNumber: 1,
      timestamp: new Date().toISOString(),
      author: 'Sarah Jenkins',
      role: 'FRC Owner',
      rationale: newRowData.rationale,
      changeSummary: 'Baseline step formulated by FRC Owner.',
      excludeCount: newRowData.excludeCount,
      includeCaseCount: newRowData.includeCaseCount,
      includeUniqueAccountCount: newRowData.includeUniqueAccountCount,
      startDate: newRowData.startDate,
      endDate: newRowData.endDate,
      workingDays: newRowData.workingDays,
    };

    const newRow: WaterfallRow = {
      ...newRowData,
      id: newId,
      stepNumber: nextNum,
      lastUpdated: new Date().toISOString(),
      versions: [initialVersion],
    };

    setWaterfallRows((prev) => [...prev, newRow]);
    addAuditLog(
      'New Step Formulated',
      'FRC Owner',
      'Sarah Jenkins',
      `Formulated Step ${nextNum} (${newId}): "${newRow.stepTitle}" under rule [${newRow.ruleReference}].`,
      newId
    );
  };

  // FRC: Update Row Rationale / Rule Reference (bumps version)
  const handleUpdateRow = (
    rowId: string,
    updates: Partial<WaterfallRow>,
    changeSummary?: string
  ) => {
    setWaterfallRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        const newVersionNum = row.versions.length + 1;
        const newVersion: WaterfallStepVersion = {
          versionNumber: newVersionNum,
          timestamp: new Date().toISOString(),
          author: 'Sarah Jenkins',
          role: 'FRC Owner',
          rationale: updates.rationale || row.rationale,
          changeSummary: changeSummary || 'Modified step rationale by FRC Owner.',
          excludeCount: row.excludeCount,
          includeCaseCount: row.includeCaseCount,
          includeUniqueAccountCount: row.includeUniqueAccountCount,
          startDate: row.startDate,
          endDate: row.endDate,
          workingDays: row.workingDays,
        };

        return {
          ...row,
          ...updates,
          lastUpdated: new Date().toISOString(),
          versions: [...row.versions, newVersion],
        };
      })
    );

    addAuditLog(
      'Step rationale modified by FRC',
      'FRC Owner',
      'Sarah Jenkins',
      changeSummary || `Updated rationale for ${rowId}. Version v${(waterfallRows.find((r) => r.id === rowId)?.versions.length || 0) + 1} generated.`,
      rowId
    );
  };

  // Step Attachments Handlers (Insert, View, Download)
  const handleAddAttachmentsToStep = (stepId: string, newAttachments: StepAttachment[]) => {
    setWaterfallRows((prev) =>
      prev.map((row) => {
        if (row.id !== stepId) return row;
        const existing = row.attachments || [];
        return {
          ...row,
          attachments: [...existing, ...newAttachments],
          lastUpdated: new Date().toISOString(),
        };
      })
    );

    const first = newAttachments[0];
    const fileNames = newAttachments.map((f) => f.name).join(', ');
    const uploaderRole = first?.uploadedByRole || (userRole === 'frc' ? 'FRC Owner' : 'Analyst');
    const uploaderName = first?.uploadedBy || (userRole === 'frc' ? 'Sarah Jenkins' : 'Alex Morgan');

    addAuditLog(
      `Files Inserted to Step ${stepId}`,
      uploaderRole,
      uploaderName,
      `Inserted ${newAttachments.length} file(s) [${fileNames}] into step ${stepId}. Available for preview and local download.`,
      stepId
    );
  };

  const handleRemoveAttachmentFromStep = (stepId: string, attachmentId: string) => {
    setWaterfallRows((prev) =>
      prev.map((row) => {
        if (row.id !== stepId) return row;
        const remaining = (row.attachments || []).filter((a) => a.id !== attachmentId);
        return {
          ...row,
          attachments: remaining,
          lastUpdated: new Date().toISOString(),
        };
      })
    );

    addAuditLog(
      `Attachment Removed from Step ${stepId}`,
      userRole === 'frc' ? 'FRC Owner' : 'Analyst',
      userRole === 'frc' ? 'Sarah Jenkins' : 'Alex Morgan',
      `Removed attachment ${attachmentId} from step ${stepId}.`,
      stepId
    );
  };

  // FRC: Finalize Requirement (Triggers stakeholder email and sets status to step_finalized)
  const handleFinalizeRequirement = (
    rowId: string,
    emailDetails?: {
      recipients: string[];
      subject: string;
      body: string;
      stepTitle?: string;
    }
  ) => {
    const timestamp = new Date().toISOString();
    setWaterfallRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              status: 'step_finalized' as const,
              emailTriggeredAt: timestamp,
              requirementFinalizedAt: r.requirementFinalizedAt || timestamp,
              requirementLatestFinalizedAt: timestamp,
              refinalizeCount: r.refinalizeCount ?? 0,
              lastEmailRecipients: emailDetails?.recipients,
              lastEmailSubject: emailDetails?.subject,
              lastEmailBody: emailDetails?.body,
            }
          : r
      )
    );

    addAuditLog(
      'Requirement Finalized by FRC',
      'FRC Owner',
      'Sarah Jenkins',
      `FRC finalized requirement for ${rowId}. Status moved to STEP FINALIZED. Stakeholder email alert dispatched to: ${
        emailDetails?.recipients.join(', ') || 'alex.morgan@enterprise.bank, marcus.vance.pmo@enterprise.bank'
      }.`,
      rowId,
      'requirement_finalized',
      'signoff_milestone'
    );
  };

  // FRC: Start Modification (Triggers stakeholder email and sets status to in_modification)
  const handleStartModification = (
    rowId: string,
    emailDetails?: {
      recipients: string[];
      subject: string;
      body: string;
      stepTitle?: string;
    }
  ) => {
    const timestamp = new Date().toISOString();
    setWaterfallRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              status: 'in_modification' as const,
              emailTriggeredAt: timestamp,
              lastEmailRecipients: emailDetails?.recipients,
              lastEmailSubject: emailDetails?.subject,
              lastEmailBody: emailDetails?.body,
            }
          : r
      )
    );

    addAuditLog(
      'FRC Initiated Requirement Modification',
      'FRC Owner',
      'Sarah Jenkins',
      `FRC initiated modification for ${rowId}. Status moved to IN MODIFICATION. Alert email dispatched to: ${
        emailDetails?.recipients.join(', ') || 'alex.morgan@enterprise.bank, marcus.vance.pmo@enterprise.bank'
      }.`,
      rowId,
      'modification_started',
      'scope_change'
    );
  };

  // FRC: Submit Modified Requirement (Triggers stakeholder email, creates version, sets status to step_finalized)
  const handleSubmitModifiedRequirement = (
    rowId: string,
    updates: Partial<WaterfallRow>,
    changeSummary: string,
    emailDetails?: {
      recipients: string[];
      subject: string;
      body: string;
      stepTitle?: string;
    }
  ) => {
    const timestamp = new Date().toISOString();
    const targetRow = waterfallRows.find((r) => r.id === rowId);
    const newRefinalizeCount = (targetRow?.refinalizeCount || 0) + 1;

    setWaterfallRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        const newVersionNum = row.versions.length + 1;
        const newVersion: WaterfallStepVersion = {
          versionNumber: newVersionNum,
          timestamp,
          author: 'Sarah Jenkins',
          role: 'FRC Owner',
          rationale: updates.rationale || row.rationale,
          changeSummary: changeSummary || 'FRC modified and re-finalized requirement.',
          excludeCount: row.excludeCount,
          includeCaseCount: row.includeCaseCount,
          includeUniqueAccountCount: row.includeUniqueAccountCount,
          startDate: row.startDate,
          endDate: row.endDate,
          workingDays: row.workingDays,
        };

        return {
          ...row,
          ...updates,
          status: 'step_finalized' as const,
          lastUpdated: timestamp,
          emailTriggeredAt: timestamp,
          requirementFinalizedAt: row.requirementFinalizedAt || timestamp,
          requirementLatestFinalizedAt: timestamp,
          refinalizeCount: newRefinalizeCount,
          lastEmailRecipients: emailDetails?.recipients,
          lastEmailSubject: emailDetails?.subject,
          lastEmailBody: emailDetails?.body,
          versions: [...row.versions, newVersion],
        };
      })
    );

    addAuditLog(
      'Modified Requirement Re-Finalized by FRC',
      'FRC Owner',
      'Sarah Jenkins',
      `FRC re-finalized requirement for ${rowId} (re-finalization #${newRefinalizeCount}). Version v${
        (targetRow?.versions.length || 0) + 1
      } generated. Status updated to STEP FINALIZED. Stakeholder email alert dispatched.`,
      rowId,
      'requirement_refinalized',
      'scope_change'
    );
  };

  // FRC: Submit Row to Analyst
  const handleSubmitToAnalyst = (rowId: string) => {
    setWaterfallRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, status: 'step_finalized' as const } : r))
    );
    addAuditLog(
      'Requirement finalized to Analyst',
      'FRC Owner',
      'Sarah Jenkins',
      `Dispatched step ${rowId} to Analyst queue. Status set to STEP FINALIZED.`,
      rowId
    );
  };

  // FRC: Sign Off Step
  const handleSignOffRow = (rowId: string) => {
    setWaterfallRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, status: 'signed_off' as const } : r))
    );
    addAuditLog(
      'Requirement finalised',
      'FRC Owner',
      'Sarah Jenkins',
      `Formal FRC requirement finalisation completed for ${rowId}. Step locked for downstream reporting.`,
      rowId,
      'sign_off',
      'signoff_milestone'
    );
  };

  // FRC: Delete Step completely (no email triggered, transaction logged in audit trail)
  const handleDeleteStep = (rowId: string) => {
    const targetStep = waterfallRows.find((r) => r.id === rowId);
    if (!targetStep) return;

    setWaterfallRows((prev) => {
      const remaining = prev.filter((r) => r.id !== rowId);
      return remaining.map((row, idx) => ({
        ...row,
        stepNumber: idx + 1,
      }));
    });

    addAuditLog(
      `Waterfall Step Deleted (${rowId})`,
      'FRC Owner',
      'Sarah Jenkins',
      `FRC Owner Sarah Jenkins completely deleted Waterfall Step ${rowId}: "${targetStep.stepTitle}". Category: ${targetStep.category}, Rule Reference: ${targetStep.ruleReference}. Deletion recorded in audit trail without outbound email dispatch.`,
      rowId,
      'general',
      'scope_change'
    );
  };

  // Analyst: Update Counts and Schedule
  const handleUpdateCountsAndSchedule = (
    rowId: string,
    updates: {
      excludeCount: number;
      includeCaseCount: number;
      includeUniqueAccountCount: number;
      startDate: string;
      endDate: string;
      workingDays: number;
      businessRequirements?: string;
      datasetLocation?: string;
      notes?: string;
      rerunCount?: number;
      analyticsCompletedAt?: string;
      analyticsFirstFinalizedAt?: string;
      analyticsLatestFinalizedAt?: string;
    },
    changeSummary?: string
  ) => {
    const existing = waterfallRows.find((r) => r.id === rowId);
    const isRerun = (updates.rerunCount ?? 0) > (existing?.rerunCount ?? 0);

    setWaterfallRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        const newVersionNum = row.versions.length + 1;
        const newVersion: WaterfallStepVersion = {
          versionNumber: newVersionNum,
          timestamp: new Date().toISOString(),
          author: 'Alex Morgan',
          role: 'Analyst',
          rationale: row.rationale,
          changeSummary:
            changeSummary ||
            `Analyst updated requirements, counts (Exclude: ${updates.excludeCount.toLocaleString()}, Include: ${updates.includeCaseCount.toLocaleString()}) and days (${updates.workingDays}d).`,
          excludeCount: updates.excludeCount,
          includeCaseCount: updates.includeCaseCount,
          includeUniqueAccountCount: updates.includeUniqueAccountCount,
          startDate: updates.startDate,
          endDate: updates.endDate,
          workingDays: updates.workingDays,
        };

        const updatedRow: WaterfallRow = {
          ...row,
          ...updates,
          lastUpdated: new Date().toISOString(),
          versions: [...row.versions, newVersion],
        };

        if ('analyticsCompletedAt' in updates && !updates.analyticsCompletedAt) {
          delete updatedRow.analyticsCompletedAt;
        }

        return updatedRow;
      })
    );

    addAuditLog(
      isRerun ? `Analytics Re-run #${updates.rerunCount} by Analyst` : 'Waterfall step modified by Analyst',
      'Analyst',
      'Alex Morgan',
      changeSummary ||
        `Updated ${rowId}: Exclude=${updates.excludeCount.toLocaleString()}, Include=${updates.includeCaseCount.toLocaleString()}, Accounts=${updates.includeUniqueAccountCount.toLocaleString()} | Days: ${updates.workingDays}d`,
      rowId,
      isRerun ? 'analytics_rerun' : 'general',
      isRerun ? 'analytical_rework' : undefined
    );
  };

  // Analyst: Status Change
  const handleAnalystStatusChange = (rowId: string, newStatus: WaterfallRow['status']) => {
    const nowIso = new Date().toISOString();
    setWaterfallRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              status: newStatus,
              analyticsFirstFinalizedAt:
                newStatus === 'ready_for_review' || newStatus === 'signed_off'
                  ? r.analyticsFirstFinalizedAt || nowIso
                  : r.analyticsFirstFinalizedAt,
              analyticsLatestFinalizedAt:
                newStatus === 'ready_for_review' || newStatus === 'signed_off'
                  ? nowIso
                  : r.analyticsLatestFinalizedAt,
            }
          : r
      )
    );
    addAuditLog(
      `Status changed to ${newStatus.replace(/_/g, ' ')}`,
      'Analyst',
      'Alex Morgan',
      `Analyst moved ${rowId} to status: ${newStatus.toUpperCase()}`,
      rowId,
      newStatus === 'ready_for_review' ? 'analytics_finalized' : 'general',
      newStatus === 'ready_for_review' ? 'signoff_milestone' : undefined
    );
  };

  // Analyst: Trigger Email Notification to Project Team
  const handleTriggerEmailNotification = (
    rowId: string,
    emailDetails: {
      recipients: string[];
      subject: string;
      body: string;
      stepTitle?: string;
    }
  ) => {
    const timestamp = new Date().toISOString();
    const existing = waterfallRows.find((r) => r.id === rowId);
    const isRerun = Boolean(
      existing?.analyticsCompletedAt ||
      existing?.status === 'in_analysis' ||
      existing?.status === 'ready_for_review' ||
      (existing?.rerunCount && existing.rerunCount > 0)
    );
    const newRerunCount = isRerun ? (existing?.rerunCount || 0) + 1 : (existing?.rerunCount || 0);

    setWaterfallRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              emailTriggeredAt: timestamp,
              rerunCount: newRerunCount,
              lastEmailRecipients: emailDetails.recipients,
            }
          : r
      )
    );

    addAuditLog(
      isRerun
        ? `Analytics Re-run #${newRerunCount} Dispatched (${rowId})`
        : `Email Notification Triggered to Project Team (${rowId})`,
      'Analyst',
      'Alex Morgan',
      `Analytics alert triggered for ${rowId}. Notification dispatched to Project Team: ${emailDetails.recipients.join(', ')}. Subject: "${emailDetails.subject}"`,
      rowId,
      isRerun ? 'analytics_rerun' : 'analytics_started',
      'analytical_rework'
    );
  };

  // Handle "Refresh Data" across all analytical steps and trigger enterprise email notification
  const handleConfirmRefreshData = (emailPayload: {
    recipients: string[];
    subject: string;
    body: string;
    customNote: string;
  }) => {
    const timestamp = new Date().toISOString();

    // Update all rows: mark refreshed, update timestamp, and record rerun count
    setWaterfallRows((prev) =>
      prev.map((r) => ({
        ...r,
        ...(r.status === 'ready_for_review' || r.status === 'signed_off'
          ? { analyticsCompletedAt: timestamp }
          : {}),
        emailTriggeredAt: timestamp,
        rerunCount: (r.rerunCount || 0) + 1,
        lastEmailRecipients: emailPayload.recipients,
        lastEmailSubject: emailPayload.subject,
        lastEmailBody: emailPayload.body,
        notes: emailPayload.customNote
          ? `${r.notes ? r.notes + '\n' : ''}[Data Refreshed: ${emailPayload.customNote}]`
          : r.notes,
      }))
    );

    addAuditLog(
      'Full Analytical Data Refresh Dispatched',
      userRole === 'frc' ? 'FRC Governance' : 'Analyst',
      userRole === 'frc' ? 'FRC Governance Team' : 'Lead Analyst Team',
      `Enterprise-wide Data Refresh triggered across all ${waterfallRows.length} analytical steps. Notification email dispatched to: ${emailPayload.recipients.join(', ')}.`,
      'all',
      'analytics_rerun',
      'analytical_rework'
    );
  };

  // Reset entire workspace back to clean slate for first-time use / leadership demonstration
  const handleResetToCleanSlate = () => {
    setProjectDetails(BLANK_PROJECT_DETAILS);
    setWaterfallRows([]);
    setAuditLogs([]);
    setWaterfalls([]);
    setActiveWaterfallId('');
    try {
      localStorage.removeItem('gov_project_details');
      localStorage.removeItem('gov_waterfall_rows');
      localStorage.removeItem('gov_audit_logs');
      localStorage.removeItem('gov_waterfalls_list');
      localStorage.removeItem('gov_active_waterfall_id');
      localStorage.setItem('gov_demo_blank_v2', 'true');
    } catch {
      // ignore
    }
  };

  // Initialize Issue Details from Setup Form
  const handleInitializeProjectDetails = (details: ProjectDetails) => {
    setProjectDetails(details);
    const newWfId = `wf-${Date.now().toString().slice(-6)}`;
    const newWf: WaterfallEntity = {
      id: newWfId,
      name: details.waterfallName || 'Initial Waterfall',
      createdAt: new Date().toISOString(),
      rows: [],
      auditLogs: [],
    };
    setWaterfalls([newWf]);
    setActiveWaterfallId(newWfId);
    setWaterfallRows([]);

    try {
      localStorage.setItem('gov_project_details', JSON.stringify(details));
      localStorage.setItem('gov_waterfalls_list', JSON.stringify([newWf]));
      localStorage.setItem('gov_active_waterfall_id', newWfId);
      localStorage.setItem('gov_waterfall_rows', JSON.stringify([]));
    } catch {
      // ignore
    }

    addAuditLog(
      `Issue Details Initialized: ${details.issueTitle}`,
      userRole === 'frc' ? 'FRC Owner' : 'Lead Analyst',
      userRole === 'frc' ? (details.frcName || 'Sarah Jenkins') : (details.analystName || 'Alex Morgan'),
      `Initialized issue governance specification for "${details.issueTitle}" (Issue #: ${details.issueNumber || '—'}). Waterfall workspace "${details.waterfallName}" configured with a blank slate.`,
      undefined,
      'draft_saved',
      'baseline_alignment'
    );
  };

  // Optional: Load sample dataset during leadership demo
  const handleLoadSampleDemo = () => {
    const sampleDetails: ProjectDetails = {
      issueNumber: 'ISS-2026-0891',
      issueTitle: 'Card Lending Overlimit Interest Recalibration & Regulatory Reporting',
      issueDescription: 'Remediation and historical recalculation of account balances and regulatory reporting discrepancies across overlimit consumer credit portfolios.',
      assignedToName: 'Sarah Jenkins',
      assignedToEmail: 'sarah.jenkins@enterprise.bank',
      frcName: 'Sarah Jenkins',
      analystName: 'Alex Morgan',
      waterfallName: 'Q3 Card Portfolio Remediation Waterfall',
      initialDataSourceType: 'Database',
      initialDataSourceDetail: 'EDW_CREDIT_FACILITY_FACT',
    };
    setProjectDetails(sampleDetails);
    setWaterfallRows(DEMO_WATERFALL_ROWS);
    setAuditLogs(DEMO_AUDIT_LOGS);

    const demoWf1Id = 'wf-demo-1';
    const demoWf2Id = 'wf-demo-2';

    const lastDemoStep = DEMO_WATERFALL_ROWS[DEMO_WATERFALL_ROWS.length - 1];
    const wf1FinalPop =
      typeof lastDemoStep?.finalPopulation === 'number'
        ? lastDemoStep.finalPopulation
        : lastDemoStep?.includeCaseCount ?? 84200;

    const demoWf1: WaterfallEntity = {
      id: demoWf1Id,
      name: sampleDetails.waterfallName,
      createdAt: new Date().toISOString(),
      rows: DEMO_WATERFALL_ROWS,
      auditLogs: DEMO_AUDIT_LOGS,
      dataSourceType: 'Database',
      dataSourceDetail: 'EDW_CREDIT_FACILITY_FACT',
      lineage: {
        type: 'independent',
        notes: 'Root enterprise extract from EDW_CREDIT_FACILITY_FACT table.',
      },
    };

    const todayStr = new Date().toISOString().split('T')[0];

    const demoWf2Rows: WaterfallRow[] = [
      {
        id: 'step-wf2-1',
        stepNumber: 1,
        stepTitle: 'Cascaded Inflow: Remediated Overlimit Cohort',
        category: 'Base Population',
        rationale: 'Direct population ingest from terminal qualified step of Waterfall #1.',
        ruleReference: 'LINEAGE-CASCADING-INGEST',
        status: 'step_finalized',
        startingPopulation: wf1FinalPop,
        excludeCount: 0,
        includeCaseCount: wf1FinalPop,
        includeUniqueAccountCount: wf1FinalPop,
        finalPopulation: wf1FinalPop,
        startDate: todayStr,
        endDate: todayStr,
        workingDays: 1,
        assignedAnalyst: 'Alex Morgan',
        frcOwner: 'Sarah Jenkins',
        versions: [],
        attachments: [],
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'step-wf2-2',
        stepNumber: 2,
        stepTitle: 'Exclude Secondary State Jurisdiction Sub-Accounts',
        category: 'Exclusion',
        rationale: 'Accounts registered under excluded state agreements are routed to local regulatory filing.',
        ruleReference: 'REG-STATE-JURIS-44',
        status: 'step_finalized',
        startingPopulation: wf1FinalPop,
        excludeCount: 32400,
        includeCaseCount: 51800,
        includeUniqueAccountCount: 49200,
        finalPopulation: 51800,
        startDate: todayStr,
        endDate: todayStr,
        workingDays: 2,
        assignedAnalyst: 'Alex Morgan',
        frcOwner: 'Sarah Jenkins',
        versions: [],
        attachments: [],
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'step-wf2-3',
        stepNumber: 3,
        stepTitle: 'Exclude Zero-Balance Closed Accounts Prior to 2024',
        category: 'Exclusion',
        rationale: 'Historical accounts with zero ledger delta archived under 7-year retention.',
        ruleReference: 'RETENTION-ZERO-BAL-01',
        status: 'step_finalized',
        startingPopulation: 51800,
        excludeCount: 37000,
        includeCaseCount: 14800,
        includeUniqueAccountCount: 14800,
        finalPopulation: 14800,
        startDate: todayStr,
        endDate: todayStr,
        workingDays: 1,
        assignedAnalyst: 'Alex Morgan',
        frcOwner: 'Sarah Jenkins',
        versions: [],
        attachments: [],
        lastUpdated: new Date().toISOString(),
      },
    ];

    const demoWf2: WaterfallEntity = {
      id: demoWf2Id,
      name: 'High-Risk Sub-Segment Scoping Waterfall',
      createdAt: new Date().toISOString(),
      rows: demoWf2Rows,
      auditLogs: [],
      dataSourceType: 'Database',
      dataSourceDetail: 'EDW_CREDIT_FACILITY_FACT',
      lineage: {
        type: 'cascading',
        parentWaterfallId: demoWf1Id,
        parentWaterfallName: sampleDetails.waterfallName,
        parentStepNumber: DEMO_WATERFALL_ROWS.length,
        parentStepTitle: lastDemoStep?.stepTitle || 'Final Qualified Output',
        parentFinalPopulation: wf1FinalPop,
        notes: `Cascaded starting population of ${wf1FinalPop.toLocaleString()} from Waterfall #1 final step.`,
      },
    };

    const allWfs = [demoWf1, demoWf2];
    setWaterfalls(allWfs);
    setActiveWaterfallId(demoWf1Id);

    // Also update project in portfolio
    const demoProjEntity: ProjectEntity = {
      id: 'proj-demo-main',
      projectDetails: sampleDetails,
      waterfalls: allWfs,
      activeWaterfallId: demoWf1Id,
      createdAt: new Date().toISOString(),
    };

    setProjects((prev) => {
      const filtered = prev.filter((p) => p.projectDetails.issueNumber !== sampleDetails.issueNumber);
      return [demoProjEntity, ...filtered];
    });

    try {
      localStorage.setItem('gov_project_details', JSON.stringify(sampleDetails));
      localStorage.setItem('gov_waterfall_rows', JSON.stringify(DEMO_WATERFALL_ROWS));
      localStorage.setItem('gov_audit_logs', JSON.stringify(DEMO_AUDIT_LOGS));
      localStorage.setItem('gov_waterfalls_list', JSON.stringify(allWfs));
      localStorage.setItem('gov_active_waterfall_id', demoWf1Id);
    } catch {
      // ignore
    }
    addAuditLog(
      'Multi-Waterfall Sample Demo Dataset Loaded',
      userRole === 'frc' ? 'FRC Owner' : 'Analyst',
      userRole === 'frc' ? 'Sarah Jenkins' : 'Alex Morgan',
      'Sample banking portfolio with 2 cascaded waterfalls (Power BI Model View Lineage) populated for demonstration.'
    );
  };

  // Save / Update Project Details & Issue Details
  const handleSaveProjectDetails = (updated: ProjectDetails) => {
    const prev = projectDetails;
    setProjectDetails(updated);
    // Also update active waterfall's name in waterfalls array
    setWaterfalls((prev) =>
      prev.map((wf) => (wf.id === activeWaterfallId ? { ...wf, name: updated.waterfallName } : wf))
    );

    // Track specific differences for audit log capture
    const changes: string[] = [];
    if (prev.issueTitle !== updated.issueTitle) {
      changes.push(`Issue Title: "${updated.issueTitle}"`);
    }
    if ((prev.issueDescription || '') !== (updated.issueDescription || '')) {
      changes.push(`Issue Description updated`);
    }
    if (prev.issueNumber !== updated.issueNumber) {
      changes.push(`Issue#: "${updated.issueNumber}"`);
    }
    if (prev.frcName !== updated.frcName) {
      changes.push(`FRC Name: "${updated.frcName}"`);
    }
    if (prev.analystName !== updated.analystName) {
      changes.push(`Analyst Name: "${updated.analystName}"`);
    }
    if (prev.waterfallName !== updated.waterfallName) {
      changes.push(`Waterfall Name: "${updated.waterfallName}"`);
    }

    const logRole = userRole === 'frc' ? 'FRC Owner' : 'Lead Analyst';
    const logUser = userRole === 'frc' ? (updated.frcName || 'Sarah Jenkins') : (updated.analystName || 'Alex Morgan');
    const logSummary = changes.length > 0
      ? `Issue Details modified: ${changes.join('; ')}`
      : `Issue Details reviewed and saved for ${updated.issueTitle || updated.issueNumber}.`;

    addAuditLog(
      'Issue Details Updated',
      logRole,
      logUser,
      logSummary,
      undefined,
      'draft_saved',
      'scope_change'
    );
  };

  // Switch Active Waterfall
  const handleSelectWaterfall = (waterfallId: string) => {
    // 1. Save current active waterfall rows
    setWaterfalls((prev) =>
      prev.map((wf) => (wf.id === activeWaterfallId ? { ...wf, rows: waterfallRows } : wf))
    );

    // 2. Load the target waterfall
    const targetWf = waterfalls.find((w) => w.id === waterfallId);
    if (targetWf) {
      setActiveWaterfallId(targetWf.id);
      setWaterfallRows(targetWf.rows || []);
      setProjectDetails((prev) => ({
        ...prev,
        waterfallName: targetWf.name,
      }));
      addAuditLog(
        `Switched Active Waterfall to: ${targetWf.name}`,
        userRole === 'frc' ? 'FRC Owner' : 'Analyst',
        userRole === 'frc' ? 'Sarah Jenkins' : 'Alex Morgan',
        `Switched workspace view to waterfall "${targetWf.name}" with ${targetWf.rows?.length || 0} rows.`
      );
    }
  };

  // Option 1: Add New Waterfall (Inherits existing project governance details + Lineage)
  const handleAddWaterfall = (
    waterfallName: string,
    lineage?: WaterfallLineage,
    dataSourceType?: DataSourceType,
    dataSourceDetail?: string
  ) => {
    // Save current active rows first
    const updatedWaterfalls = waterfalls.map((wf) =>
      wf.id === activeWaterfallId ? { ...wf, rows: waterfallRows } : wf
    );

    const parentWf =
      waterfalls.find((w) => w.id === lineage?.parentWaterfallId) ||
      waterfalls[waterfalls.length - 1];
    const parentRows = parentWf?.rows || waterfallRows;
    const parentLastRow = parentRows.length > 0 ? parentRows[parentRows.length - 1] : null;
    const parentFinalPop =
      lineage?.parentFinalPopulation ??
      (parentLastRow && typeof parentLastRow.finalPopulation === 'number'
        ? parentLastRow.finalPopulation
        : undefined);

    let initialRows: WaterfallRow[] = [];
    if (lineage?.type === 'cascading' && typeof parentFinalPop === 'number') {
      const step1Id = `step-${Date.now().toString().slice(-4)}`;
      const todayStr = new Date().toISOString().split('T')[0];
      initialRows = [
        {
          id: step1Id,
          stepNumber: 1,
          stepTitle: `Cascaded Inflow from ${parentWf?.name || 'Upstream Waterfall'}`,
          category: 'Base Population',
          rationale: `Starting population derived directly from final qualified output of ${parentWf?.name || 'upstream waterfall'}${lineage.parentStepTitle ? ` (Step ${lineage.parentStepNumber || parentRows.length}: ${lineage.parentStepTitle})` : ''}.`,
          ruleReference: 'LINEAGE-CASCADING-START',
          status: 'step_finalized',
          startingPopulation: parentFinalPop,
          excludeCount: 0,
          includeCaseCount: parentFinalPop,
          includeUniqueAccountCount: parentFinalPop,
          finalPopulation: parentFinalPop,
          startDate: todayStr,
          endDate: todayStr,
          workingDays: 1,
          assignedAnalyst: 'Alex Morgan',
          frcOwner: 'Sarah Jenkins',
          versions: [
            {
              versionNumber: 1,
              timestamp: new Date().toISOString(),
              author: currentUser?.name || 'Sarah Jenkins',
              role: 'FRC Owner',
              rationale: `Direct analytical handoff from ${parentWf?.name || 'prior step'}.`,
              changeSummary: 'Inherited terminal cohort population.',
              excludeCount: 0,
              includeCaseCount: parentFinalPop,
              includeUniqueAccountCount: parentFinalPop,
              startDate: todayStr,
              endDate: todayStr,
              workingDays: 1,
            },
          ],
          attachments: [],
          lastUpdated: new Date().toISOString(),
        },
      ];
    }

    const newWaterfallId = `wf-${Date.now().toString().slice(-6)}`;
    const newWf: WaterfallEntity = {
      id: newWaterfallId,
      projectId: activeProjectId || undefined,
      name: waterfallName,
      createdAt: new Date().toISOString(),
      rows: initialRows,
      auditLogs: [],
      dataSourceType:
        dataSourceType ||
        (lineage?.type === 'shared_source' ? parentWf?.dataSourceType : 'Database'),
      dataSourceDetail: dataSourceDetail || parentWf?.dataSourceDetail,
      lineage,
    };

    const newWaterfallsList = [...updatedWaterfalls, newWf];
    setWaterfalls(newWaterfallsList);
    setActiveWaterfallId(newWaterfallId);
    setWaterfallRows(initialRows);
    setProjectDetails((prev) => ({
      ...prev,
      waterfallName,
    }));

    if (activeProjectId) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === activeProjectId
            ? { ...p, waterfalls: newWaterfallsList, activeWaterfallId: newWaterfallId }
            : p
        )
      );
    }

    addAuditLog(
      `New Waterfall Added: ${waterfallName}`,
      userRole === 'frc' ? 'FRC Owner' : 'Analyst',
      userRole === 'frc' ? 'Sarah Jenkins' : 'Alex Morgan',
      `Created additional waterfall "${waterfallName}" (Lineage: ${lineage?.type || 'Standard'}) under project "${projectDetails.issueTitle}" (Issue# ${projectDetails.issueNumber}). All project governance details inherited.`
    );
  };

  // Option 2: Create Brand New Project (Fresh Issue#, Title, leads, and initial waterfall)
  const handleCreateNewProject = (newProject: ProjectDetails) => {
    const newWaterfallId = `wf-${Date.now().toString().slice(-6)}`;
    const newProjId = `proj-${Date.now().toString().slice(-6)}`;
    const newWf: WaterfallEntity = {
      id: newWaterfallId,
      projectId: newProjId,
      name: newProject.waterfallName,
      createdAt: new Date().toISOString(),
      rows: [],
      auditLogs: [],
      dataSourceType: newProject.initialDataSourceType || 'Database',
      dataSourceDetail:
        newProject.initialDataSourceDetail ||
        (newProject.initialDataSourceType === 'Database'
          ? 'Enterprise Database / EDW'
          : 'Flat File provided by stakeholder'),
    };

    const newProjEntity: ProjectEntity = {
      id: newProjId,
      projectDetails: newProject,
      waterfalls: [newWf],
      activeWaterfallId: newWaterfallId,
      createdAt: new Date().toISOString(),
    };

    setProjects((prev) => [newProjEntity, ...prev]);
    setActiveProjectId(newProjId);
    setProjectDetails(newProject);
    setWaterfalls([newWf]);
    setActiveWaterfallId(newWaterfallId);
    setWaterfallRows([]);
    setAuditLogs([]);

    try {
      localStorage.setItem('gov_project_details', JSON.stringify(newProject));
      localStorage.setItem('gov_waterfalls_list', JSON.stringify([newWf]));
      localStorage.setItem('gov_active_waterfall_id', newWaterfallId);
      localStorage.setItem('gov_waterfall_rows', JSON.stringify([]));
      localStorage.setItem('gov_audit_logs', JSON.stringify([]));
    } catch {
      // ignore
    }

    addAuditLog(
      `Brand New Project Created: ${newProject.issueTitle}`,
      'FRC Owner',
      newProject.frcName || 'FRC Owner',
      `Initialized fresh project specification: Issue# "${newProject.issueNumber || '—'}", Waterfall: "${newProject.waterfallName}", Data Source: "${newProject.initialDataSourceType || 'Database'}".`
    );
  };

  // Deliverables Auditor Calculation
  const report = useMemo(() => {
    return performAudit(files, deliverables, folderName);
  }, [files, deliverables, folderName]);

  // Handle uploaded files from input or drag-and-drop
  const handleFilesIngested = useCallback((fileList: FileList) => {
    const scanned: ScannedFile[] = [];
    let detectedRootFolder = '';

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const relPath = file.webkitRelativePath || file.name;

      if (!detectedRootFolder && file.webkitRelativePath) {
        const parts = file.webkitRelativePath.split('/');
        if (parts.length > 1) {
          detectedRootFolder = parts[0];
        }
      }

      const ext = file.name.includes('.')
        ? file.name.split('.').pop()?.toLowerCase() || ''
        : '';

      scanned.push({
        id: `scanned-${Date.now()}-${i}`,
        name: file.name,
        path: relPath,
        size: file.size,
        lastModified: file.lastModified || Date.now(),
        extension: ext,
      });
    }

    if (scanned.length > 0) {
      setFiles(scanned);
      setIsUsingSample(false);
      setFolderName(detectedRootFolder ? `Waterfall/${detectedRootFolder}` : 'Uploaded_Waterfall_Folder');
    }
  }, []);

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesIngested(e.dataTransfer.files);
    }
  };

  // Restore sample project
  const handleLoadSample = () => {
    setFiles(SAMPLE_WATERFALL_FILES);
    setFolderName('H:\\My Drive\\Waterfall');
    setIsUsingSample(true);
    setSelectedPhase('all');
    setStatusFilter('all');
  };

  // Directory scaffolding handler
  const handleDirectoryScaffoldSuccess = (createdPaths: string[]) => {
    const newScanned: ScannedFile[] = createdPaths.map((p, idx) => {
      const parts = p.split('/');
      const fileName = parts[parts.length - 1];
      const ext = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() || '' : '';
      return {
        id: `scaffolded-${Date.now()}-${idx}`,
        name: fileName,
        path: `${targetPath}\\${p.replace(/\//g, '\\')}`,
        size: 2048,
        lastModified: Date.now(),
        extension: ext,
      };
    });

    setFiles((prev) => [...newScanned, ...prev]);
    addAuditLog(
      'Files scaffolded to Google Drive',
      userRole === 'frc' ? 'FRC Owner' : 'Analyst',
      userRole === 'frc' ? 'Sarah Jenkins' : 'Alex Morgan',
      `Scaffolded ${createdPaths.length} deliverable templates to H:\\My Drive\\Waterfall.`
    );
  };

  const handleAttachSingleFile = (deliverableId: string, file: File) => {
    const ext = file.name.includes('.')
      ? file.name.split('.').pop()?.toLowerCase() || ''
      : '';

    const newScannedFile: ScannedFile = {
      id: `attached-${Date.now()}`,
      name: file.name,
      path: `${folderName}/${file.name}`,
      size: file.size,
      lastModified: file.lastModified || Date.now(),
      extension: ext,
      matchedDeliverableId: deliverableId,
    };

    setFiles((prev) => [newScannedFile, ...prev]);

    setInspectedItem((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'up-to-date',
        matchedFile: newScannedFile,
        reason: `Manually verified & uploaded file: ${newScannedFile.name}`,
        daysOld: 0,
      };
    });
  };

  const handleSelectUnmatchedFile = (file: ScannedFile) => {
    alert(
      `File: ${file.name}\nPath: ${file.path}\nSize: ${(file.size / 1024).toFixed(
        1
      )} KB\n\nThis file is not matched to standard Waterfall specifications. You can add a custom deliverable pattern in 'Audit Rules' to track it.`
    );
  };

  // Portfolio Page Handlers
  const handleOpenProject = (projectId: string, waterfallId?: string) => {
    const targetProject = projects.find((p) => p.id === projectId);
    if (!targetProject) return;

    const targetWfId =
      waterfallId || targetProject.activeWaterfallId || targetProject.waterfalls[0]?.id || '';
    const targetWf =
      targetProject.waterfalls.find((w) => w.id === targetWfId) || targetProject.waterfalls[0];

    setActiveProjectId(projectId);
    setProjectDetails(targetProject.projectDetails);
    setWaterfalls(targetProject.waterfalls || []);
    setActiveWaterfallId(targetWfId);
    setWaterfallRows(targetWf?.rows || []);
    setAuditLogs(targetWf?.auditLogs || []);
  };

  const handleNavigateToPortfolio = () => {
    if (activeProjectId) {
      setProjects((prev) =>
        prev.map((proj) => {
          if (proj.id !== activeProjectId) return proj;
          const updatedWfs = (proj.waterfalls || []).map((wf) =>
            wf.id === activeWaterfallId ? { ...wf, rows: waterfallRows, auditLogs } : wf
          );
          return {
            ...proj,
            projectDetails,
            waterfalls: updatedWfs,
            activeWaterfallId,
          };
        })
      );
    }
    setActiveProjectId(null);
  };

  const handleCreateProjectFromPortfolio = (details: ProjectDetails) => {
    const newProjId = `proj-${Date.now().toString().slice(-6)}`;
    const newWfId = `wf-${Date.now().toString().slice(-6)}`;
    const newWf: WaterfallEntity = {
      id: newWfId,
      projectId: newProjId,
      name: details.waterfallName || 'Initial Scoping Waterfall',
      createdAt: new Date().toISOString(),
      rows: [],
      auditLogs: [],
    };
    const newProject: ProjectEntity = {
      id: newProjId,
      projectDetails: details,
      waterfalls: [newWf],
      activeWaterfallId: newWfId,
      createdAt: new Date().toISOString(),
    };

    setProjects((prev) => [newProject, ...prev]);

    setActiveProjectId(newProjId);
    setProjectDetails(details);
    setWaterfalls([newWf]);
    setActiveWaterfallId(newWfId);
    setWaterfallRows([]);
    setAuditLogs([]);

    addAuditLog(
      `Project Created: ${details.issueTitle}`,
      userRole === 'frc' ? 'FRC Owner' : 'Analyst',
      userRole === 'frc' ? (details.frcName || 'Sarah Jenkins') : (details.analystName || 'Alex Morgan'),
      `Configured project "${details.issueTitle}" (Issue# ${details.issueNumber || 'ISS-1001'}) with initial waterfall "${details.waterfallName}". Assigned to: ${details.assignedToName || details.frcName || 'Sarah Jenkins'}.`
    );
  };

  const handleAddWaterfallToProjectInPortfolio = (
    projectId: string,
    waterfallName: string,
    lineage?: WaterfallLineage,
    dataSourceType?: DataSourceType,
    dataSourceDetail?: string
  ) => {
    const targetProject = projects.find((p) => p.id === projectId);
    const parentWf =
      targetProject?.waterfalls?.find((w) => w.id === lineage?.parentWaterfallId) ||
      targetProject?.waterfalls?.[targetProject.waterfalls.length - 1];
    const parentRows = parentWf?.rows || [];
    const parentLastRow = parentRows.length > 0 ? parentRows[parentRows.length - 1] : null;
    const parentFinalPop =
      lineage?.parentFinalPopulation ??
      (parentLastRow && typeof parentLastRow.finalPopulation === 'number'
        ? parentLastRow.finalPopulation
        : undefined);

    let initialRows: WaterfallRow[] = [];
    if (lineage?.type === 'cascading' && typeof parentFinalPop === 'number') {
      const step1Id = `step-${Date.now().toString().slice(-4)}`;
      const todayStr = new Date().toISOString().split('T')[0];
      initialRows = [
        {
          id: step1Id,
          stepNumber: 1,
          stepTitle: `Cascaded Inflow from ${parentWf?.name || 'Upstream Waterfall'}`,
          category: 'Base Population',
          rationale: `Starting population derived directly from final qualified output of ${parentWf?.name || 'upstream waterfall'}${lineage.parentStepTitle ? ` (Step ${lineage.parentStepNumber || parentRows.length}: ${lineage.parentStepTitle})` : ''}.`,
          ruleReference: 'LINEAGE-CASCADING-START',
          status: 'step_finalized',
          startingPopulation: parentFinalPop,
          excludeCount: 0,
          includeCaseCount: parentFinalPop,
          includeUniqueAccountCount: parentFinalPop,
          finalPopulation: parentFinalPop,
          startDate: todayStr,
          endDate: todayStr,
          workingDays: 1,
          assignedAnalyst: 'Alex Morgan',
          frcOwner: 'Sarah Jenkins',
          versions: [
            {
              versionNumber: 1,
              timestamp: new Date().toISOString(),
              author: currentUser?.name || 'Sarah Jenkins',
              role: 'FRC Owner',
              rationale: `Direct analytical handoff from ${parentWf?.name || 'prior step'}.`,
              changeSummary: 'Inherited terminal cohort population.',
              excludeCount: 0,
              includeCaseCount: parentFinalPop,
              includeUniqueAccountCount: parentFinalPop,
              startDate: todayStr,
              endDate: todayStr,
              workingDays: 1,
            },
          ],
          attachments: [],
          lastUpdated: new Date().toISOString(),
        },
      ];
    }

    const newWfId = `wf-${Date.now().toString().slice(-6)}`;
    const newWf: WaterfallEntity = {
      id: newWfId,
      projectId,
      name: waterfallName,
      createdAt: new Date().toISOString(),
      rows: initialRows,
      auditLogs: [],
      dataSourceType:
        dataSourceType ||
        (lineage?.type === 'shared_source' ? parentWf?.dataSourceType : 'Database'),
      dataSourceDetail: dataSourceDetail || parentWf?.dataSourceDetail,
      lineage,
    };

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          waterfalls: [...p.waterfalls, newWf],
          activeWaterfallId: newWfId,
        };
      })
    );

    if (activeProjectId === projectId) {
      setWaterfalls((prev) => [...prev, newWf]);
      setActiveWaterfallId(newWfId);
      setWaterfallRows(initialRows);
    }
  };

  const handleDeleteProjectFromPortfolio = (projectId: string) => {
    const target = projects.find((p) => p.id === projectId);
    if (!target) return;
    if (
      !confirm(
        `Are you sure you want to delete project "${target.projectDetails.issueTitle}" (Issue #${target.projectDetails.issueNumber || '—'})?`
      )
    ) {
      return;
    }
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (activeProjectId === projectId) {
      setActiveProjectId(null);
    }
  };

  const handleResetPortfolioToBlankSlate = () => {
    if (!confirm('Reset portfolio to a completely blank slate (0 projects) for clean verification?')) {
      return;
    }
    setProjects([]);
    setActiveProjectId(null);
    setProjectDetails(BLANK_PROJECT_DETAILS);
    setWaterfalls([]);
    setWaterfallRows([]);
    setAuditLogs([]);
    try {
      localStorage.removeItem('gov_projects_portfolio_v4');
      localStorage.removeItem('gov_active_project_id_v4');
      localStorage.removeItem('egrc_projects_portfolio_v3');
      localStorage.removeItem('egrc_active_project_id_v3');
    } catch {
      // ignore
    }
  };

  const handleLoadSamplePortfolio = () => {
    setProjects(SAMPLE_PORTFOLIO_PROJECTS);
    try {
      localStorage.setItem('gov_projects_portfolio_v4', JSON.stringify(SAMPLE_PORTFOLIO_PROJECTS));
    } catch {
      // ignore
    }
  };

  if (!currentUser) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // If user is authenticated and not inside a specific project workspace, show Project Portfolio Landing Page
  if (!activeProjectId) {
    return (
      <ProjectPortfolioLanding
        currentUser={currentUser}
        projects={projects}
        onOpenProject={handleOpenProject}
        onCreateProject={handleCreateProjectFromPortfolio}
        onAddWaterfallToProject={handleAddWaterfallToProjectInPortfolio}
        onDeleteProject={handleDeleteProjectFromPortfolio}
        onResetToCleanSlate={handleResetPortfolioToBlankSlate}
        onLoadSamplePortfolio={handleLoadSamplePortfolio}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div
      id="waterfall-app-root"
      className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans relative antialiased selection:bg-stone-900 selection:text-white"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div
          id="drop-zone-overlay"
          className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-white border-4 border-dashed border-emerald-400 m-4 rounded-3xl"
        >
          <UploadCloud className="w-16 h-16 text-emerald-400 animate-bounce mb-4" />
          <h3 className="text-xl font-bold">Drop your Waterfall folder here</h3>
          <p className="text-sm text-stone-300 mt-1">
            Instantly inspect all project deliverables, phase readiness, and outdated assets
          </p>
        </div>
      )}

      {/* Top Header with Persistent Role Toggle & Audit Log Drawer Trigger */}
      <Header
        report={report}
        userRole={userRole}
        onRoleChange={handleRoleChange}
        onOpenAuditLogs={() => setIsAuditLogOpen(true)}
        auditLogsCount={auditLogs.length}
        onFilesSelected={handleFilesIngested}
        onLoadSample={handleLoadSample}
        onOpenRules={() => setShowRulesModal(true)}
        onOpenExport={() => setShowExportModal(true)}
        onOpenScaffold={() => setShowScaffoldModal(true)}
        isUsingSample={isUsingSample}
        folderName={folderName}
        onResetToCleanSlate={handleResetToCleanSlate}
        onLoadSampleDemo={handleLoadSampleDemo}
        waterfallRowsCount={waterfallRows.length}
        onRefreshData={() => setShowRefreshModal(true)}
        onExportExcel={() => {
          // Sync active waterfall rows in current waterfalls list before exporting
          const currentWaterfalls = waterfalls.map((wf) =>
            wf.id === activeWaterfallId ? { ...wf, rows: waterfallRows } : wf
          );
          exportAnalystViewToExcel(
            waterfallRows,
            undefined,
            'Waterfall_Analyst_Requirements.xlsx',
            projectDetails,
            currentWaterfalls
          );
        }}
        onOpenAddWaterfall={() => setIsAddWaterfallOpen(true)}
        onOpenCreateProject={() => setIsCreateProjectOpen(true)}
        waterfalls={waterfalls}
        activeWaterfallId={activeWaterfallId}
        onSelectWaterfall={handleSelectWaterfall}
        isConfigured={isIssueDetailsConfigured}
        currentUser={currentUser}
        onLogout={handleLogout}
        onNavigateToPortfolio={handleNavigateToPortfolio}
        isReadOnly={isReadOnly}
        activeProjectDetails={{
          issueNumber: projectDetails.issueNumber || '',
          issueTitle: projectDetails.issueTitle,
        }}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {!isIssueDetailsConfigured ? (
          <IssueDetailsSetup
            onSubmit={handleInitializeProjectDetails}
          />
        ) : (
          <>
            {/* PRIMARY VIEW RENDERING BASED ON ROLE */}
            {userRole === 'frc' ? (
              <FRCWorkspace
                rows={waterfallRows}
                auditLogs={auditLogs}
                projectDetails={projectDetails}
                waterfalls={waterfalls}
                activeWaterfallId={activeWaterfallId}
                onSelectWaterfall={handleSelectWaterfall}
                onOpenAddWaterfall={() => setIsAddWaterfallOpen(true)}
                onOpenCreateProject={() => setIsCreateProjectOpen(true)}
                onOpenAuditLogs={() => setIsAuditLogOpen(true)}
                onResetToCleanSlate={handleResetToCleanSlate}
                onSaveProjectDetails={handleSaveProjectDetails}
                onAddRow={handleAddStep}
                onUpdateRow={handleUpdateRow}
                onSubmitToAnalyst={handleSubmitToAnalyst}
                onSignOffRow={handleSignOffRow}
                onFinalizeRequirement={handleFinalizeRequirement}
                onStartModification={handleStartModification}
                onSubmitModifiedRequirement={handleSubmitModifiedRequirement}
                onTriggerEmailNotification={handleTriggerEmailNotification}
                onDeleteRow={handleDeleteStep}
                onAddAttachmentsToStep={handleAddAttachmentsToStep}
                onRemoveAttachmentFromStep={handleRemoveAttachmentFromStep}
                isReadOnly={isReadOnly}
              />
            ) : (
              <AnalystWorkspace
                rows={waterfallRows}
                auditLogs={auditLogs}
                projectDetails={projectDetails}
                waterfalls={waterfalls}
                activeWaterfallId={activeWaterfallId}
                onSelectWaterfall={handleSelectWaterfall}
                onOpenAddWaterfall={() => setIsAddWaterfallOpen(true)}
                onOpenCreateProject={() => setIsCreateProjectOpen(true)}
                onOpenAuditLogs={() => setIsAuditLogOpen(true)}
                onResetToCleanSlate={handleResetToCleanSlate}
                onSaveProjectDetails={handleSaveProjectDetails}
                activeTab={analystTab}
                onTabChange={setAnalystTab}
                onUpdateCountsAndSchedule={handleUpdateCountsAndSchedule}
                onStatusChange={handleAnalystStatusChange}
                onAddAttachmentsToStep={handleAddAttachmentsToStep}
                onRemoveAttachmentFromStep={handleRemoveAttachmentFromStep}
                onTriggerEmailNotification={handleTriggerEmailNotification}
                isReadOnly={isReadOnly}
              />
            )}

            {/* SECONDARY VIEW: DELIVERABLES & FILE GATE AUDITOR (Collapsible or Expandable) */}
            {showFileGatesAuditor && (
              <div className="border-t-2 border-stone-300 pt-6 space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-stone-700" />
                      Waterfall Deliverables &amp; Phase Gates Auditor
                    </h3>
                    <p className="text-xs text-stone-500">
                      Inspect underlying physical BRD, SRS, code freezes, UAT test logs, and release runbooks in{' '}
                      <code className="font-mono text-stone-800">{targetPath}</code>
                    </p>
                  </div>
                </div>

                {/* Executive Summary Cards */}
                <ExecutiveSummary
                  report={report}
                  onFilterStatus={(st) => setStatusFilter(st)}
                  onOpenScaffold={() => setShowScaffoldModal(true)}
                  targetPath={targetPath}
                />

                {/* Sequential Phase Gates Pipeline */}
                <PhasePipeline
                  phases={report.phases}
                  selectedPhase={selectedPhase}
                  onSelectPhase={(phase) => setSelectedPhase(phase)}
                />

                {/* Detailed Deliverables Audit Table */}
                <DeliverablesTable
                  results={report.results}
                  unmatchedFiles={report.unmatchedFiles}
                  activePhase={selectedPhase}
                  activeStatusFilter={statusFilter}
                  onStatusFilterChange={(st) => setStatusFilter(st)}
                  onSelectDeliverable={(item) => setInspectedItem(item)}
                  onSelectUnmatchedFile={handleSelectUnmatchedFile}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-700">Traceable Requirements Waterfall</span>
            <span>•</span>
            <span>Dual-Persona Governance &amp; Quantitative Flow Control</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Drive Parity: H:\My Drive\Waterfall
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-stone-600">
              <FolderOpen className="w-3.5 h-3.5 text-stone-400" />
              {isIssueDetailsConfigured ? (
                <>
                  Role: <strong className="uppercase font-bold">{userRole}</strong>
                </>
              ) : (
                <span>
                  Status: <strong className="font-semibold text-stone-700">Setup &amp; Intake</strong>
                </span>
              )}
            </span>
          </div>
        </div>
      </footer>

      {/* Consolidated Real-Time Activity Audit Log Drawer */}
      <AuditLogDrawer
        isOpen={isAuditLogOpen}
        onClose={() => setIsAuditLogOpen(false)}
        logs={auditLogs}
      />

      {/* Inspect / Upload Deliverable Modal */}
      {inspectedItem && (
        <DeliverableModal
          item={inspectedItem}
          onClose={() => setInspectedItem(null)}
          onAttachFile={handleAttachSingleFile}
        />
      )}

      {/* Export Report Modal */}
      {showExportModal && (
        <ReportExportModal
          report={report}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* Custom Rules Editor Modal */}
      {showRulesModal && (
        <RulesEditorModal
          deliverables={deliverables}
          onSave={(newRules) => setDeliverables(newRules)}
          onReset={() => setDeliverables(DEFAULT_DELIVERABLES)}
          onClose={() => setShowRulesModal(false)}
        />
      )}

      {/* Scaffold Missing Files Modal */}
      {showScaffoldModal && (
        <ScaffoldModal
          missingItems={report.results.filter((r) => r.status === 'missing')}
          targetPath={targetPath}
          projectName="Waterfall Project Alpha"
          onClose={() => setShowScaffoldModal(false)}
          onDirectoryScaffoldSuccess={(paths) => handleDirectoryScaffoldSuccess(paths)}
        />
      )}

      {/* Refresh All Analytical Steps Email Dispatch Modal */}
      <RefreshDataModal
        rows={waterfallRows}
        isOpen={showRefreshModal}
        onClose={() => setShowRefreshModal(false)}
        onConfirmRefresh={handleConfirmRefreshData}
      />

      {/* Option 1: Add Waterfall Modal with Lineage & Data Source */}
      <AddWaterfallModal
        isOpen={isAddWaterfallOpen}
        onClose={() => setIsAddWaterfallOpen(false)}
        currentProject={projectDetails}
        existingWaterfalls={waterfalls}
        onAddWaterfall={handleAddWaterfall}
      />

      {/* Option 2: Create Brand New Project Modal (prompts for full project spec + waterfall) */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onCreateProject={handleCreateNewProject}
      />
    </div>
  );
}
