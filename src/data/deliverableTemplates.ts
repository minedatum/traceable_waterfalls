export interface ScaffoldTemplate {
  fileName: string;
  subfolder: string;
  title: string;
  generateContent: (projectName: string, authorName: string) => string;
}

export const SCAFFOLD_TEMPLATES: Record<string, ScaffoldTemplate> = {
  'del-brd': {
    fileName: 'Business_Requirements_Document_BRD.md',
    subfolder: '01-Requirements',
    title: 'Business Requirements Document (BRD)',
    generateContent: (projectName, author) => `# ${projectName} - Business Requirements Document (BRD)

**Document Version:** 1.0  
**Status:** Baseline Draft  
**Author:** ${author}  
**Date:** ${new Date().toISOString().split('T')[0]}  
**Target Gate:** Waterfall Phase 1 (Requirements)

---

## 1. Executive Summary & Business Objectives
Provide a concise overview of the problem statement, market opportunity, and high-level project goals.
- **Objective 1:** Deliver core business capabilities to stakeholders.
- **Objective 2:** Ensure compliance with enterprise security and governance.

## 2. In-Scope vs. Out-of-Scope
### 2.1 In-Scope
- Core functional workflow integration.
- Automated data sync and verification.
### 2.2 Out-of-Scope
- Legacy database migration (slated for Phase 2.0).

## 3. Stakeholder & User Personas
| Stakeholder Role | Responsibilities | Key Needs |
|---|---|---|
| Project Sponsor | Executive Sign-off | Timely milestone delivery |
| Engineering Lead | System Delivery | Clear specifications |
| End User | Daily Operations | Intuitive workflow |

## 4. Formal Stakeholder Sign-Off Matrix
| Name | Title | Decision | Date | Signature |
|---|---|---|---|---|
| Project Sponsor | VP Technology | [ ] Approved [ ] Rejected | _________ | _________________ |
| Business Lead | Product Director | [ ] Approved [ ] Rejected | _________ | _________________ |
`,
  },

  'del-srs': {
    fileName: 'Software_Requirements_Specification_SRS.md',
    subfolder: '01-Requirements',
    title: 'Software Requirements Specification (SRS)',
    generateContent: (projectName, author) => `# ${projectName} - Software Requirements Specification (SRS)

**Standard:** IEEE 830 compliant  
**Version:** 1.0  
**Author:** ${author}  
**Date:** ${new Date().toISOString().split('T')[0]}

---

## 1. System Overview
Describes the functional and technical requirements for the ${projectName} system.

## 2. Functional Requirements (FR)
- **FR-001:** The system shall authenticate authorized users and grant role-based privileges.
- **FR-002:** The system shall audit project deliverables against baseline Waterfall milestones.
- **FR-003:** The system shall generate auditable compliance logs and exportable reports.

## 3. Non-Functional Requirements (NFR)
- **NFR-001 (Performance):** Page and query response times shall be < 1.5s under 95th percentile load.
- **NFR-002 (Availability):** 99.9% uptime target during operational hours.
- **NFR-003 (Security):** All data in transit shall use TLS 1.3 encryption.

## 4. Requirement Verification & Acceptance Criteria
Every functional requirement must have a corresponding verification test case identified in the Traceability Matrix (RTM).
`,
  },

  'del-traceability': {
    fileName: 'Requirements_Traceability_Matrix_RTM.md',
    subfolder: '01-Requirements',
    title: 'Requirements Traceability Matrix (RTM)',
    generateContent: (projectName, author) => `# ${projectName} - Requirements Traceability Matrix (RTM)

**Version:** 1.0  
**Author:** ${author}  
**Date:** ${new Date().toISOString().split('T')[0]}

---

| Req ID | Requirement Description | Design Spec Ref (HLD/LLD) | Test Case ID | Verification Status |
|---|---|---|---|---|
| REQ-01 | User Authentication & RBAC | SEC-ARCH-01 | TC-AUTH-101 | Verified |
| REQ-02 | Folder Structure Ingestion | SYS-ARCH-02 | TC-INGEST-201 | In Progress |
| REQ-03 | Gate Clearance Audit Engine | MOD-AUDIT-03 | TC-AUDIT-301 | Pending UAT |
| REQ-04 | Compliance Export (MD/PDF) | EXP-MOD-04 | TC-EXP-401 | Verified |
`,
  },

  'del-req-signoff': {
    fileName: 'Stakeholder_Scope_Signoff_Baseline.md',
    subfolder: '01-Requirements',
    title: 'Stakeholder Scope Sign-off Baseline',
    generateContent: (projectName, author) => `# ${projectName} - Stakeholder Scope Sign-off & Baseline

**Milestone:** Phase 1 (Requirements & Scope Baseline Freeze)  
**Author:** ${author}  
**Date:** ${new Date().toISOString().split('T')[0]}

---

## Scope Freeze Declaration
This document formally acknowledges that the Business Requirements Document (BRD) and Software Requirements Specification (SRS) for **${projectName}** have been reviewed and baselined. Any future changes require an approved Change Request (CR) through the Architecture Review Board.

## Sign-off Approvals
| Stakeholder | Department | Approval Status | Date |
|---|---|---|---|
| Business Lead | Product Strategy | [X] APPROVED | ${new Date().toISOString().split('T')[0]} |
| Technical Lead | Software Architecture | [X] APPROVED | ${new Date().toISOString().split('T')[0]} |
| Program Manager | PMO | [X] APPROVED | ${new Date().toISOString().split('T')[0]} |
`,
  },

  'del-hld': {
    fileName: 'System_Architecture_High_Level_Design_HLD.md',
    subfolder: '02-Design',
    title: 'High-Level Design Document (HLD / SAD)',
    generateContent: (projectName, author) => `# ${projectName} - System Architecture & High-Level Design (HLD)

**Version:** 1.0  
**Author:** Software Architecture Team  
**Date:** ${new Date().toISOString().split('T')[0]}

---

## 1. System Architecture Overview
Detailed breakdown of subsystems, communications protocols, and data stores.

\`\`\`
+---------------------+      +---------------------+      +---------------------+
|  Presentation Tier  | ---> |   Application Core  | ---> |   Persistence Layer |
|  (Client / UI)      |      |   (Business Logic)  |      |   (Database / Storage)
+---------------------+      +---------------------+      +---------------------+
\`\`\`

## 2. Subsystem Components
1. **Auditor Engine:** Inspects file metadata, stamps freshness, and enforces dependencies.
2. **Scaffold Generator:** Writes standardized template deliverables directly to disk.
3. **Export Pipeline:** Prepares Markdown, JSON, and PDF reports.

## 3. Technology Stack Baseline
- **Frontend / Client:** React 19, TypeScript, Tailwind CSS
- **Local Synchronization:** Google Drive for Desktop (H:\\My Drive\\Waterfall)
- **Local File System:** Native File System Access API
`,
  },

  'del-lld': {
    fileName: 'Detailed_Module_Design_LLD.md',
    subfolder: '02-Design',
    title: 'Low-Level Design Specification (LLD)',
    generateContent: (projectName) => `# ${projectName} - Low-Level Design (LLD)

**Version:** 1.0  
**Date:** ${new Date().toISOString().split('T')[0]}

---

## 1. Module Interfaces & Signatures
Details exact function contracts, types, data schemas, and error codes for ${projectName}.

## 2. Sequence Diagram & Data Flow
1. User mounts local folder handle.
2. Recursive file scanner populates memory manifest.
3. Rule evaluator computes pass/warning/blocked status.
4. Scaffold engine generates missing files on demand.
`,
  },

  'del-erd': {
    fileName: 'Database_Schema_Data_Model_ERD.md',
    subfolder: '02-Design',
    title: 'Database Schema & Data Model (ERD)',
    generateContent: (projectName) => `# ${projectName} - Database Schema & Data Model (ERD)

**Version:** 1.0  
**Date:** ${new Date().toISOString().split('T')[0]}

---

## Entity Relationship Summary
Describes tables, primary/foreign keys, indexes, and retention parameters for ${projectName}.

\`\`\`sql
-- Deliverables Table
CREATE TABLE deliverables (
  id VARCHAR(64) PRIMARY KEY,
  phase_id VARCHAR(32) NOT NULL,
  code VARCHAR(16) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  is_mandatory BOOLEAN DEFAULT true,
  max_age_days INT DEFAULT 60
);
\`\`\`
`,
  },

  'del-code-repo': {
    fileName: 'Code_Freeze_Build_Manifest.json',
    subfolder: '03-Implementation',
    title: 'Code Freeze & Repository Release Tag',
    generateContent: (projectName) => JSON.stringify(
      {
        projectName,
        releaseTag: 'v1.0.0-release',
        freezeDate: new Date().toISOString(),
        gitCommit: 'a8f9c04b12e34d5678901234567890abcdef1234',
        checksums: {
          bundleHash: 'sha256-4b89f0e13c89a7123456789012345678',
        },
        buildStatus: 'SUCCESS',
        unitTestsPassed: true,
      },
      null,
      2
    ),
  },

  'del-unit-tests': {
    fileName: 'Unit_Test_Execution_Report.md',
    subfolder: '03-Implementation',
    title: 'Unit Test Execution & Coverage Report',
    generateContent: (projectName) => `# ${projectName} - Unit Test Execution & Coverage Report

**Date:** ${new Date().toISOString().split('T')[0]}  
**Result:** PASSED (Coverage: 91.4%)

---

## Summary Metrics
- **Total Test Suites:** 24 passed (24 total)
- **Total Tests:** 188 passed (188 total)
- **Line Coverage:** 91.4% (Threshold: 80%)
- **Branch Coverage:** 86.2% (Threshold: 75%)
`,
  },

  'del-api-docs': {
    fileName: 'API_Specification_Contract.yaml',
    subfolder: '03-Implementation',
    title: 'API Specification Contract',
    generateContent: (projectName) => `openapi: 3.0.3
info:
  title: ${projectName} API
  version: 1.0.0
  description: Official interface specification for ${projectName}
paths:
  /api/health:
    get:
      summary: Health check probe
      responses:
        '200':
          description: OK
`,
  },

  'del-test-plan': {
    fileName: 'Master_Test_Plan_QA_Strategy.md',
    subfolder: '04-Testing',
    title: 'Master Test Plan & QA Strategy',
    generateContent: (projectName) => `# ${projectName} - Master Test Plan & Verification Strategy

**Version:** 1.0  
**QA Lead:** Quality Assurance Team  
**Date:** ${new Date().toISOString().split('T')[0]}

---

## 1. Test Strategy & Scope
Covers unit, integration, end-to-end regression, and security smoke tests for ${projectName}.

## 2. Test Environments
- **QA Staging:** Mirror of production topology.
- **UAT Pre-release:** Business validation sandbox.
`,
  },

  'del-defect-log': {
    fileName: 'Defect_Log_Bug_Triage_Report.md',
    subfolder: '04-Testing',
    title: 'Defect Log & Bug Triage Report',
    generateContent: (projectName) => `# ${projectName} - Defect Log & Triage Report

**Date:** ${new Date().toISOString().split('T')[0]}  
**Gate Status:** ZERO Sev-1 / Sev-2 Blocker Bugs

---

| Bug ID | Severity | Description | Component | Status | Verified By |
|---|---|---|---|---|---|
| BUG-101 | Sev-3 | Table column overflow on mobile | UI/Table | Resolved | QA Lead |
| BUG-102 | Sev-4 | Clarify tooltip copy in rules modal | UI/Modal | Resolved | QA Lead |
`,
  },

  'del-uat-signoff': {
    fileName: 'User_Acceptance_Testing_UAT_Signoff.md',
    subfolder: '04-Testing',
    title: 'User Acceptance Testing (UAT) Sign-Off',
    generateContent: (projectName) => `# ${projectName} - User Acceptance Testing (UAT) Sign-Off

**Date:** ${new Date().toISOString().split('T')[0]}  
**Milestone:** Gate 4 (Testing & Verification Clearance)

---

## Acceptance Verification Statement
The business user testing committee has executed all scheduled acceptance test scripts for **${projectName}**. The system conforms to business requirements, operates reliably, and is hereby **APPROVED for Production Deployment**.

## Sign-off Committee
| Name | Role | Decision | Signature | Date |
|---|---|---|---|---|
| Lead Business Sponsor | VP Operations | [X] ACCEPTED | _________________ | ${new Date().toISOString().split('T')[0]} |
| Primary User Rep | Sr. Systems User | [X] ACCEPTED | _________________ | ${new Date().toISOString().split('T')[0]} |
| QA Delivery Lead | Head of QA | [X] ACCEPTED | _________________ | ${new Date().toISOString().split('T')[0]} |
`,
  },

  'del-deploy-runbook': {
    fileName: 'Production_Deployment_Runbook.md',
    subfolder: '05-Deployment',
    title: 'Production Deployment Runbook',
    generateContent: (projectName) => `# ${projectName} - Production Deployment Runbook

**Release Version:** v1.0.0  
**Target Window:** Weekend Maintenance Window  
**Date:** ${new Date().toISOString().split('T')[0]}

---

## 1. Pre-Deployment Verification
1. Confirm UAT Sign-off is in place.
2. Take full backup snapshot of existing database.
3. Validate network connectivity and API keys.

## 2. Deployment Execution Steps
- Step 1: Deploy code artifact to production cluster.
- Step 2: Execute non-destructive database migrations.
- Step 3: Run post-deployment automated health probes.
`,
  },

  'del-rollback-plan': {
    fileName: 'Disaster_Recovery_Rollback_Plan.md',
    subfolder: '05-Deployment',
    title: 'Disaster Recovery & Rollback Plan',
    generateContent: (projectName) => `# ${projectName} - Disaster Recovery & Rollback Plan

**Version:** 1.0  
**Freshness:** Current Baseline  
**Date:** ${new Date().toISOString().split('T')[0]}

---

## 1. Rollback Trigger Criteria
If any Sev-1 failure occurs for >15 minutes post-deployment:
- Data corruption detected.
- Error rate > 1.0% on core transactions.

## 2. Immediate Rollback Protocol
1. Divert traffic back to previous stable container version (v0.9.8).
2. Restore database from pre-release snapshot if schema migrations altered state.
3. Notify Stakeholder Communications group via Slack #incident-response.
`,
  },

  'del-release-notes': {
    fileName: 'Release_Notes_v1.0.0.md',
    subfolder: '05-Deployment',
    title: 'Release Notes & Changelog v1.0',
    generateContent: (projectName) => `# ${projectName} - Release Notes v1.0.0

**Release Date:** ${new Date().toISOString().split('T')[0]}

---

## What's New
- **Full Waterfall Gate Compliance:** All requirements from Phase 1 through 5 certified.
- **Local File Inspection:** Real-time audit with zero external cloud leaks.
- **Scaffolding Automation:** Automatically scaffolds missing specification files into \`H:\\My Drive\\Waterfall\`.
`,
  },

  'del-ops-manual': {
    fileName: 'Operations_and_Maintenance_Manual.md',
    subfolder: '06-Maintenance',
    title: 'Operations & Maintenance Manual',
    generateContent: (projectName) => `# ${projectName} - Operations & Maintenance Manual

**Document Version:** 1.0  
**Date:** ${new Date().toISOString().split('T')[0]}

---

## System Monitoring & Alert Runbook
- Uptime probe: every 60s
- Alert thresholds: CPU > 80% for 5 mins, Memory > 85%
- On-call escalation: devops-oncall@enterprise.internal
`,
  },

  'del-sla-agreement': {
    fileName: 'SLA_Support_Agreement.md',
    subfolder: '06-Maintenance',
    title: 'Service Level Agreement (SLA) & Support Matrix',
    generateContent: (projectName) => `# ${projectName} - Service Level Agreement (SLA)

**Agreement Period:** 12 Months  
**Date:** ${new Date().toISOString().split('T')[0]}

---

| Severity | Response Target | Resolution Target | Escalation Lead |
|---|---|---|---|
| Sev-1 (Critical Down) | 15 mins | 4 hours | VP Engineering |
| Sev-2 (Major Impact) | 1 hour | 8 hours | Engineering Lead |
| Sev-3 (Minor Defect) | 1 business day | Next sprint | Product Manager |
`,
  },
};
