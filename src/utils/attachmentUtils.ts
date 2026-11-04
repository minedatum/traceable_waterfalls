import { StepAttachment } from '../types';

export type FileCategory = 'pdf' | 'excel' | 'word' | 'ppt' | 'image' | 'code' | 'other';

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length > 1) {
    return parts.pop()?.toLowerCase() || '';
  }
  return '';
}

export function getFileCategory(extension: string): FileCategory {
  const ext = extension.toLowerCase().replace('.', '');
  if (ext === 'pdf') return 'pdf';
  if (['xlsx', 'xls', 'csv'].includes(ext)) return 'excel';
  if (['doc', 'docx', 'rtf', 'odt'].includes(ext)) return 'word';
  if (['ppt', 'pptx', 'key'].includes(ext)) return 'ppt';
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp'].includes(ext)) return 'image';
  if (['sql', 'json', 'py', 'ts', 'js', 'html', 'css', 'txt'].includes(ext)) return 'code';
  return 'other';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getCategoryBadgeStyles(category: FileCategory): {
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconBg: string;
  label: string;
} {
  switch (category) {
    case 'pdf':
      return {
        badgeBg: 'bg-rose-50',
        badgeText: 'text-rose-700',
        badgeBorder: 'border-rose-200',
        iconBg: 'bg-rose-100 text-rose-600',
        label: 'PDF',
      };
    case 'excel':
      return {
        badgeBg: 'bg-emerald-50',
        badgeText: 'text-emerald-700',
        badgeBorder: 'border-emerald-200',
        iconBg: 'bg-emerald-100 text-emerald-600',
        label: 'Excel / Data',
      };
    case 'word':
      return {
        badgeBg: 'bg-blue-50',
        badgeText: 'text-blue-700',
        badgeBorder: 'border-blue-200',
        iconBg: 'bg-blue-100 text-blue-600',
        label: 'Word Doc',
      };
    case 'ppt':
      return {
        badgeBg: 'bg-amber-50',
        badgeText: 'text-amber-700',
        badgeBorder: 'border-amber-200',
        iconBg: 'bg-amber-100 text-amber-600',
        label: 'PowerPoint',
      };
    case 'image':
      return {
        badgeBg: 'bg-purple-50',
        badgeText: 'text-purple-700',
        badgeBorder: 'border-purple-200',
        iconBg: 'bg-purple-100 text-purple-600',
        label: 'Image',
      };
    case 'code':
      return {
        badgeBg: 'bg-cyan-50',
        badgeText: 'text-cyan-700',
        badgeBorder: 'border-cyan-200',
        iconBg: 'bg-cyan-100 text-cyan-600',
        label: 'Script / Code',
      };
    default:
      return {
        badgeBg: 'bg-stone-50',
        badgeText: 'text-stone-700',
        badgeBorder: 'border-stone-200',
        iconBg: 'bg-stone-100 text-stone-600',
        label: 'Attachment',
      };
  }
}

/**
 * Downloads an attachment to user's local disk
 */
export function downloadAttachment(attachment: StepAttachment) {
  if (!attachment.dataUrl) {
    // If no dataUrl exists, generate a dummy text blob with metadata
    const content = `Filename: ${attachment.name}\nSize: ${formatFileSize(attachment.size)}\nUploaded By: ${attachment.uploadedBy} (${attachment.uploadedByRole})\nUploaded Date: ${attachment.uploadedAt}\nNotes: ${attachment.notes || 'None'}\n\n[Waterfall Governance Deliverable Attachment]`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.name.endsWith('.txt') ? attachment.name : `${attachment.name}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return;
  }

  const link = document.createElement('a');
  link.href = attachment.dataUrl;
  link.download = attachment.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Reads a File from an <input type="file"> or drop event as DataURL
 */
export function readFileAsAttachment(
  file: File,
  uploadedBy: string,
  uploadedByRole: 'FRC Owner' | 'Analyst'
): Promise<StepAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const ext = getFileExtension(file.name);
    const id = `ATT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve({
        id,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        extension: ext,
        uploadedAt: new Date().toISOString(),
        uploadedBy,
        uploadedByRole,
        dataUrl,
      });
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Creates quick sample files for demo / mock prototyping if needed
 */
export function generateSampleAttachment(
  sampleType: 'mandate_pdf' | 'population_xlsx' | 'policy_doc' | 'deck_ppt' | 'architecture_png',
  uploadedBy: string,
  uploadedByRole: 'FRC Owner' | 'Analyst',
  stepNumber: number
): StepAttachment {
  const timestamp = new Date().toISOString();
  const id = `ATT-DEMO-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;

  switch (sampleType) {
    case 'mandate_pdf': {
      // Lightweight SVG rendered as dataUrl
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1100" viewBox="0 0 800 1100">
        <rect width="100%" height="100%" fill="#ffffff"/>
        <rect x="40" y="40" width="720" height="80" rx="8" fill="#1e293b"/>
        <text x="70" y="88" fill="#ffffff" font-family="sans-serif" font-size="20" font-weight="bold">GOVERNANCE &amp; REGULATORY MANDATE</text>
        <text x="70" y="106" fill="#94a3b8" font-family="sans-serif" font-size="12">Step ${stepNumber} Formal Scoping Directive - Document REF: REG-MANDATE-2024</text>
        
        <rect x="40" y="150" width="720" height="120" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
        <text x="70" y="185" fill="#334155" font-family="sans-serif" font-size="14" font-weight="bold">1. Mandatory Regulatory Scope</text>
        <text x="70" y="215" fill="#64748b" font-family="sans-serif" font-size="12">This requirement is formulated pursuant to Enterprise Scoping Standard and FRC compliance directives.</text>
        <text x="70" y="235" fill="#64748b" font-family="sans-serif" font-size="12">All exclusions and baseline criteria must maintain complete traceability to source transaction ledgers.</text>
        
        <rect x="40" y="300" width="720" height="280" rx="8" fill="#ffffff" stroke="#cbd5e1"/>
        <text x="70" y="335" fill="#1e293b" font-family="sans-serif" font-size="14" font-weight="bold">2. Population Validation Criteria</text>
        <line x1="70" y1="355" x2="730" y2="355" stroke="#e2e8f0" stroke-width="2"/>
        <text x="70" y="380" fill="#475569" font-family="sans-serif" font-size="12">Target Population: FY2024 Core Retail &amp; Commercial Balances</text>
        <text x="70" y="410" fill="#475569" font-family="sans-serif" font-size="12">Exclusion Criteria: Internal test accounts, branch 9999 clearing, charge-off overrides</text>
        <text x="70" y="440" fill="#475569" font-family="sans-serif" font-size="12">Data Source: Enterprise Data Warehouse (EDW) - Gold Layer</text>
        <text x="70" y="470" fill="#475569" font-family="sans-serif" font-size="12">Approval Authority: Requirements Lead &amp; Regulatory Director</text>
        
        <rect x="40" y="610" width="720" height="100" rx="8" fill="#f0fdf4" stroke="#86efac"/>
        <text x="70" y="645" fill="#166534" font-family="sans-serif" font-size="13" font-weight="bold">Status: Officially Signed Off &amp; Verified</text>
        <text x="70" y="670" fill="#15803d" font-family="sans-serif" font-size="12">Timestamp: ${timestamp} | Author: ${uploadedBy} (${uploadedByRole})</text>
      </svg>`;
      const encodedSvg = encodeURIComponent(svg);
      return {
        id,
        name: `Regulatory_Mandate_Step_${stepNumber}.pdf`,
        size: 342100,
        type: 'application/pdf',
        extension: 'pdf',
        uploadedAt: timestamp,
        uploadedBy,
        uploadedByRole,
        dataUrl: `data:image/svg+xml;charset=utf-8,${encodedSvg}`,
        notes: 'Official regulatory mandate directive from Compliance & Legal.',
      };
    }
    case 'population_xlsx': {
      // CSV data URL format
      const csvContent = [
        'Account_Number,Client_Name,Product_Type,Open_Date,Current_Balance,In_Scope_Flag,Exclusion_Reason',
        'ACC-1002931,Horizon Logistics LLC,Commercial Credit,2022-04-15,450000.00,YES,N/A',
        'ACC-1002932,Vanguard Retail Inc,Business Line,2023-01-10,125000.50,YES,N/A',
        'ACC-9999001,QA Automated Test Stub,Sandbox Test,2024-02-01,0.00,NO,Employee / Sandbox Clearing',
        'ACC-1002934,Sterling Asset Mgmt,Commercial Term,2021-11-20,890000.00,YES,N/A',
        'ACC-1002935,Cascade Energy Corp,Overdraft Facility,2023-08-05,320000.25,YES,N/A',
        'ACC-9999002,Branch 9999 Clearing,Suspense Ledger,2024-03-12,500.00,NO,Internal Branch Clearing',
      ].join('\n');
      return {
        id,
        name: `Population_Data_Extract_Step_${stepNumber}.xlsx`,
        size: 512000,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        extension: 'xlsx',
        uploadedAt: timestamp,
        uploadedBy,
        uploadedByRole,
        dataUrl: `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`,
        notes: 'Pre-filtered master account ledger extract verified against DWH totals.',
      };
    }
    case 'policy_doc': {
      const docText = `WATERFALL SCOPING & BUSINESS REQUIREMENTS POLICY\nDocument Ref: POL-WF-${stepNumber}\n\n1. Overview:\nDefines the technical rules and governance conditions required for Step ${stepNumber}.\n\n2. Acceptance Criteria:\n- Developer must implement exact criteria matching the FRC rule reference.\n- Working days calculations must align with business calendar.\n- Output counts must reconcile against parent population.\n\nAuthor: ${uploadedBy} (${uploadedByRole})\nDate: ${timestamp}`;
      return {
        id,
        name: `Business_Requirements_Specification_Step_${stepNumber}.docx`,
        size: 198000,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        extension: 'docx',
        uploadedAt: timestamp,
        uploadedBy,
        uploadedByRole,
        dataUrl: `data:text/plain;charset=utf-8,${encodeURIComponent(docText)}`,
        notes: 'Detailed business requirements specifications document.',
      };
    }
    case 'deck_ppt': {
      const pptText = `EXECUTIVE WATERFALL WALKTHROUGH\nStep ${stepNumber} Governance Deck\n\nSlide 1: Executive Scoping Objective\nSlide 2: In-Scope vs Excluded Case Analysis\nSlide 3: Impact on Capital Reserves & Compliance Audit\n\nPresented by: ${uploadedBy}`;
      return {
        id,
        name: `Executive_Governance_Deck_Step_${stepNumber}.pptx`,
        size: 890000,
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        extension: 'pptx',
        uploadedAt: timestamp,
        uploadedBy,
        uploadedByRole,
        dataUrl: `data:text/plain;charset=utf-8,${encodeURIComponent(pptText)}`,
        notes: 'Executive stakeholder deck for committee sign-off.',
      };
    }
    case 'architecture_png': {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="400" viewBox="0 0 700 400">
        <rect width="100%" height="100%" fill="#0f172a"/>
        <text x="350" y="45" fill="#f8fafc" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle">STEP ${stepNumber} ETL DATA FLOW &amp; EXCLUSION PIPELINE</text>
        
        <rect x="50" y="100" width="160" height="90" rx="8" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
        <text x="130" y="140" fill="#38bdf8" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle">Data Warehouse</text>
        <text x="130" y="165" fill="#94a3b8" font-family="sans-serif" font-size="11" text-anchor="middle">Gold Core Ledger</text>
        
        <path d="M 210 145 L 270 145" stroke="#38bdf8" stroke-width="2" marker-end="url(#arrow)"/>
        
        <rect x="270" y="100" width="160" height="90" rx="8" fill="#1e293b" stroke="#a855f7" stroke-width="2"/>
        <text x="350" y="140" fill="#c084fc" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle">Exclusion Logic</text>
        <text x="350" y="165" fill="#94a3b8" font-family="sans-serif" font-size="11" text-anchor="middle">Filter Rule REG-${stepNumber}</text>
        
        <path d="M 430 145 L 490 145" stroke="#a855f7" stroke-width="2"/>
        
        <rect x="490" y="100" width="160" height="90" rx="8" fill="#1e293b" stroke="#4ade80" stroke-width="2"/>
        <text x="570" y="140" fill="#4ade80" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle">Filtered Dataset</text>
        <text x="570" y="165" fill="#94a3b8" font-family="sans-serif" font-size="11" text-anchor="middle">Reconciled Population</text>
        
        <rect x="180" y="240" width="340" height="80" rx="8" fill="#334155" stroke="#64748b"/>
        <text x="350" y="275" fill="#f1f5f9" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">Audited Traceability Pipeline</text>
        <text x="350" y="300" fill="#94a3b8" font-family="sans-serif" font-size="11" text-anchor="middle">Uploaded by ${uploadedBy} | Status: Verified</text>
      </svg>`;
      const encodedSvg = encodeURIComponent(svg);
      return {
        id,
        name: `Data_Architecture_Flow_Step_${stepNumber}.png`,
        size: 245000,
        type: 'image/png',
        extension: 'png',
        uploadedAt: timestamp,
        uploadedBy,
        uploadedByRole,
        dataUrl: `data:image/svg+xml;charset=utf-8,${encodedSvg}`,
        notes: 'Technical architecture diagram of ETL exclusion query pipeline.',
      };
    }
  }
}
