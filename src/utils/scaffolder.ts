import JSZip from 'jszip';
import { DeliverableAuditResult, ScannedFile } from '../types';
import { SCAFFOLD_TEMPLATES } from '../data/deliverableTemplates';

export interface ScaffoldResult {
  success: boolean;
  filesCreated: number;
  createdPaths: string[];
  error?: string;
}

// Recursively scan FileSystemDirectoryHandle (File System Access API)
export async function scanFileSystemDirectory(
  dirHandle: FileSystemDirectoryHandle,
  basePath: string = ''
): Promise<ScannedFile[]> {
  const scanned: ScannedFile[] = [];

  // @ts-expect-error entries() is available on FileSystemDirectoryHandle
  for await (const [name, handle] of dirHandle.entries()) {
    const currentPath = basePath ? `${basePath}/${name}` : name;

    if (handle.kind === 'file') {
      const fileHandle = handle as FileSystemFileHandle;
      const file = await fileHandle.getFile();
      const ext = name.includes('.') ? name.split('.').pop()?.toLowerCase() || '' : '';

      scanned.push({
        id: `fs-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name,
        path: currentPath,
        size: file.size,
        lastModified: file.lastModified,
        extension: ext,
      });
    } else if (handle.kind === 'directory') {
      const subDir = handle as FileSystemDirectoryHandle;
      const subFiles = await scanFileSystemDirectory(subDir, currentPath);
      scanned.push(...subFiles);
    }
  }

  return scanned;
}

// Direct write to directory handle (H:\My Drive\Waterfall)
export async function writeMissingFilesToDirectoryHandle(
  dirHandle: FileSystemDirectoryHandle,
  missingResults: DeliverableAuditResult[],
  projectName: string = 'Waterfall Project'
): Promise<ScaffoldResult> {
  let count = 0;
  const createdPaths: string[] = [];

  try {
    for (const item of missingResults) {
      const template = SCAFFOLD_TEMPLATES[item.deliverable.id];
      if (!template) continue;

      // 1. Get or create phase folder
      const subDir = await dirHandle.getDirectoryHandle(template.subfolder, { create: true });

      // 2. Create file in subfolder
      const fileHandle = await subDir.getFileHandle(template.fileName, { create: true });
      const writable = await fileHandle.createWritable();

      // 3. Write content
      const content = template.generateContent(projectName, 'System Auditor');
      await writable.write(content);
      await writable.close();

      count++;
      createdPaths.push(`${template.subfolder}/${template.fileName}`);
    }

    return {
      success: true,
      filesCreated: count,
      createdPaths,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      filesCreated: count,
      createdPaths,
      error: message,
    };
  }
}

// Generate ZIP package of all missing deliverables
export async function generateMissingDeliverablesZip(
  missingResults: DeliverableAuditResult[],
  projectName: string = 'Waterfall Project'
): Promise<Blob> {
  const zip = new JSZip();
  const root = zip.folder('Waterfall');

  // Also include a Readme
  root?.file(
    'README_SCAFFOLDING.md',
    `# Waterfall Project Scaffolding Bundle
Target Directory: H:\\My Drive\\Waterfall
Project Name: ${projectName}
Date: ${new Date().toISOString()}

This archive contains all missing project deliverables detected during the Waterfall audit.
Extract the folders (01-Requirements, 02-Design, 03-Implementation, 04-Testing, 05-Deployment, 06-Maintenance) directly into your Google Drive Waterfall directory (H:\\My Drive\\Waterfall).
`
  );

  for (const item of missingResults) {
    const template = SCAFFOLD_TEMPLATES[item.deliverable.id];
    if (!template) continue;

    const phaseFolder = root?.folder(template.subfolder);
    const content = template.generateContent(projectName, 'System Auditor');
    phaseFolder?.file(template.fileName, content);
  }

  return await zip.generateAsync({ type: 'blob' });
}

// Generate a PowerShell script to scaffold directly to H:\My Drive\Waterfall
export function generatePowerShellScaffoldScript(
  missingResults: DeliverableAuditResult[],
  targetPath: string = 'H:\\My Drive\\Waterfall',
  projectName: string = 'Waterfall Project'
): string {
  let ps = `# =========================================================
# PowerShell Scaffolding Script for ${projectName}
# Target Path: ${targetPath}
# =========================================================

$targetPath = "${targetPath}"
Write-Host "Scaffolding missing Waterfall files to $targetPath..." -ForegroundColor Cyan

if (-not (Test-Path $targetPath)) {
    New-Item -ItemType Directory -Path $targetPath -Force | Out-Null
}

`;

  for (const item of missingResults) {
    const template = SCAFFOLD_TEMPLATES[item.deliverable.id];
    if (!template) continue;

    const fullDirPath = `$targetPath\\${template.subfolder}`;
    const fullFilePath = `${fullDirPath}\\${template.fileName}`;
    const content = template
      .generateContent(projectName, 'Waterfall Auditor')
      .replace(/"/g, '`"')
      .replace(/\$/g, '`$');

    ps += `# Deliverable: ${item.deliverable.name} (${item.deliverable.code})
if (-not (Test-Path "${fullDirPath}")) {
    New-Item -ItemType Directory -Path "${fullDirPath}" -Force | Out-Null
}

@'
${content}
'@ | Out-File -FilePath "${fullFilePath}" -Encoding utf8 -Force
Write-Host "Created: ${template.subfolder}\\${template.fileName}" -ForegroundColor Green

`;
  }

  ps += `Write-Host "Waterfall scaffolding completed! All missing files are generated in $targetPath." -ForegroundColor Green
`;

  return ps;
}

// Generate Windows Batch script (.bat) that creates the files
export function generateBatchScaffoldScript(
  missingResults: DeliverableAuditResult[],
  targetPath: string = 'H:\\My Drive\\Waterfall',
  projectName: string = 'Waterfall Project'
): string {
  const psScript = generatePowerShellScaffoldScript(missingResults, targetPath, projectName);
  const base64Ps = btoa(unescape(encodeURIComponent(psScript)));

  return `@echo off
title Waterfall Scaffolder - ${projectName}
echo ========================================================
echo Scaffolding missing Waterfall files to ${targetPath}
echo ========================================================

powershell -NoProfile -ExecutionPolicy Bypass -Command "[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${base64Ps}')) | iex"

echo.
echo Process complete! Please check your Google Drive folder:
echo ${targetPath}
echo.
pause
`;
}

