import pptxgen from 'pptxgenjs';

export async function exportPitchDeckPptx(): Promise<void> {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Traceable Waterfalls Governance & Analytics';
  pptx.company = 'Enterprise Regulatory Compliance';
  pptx.title = 'Traceable Waterfalls - Executive Pitch';

  // Color Palette Constants
  const BG_DARK = '0F172A';
  const BG_CARD_DARK = '1E293B';
  const BG_LIGHT = 'F8FAFC';
  const TEXT_WHITE = 'FFFFFF';
  const TEXT_MUTED_DARK = '94A3B8';
  const TEXT_DARK = '0F172A';
  const TEXT_MUTED = '64748B';
  const ACCENT_EMERALD = '059669';
  const ACCENT_BLUE = '2563EB';
  const ACCENT_PURPLE = '7C3AED';
  const ACCENT_AMBER = 'D97706';
  const BORDER_LIGHT = 'E2E8F0';

  // Helper to add standard slide header for light slides
  const addHeader = (slide: pptxgen.Slide, category: string, title: string, subtitle: string) => {
    slide.background = { color: 'FFFFFF' };
    
    // Top banner accent
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 13.33,
      h: 0.1,
      fill: { color: ACCENT_BLUE },
      line: { color: ACCENT_BLUE },
    });

    slide.addText(category.toUpperCase(), {
      x: 0.8,
      y: 0.4,
      w: 11.5,
      h: 0.25,
      fontSize: 10,
      bold: true,
      color: ACCENT_BLUE,
      fontFace: 'Arial',
    });

    slide.addText(title, {
      x: 0.8,
      y: 0.65,
      w: 11.5,
      h: 0.5,
      fontSize: 22,
      bold: true,
      color: TEXT_DARK,
      fontFace: 'Arial',
    });

    slide.addText(subtitle, {
      x: 0.8,
      y: 1.15,
      w: 11.5,
      h: 0.35,
      fontSize: 12,
      color: TEXT_MUTED,
      fontFace: 'Arial',
    });

    // Footer
    slide.addText('Traceable Waterfalls | Executive Pitch & Product Architecture', {
      x: 0.8,
      y: 7.1,
      w: 8.0,
      h: 0.3,
      fontSize: 9,
      color: TEXT_MUTED,
      fontFace: 'Arial',
    });
  };

  // ==========================================
  // SLIDE 1: Title Slide (Dark Elegance)
  // ==========================================
  {
    const s = pptx.addSlide();
    s.background = { color: BG_DARK };

    // Decorative geometric accents
    s.addShape(pptx.ShapeType.rect, {
      x: 0.8,
      y: 1.5,
      w: 0.15,
      h: 4.2,
      fill: { color: ACCENT_EMERALD },
      line: { color: ACCENT_EMERALD },
    });

    s.addText('ENTERPRISE GOVERNANCE & QUANTITATIVE ANALYTICS PLATFORM', {
      x: 1.2,
      y: 1.6,
      w: 10.5,
      h: 0.3,
      fontSize: 11,
      bold: true,
      color: ACCENT_EMERALD,
      fontFace: 'Arial',
    });

    s.addText('Traceable Waterfalls', {
      x: 1.2,
      y: 2.0,
      w: 10.5,
      h: 1.1,
      fontSize: 44,
      bold: true,
      color: TEXT_WHITE,
      fontFace: 'Arial',
    });

    s.addText(
      'Defensible population exclusion waterfalls, quantitative case scoping, and real-time audit governance for regulatory remediations.',
      {
        x: 1.2,
        y: 3.2,
        w: 9.5,
        h: 0.8,
        fontSize: 16,
        color: TEXT_MUTED_DARK,
        fontFace: 'Arial',
      }
    );

    // Key pillars badge container
    const pillars = [
      { title: 'Dual-Persona Governance', desc: 'FRC Compliance + Data Analytics' },
      { title: 'Deterministic Funnel', desc: 'Starting Count to In-Scope Accounts' },
      { title: 'Zero Audit Finding Risk', desc: 'Immutable, timestamped event ledger' },
    ];

    pillars.forEach((p, idx) => {
      const xPos = 1.2 + idx * 3.7;
      s.addShape(pptx.ShapeType.roundRect, {
        x: xPos,
        y: 4.4,
        w: 3.4,
        h: 1.4,
        fill: { color: BG_CARD_DARK },
        line: { color: '334155', width: 1 },
      });

      s.addText(p.title, {
        x: xPos + 0.2,
        y: 4.6,
        w: 3.0,
        h: 0.35,
        fontSize: 13,
        bold: true,
        color: TEXT_WHITE,
        fontFace: 'Arial',
      });

      s.addText(p.desc, {
        x: xPos + 0.2,
        y: 5.0,
        w: 3.0,
        h: 0.6,
        fontSize: 11,
        color: TEXT_MUTED_DARK,
        fontFace: 'Arial',
      });
    });

    s.addText('Confidential | For Executive & Stakeholder Review', {
      x: 1.2,
      y: 6.8,
      w: 10.0,
      h: 0.3,
      fontSize: 10,
      color: TEXT_MUTED_DARK,
      fontFace: 'Arial',
    });
  }

  // ==========================================
  // SLIDE 2: The Problem (Spreadsheet Risk)
  // ==========================================
  {
    const s = pptx.addSlide();
    addHeader(
      s,
      'Industry Problem & Context',
      'The High Cost of Unstructured Remediation Scoping',
      'Regulatory remediations and portfolio reconciliations face severe operational and audit risks.'
    );

    const painPoints = [
      {
        title: 'Spreadsheet Sprawl & Version Breakage',
        desc: 'Exclusion waterfalls are kept in desktop Excel workbooks with complex macros. Multiple versions circulate via email, causing loss of data provenance.',
        badge: 'High Audit Risk',
        color: 'DC2626',
      },
      {
        title: 'The "Policy to SQL" Translation Gap',
        desc: 'FRC Compliance writes legalistic rule policies, while Data Analysts write SQL scripts. Without a shared medium, interpretation mismatches cause invalid exclusions.',
        badge: 'Operational Friction',
        color: 'EA580C',
      },
      {
        title: 'Missing Audit Trails & Regulatory Exposure',
        desc: 'When examiners or internal auditors request proof of why 50,000 customer accounts were excluded, finding the signed-off rationale takes weeks of email forensics.',
        badge: 'Compliance Penalty',
        color: 'B91C1C',
      },
      {
        title: 'Cascading Scope Delays & Un-notified Changes',
        desc: 'If an FRC owner alters a business rule midway through a remediation, downstream analysts frequently continue executing on stale criteria without notification.',
        badge: 'Timeline Slippage',
        color: 'D97706',
      },
    ];

    painPoints.forEach((p, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 0.8 + col * 5.9;
      const y = 1.7 + row * 2.5;

      s.addShape(pptx.ShapeType.roundRect, {
        x,
        y,
        w: 5.6,
        h: 2.2,
        fill: { color: BG_LIGHT },
        line: { color: BORDER_LIGHT, width: 1 },
      });

      // Accent pill
      s.addShape(pptx.ShapeType.roundRect, {
        x: x + 0.3,
        y: y + 0.3,
        w: 1.8,
        h: 0.3,
        fill: { color: p.color },
      });
      s.addText(p.badge.toUpperCase(), {
        x: x + 0.3,
        y: y + 0.3,
        w: 1.8,
        h: 0.3,
        fontSize: 8,
        bold: true,
        color: TEXT_WHITE,
        align: 'center',
        valign: 'middle',
        fontFace: 'Arial',
      });

      s.addText(p.title, {
        x: x + 0.3,
        y: y + 0.7,
        w: 5.0,
        h: 0.4,
        fontSize: 14,
        bold: true,
        color: TEXT_DARK,
        fontFace: 'Arial',
      });

      s.addText(p.desc, {
        x: x + 0.3,
        y: y + 1.15,
        w: 5.0,
        h: 0.85,
        fontSize: 11,
        color: TEXT_MUTED,
        fontFace: 'Arial',
      });
    });
  }

  // ==========================================
  // SLIDE 3: The Solution
  // ==========================================
  {
    const s = pptx.addSlide();
    addHeader(
      s,
      'Product Vision & Solution',
      'A Single Source of Truth for Population Waterfalls',
      'Traceable Waterfalls bridges First-Line Risk and Data Analytics in a governed, unified workspace.'
    );

    const pillars = [
      {
        num: '01',
        title: 'Governed Rule Formulation',
        desc: 'FRC Owners formulate step-by-step exclusion logic, attach official business rationales, and set scope boundaries without writing code.',
      },
      {
        num: '02',
        title: 'Analytical Execution & Verification',
        desc: 'Analysts link data lake datasets, execute SQL queries, calculate deduplicated accounts vs records, and model working days.',
      },
      {
        num: '03',
        title: 'Immutable Audit Ledger',
        desc: 'Every parameter change, finalization, or modification records actor identity, timestamp, and field differences for instant regulatory defense.',
      },
    ];

    pillars.forEach((p, idx) => {
      const x = 0.8 + idx * 3.9;
      s.addShape(pptx.ShapeType.roundRect, {
        x,
        y: 1.8,
        w: 3.6,
        h: 4.8,
        fill: { color: 'FFFFFF' },
        line: { color: BORDER_LIGHT, width: 1.5 },
      });

      // Top number badge
      s.addText(p.num, {
        x: x + 0.3,
        y: 2.1,
        w: 1.0,
        h: 0.6,
        fontSize: 28,
        bold: true,
        color: ACCENT_BLUE,
        fontFace: 'Arial',
      });

      s.addText(p.title, {
        x: x + 0.3,
        y: 2.8,
        w: 3.0,
        h: 0.6,
        fontSize: 15,
        bold: true,
        color: TEXT_DARK,
        fontFace: 'Arial',
      });

      s.addText(p.desc, {
        x: x + 0.3,
        y: 3.5,
        w: 3.0,
        h: 1.5,
        fontSize: 12,
        color: TEXT_MUTED,
        fontFace: 'Arial',
      });

      // Bullet points
      s.addText('✓ Standardized governance\n✓ Automated notifications\n✓ 1-click Excel export', {
        x: x + 0.3,
        y: 5.2,
        w: 3.0,
        h: 1.0,
        fontSize: 10,
        color: ACCENT_EMERALD,
        bold: true,
        fontFace: 'Arial',
      });
    });
  }

  // ==========================================
  // SLIDE 4: Dual-Persona Architecture
  // ==========================================
  {
    const s = pptx.addSlide();
    addHeader(
      s,
      'System Architecture',
      'Dual-Persona Synchronization Model',
      'Eliminates handoff friction by giving Compliance and Analytics specialized interfaces over identical data.'
    );

    // Left Box: FRC Owner
    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.8,
      y: 1.8,
      w: 5.6,
      h: 4.8,
      fill: { color: 'F0FDF4' },
      line: { color: 'BBF7D0', width: 1.5 },
    });

    s.addText('ROLE 1: FRC REQUIREMENT OWNER', {
      x: 1.1,
      y: 2.1,
      w: 5.0,
      h: 0.3,
      fontSize: 11,
      bold: true,
      color: ACCENT_EMERALD,
      fontFace: 'Arial',
    });

    s.addText('Business & Compliance Formulation', {
      x: 1.1,
      y: 2.4,
      w: 5.0,
      h: 0.4,
      fontSize: 18,
      bold: true,
      color: '064E3B',
      fontFace: 'Arial',
    });

    const frcBullets = [
      'Sets Governance Identifiers (COE#, eGRC# ticket, Portfolio)',
      'Defines Starting Population parameters & bounds',
      'Formulates Step Criteria & detailed Business Rationale',
      'Triggers Finalize Requirement to alert stakeholders',
      'Initiates Modify Requirement flow when policies evolve',
    ];

    s.addText(frcBullets.map((b) => `•  ${b}`).join('\n\n'), {
      x: 1.1,
      y: 3.0,
      w: 5.0,
      h: 3.2,
      fontSize: 11.5,
      color: '14532D',
      fontFace: 'Arial',
    });

    // Right Box: Data Analyst
    s.addShape(pptx.ShapeType.roundRect, {
      x: 6.9,
      y: 1.8,
      w: 5.6,
      h: 4.8,
      fill: { color: 'EFF6FF' },
      line: { color: 'BFDBFE', width: 1.5 },
    });

    s.addText('ROLE 2: QUANTITATIVE DATA ANALYST', {
      x: 7.2,
      y: 2.1,
      w: 5.0,
      h: 0.3,
      fontSize: 11,
      bold: true,
      color: ACCENT_BLUE,
      fontFace: 'Arial',
    });

    s.addText('Data Lake Execution & Counting', {
      x: 7.2,
      y: 2.4,
      w: 5.0,
      h: 0.4,
      fontSize: 18,
      bold: true,
      color: '1E3A8A',
      fontFace: 'Arial',
    });

    const analystBullets = [
      'Unlocks step via dedicated "Start Analytics" trigger',
      'Links Data Artifacts (SQL scripts, S3/GCS data lake locations)',
      'Inputs empirical Record Counts & Unique Account Counts',
      'Calculates net retained population and working days',
      'Certifies completion and submits deliverable packet',
    ];

    s.addText(analystBullets.map((b) => `•  ${b}`).join('\n\n'), {
      x: 7.2,
      y: 3.0,
      w: 5.0,
      h: 3.2,
      fontSize: 11.5,
      color: '1E40AF',
      fontFace: 'Arial',
    });
  }

  // ==========================================
  // SLIDE 5: FRC Formulation Workspace Snapshot
  // ==========================================
  {
    const s = pptx.addSlide();
    addHeader(
      s,
      'Product Deep Dive: Persona 1',
      'FRC Formulation Workspace & Scoping Controls',
      'Empowers Compliance Leads to formulate defensible rules with zero technical friction.'
    );

    // Left Mockup Representation
    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.8,
      y: 1.8,
      w: 6.5,
      h: 4.8,
      fill: { color: 'FFFFFF' },
      line: { color: BORDER_LIGHT, width: 1.5 },
    });

    // Mockup Header bar
    s.addShape(pptx.ShapeType.rect, {
      x: 0.8,
      y: 1.8,
      w: 6.5,
      h: 0.5,
      fill: { color: 'F1F5F9' },
    });
    s.addText('UI Mockup: FRC Scoping Workspace (Sarah Jenkins)', {
      x: 1.0,
      y: 1.9,
      w: 6.0,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: TEXT_MUTED,
      fontFace: 'Arial',
    });

    // Mockup Issue Details Card
    s.addShape(pptx.ShapeType.roundRect, {
      x: 1.0,
      y: 2.45,
      w: 6.1,
      h: 1.2,
      fill: { color: BG_LIGHT },
      line: { color: BORDER_LIGHT, width: 1 },
    });
    s.addText('Issue Details  [ Edit ]', {
      x: 1.2,
      y: 2.55,
      w: 5.7,
      h: 0.25,
      fontSize: 10,
      bold: true,
      color: TEXT_DARK,
      fontFace: 'Arial',
    });
    s.addText('COE#: COE-2026-8891  |  eGRC#: eGRC-REQ-4421\nIssue: Retail Loan Interest Calculation Variance\nFRC Owner: Sarah Jenkins  |  Analyst: Alex Morgan', {
      x: 1.2,
      y: 2.85,
      w: 5.7,
      h: 0.7,
      fontSize: 9,
      color: TEXT_MUTED,
      fontFace: 'Arial',
    });

    // Mockup Step Card
    s.addShape(pptx.ShapeType.roundRect, {
      x: 1.0,
      y: 3.8,
      w: 6.1,
      h: 2.6,
      fill: { color: 'FFFFFF' },
      line: { color: 'BBF7D0', width: 1.5 },
    });
    s.addText('Step 1: Starting Population — All Retail Loans FY24-FY26', {
      x: 1.2,
      y: 3.95,
      w: 5.7,
      h: 0.3,
      fontSize: 11,
      bold: true,
      color: '065F46',
      fontFace: 'Arial',
    });
    s.addText('Category: Starting Population  |  Status: Finalized (Green)', {
      x: 1.2,
      y: 4.25,
      w: 5.7,
      h: 0.25,
      fontSize: 9,
      bold: true,
      color: ACCENT_EMERALD,
      fontFace: 'Arial',
    });
    s.addText('Business Rationale: Identifies all closed and active retail lending products in the core ledger impacted by rate table index updates.', {
      x: 1.2,
      y: 4.55,
      w: 5.7,
      h: 0.6,
      fontSize: 9,
      color: TEXT_MUTED,
      fontFace: 'Arial',
    });
    s.addText('Action Buttons: [ Finalize Requirement ]  [ Modify Requirement ]', {
      x: 1.2,
      y: 5.8,
      w: 5.7,
      h: 0.3,
      fontSize: 9,
      bold: true,
      color: ACCENT_BLUE,
      fontFace: 'Arial',
    });

    // Right Feature Callouts
    const frcFeatures = [
      {
        title: 'Issue Details Governance Registry',
        desc: 'Permanent visibility of regulatory identifiers (COE, eGRC) and assigned owners across all views.',
      },
      {
        title: 'Milestone Progress Ribbon',
        desc: 'Real-time counters for Total Steps, Draft, In Modification, and Finalized milestones.',
      },
      {
        title: 'Structured Scoping Parameters',
        desc: 'Standardized forms capture Step Categories (Exclusion, Inclusion, Starting), Rationale, and Target Timelines.',
      },
      {
        title: 'Stakeholder Alert Dispatcher',
        desc: 'Finalizing or modifying a requirement immediately triggers email notifications to PM, Analyst, and Compliance.',
      },
    ];

    frcFeatures.forEach((f, idx) => {
      const y = 1.8 + idx * 1.2;
      s.addText(f.title, {
        x: 7.6,
        y,
        w: 5.0,
        h: 0.3,
        fontSize: 13,
        bold: true,
        color: TEXT_DARK,
        fontFace: 'Arial',
      });
      s.addText(f.desc, {
        x: 7.6,
        y: y + 0.3,
        w: 5.0,
        h: 0.75,
        fontSize: 11,
        color: TEXT_MUTED,
        fontFace: 'Arial',
      });
    });
  }

  // ==========================================
  // SLIDE 6: Analyst Execution Workspace Snapshot
  // ==========================================
  {
    const s = pptx.addSlide();
    addHeader(
      s,
      'Product Deep Dive: Persona 2',
      'Quantitative Analyst Execution & Validation Workspace',
      'Enables technical data teams to register code, track counts, and submit defensible packets.'
    );

    // Left Mockup
    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.8,
      y: 1.8,
      w: 6.5,
      h: 4.8,
      fill: { color: 'FFFFFF' },
      line: { color: BORDER_LIGHT, width: 1.5 },
    });

    s.addShape(pptx.ShapeType.rect, {
      x: 0.8,
      y: 1.8,
      w: 6.5,
      h: 0.5,
      fill: { color: 'F1F5F9' },
    });
    s.addText('UI Mockup: Analyst Workspace (Alex Morgan)', {
      x: 1.0,
      y: 1.9,
      w: 6.0,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: TEXT_MUTED,
      fontFace: 'Arial',
    });

    // Mockup Row
    s.addShape(pptx.ShapeType.roundRect, {
      x: 1.0,
      y: 2.5,
      w: 6.1,
      h: 3.8,
      fill: { color: BG_LIGHT },
      line: { color: 'BFDBFE', width: 1 },
    });

    s.addText('STEP 1: All Retail Loans FY24-FY26', {
      x: 1.2,
      y: 2.7,
      w: 5.7,
      h: 0.3,
      fontSize: 11,
      bold: true,
      color: '1E3A8A',
      fontFace: 'Arial',
    });

    s.addText('Column 1: FRC Rule Rationale\n• Rate table index misalignment identified across credit union accounts.\n\nColumn 2: Quantitative Counts & Verification\n• Starting Records: 1,450,000\n• Net Accounts: 850,000\n• Working Days: 3.5 Days\n• Data Artifact: /lake/core_loans_redress_v1.sql\n\nColumn 3: Schedule & Sign-Off Status\n• Review Status: Certified by Alex Morgan\n• Deliverables: [ Complete Analysis Packet ]', {
      x: 1.2,
      y: 3.1,
      w: 5.7,
      h: 2.9,
      fontSize: 9.5,
      color: TEXT_DARK,
      fontFace: 'Arial',
    });

    // Right Callouts
    const analystFeatures = [
      {
        title: 'Dedicated "Start Analytics" Trigger',
        desc: 'Prevents premature analytics execution by locking quantitative fields until the FRC rule is finalized.',
      },
      {
        title: 'Tri-Metric Counting Rigor',
        desc: 'Separates Excluded Records from Unique Customer Accounts to prevent duplicate redress disbursements.',
      },
      {
        title: 'Data Artifact Provenance',
        desc: 'Direct repository and file path links (SQL, S3 buckets, Databricks tables) registered directly on the step.',
      },
      {
        title: 'Automated Schedule & Effort Calculator',
        desc: 'Dynamically computes total net working days and identifies critical path constraints.',
      },
    ];

    analystFeatures.forEach((f, idx) => {
      const y = 1.8 + idx * 1.2;
      s.addText(f.title, {
        x: 7.6,
        y,
        w: 5.0,
        h: 0.3,
        fontSize: 13,
        bold: true,
        color: TEXT_DARK,
        fontFace: 'Arial',
      });
      s.addText(f.desc, {
        x: 7.6,
        y: y + 0.3,
        w: 5.0,
        h: 0.75,
        fontSize: 11,
        color: TEXT_MUTED,
        fontFace: 'Arial',
      });
    });
  }

  // ==========================================
  // SLIDE 7: Retention Funnel & Rollup Summary
  // ==========================================
  {
    const s = pptx.addSlide();
    addHeader(
      s,
      'Analytics & Reporting',
      'Dynamic Retention Funnel & Rollup Intelligence',
      'Provides executives and auditors with an instant macro-view of population reductions.'
    );

    // Funnel Visual Representation
    const funnelSteps = [
      { label: '1. Initial Gross Population', count: '1,450,000 Accounts', width: 5.8, color: '1E3A8A' },
      { label: '2. Exclude: Closed Prior to 2024', count: '- 320,000 Accounts', width: 4.8, color: '2563EB' },
      { label: '3. Exclude: Commercial & Institutional', count: '- 180,000 Accounts', width: 4.0, color: '3B82F6' },
      { label: '4. Exclude: Zero Impact / Neutral Rate', count: '- 95,000 Accounts', width: 3.2, color: '60A5FA' },
      { label: '5. Final In-Scope Remediation Population', count: '855,000 Accounts', width: 2.6, color: '059669' },
    ];

    funnelSteps.forEach((st, idx) => {
      const y = 1.9 + idx * 0.95;
      const x = 0.8 + (6.0 - st.width) / 2;

      s.addShape(pptx.ShapeType.roundRect, {
        x,
        y,
        w: st.width,
        h: 0.75,
        fill: { color: st.color },
      });

      s.addText(`${st.label} (${st.count})`, {
        x,
        y: y + 0.15,
        w: st.width,
        h: 0.45,
        fontSize: 10,
        bold: true,
        color: TEXT_WHITE,
        align: 'center',
        fontFace: 'Arial',
      });
    });

    // Right Box: KPI Summary Cards
    const kpis = [
      { label: 'Gross Excluded Accounts', val: '595,000', change: '-41.0% of starting pool' },
      { label: 'Net In-Scope Redress Target', val: '855,000', change: '59.0% verified retention' },
      { label: 'Total Net Working Days Saved', val: '18.5 Days', change: 'Through automated scoping' },
      { label: 'Regulator-Ready Excel Export', val: '1-Click', change: 'Fully formatted .xlsx workbook' },
    ];

    kpis.forEach((k, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 7.2 + col * 2.7;
      const y = 2.0 + row * 2.3;

      s.addShape(pptx.ShapeType.roundRect, {
        x,
        y,
        w: 2.5,
        h: 1.9,
        fill: { color: BG_LIGHT },
        line: { color: BORDER_LIGHT, width: 1 },
      });

      s.addText(k.label.toUpperCase(), {
        x: x + 0.2,
        y: y + 0.2,
        w: 2.1,
        h: 0.35,
        fontSize: 8.5,
        bold: true,
        color: TEXT_MUTED,
        fontFace: 'Arial',
      });

      s.addText(k.val, {
        x: x + 0.2,
        y: y + 0.6,
        w: 2.1,
        h: 0.5,
        fontSize: 20,
        bold: true,
        color: TEXT_DARK,
        fontFace: 'Arial',
      });

      s.addText(k.change, {
        x: x + 0.2,
        y: y + 1.2,
        w: 2.1,
        h: 0.4,
        fontSize: 9.5,
        color: ACCENT_EMERALD,
        bold: true,
        fontFace: 'Arial',
      });
    });
  }

  // ==========================================
  // SLIDE 8: Immutable Audit Trail & Change Control
  // ==========================================
  {
    const s = pptx.addSlide();
    addHeader(
      s,
      'Compliance & Governance',
      'Continuous Audit Trail & Regulatory Change Control',
      'Every interaction is recorded in an immutable ledger with full actor accountability.'
    );

    // Mockup Audit Table
    const auditRows: pptxgen.TableRow[] = [
      [
        { text: 'Timestamp', options: { bold: true, fill: { color: 'F1F5F9' } } },
        { text: 'Event Category', options: { bold: true, fill: { color: 'F1F5F9' } } },
        { text: 'User & Role', options: { bold: true, fill: { color: 'F1F5F9' } } },
        { text: 'Summary Description', options: { bold: true, fill: { color: 'F1F5F9' } } },
      ],
      [
        { text: '2026-09-19 13:42' },
        { text: 'Scope Change' },
        { text: 'Sarah Jenkins (FRC)' },
        { text: 'Updated step 3 exclusion criteria to cover inactive products' },
      ],
      [
        { text: '2026-09-19 12:15' },
        { text: 'Requirement Finalized' },
        { text: 'Sarah Jenkins (FRC)' },
        { text: 'Finalized step 1 baseline starting population and dispatched alert' },
      ],
      [
        { text: '2026-09-19 10:30' },
        { text: 'Analytics Completed' },
        { text: 'Alex Morgan (Analyst)' },
        { text: 'Completed SQL execution on core_loans_redress_v1 (855k accounts)' },
      ],
      [
        { text: '2026-09-19 09:00' },
        { text: 'Project Initialized' },
        { text: 'System Administrator' },
        { text: 'Initialized project COE-2026-8891 / eGRC-REQ-4421' },
      ],
    ];

    s.addTable(auditRows, {
      x: 0.8,
      y: 1.8,
      w: 11.7,
      h: 2.8,
      colW: [2.0, 2.2, 2.5, 5.0],
      fill: { color: 'FFFFFF' },
      border: { color: BORDER_LIGHT, pt: 1 },
      fontSize: 9.5,
      fontFace: 'Arial',
      color: TEXT_DARK,
      rowH: [0.45, 0.5, 0.5, 0.5, 0.5],
      align: 'left',
      valign: 'middle',
    });

    // Key Governance Guarantees
    const guarantees = [
      {
        title: 'Zero Tampering Guarantee',
        desc: 'Audit records cannot be purged or manually overwritten, satisfying SEC, OCC, and CFPB recordkeeping mandates.',
      },
      {
        title: 'Field-Level Difference Tracking',
        desc: 'Captures before-and-after values for titles, rationale text, count metrics, and assigned owners.',
      },
      {
        title: 'Real-Time Stakeholder Dispatch',
        desc: 'Instant email alert triggers whenever steps transition from Draft to Finalized or In Modification.',
      },
    ];

    guarantees.forEach((g, idx) => {
      const x = 0.8 + idx * 3.9;
      s.addShape(pptx.ShapeType.roundRect, {
        x,
        y: 5.0,
        w: 3.6,
        h: 1.6,
        fill: { color: 'F8FAFC' },
        line: { color: BORDER_LIGHT, width: 1 },
      });

      s.addText(g.title, {
        x: x + 0.2,
        y: 5.2,
        w: 3.2,
        h: 0.3,
        fontSize: 12,
        bold: true,
        color: TEXT_DARK,
        fontFace: 'Arial',
      });

      s.addText(g.desc, {
        x: x + 0.2,
        y: 5.55,
        w: 3.2,
        h: 0.85,
        fontSize: 10,
        color: TEXT_MUTED,
        fontFace: 'Arial',
      });
    });
  }

  // ==========================================
  // SLIDE 9: Business Benefits & ROI
  // ==========================================
  {
    const s = pptx.addSlide();
    addHeader(
      s,
      'Value Proposition & ROI',
      'Tangible Business & Compliance Returns',
      'Delivers measurable operational efficiencies and eliminates regulatory enforcement exposure.'
    );

    const benefits = [
      {
        metric: '100%',
        label: 'Audit Defensibility',
        desc: 'Eliminates examination findings caused by missing exclusion justifications or undocumented population drops.',
        color: ACCENT_EMERALD,
      },
      {
        metric: '50%',
        label: 'Faster Scoping Pacing',
        desc: 'Replaces weeks of email ping-pong and manual reconciliation meetings with a streamlined, structured pipeline.',
        color: ACCENT_BLUE,
      },
      {
        metric: '$0',
        label: 'Redress Leakage',
        desc: 'Accurate account deduplication prevents over-remediation payouts to ineligible customers and under-remediation penalties.',
        color: ACCENT_PURPLE,
      },
      {
        metric: 'Real-Time',
        label: 'Stakeholder Visibility',
        desc: 'Executive leadership, compliance officers, and project managers share an unassailable live operational dashboard.',
        color: ACCENT_AMBER,
      },
    ];

    benefits.forEach((b, idx) => {
      const x = 0.8 + idx * 2.95;
      s.addShape(pptx.ShapeType.roundRect, {
        x,
        y: 1.8,
        w: 2.7,
        h: 4.8,
        fill: { color: 'FFFFFF' },
        line: { color: BORDER_LIGHT, width: 1.5 },
      });

      s.addShape(pptx.ShapeType.rect, {
        x: x + 0.2,
        y: 2.1,
        w: 0.1,
        h: 1.1,
        fill: { color: b.color },
      });

      s.addText(b.metric, {
        x: x + 0.4,
        y: 2.1,
        w: 2.1,
        h: 0.65,
        fontSize: 26,
        bold: true,
        color: b.color,
        fontFace: 'Arial',
      });

      s.addText(b.label, {
        x: x + 0.4,
        y: 2.8,
        w: 2.1,
        h: 0.4,
        fontSize: 13,
        bold: true,
        color: TEXT_DARK,
        fontFace: 'Arial',
      });

      s.addText(b.desc, {
        x: x + 0.3,
        y: 3.5,
        w: 2.2,
        h: 2.8,
        fontSize: 11,
        color: TEXT_MUTED,
        fontFace: 'Arial',
      });
    });
  }

  // ==========================================
  // SLIDE 10: Technology Stack & Production Architecture
  // ==========================================
  {
    const s = pptx.addSlide();
    addHeader(
      s,
      'Technology & Engineering',
      'Modern, Scalable Enterprise Tech Stack',
      'Engineered for maximum reliability, speed, type safety, and zero deployment friction.'
    );

    const techTiers = [
      {
        tier: 'Core Frontend Framework',
        tech: 'React 19 & TypeScript',
        desc: 'Strict end-to-end typing, robust state isolation, and performant component modularity.',
      },
      {
        tier: 'Build & Bundling Engine',
        tech: 'Vite 6 & ESBuild',
        desc: 'Sub-second cold starts, lightning-fast compilation, and optimized lightweight distributions.',
      },
      {
        tier: 'Design System & UI',
        tech: 'Tailwind CSS v4 & Lucide Icons',
        desc: 'High-contrast accessible typography, ergonomic layout scales, and vector iconography.',
      },
      {
        tier: 'Data & Export Engines',
        tech: 'SheetJS (xlsx) & PptxGenJS',
        desc: 'Client-side generation of regulator-ready Excel workbooks and executive PowerPoint decks.',
      },
      {
        tier: 'Analytics & Visualization',
        tech: 'Recharts & Dynamic SVG',
        desc: 'Responsive population deduction funnels, real-time variance, and progress tracking.',
      },
      {
        tier: 'Deployment & CI/CD',
        tech: 'Google Cloud Run & GitHub Pages',
        desc: 'Containerized preview environments paired with continuous production delivery.',
      },
    ];

    techTiers.forEach((t, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 0.8 + col * 5.9;
      const y = 1.8 + row * 1.6;

      s.addShape(pptx.ShapeType.roundRect, {
        x,
        y,
        w: 5.6,
        h: 1.4,
        fill: { color: BG_LIGHT },
        line: { color: BORDER_LIGHT, width: 1 },
      });

      s.addText(t.tier.toUpperCase(), {
        x: x + 0.3,
        y: y + 0.15,
        w: 5.0,
        h: 0.25,
        fontSize: 9,
        bold: true,
        color: ACCENT_BLUE,
        fontFace: 'Arial',
      });

      s.addText(t.tech, {
        x: x + 0.3,
        y: y + 0.45,
        w: 5.0,
        h: 0.35,
        fontSize: 14,
        bold: true,
        color: TEXT_DARK,
        fontFace: 'Arial',
      });

      s.addText(t.desc, {
        x: x + 0.3,
        y: y + 0.8,
        w: 5.0,
        h: 0.5,
        fontSize: 10.5,
        color: TEXT_MUTED,
        fontFace: 'Arial',
      });
    });
  }

  // Save the PPTX file
  await pptx.writeFile({ fileName: 'Traceable_Waterfalls_Executive_Pitch.pptx' });
}
