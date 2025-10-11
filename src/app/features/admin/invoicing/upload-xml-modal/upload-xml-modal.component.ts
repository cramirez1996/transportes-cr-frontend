import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../../../core/services/invoice.service';
import { TripService } from '../../../../core/services/trip.service';
import { UploadXmlInvoiceDto } from '../../../../core/models/invoice.model';

@Component({
  selector: 'app-upload-xml-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './upload-xml-modal.component.html',
  styleUrl: './upload-xml-modal.component.scss'
})
export class UploadXmlModalComponent implements OnInit {
  private invoiceService = inject(InvoiceService);
  private tripService = inject(TripService);

  isOpen = false;
  isLoading = false;
  errorMessage = '';
  selectedFile: File | null = null;
  trips: any[] = [];

  uploadData: UploadXmlInvoiceDto = {
    tripId: undefined,
    notes: undefined,
  };

  ngOnInit(): void {
    this.loadTrips();
  }

  open(): void {
    this.isOpen = true;
    this.resetForm();
  }

  close(): void {
    this.isOpen = false;
    this.resetForm();
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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validar tipo de archivo
      if (!file.name.endsWith('.xml')) {
        this.errorMessage = 'Por favor selecciona un archivo XML válido';
        this.selectedFile = null;
        return;
      }

      // Validar tamaño (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'El archivo es demasiado grande. Máximo 5MB';
        this.selectedFile = null;
        return;
      }

      this.selectedFile = file;
      this.errorMessage = '';
    }
  }

  onSubmit(): void {
    if (!this.selectedFile) {
      this.errorMessage = 'Por favor selecciona un archivo XML';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.invoiceService.uploadXmlInvoice(this.selectedFile, this.uploadData).subscribe({
      next: (invoice) => {
        console.log('Factura creada exitosamente:', invoice);
        this.isLoading = false;
        this.close();
        // Emitir evento de éxito o recargar lista
        window.location.reload(); // Temporal - mejor usar un EventEmitter
      },
      error: (error) => {
        console.error('Error al subir XML:', error);
        this.errorMessage = error.error?.message || 'Error al procesar el archivo XML';
        this.isLoading = false;
      }
    });
  }

  resetForm(): void {
    this.selectedFile = null;
    this.uploadData = {
      tripId: undefined,
      notes: undefined,
    };
    this.errorMessage = '';
    this.isLoading = false;
  }

  // Método para cerrar modal al hacer click fuera
  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close();
    }
  }
}
