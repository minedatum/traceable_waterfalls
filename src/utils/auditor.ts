import {
  ExpectedDeliverable,
  ScannedFile,
  DeliverableAuditResult,
  PhaseAuditSummary,
  ProjectAuditReport,
  PhaseId,
} from '../types';
import { WATERFALL_PHASES } from '../data/waterfallTemplate';

export function matchFileToDeliverable(
  file: ScannedFile,
  deliverables: ExpectedDeliverable[]
): ExpectedDeliverable | undefined {
  const cleanFileName = file.name.toLowerCase().replace(/[-_.]/g, ' ');
  const cleanPath = file.path.toLowerCase().replace(/[-_.]/g, ' ');

  // Direct code match e.g. REQ-01
  const codeMatch = deliverables.find((d) =>
    file.name.toLowerCase().includes(d.code.toLowerCase())
  );
  if (codeMatch) return codeMatch;

  // Pattern matching
  for (const del of deliverables) {
    for (const pattern of del.patterns) {
      const p = pattern.toLowerCase();
      if (cleanFileName.includes(p) || cleanPath.includes(p)) {
        return del;
      }
    }
  }

  // Name fuzzy match
  for (const del of deliverables) {
    const keywords = del.name.toLowerCase().split(' ').filter((w) => w.length > 3);
    const matchCount = keywords.filter((kw) => cleanFileName.includes(kw)).length;
    if (keywords.length > 0 && matchCount >= Math.min(2, keywords.length)) {
      return del;
    }
  }

  return undefined;
}

