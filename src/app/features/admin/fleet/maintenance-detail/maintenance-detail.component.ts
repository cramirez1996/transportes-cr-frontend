import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { MaintenanceRecord, MaintenanceStatus, MaintenanceClass } from '../../../../core/models/maintenance.model';

@Component({
  selector: 'app-maintenance-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './maintenance-detail.component.html',
  styleUrl: './maintenance-detail.component.scss'
})
export class MaintenanceDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private maintenanceService = inject(MaintenanceService);

  maintenanceRecord: MaintenanceRecord | null = null;
  loading = false;
  error: string | null = null;

  // Enum references for template
  MaintenanceStatus = MaintenanceStatus;
  MaintenanceClass = MaintenanceClass;

  // Status badge classes
  statusColors: Record<MaintenanceStatus, string> = {
    [MaintenanceStatus.SCHEDULED]: 'bg-blue-100 text-blue-800',
    [MaintenanceStatus.COMPLETED]: 'bg-green-100 text-green-800',
    [MaintenanceStatus.OVERDUE]: 'bg-red-100 text-red-800',
    [MaintenanceStatus.CANCELLED]: 'bg-gray-100 text-gray-800',
  };

  // Status labels
  statusLabels: Record<MaintenanceStatus, string> = {
    [MaintenanceStatus.SCHEDULED]: 'Programado',
    [MaintenanceStatus.COMPLETED]: 'Completado',
    [MaintenanceStatus.OVERDUE]: 'Vencido',
    [MaintenanceStatus.CANCELLED]: 'Cancelado',
  };

  // Class badge classes
  classBadgeColors: Record<MaintenanceClass, string> = {
    [MaintenanceClass.PREVENTIVE]: 'bg-blue-100 text-blue-800',
    [MaintenanceClass.CORRECTIVE]: 'bg-orange-100 text-orange-800',
  };

  // Class labels
  classLabels: Record<MaintenanceClass, string> = {
    [MaintenanceClass.PREVENTIVE]: 'Preventivo',
    [MaintenanceClass.CORRECTIVE]: 'Correctivo',
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadMaintenanceRecord(id);
    } else {
      this.error = 'ID de mantenimiento no proporcionado';
    }
  }

  loadMaintenanceRecord(id: string): void {
    this.loading = true;
    this.error = null;

    this.maintenanceService.getMaintenanceRecordById(id).subscribe({
      next: (record) => {
        this.maintenanceRecord = record;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading maintenance record:', error);
        this.error = 'Error al cargar el registro de mantenimiento';
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  edit(): void {
    if (this.maintenanceRecord) {
      this.router.navigate(['/admin/fleet/maintenance', this.maintenanceRecord.id, 'edit']);
    }
  }

  delete(): void {
    if (!this.maintenanceRecord) return;

    if (confirm(`¿Está seguro de que desea eliminar este registro de mantenimiento?`)) {
      this.maintenanceService.deleteMaintenanceRecord(this.maintenanceRecord.id).subscribe({
        next: () => {
          alert('Registro eliminado exitosamente');
          this.router.navigate(['/admin/fleet/maintenance']);
        },
        error: (error) => {
          console.error('Error deleting maintenance record:', error);
          alert('Error al eliminar el registro de mantenimiento');
        }
      });
    }
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  canEdit(): boolean {
    return this.maintenanceRecord?.status !== MaintenanceStatus.COMPLETED;
  }

  canDelete(): boolean {
    return this.maintenanceRecord?.status !== MaintenanceStatus.COMPLETED;
  }
}
