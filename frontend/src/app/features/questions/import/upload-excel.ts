import { Component, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-upload-excel',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="upload-container">
      <div class="template-section">
        <h3>📋 Download Sample Template</h3>
        <p class="description-text">
          Use our standard Excel layout to structure your question import sheet. Ensure required columns are filled correctly.
        </p>
        <button mat-stroked-button color="accent" (click)="downloadTemplate()">
          <mat-icon>download</mat-icon> Download Sample Excel
        </button>
      </div>

      <div class="drop-zone" 
           [class.drag-over]="isDragOver()"
           (dragover)="onDragOver($event)"
           (dragleave)="onDragLeave($event)"
           (drop)="onDrop($event)"
           (click)="fileInput.click()">
        <input type="file" #fileInput 
               accept=".xlsx,.xls,.csv" 
               style="display: none;" 
               (change)="onFileSelected($event)">
        
        <mat-icon class="upload-icon">cloud_upload</mat-icon>
        <div class="upload-title">Drag & Drop Excel File Here</div>
        <div class="upload-subtitle">or click to browse from files (Max 10MB)</div>

        <div class="file-info" *ngIf="selectedFile()">
          <mat-icon>insert_drive_file</mat-icon>
          <span class="file-name">{{ selectedFile()?.name }}</span>
          <span class="file-size">({{ getFormattedSize(selectedFile()?.size || 0) }})</span>
        </div>
      </div>

      <div class="action-bar" *ngIf="selectedFile()">
        <button mat-raised-button color="primary" class="upload-btn" (click)="uploadFile()">
          <mat-icon>arrow_forward</mat-icon> Validate & Parse Sheet
        </button>
      </div>
    </div>
  `,
  styles: [`
    .upload-container {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .template-section {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
      padding: 1.5rem;
      border-radius: 12px;
      text-align: left;

      h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.1rem;
        font-weight: 700;
        color: #fff;
      }

      .description-text {
        font-size: 0.85rem;
        color: #a3a3a3;
        margin-bottom: 1.25rem;
      }
    }

    .drop-zone {
      border: 2px dashed rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.02);
      padding: 3rem 2rem;
      border-radius: 16px;
      text-align: center;
      cursor: pointer;
      transition: all 0.25s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      &:hover, &.drag-over {
        border-color: var(--accent-color, #673ab7);
        background: rgba(103, 58, 183, 0.05);
      }

      .upload-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: var(--accent-color, #673ab7);
        margin-bottom: 1rem;
      }

      .upload-title {
        font-size: 1.2rem;
        font-weight: 700;
        color: #fff;
        margin-bottom: 0.25rem;
      }

      .upload-subtitle {
        font-size: 0.85rem;
        color: #a3a3a3;
        margin-bottom: 1.5rem;
      }
    }

    .file-info {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.85rem;
      color: #fff;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #a3a3a3;
      }

      .file-size {
        color: #a3a3a3;
      }
    }

    .action-bar {
      display: flex;
      justify-content: flex-end;
    }

    .upload-btn {
      padding: 0.6rem 2rem;
      font-weight: 600;
      border-radius: 8px;
    }
  `]
})
export class UploadExcelComponent {
  @Output() fileSelected = new EventEmitter<File>();
  
  selectedFile = signal<File | null>(null);
  isDragOver = signal<boolean>(false);

  constructor(private apiService: ApiService) {}

  downloadTemplate() {
    this.apiService.downloadQuestionTemplate().subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'question_import_template.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        alert('Failed to download template.');
      }
    });
  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragOver.set(false);
    
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (this.isValidFile(file)) {
        this.selectedFile.set(file);
      }
    }
  }

  onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (this.isValidFile(file)) {
        this.selectedFile.set(file);
      }
    }
  }

  isValidFile(file: File): boolean {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(extension || '')) {
      alert('Only .xlsx, .xls or .csv files are supported.');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Maximum file size allowed is 10 MB.');
      return false;
    }
    return true;
  }

  getFormattedSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  uploadFile() {
    const file = this.selectedFile();
    if (file) {
      this.fileSelected.emit(file);
    }
  }
}
