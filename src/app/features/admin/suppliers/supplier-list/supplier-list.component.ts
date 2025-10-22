import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SupplierService } from '../../../../core/services/supplier.service';
import { Supplier, SupplierType, SupplierStatus } from '../../../../core/models/supplier.model';
import { ModalService } from '../../../../core/services/modal.service';
import { SupplierFormComponent } from '../supplier-form/supplier-form.component';

@Component({
  selector: 'app-supplier-list',
  imports: [CommonModule, RouterModule],
  templateUrl: './supplier-list.component.html',
  styleUrl: './supplier-list.component.scss'
})
export class SupplierListComponent implements OnInit {
  suppliers = signal<Supplier[]>([]);
  loading = signal(false);

  private supplierService = inject(SupplierService);
  private modalService = inject(ModalService);

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.loading.set(true);
    this.supplierService.getSuppliers().subscribe({
      next: (suppliers) => {
        this.suppliers.set(suppliers);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading suppliers:', err);
        this.loading.set(false);
      }
    });
  }

  openCreateModal(): void {
    const modalRef = this.modalService.open(SupplierFormComponent, {
      title: 'Nuevo Proveedor'
    });

    modalRef.result
      .then((supplierData) => {
        this.supplierService.createSupplier(supplierData).subscribe({
          next: () => this.loadSuppliers(),
          error: (err) => console.error('Error creating supplier:', err)
        });
      })
      .catch(() => {
        // Modal dismissed
      });
  }

  openEditModal(supplier: Supplier): void {
    const modalRef = this.modalService.open(SupplierFormComponent, {
      title: 'Editar Proveedor',
      data: { supplier }
    });

    modalRef.result
      .then((supplierData) => {
        this.supplierService.updateSupplier(supplier.id, supplierData).subscribe({
          next: () => this.loadSuppliers(),
          error: (err) => console.error('Error updating supplier:', err)
        });
      })
      .catch(() => {
        // Modal dismissed
      });
  }

  deleteSupplier(id: string): void {
    if (confirm('¿Estás seguro de eliminar este proveedor?')) {
      this.supplierService.deleteSupplier(id).subscribe({
        next: () => this.loadSuppliers(),
        error: (err) => console.error('Error deleting supplier:', err)
      });
    }
  }

  getStatusBadgeClass(status: SupplierStatus): string {
    const classes: Record<SupplierStatus, string> = {
      [SupplierStatus.ACTIVE]: 'bg-green-100 text-green-800',
      [SupplierStatus.INACTIVE]: 'bg-red-100 text-red-800',
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(status: SupplierStatus): string {
    const labels: Record<SupplierStatus, string> = {
      [SupplierStatus.ACTIVE]: 'Activo',
      [SupplierStatus.INACTIVE]: 'Inactivo',
    };
    return labels[status] || status;
  }

  getSupplierTypeLabel(type: SupplierType): string {
    const labels: Record<SupplierType, string> = {
      [SupplierType.FUEL]: 'Combustible',
      [SupplierType.MAINTENANCE]: 'Mantenimiento',
      [SupplierType.PARTS]: 'Repuestos',
      [SupplierType.INSURANCE]: 'Seguros',
      [SupplierType.SERVICE]: 'Servicios',
      [SupplierType.SUBCONTRACTOR]: 'Subcontratista',
      [SupplierType.OTHER]: 'Otro',
    };
    return labels[type] || type;
  }
}
