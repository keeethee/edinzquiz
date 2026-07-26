import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

@Injectable()
export class FileProcessingService {
  private readonly logger = new Logger(FileProcessingService.name);

  /**
   * Main entry point to detect file type and extract readable normalized content.
   * Returns text string and optional base64 image strings for multimodal vision models.
   */
  async extractContent(filePath: string, originalName?: string): Promise<{
    fileType: string;
    extractedText: string;
    imageBase64List?: string[];
  }> {
    const resolvedPath = path.resolve(filePath);
    const fileName = originalName || path.basename(resolvedPath);
    const ext = path.extname(fileName).toLowerCase();

    if (!fs.existsSync(resolvedPath)) {
      this.logger.error(`File not found at path: ${resolvedPath}`);
      return {
        fileType: ext || 'unknown',
        extractedText: `[File missing at path: ${fileName}]`,
      };
    }

    try {
      // 1. Plain text & Source code files
      if (this.isSourceCodeOrText(ext)) {
        const text = fs.readFileSync(resolvedPath, 'utf8');
        return {
          fileType: ext || '.txt',
          extractedText: this.sanitizeText(text),
        };
      }

      // 2. Image files (PNG, JPG, JPEG, WEBP) -> Vision Mode
      if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
        const imageBuffer = fs.readFileSync(resolvedPath);
        const base64 = imageBuffer.toString('base64');
        return {
          fileType: ext,
          extractedText: `[Uploaded File is an Image asset: ${fileName}]`,
          imageBase64List: [base64],
        };
      }

      // 3. PDF & Scanned PDFs
      if (ext === '.pdf') {
        const text = await this.extractPdfText(resolvedPath);
        return {
          fileType: '.pdf',
          extractedText: this.sanitizeText(text),
        };
      }

      // 4. DOCX Documents
      if (ext === '.docx') {
        const text = await this.extractDocxText(resolvedPath);
        return {
          fileType: '.docx',
          extractedText: this.sanitizeText(text),
        };
      }

      // 5. Excel Spreadsheets (XLSX, XLS, CSV)
      if (['.xlsx', '.xls', '.csv'].includes(ext)) {
        const text = this.extractSpreadsheetText(resolvedPath);
        return {
          fileType: ext,
          extractedText: this.sanitizeText(text),
        };
      }

      // 6. ZIP Archive Projects
      if (ext === '.zip') {
        const text = await this.extractZipContent(resolvedPath);
        return {
          fileType: '.zip',
          extractedText: this.sanitizeText(text),
        };
      }

      // Fallback: Read as utf8 string if possible
      const fallbackText = fs.readFileSync(resolvedPath, 'utf8');
      return {
        fileType: ext || 'generic',
        extractedText: this.sanitizeText(fallbackText),
      };
    } catch (err: any) {
      this.logger.error(`Error processing file ${fileName}: ${err.message}`, err.stack);
      return {
        fileType: ext || 'unknown',
        extractedText: `[Error extracting file contents: ${err.message}]`,
      };
    }
  }

  private isSourceCodeOrText(ext: string): boolean {
    const codeExts = [
      '.txt', '.md', '.json', '.js', '.ts', '.jsx', '.tsx', '.py',
      '.java', '.c', '.cpp', '.cs', '.h', '.hpp', '.html', '.css',
      '.scss', '.sql', '.xml', '.yaml', '.yml', '.sh', '.bat', '.env',
      '.gradle', '.properties'
    ];
    return codeExts.includes(ext);
  }

  private async extractPdfText(filePath: string): Promise<string> {
    try {
      // Dynamic import for pdf-parse
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      if (data && data.text && data.text.trim().length > 0) {
        return data.text;
      }
      return `[PDF file ${path.basename(filePath)} contained no readable text or is scanned]`;
    } catch (e: any) {
      return `[PDF extraction notice: ${e.message}]`;
    }
  }

  private async extractDocxText(filePath: string): Promise<string> {
    try {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || '[DOCX document contained no text]';
    } catch (e: any) {
      return `[DOCX extraction notice: ${e.message}]`;
    }
  }

  private extractSpreadsheetText(filePath: string): string {
    try {
      const workbook = XLSX.readFile(filePath);
      let fullText = '';
      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        fullText += `--- Sheet: ${sheetName} ---\n${csv}\n\n`;
      });
      return fullText || '[Spreadsheet contained no data]';
    } catch (e: any) {
      return `[Spreadsheet extraction notice: ${e.message}]`;
    }
  }

  private async extractZipContent(filePath: string): Promise<string> {
    try {
      const AdmZip = require('adm-zip');
      const zip = new AdmZip(filePath);
      const zipEntries = zip.getEntries();

      let summaryText = `=== ZIP PROJECT ARCHIVE METADATA ===\nTotal Files: ${zipEntries.length}\n\n`;
      let fileCount = 0;

      for (const entry of zipEntries) {
        if (entry.isDirectory) continue;
        const entryName = entry.entryName;

        // Skip node_modules, .git, build dirs, binary assets
        if (
          entryName.includes('node_modules/') ||
          entryName.includes('.git/') ||
          entryName.includes('dist/') ||
          entryName.includes('target/') ||
          entryName.includes('.png') ||
          entryName.includes('.jpg') ||
          entryName.includes('.pdf')
        ) {
          continue;
        }

        const ext = path.extname(entryName).toLowerCase();
        if (this.isSourceCodeOrText(ext)) {
          const content = zip.readAsText(entry);
          summaryText += `\n--- File: ${entryName} ---\n${content.slice(0, 10000)}\n`;
          fileCount++;
          if (fileCount >= 40) {
            summaryText += `\n[Truncated remaining files for LLM prompt context size]\n`;
            break;
          }
        }
      }
      return summaryText;
    } catch (e: any) {
      return `[ZIP extraction notice: ${e.message}]`;
    }
  }

  private sanitizeText(raw: string): string {
    if (!raw) return '';
    // Strip null characters, restrict excessive blank lines
    return raw
      .replace(/\0/g, '')
      .replace(/\r\n/g, '\n')
      .replace(/\n{4,}/g, '\n\n\n')
      .trim();
  }
}
