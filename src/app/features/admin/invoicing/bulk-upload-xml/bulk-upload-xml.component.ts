import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InvoiceService } from '../../../../core/services/invoice.service';
import { TripService } from '../../../../core/services/trip.service';
import {
  UploadXmlBulkDto,
  BulkUploadResponse,
  BulkUploadFileResult,
  BulkUploadStatus,
} from '../../../../core/models/invoice.model';

@Component({
  selector: 'app-bulk-upload-xml',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bulk-upload-xml.component.html',
  styleUrl: './bulk-upload-xml.component.scss'
})
export class BulkUploadXmlComponent implements OnInit {
  private invoiceService = inject(InvoiceService);
  private tripService = inject(TripService);
  private router = inject(Router);

  isLoading = false;
  errorMessage = '';
  selectedFiles: File[] = [];
  trips: any[] = [];
  uploadResult: BulkUploadResponse | null = null;
  showResults = false;

  // Enum para el template
  BulkUploadStatus = BulkUploadStatus;

  uploadData: UploadXmlBulkDto = {
    tripId: undefined,
    notes: undefined,
    skipDuplicates: true,
  };

  ngOnInit(): void {
    this.loadTrips();
  }

  loadTrips(): void {
    this.tripService.getTrips().subscribe({
      next: (trips) => {
        this.trips = trips;
      },
      error: (error) => {
        console.error('Error loading trips:', error);
      }
    });
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const validFiles: File[] = [];
      const errors: string[] = [];

      // Validar cada archivo
      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];

        // Validar extensión
        if (!file.name.endsWith('.xml')) {
          errors.push(`${file.name}: Debe ser un archivo XML`);
          continue;
        }

        // Validar tamaño (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          errors.push(`${file.name}: Tamaño máximo 5MB`);
          continue;
        }

        validFiles.push(file);
      }

      // Limitar a 100 archivos
      if (validFiles.length > 100) {
        this.errorMessage = 'Máximo 100 archivos por carga';
        this.selectedFiles = validFiles.slice(0, 100);
      } else {
        this.selectedFiles = validFiles;
      }

      if (errors.length > 0) {
        this.errorMessage = errors.join('\n');
      } else {
        this.errorMessage = '';
      }
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  clearFiles(): void {
    this.selectedFiles = [];
    this.errorMessage = '';
  }

  onSubmit(): void {
    if (this.selectedFiles.length === 0) {
      this.errorMessage = 'Por favor selecciona al menos un archivo XML';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.showResults = false;

    this.invoiceService.uploadXmlBulk(this.selectedFiles, this.uploadData).subscribe({
      next: (response) => {
        console.log('Carga masiva completada:', response);
        this.uploadResult = response;
        this.showResults = true;
        this.isLoading = false;

        // Limpiar archivos seleccionados si todo fue exitoso
        if (response.summary.failed === 0) {
          this.selectedFiles = [];
        }
      },
      error: (error) => {
        console.error('Error en carga masiva:', error);
        this.errorMessage = error.error?.message || 'Error al procesar los archivos XML';
        this.isLoading = false;
      }
    });
  }

  getStatusClass(status: BulkUploadStatus): string {
    switch (status) {
      case BulkUploadStatus.SUCCESS:
        return 'status-success';
      case BulkUploadStatus.FAILED:
        return 'status-failed';
      case BulkUploadStatus.SKIPPED:
        return 'status-skipped';
      default:
        return '';
    }
  }

  getStatusText(status: BulkUploadStatus): string {
    switch (status) {
      case BulkUploadStatus.SUCCESS:
        return 'Éxito';
      case BulkUploadStatus.FAILED:
        return 'Error';
      case BulkUploadStatus.SKIPPED:
        return 'Omitido';
      default:
        return status;
    }
  }

  downloadReport(): void {
    if (!this.uploadResult) return;

    const report = {
      fecha: new Date().toISOString(),
      resumen: this.uploadResult.summary,
      resultados: this.uploadResult.results,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-carga-masiva-${Date.now()}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  goBack(): void {
    this.router.navigate(['/admin/invoicing']);
  }

  getFileSizeText(file: File): string {
    const kb = file.size / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(2)} KB`;
    }
    return `${(kb / 1024).toFixed(2)} MB`;
  }
}
