export type PhaseId =
  | 'requirements'
  | 'design'
  | 'implementation'
  | 'testing'
  | 'deployment'
  | 'maintenance';

export type DeliverableStatus =
  | 'up-to-date'
  | 'outdated'
  | 'missing'
  | 'under-review'
  | 'unmatched';

export interface ExpectedDeliverable {
  id: string;
  phaseId: PhaseId;
  name: string;
  code: string;
  description: string;
  patterns: string[]; // keywords or regex to match file names
  isMandatory: boolean;
  maxAgeDays?: number; // deliverable shouldn't be older than X days, or relative
  dependsOn?: string[]; // IDs of preceding deliverables (e.g. Design depends on SRS)
}

export interface ScannedFile {
  id: string;
  name: string;
  path: string;
  size: number;
  lastModified: number; // timestamp
  extension: string;
  matchedDeliverableId?: string;
  contentSnippet?: string;
}

export interface DeliverableAuditResult {
  deliverable: ExpectedDeliverable;
  status: DeliverableStatus;
  matchedFile?: ScannedFile;
  reason: string;
  daysOld?: number;
  dependencyStatus?: {
    isSatisfied: boolean;
    note?: string;
  };
}

export interface PhaseAuditSummary {
  phaseId: PhaseId;
  phaseName: string;
  phaseNumber: number;
  totalRequired: number;
  presentCount: number;
  missingCount: number;
  outdatedCount: number;
  gatePassed: boolean;
  blockers: string[];
}

export interface ProjectAuditReport {
  projectName: string;
  scanDate: number;
  overallScore: number;
  overallGateStatus: 'CLEARED' | 'WARNING' | 'BLOCKED';
  totalDeliverables: number;
  presentDeliverables: number;
  missingDeliverables: number;
  outdatedDeliverables: number;
  phases: PhaseAuditSummary[];
  results: DeliverableAuditResult[];
  unmatchedFiles: ScannedFile[];
  totalFilesScanned: number;
}

// eGRC Dual-Persona & Waterfall Row Types
export type UserRole = 'frc' | 'analyst';

export type AnalystTab = 'table' | 'start' | 'complete' | 'finalize' | 'evolving' | 'dispute_logs';

export type WaterfallRowStatus =
  | 'draft'
  | 'submitted'
  | 'in_modification'
  | 'step_finalized'
  | 'in_analysis'
  | 'ready_for_review'
  | 'signed_off';

export interface WaterfallStepVersion {
  versionNumber: number;
  timestamp: string;
  author: string;
  role: 'FRC Owner' | 'Analyst';
  rationale: string;
  changeSummary: string;
  excludeCount: number;
  includeCaseCount: number;
  includeUniqueAccountCount: number;
  startDate: string;
  endDate: string;
  workingDays: number;
}

export type WaterfallCategory =
  | 'Flag accounts/cases'
  | 'Exclude'
  | 'Starting Population'
  | 'Base Population'
  | 'Exclusion'
  | 'Inclusion'
  | 'Sampling'
  | 'Regulatory';

export interface WaterfallRow {
  id: string;
  stepNumber: number;
  stepTitle: string;
  category: WaterfallCategory;
  ruleReference: string;
  rationale: string;
  businessRequirements?: string;
  datasetLocation?: string;
  status: WaterfallRowStatus;
  excludeCount: number;
  includeCaseCount: number;
  includeUniqueAccountCount: number;
  startDate: string;
  endDate: string;
  workingDays: number;
  assignedAnalyst: string;
  frcOwner: string;
  versions: WaterfallStepVersion[];
  lastUpdated: string;
  notes?: string;
  analyticsCompletedAt?: string;
  emailTriggeredAt?: string;
  lastEmailRecipients?: string[];
  lastEmailSubject?: string;
  lastEmailBody?: string;
  // Timeline Journey & Dispute Resolution fields
  rerunCount?: number;
  refinalizeCount?: number;
  requirementFinalizedAt?: string;
  requirementLatestFinalizedAt?: string;
  analyticsFirstFinalizedAt?: string;
  analyticsLatestFinalizedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  role: 'FRC Owner' | 'Analyst' | 'System';
  action: string;
  rowId?: string;
  stepTitle?: string;
  details: string;
  eventType?:
    | 'requirement_finalized'
    | 'requirement_refinalized'
    | 'analytics_started'
    | 'analytics_rerun'
    | 'analytics_finalized'
    | 'modification_started'
    | 'draft_saved'
    | 'sign_off'
    | 'general';
  disputeCategory?: 'scope_change' | 'analytical_rework' | 'signoff_milestone' | 'baseline_alignment';
}

export interface ProjectDetails {
  coeNumber: string;
  egrcNumber: string;
  issueTitle: string;
  issueDescription?: string;
  frcName: string;
  analystName: string;
  waterfallName: string;
}

export interface WaterfallEntity {
  id: string;
  projectId?: string;
  name: string;
  createdAt: string;
  rows: WaterfallRow[];
  auditLogs?: AuditLogEntry[];
}

export interface ProjectEntity {
  id: string;
  projectDetails: ProjectDetails;
  waterfalls: WaterfallEntity[];
  activeWaterfallId: string;
  createdAt: string;
}

