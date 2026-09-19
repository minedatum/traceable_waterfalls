import * as XLSX from 'xlsx';
import { WaterfallRow, AuditLogEntry, ProjectDetails, WaterfallEntity } from '../types';
import { formatDateDisplay, formatDateTimeDisplay } from './workingDays';

// Trigger browser download of a file
function downloadFile(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Trigger browser download of binary buffer (.xlsx)
function downloadBinaryFile(buffer: Uint8Array, fileName: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Sanitize sheet name for Excel rules (max 31 chars, no invalid chars, unique)
function getSanitizedSheetName(rawName: string, existingNames: Set<string>, fallback = 'Waterfall'): string {
  let cleaned = rawName
    .replace(/[\\/*?:[\]]/g, '_')
    .trim();
  if (!cleaned) {
    cleaned = fallback;
  }
  let truncated = cleaned.slice(0, 31);
  if (!existingNames.has(truncated.toLowerCase())) {
    existingNames.add(truncated.toLowerCase());
    return truncated;
  }
  // If duplicate, append numeric suffix (e.g., WF (2))
  let counter = 2;
  while (true) {
    const suffix = ` (${counter})`;
    const maxPrefixLen = 31 - suffix.length;
    const candidate = `${cleaned.slice(0, maxPrefixLen)}${suffix}`;
    if (!existingNames.has(candidate.toLowerCase())) {
      existingNames.add(candidate.toLowerCase());
      return candidate;
    }
    counter++;
  }
}

// Convert data to CSV format
export function exportWaterfallToCsv(rows: WaterfallRow[], fileName = 'Waterfall_Rows.csv') {
  const headers = [
    'Step #',
    'WFID#',
    'Step Rationale',
    'Business Requirements',
    'Dataset Location',
    'Exclude Count Case Level',
    'Include Count Case Level',
    'Unique Level Count',
    'Optional Notes',
    'Start Date',
    'End Date',
    'Days Count',
    'Status',
    'Rule Reference',
    'Assigned Analyst',
    'FRC Owner',
  ];

  const lines = rows.map((r) => [
    r.stepNumber,
    `"${r.id}"`,
    `"${(r.rationale || '').replace(/"/g, '""')}"`,
    `"${(r.businessRequirements || '').replace(/"/g, '""')}"`,
    `"${(r.datasetLocation || '').replace(/"/g, '""')}"`,
    r.excludeCount,
    r.includeCaseCount,
    r.includeUniqueAccountCount,
    `"${(r.notes || '').replace(/"/g, '""')}"`,
    r.startDate,
    r.endDate,
    r.workingDays,
    `"${r.status}"`,
    `"${r.ruleReference || ''}"`,
    `"${r.assignedAnalyst || ''}"`,
    `"${r.frcOwner || ''}"`,
  ]);

  const csvContent = [headers.join(','), ...lines.map((l) => l.join(','))].join('\r\n');
  downloadFile(csvContent, fileName, 'text/csv;charset=utf-8;');
}

// Helper to build a worksheet for a waterfall in standard FRC / Table format
function buildWaterfallWorksheet(
  wfName: string,
  rows: WaterfallRow[],
  projectDetails?: ProjectDetails
): XLSX.WorkSheet {
  const sheetAoa: (string | number)[][] = [
    ['eGRC WATERFALL REQUIREMENTS & SCOPING TABLE'],
    [],
    ['COE#', projectDetails?.coeNumber || '—'],
    ['eGRC#', projectDetails?.egrcNumber || '—'],
    ['Issue Title', projectDetails?.issueTitle || '—'],
    ['Issue Description', projectDetails?.issueDescription || '—'],
    ['FRC Name', projectDetails?.frcName || '—'],
    ['Analyst Name', projectDetails?.analystName || '—'],
    ['Waterfall Name', wfName || '—'],
    [],
    [
      'Step #',
      'WFID#',
      'Title',
      'Category',
      'Rule Reference',
      'Status',
      'Step Rationale',
      'Business Requirements',
      'Dataset Location',
      'Exclude Count',
      'Include Cases',
      'Unique Accounts',
      'Start Date',
      'End Date',
      'Working Days',
      'Assigned Analyst',
      'FRC Owner',
      'Notes',
    ],
  ];

  rows.forEach((r) => {
    sheetAoa.push([
      r.stepNumber,
      r.id,
      r.stepTitle,
      r.category,
      r.ruleReference || '',
      r.status.replace(/_/g, ' ').toUpperCase(),
      r.rationale || '',
      r.businessRequirements || '',
      r.datasetLocation || '',
      r.excludeCount,
      r.includeCaseCount,
      r.includeUniqueAccountCount,
      r.startDate || '',
      r.endDate || '',
      r.workingDays,
      r.assignedAnalyst || '',
      r.frcOwner || '',
      r.notes || '',
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(sheetAoa);
  worksheet['!cols'] = [
    { wch: 10 },
    { wch: 12 },
    { wch: 32 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 35 },
    { wch: 35 },
    { wch: 35 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 25 },
  ];
  return worksheet;
}

// Helper to build a worksheet for a waterfall in Analyst format
function buildAnalystWorksheet(
  wfName: string,
  rows: WaterfallRow[],
  effectiveFieldOverrides?: Record<string, Partial<WaterfallRow>>,
  projectDetails?: ProjectDetails
): XLSX.WorkSheet {
  const sheetAoa: (string | number)[][] = [
    ['eGRC REQUIREMENTS WATERFALL - ANALYST SPECIFICATION & SCOPING'],
    [],
    ['COE#', projectDetails?.coeNumber || '—'],
    ['eGRC#', projectDetails?.egrcNumber || '—'],
    ['Issue Title', projectDetails?.issueTitle || '—'],
    ['Issue Description', projectDetails?.issueDescription || '—'],
    ['FRC Name', projectDetails?.frcName || '—'],
    ['Analyst Name', projectDetails?.analystName || '—'],
    ['Waterfall Name', wfName || '—'],
    [],
    [
      'WFID#',
      'Step Rationale',
      'Business Requirements',
      'Dataset Location',
      'Exclude Count (Case Level)',
      'Include Count (Case Level)',
      'Unique Count (Account Level)',
      'Optional Notes',
      'Days Count (Working Days)',
      'Timeline',
      'Status',
    ],
  ];

  rows.forEach((r) => {
    const override = effectiveFieldOverrides?.[r.id] || {};
    const businessReq = override.businessRequirements !== undefined ? override.businessRequirements : (r.businessRequirements || '');
    const datasetLoc = override.datasetLocation !== undefined ? override.datasetLocation : (r.datasetLocation || `H:\\My Drive\\Waterfall\\0${r.stepNumber}_Data\\dataset_${r.id.toLowerCase()}.parquet`);
    const excludeCnt = override.excludeCount !== undefined ? override.excludeCount : r.excludeCount;
    const includeCaseCnt = override.includeCaseCount !== undefined ? override.includeCaseCount : r.includeCaseCount;
    const uniqueAcctCnt = override.includeUniqueAccountCount !== undefined ? override.includeUniqueAccountCount : r.includeUniqueAccountCount;
    const optNotes = override.notes !== undefined ? override.notes : (r.notes || '');
    const workDays = override.workingDays !== undefined ? override.workingDays : r.workingDays;
    const stDate = override.startDate !== undefined ? override.startDate : r.startDate;
    const enDate = override.endDate !== undefined ? override.endDate : r.endDate;

    const fullRationale = `${r.stepTitle}\n${r.rationale}${r.ruleReference ? `\nRef: ${r.ruleReference}` : ''}`;
    const timeline = stDate && enDate ? `${stDate} to ${enDate}` : (stDate || enDate || '—');

    sheetAoa.push([
      r.id,
      fullRationale,
      businessReq,
      datasetLoc,
      excludeCnt,
      includeCaseCnt,
      uniqueAcctCnt,
      optNotes,
      workDays,
      timeline,
      r.status.replace(/_/g, ' ').toUpperCase(),
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(sheetAoa);
  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 45 },
    { wch: 45 },
    { wch: 42 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 32 },
    { wch: 16 },
    { wch: 24 },
    { wch: 18 },
  ];
  return worksheet;
}

// Export exact replica of Analyst Requirements view to true Excel (.xlsx)
// If waterfalls are passed, exports ALL waterfalls into one single workbook with each waterfall in its own sheet!
export function exportAnalystViewToExcel(
  rows: WaterfallRow[],
  effectiveFieldOverrides?: Record<string, Partial<WaterfallRow>>,
  fileName = 'Waterfall_Analyst_Requirements.xlsx',
  projectDetails?: ProjectDetails,
  waterfalls?: WaterfallEntity[]
) {
  const workbook = XLSX.utils.book_new();
  const existingSheetNames = new Set<string>();

  if (waterfalls && waterfalls.length > 0) {
    // Export all waterfalls in one file but split in different sheets
    waterfalls.forEach((wf) => {
      const sheetName = getSanitizedSheetName(wf.name || 'Waterfall', existingSheetNames);
      // For active waterfall, if current rows were passed, use them to capture any in-memory latest updates
      const wfRows = wf.rows && wf.rows.length > 0 ? wf.rows : (rows && rows.length > 0 ? rows : []);
      const worksheet = buildAnalystWorksheet(wf.name, wfRows, effectiveFieldOverrides, projectDetails);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });
  } else {
    // Single active waterfall sheet
    const initialName = projectDetails?.waterfallName || 'Initial Waterfall';
    const sheetName = getSanitizedSheetName(initialName, existingSheetNames);
    const worksheet = buildAnalystWorksheet(initialName, rows, effectiveFieldOverrides, projectDetails);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }

  const finalFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName.replace(/\.[^.]+$/, '')}.xlsx`;
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  downloadBinaryFile(new Uint8Array(excelBuffer), finalFileName);
}

// Export formatted Excel table (.xlsx)
// If waterfalls are passed, exports ALL waterfalls into one single workbook with each waterfall in its own sheet!
export function exportWaterfallToExcel(
  rows: WaterfallRow[],
  fileName = 'Waterfall_Rows.xlsx',
  projectDetails?: ProjectDetails,
  waterfalls?: WaterfallEntity[]
) {
  const workbook = XLSX.utils.book_new();
  const existingSheetNames = new Set<string>();

  if (waterfalls && waterfalls.length > 0) {
    // Export all waterfalls in one file but split in different sheets
    waterfalls.forEach((wf) => {
      const sheetName = getSanitizedSheetName(wf.name || 'Waterfall', existingSheetNames);
      const wfRows = wf.rows && wf.rows.length > 0 ? wf.rows : (rows && rows.length > 0 ? rows : []);
      const worksheet = buildWaterfallWorksheet(wf.name, wfRows, projectDetails);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });
  } else {
    // Single active waterfall sheet
    const initialName = projectDetails?.waterfallName || 'Initial Waterfall';
    const sheetName = getSanitizedSheetName(initialName, existingSheetNames);
    const worksheet = buildWaterfallWorksheet(initialName, rows, projectDetails);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }

  const finalFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName.replace(/\.[^.]+$/, '')}.xlsx`;
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  downloadBinaryFile(new Uint8Array(excelBuffer), finalFileName);
}

// Export Audit Logs to CSV
export function exportAuditLogsToCsv(logs: AuditLogEntry[], fileName = 'Audit_Activity_Log.csv') {
  const headers = ['Log ID', 'Timestamp', 'User', 'Role', 'Action', 'Target Row', 'Details'];
  const lines = logs.map((l) => [
    `"${l.id}"`,
    `"${l.timestamp}"`,
    `"${l.user}"`,
    `"${l.role}"`,
    `"${l.action.replace(/"/g, '""')}"`,
    `"${l.rowId || ''}"`,
    `"${(l.details || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...lines.map((l) => l.join(','))].join('\r\n');
  downloadFile(csvContent, fileName, 'text/csv;charset=utf-8;');
}

// Export Audit Logs to Excel (.xlsx)
export function exportAuditLogsToExcel(logs: AuditLogEntry[], fileName = 'Audit_Activity_Log.xlsx') {
  const data = logs.map((l) => ({
    'Log ID': l.id,
    'Timestamp': formatDateTimeDisplay(l.timestamp),
    'User': l.user,
    'Role': l.role,
    'Action': l.action,
    'Target Row': l.rowId || '—',
    'Details': l.details,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Logs');

  const finalFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName.replace(/\.[^.]+$/, '')}.xlsx`;
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  downloadBinaryFile(new Uint8Array(excelBuffer), finalFileName);
}

function escapeHtml(text: string): string {
  return (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'signed_off':
      return '#dcfce7'; // green-100
    case 'in_analysis':
      return '#fef3c7'; // amber-100
    case 'ready_for_review':
      return '#e0e7ff'; // indigo-100
    case 'submitted':
      return '#dbeafe'; // blue-100
    default:
      return '#f1f5f9'; // slate-100
  }
}
