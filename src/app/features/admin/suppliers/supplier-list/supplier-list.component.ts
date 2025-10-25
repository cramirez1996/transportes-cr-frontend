import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupplierService } from '../../../../core/services/supplier.service';
import { Supplier, SupplierType, SupplierStatus } from '../../../../core/models/supplier.model';
import { ModalService } from '../../../../core/services/modal.service';
import { SupplierFormComponent } from '../supplier-form/supplier-form.component';
import { DropdownComponent } from '../../../../shared/components/dropdown/dropdown.component';
import { DropdownItemComponent } from '../../../../shared/components/dropdown-item/dropdown-item.component';
import { DropdownDividerComponent } from '../../../../shared/components/dropdown-divider/dropdown-divider.component';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';

interface SupplierFilters {
  search?: string;
  status?: SupplierStatus;
  supplierType?: SupplierType;
  city?: string;
}

@Component({
  selector: 'app-supplier-list',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    DropdownComponent,
    DropdownItemComponent,
    DropdownDividerComponent,
    AvatarComponent
  ],
  templateUrl: './supplier-list.component.html',
  styleUrl: './supplier-list.component.scss'
})
export class SupplierListComponent implements OnInit {
  suppliers = signal<Supplier[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Expose enums to template
  SupplierStatus = SupplierStatus;
  SupplierType = SupplierType;

  // Filters
  filters: SupplierFilters = {};

  // Pagination
  currentPage = signal(1);
  itemsPerPage = 10;

  private supplierService = inject(SupplierService);
  private modalService = inject(ModalService);

  // Computed: Filtered suppliers
  filteredSuppliers = computed(() => {
    let result = this.suppliers();

    // Search filter
    if (this.filters.search) {
      const searchLower = this.filters.search.toLowerCase();
      result = result.filter(supplier =>
        supplier.rut?.toLowerCase().includes(searchLower) ||
        supplier.businessName?.toLowerCase().includes(searchLower) ||
        supplier.contactName?.toLowerCase().includes(searchLower) ||
        supplier.email?.toLowerCase().includes(searchLower) ||
        supplier.phone?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (this.filters.status) {
      result = result.filter(supplier => supplier.status === this.filters.status);
    }

    // Type filter
    if (this.filters.supplierType) {
      result = result.filter(supplier => supplier.supplierType === this.filters.supplierType);
    }

    // City filter
    if (this.filters.city) {
      const cityLower = this.filters.city.toLowerCase();
      result = result.filter(supplier => supplier.city?.toLowerCase().includes(cityLower));
    }

    return result;
  });

  // Computed: Paginated suppliers
  paginatedSuppliers = computed(() => {
    const filtered = this.filteredSuppliers();
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return filtered.slice(start, end);
  });

  // Computed: Total pages
  totalPages = computed(() => {
    return Math.ceil(this.filteredSuppliers().length / this.itemsPerPage);
  });

  // Computed: Active filters count
  get activeFiltersCount(): number {
    let count = 0;
    if (this.filters.search) count++;
    if (this.filters.status) count++;
    if (this.filters.supplierType) count++;
    if (this.filters.city) count++;
    return count;
  }

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.loading.set(true);
    this.error.set(null);
    this.supplierService.getSuppliers().subscribe({
      next: (suppliers) => {
        this.suppliers.set(suppliers);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading suppliers:', err);
        this.error.set('Error al cargar los proveedores. Por favor, intente nuevamente.');
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

  toggleSupplierStatus(supplier: Supplier): void {
    const newStatus = supplier.status === SupplierStatus.ACTIVE ? SupplierStatus.INACTIVE : SupplierStatus.ACTIVE;
    const action = newStatus === SupplierStatus.ACTIVE ? 'activar' : 'desactivar';

    if (confirm(`¿Estás seguro de ${action} este proveedor?`)) {
      this.supplierService.updateSupplier(supplier.id, { status: newStatus }).subscribe({
        next: () => {
          this.loadSuppliers();
        },
        error: (err) => console.error('Error updating supplier status:', err)
      });
    }
  }

  // Filter methods
  onFilterChange(): void {
    // Reset to first page when filters change
    this.currentPage.set(1);
  }

  clearFilters(): void {
    this.filters = {};
    this.currentPage.set(1);
  }

  // Pagination methods
  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
    }
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
