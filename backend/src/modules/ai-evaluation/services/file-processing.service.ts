import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

@Injectable()
export class FileProcessingService {
  private readonly logger = new Logger(FileProcessingService.name);

  /**
   * Helper to detect placeholder strings produced on extraction failure/empty text.
   */
  isExtractionPlaceholder(text: string | null | undefined): boolean {
    if (!text || text.trim().length === 0) return true;
    const lower = text.toLowerCase();
    return (
      lower.includes('contained no readable text') ||
      lower.includes('contained no text') ||
      lower.includes('contained no data') ||
      lower.includes('extraction notice:') ||
      lower.includes('file missing at path') ||
      lower.includes('error extracting file contents') ||
      lower.includes('contained no readable text or is scanned')
    );
  }

  /**
   * Main entry point to detect file type and extract readable normalized content.
   * Returns text string, extractionFailed status, and optional base64 image strings for vision models.
   */
  async extractContent(filePath: string, originalName?: string): Promise<{
    fileType: string;
    extractedText: string;
    imageBase64List?: string[];
    extractionFailed: boolean;
  }> {
    const resolvedPath = path.resolve(filePath);
    const fileName = originalName || path.basename(resolvedPath);
    const ext = path.extname(fileName).toLowerCase();

    if (!fs.existsSync(resolvedPath)) {
      this.logger.error(`File not found at path: ${resolvedPath}`);
      return {
        fileType: ext || 'unknown',
        extractedText: `[File missing at path: ${fileName}]`,
        extractionFailed: true,
      };
    }

    try {
      // 1. Plain text & Source code files
      if (this.isSourceCodeOrText(ext)) {
        const text = this.sanitizeText(fs.readFileSync(resolvedPath, 'utf8'));
        const failed = this.isExtractionPlaceholder(text);
        return {
          fileType: ext || '.txt',
          extractedText: text,
          extractionFailed: failed,
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
          extractionFailed: false,
        };
      }

      // 3. PDF & Scanned PDFs
      if (ext === '.pdf') {
        const rawText = await this.extractPdfText(resolvedPath);
        const text = this.sanitizeText(rawText);
        const failed = this.isExtractionPlaceholder(text);
        return {
          fileType: '.pdf',
          extractedText: text,
          extractionFailed: failed,
        };
      }

      // 4. DOCX Documents
      if (ext === '.docx') {
        const rawText = await this.extractDocxText(resolvedPath);
        const text = this.sanitizeText(rawText);
        const failed = this.isExtractionPlaceholder(text);
        return {
          fileType: '.docx',
          extractedText: text,
          extractionFailed: failed,
        };
      }

      // 5. Excel Spreadsheets (XLSX, XLS, CSV)
      if (['.xlsx', '.xls', '.csv'].includes(ext)) {
        const rawText = this.extractSpreadsheetText(resolvedPath);
        const text = this.sanitizeText(rawText);
        const failed = this.isExtractionPlaceholder(text);
        return {
          fileType: ext,
          extractedText: text,
          extractionFailed: failed,
        };
      }

      // 6. ZIP Archive Projects
      if (ext === '.zip') {
        const rawText = await this.extractZipContent(resolvedPath);
        const text = this.sanitizeText(rawText);
        const failed = this.isExtractionPlaceholder(text);
        return {
          fileType: '.zip',
          extractedText: text,
          extractionFailed: failed,
        };
      }

      // Fallback: Read as utf8 string if possible
      const fallbackText = this.sanitizeText(fs.readFileSync(resolvedPath, 'utf8'));
      const failed = this.isExtractionPlaceholder(fallbackText);
      return {
        fileType: ext || 'generic',
        extractedText: fallbackText,
        extractionFailed: failed,
      };
    } catch (err: any) {
      this.logger.error(`Error processing file ${fileName}: ${err.message}`, err.stack);
      return {
        fileType: ext || 'unknown',
        extractedText: `[Error extracting file contents: ${err.message}]`,
        extractionFailed: true,
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
    // 1. Primary PDF parser: pdf2json (handles complex font encodings & Jupyter notebook exports)
    try {
      const PDFParser = require('pdf2json');
      const text = await new Promise<string>((resolve, reject) => {
        const pdfParser = new PDFParser(null, 1);
        pdfParser.on('pdfParser_dataError', (errData: any) => reject(errData?.parserError || errData));
        pdfParser.on('pdfParser_dataReady', () => {
          try {
            const rawText = pdfParser.getRawTextContent();
            resolve(rawText || '');
          } catch (err) {
            reject(err);
          }
        });
        pdfParser.loadPDF(filePath);
      });

      if (text && text.trim().length > 30) {
        return text;
      }
    } catch (err: any) {
      this.logger.warn(`pdf2json extraction warning for ${filePath}: ${err.message || err}`);
    }

    // 2. Secondary fallback: pdf-parse
    try {
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      if (data && data.text && data.text.trim().length > 30) {
        return data.text;
      }
    } catch (e: any) {
      this.logger.warn(`pdf-parse fallback warning for ${filePath}: ${e.message || e}`);
    }

    return `[PDF file ${path.basename(filePath)} contained no readable text or is scanned]`;
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