export function performAudit(
  files: ScannedFile[],
  deliverables: ExpectedDeliverable[],
  projectName: string = 'Waterfall Project'
): ProjectAuditReport {
  const now = Date.now();
  const matchedFileMap = new Map<string, ScannedFile[]>();
  const unmatchedFiles: ScannedFile[] = [];

  // Group matched files
  for (const file of files) {
    const matchedDel = matchFileToDeliverable(file, deliverables);
    if (matchedDel) {
      file.matchedDeliverableId = matchedDel.id;
      const current = matchedFileMap.get(matchedDel.id) || [];
      current.push(file);
      matchedFileMap.set(matchedDel.id, current);
    } else {
      unmatchedFiles.push(file);
    }
  }

  const results: DeliverableAuditResult[] = [];

  for (const del of deliverables) {
    const candidateFiles = matchedFileMap.get(del.id) || [];

    if (candidateFiles.length === 0) {
      results.push({
        deliverable: del,
        status: 'missing',
        reason: del.isMandatory
          ? 'Mandatory deliverable not found in project directory'
          : 'Optional deliverable is not present',
      });
      continue;
    }

    // Pick newest file if multiple candidates exist
    candidateFiles.sort((a, b) => b.lastModified - a.lastModified);
    const primaryFile = candidateFiles[0];
    const ageDays = Math.max(0, Math.floor((now - primaryFile.lastModified) / (1000 * 60 * 60 * 24)));

    let status: 'up-to-date' | 'outdated' = 'up-to-date';
    let reason = `File found: ${primaryFile.name} (${formatBytes(primaryFile.size)}). Updated ${ageDays} days ago.`;

    if (del.maxAgeDays && ageDays > del.maxAgeDays) {
      status = 'outdated';
      reason = `Deliverable exceeds recommended freshness threshold (${ageDays}d old vs max ${del.maxAgeDays}d limit). Needs review or refresh.`;
    }

    results.push({
      deliverable: del,
      matchedFile: primaryFile,
      status,
      reason,
      daysOld: ageDays,
    });
  }

  // Cross-check dependencies (e.g. Design requiring SRS)
  const deliverableStatusMap = new Map(results.map((r) => [r.deliverable.id, r]));

  for (const result of results) {
    if (result.deliverable.dependsOn && result.deliverable.dependsOn.length > 0) {
      const missingDeps: string[] = [];
      for (const depId of result.deliverable.dependsOn) {
        const depResult = deliverableStatusMap.get(depId);
        if (!depResult || depResult.status === 'missing') {
          missingDeps.push(depResult?.deliverable.code || depId);
        }
      }

      if (missingDeps.length > 0) {
        result.dependencyStatus = {
          isSatisfied: false,
          note: `Precursor dependency unfulfilled: ${missingDeps.join(', ')}`,
        };
      } else {
        result.dependencyStatus = {
          isSatisfied: true,
        };
      }
    }
  }

  // Compute Phase summaries
  const phaseMap = new Map<PhaseId, PhaseAuditSummary>();

  for (const p of WATERFALL_PHASES) {
    const phaseId = p.id as PhaseId;
    const phaseDeliverables = results.filter((r) => r.deliverable.phaseId === phaseId);
    const totalRequired = phaseDeliverables.length;
    const presentCount = phaseDeliverables.filter((r) => r.status !== 'missing').length;
    const missingCount = phaseDeliverables.filter((r) => r.status === 'missing').length;
    const outdatedCount = phaseDeliverables.filter((r) => r.status === 'outdated').length;

    const blockers: string[] = [];
    phaseDeliverables.forEach((r) => {
      if (r.deliverable.isMandatory && r.status === 'missing') {
        blockers.push(`Missing mandatory: ${r.deliverable.name} (${r.deliverable.code})`);
      }
      if (r.dependencyStatus && !r.dependencyStatus.isSatisfied) {
        blockers.push(`${r.deliverable.code}: ${r.dependencyStatus.note}`);
      }
    });

    const gatePassed = blockers.length === 0;

    phaseMap.set(phaseId, {
      phaseId,
      phaseName: p.name,
      phaseNumber: p.number,
      totalRequired,
      presentCount,
      missingCount,
      outdatedCount,
      gatePassed,
      blockers,
    });
  }

  const phases = Array.from(phaseMap.values());
  const totalDeliverables = deliverables.length;
  const presentDeliverables = results.filter((r) => r.status !== 'missing').length;
  const missingDeliverables = results.filter((r) => r.status === 'missing').length;
  const outdatedDeliverables = results.filter((r) => r.status === 'outdated').length;

  const blockedPhases = phases.filter((p) => !p.gatePassed);

  let overallGateStatus: 'CLEARED' | 'WARNING' | 'BLOCKED' = 'CLEARED';
  if (blockedPhases.length > 0) {
    overallGateStatus = 'BLOCKED';
  } else if (outdatedDeliverables > 0 || missingDeliverables > 0) {
    overallGateStatus = 'WARNING';
  }

  // Completeness score (0-100)
  const mandatoryCount = deliverables.filter((d) => d.isMandatory).length;
  const mandatoryPresent = results.filter((r) => r.deliverable.isMandatory && r.status !== 'missing').length;
  const mandatoryFresh = results.filter((r) => r.deliverable.isMandatory && r.status === 'up-to-date').length;

  const rawScore = mandatoryCount > 0
    ? (mandatoryPresent / mandatoryCount) * 70 + (mandatoryFresh / mandatoryCount) * 30
    : 100;
  const overallScore = Math.round(rawScore);

  return {
    projectName,
    scanDate: now,
    overallScore,
    overallGateStatus,
    totalDeliverables,
    presentDeliverables,
    missingDeliverables,
    outdatedDeliverables,
    phases,
    results,
    unmatchedFiles,
    totalFilesScanned: files.length,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function generateMarkdownReport(report: ProjectAuditReport): string {
  const dateStr = new Date(report.scanDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  let md = `# Waterfall Project Audit Report
**Project:** ${report.projectName}
**Audit Date:** ${dateStr}
**Health Score:** ${report.overallScore}/100
**Gate Status:** ${report.overallGateStatus}
**Summary:** ${report.presentDeliverables}/${report.totalDeliverables} deliverables present | ${report.outdatedDeliverables} outdated | ${report.missingDeliverables} missing

---

## 1. Waterfall Phase Gates Summary

| Phase | Required | Present | Outdated | Gate Status |
|---|---|---|---|---|
`;

  for (const p of report.phases) {
    const statusLabel = p.gatePassed ? 'PASS' : 'BLOCKED';
    md += `| ${p.phaseName} | ${p.totalRequired} | ${p.presentCount} | ${p.outdatedCount} | ${statusLabel} |\n`;
  }

  md += `\n---\n\n## 2. Deliverable Details\n\n`;

  for (const item of report.results) {
    const statusIcon = item.status === 'up-to-date' ? 'UP-TO-DATE' : item.status === 'outdated' ? 'OUTDATED' : 'MISSING';
    md += `### [${item.deliverable.code}] ${item.deliverable.name}\n`;
    md += `- **Status:** ${statusIcon}\n`;
    md += `- **Requirement:** ${item.deliverable.isMandatory ? 'Mandatory' : 'Optional'}\n`;
    if (item.matchedFile) {
      md += `- **Matched File:** \`${item.matchedFile.name}\` (${formatBytes(item.matchedFile.size)})\n`;
      md += `- **Path:** \`${item.matchedFile.path}\`\n`;
      md += `- **Age:** ${item.daysOld} days old\n`;
    }
    md += `- **Note:** ${item.reason}\n\n`;
  }

  if (report.unmatchedFiles.length > 0) {
    md += `\n---\n\n## 3. Unclassified Files (${report.unmatchedFiles.length})\n\n`;
    for (const f of report.unmatchedFiles) {
      md += `- \`${f.path}\` (${formatBytes(f.size)})\n`;
    }
  }

  return md;
}
