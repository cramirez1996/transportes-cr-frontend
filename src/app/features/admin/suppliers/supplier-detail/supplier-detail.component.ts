import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SupplierService } from '../../../../core/services/supplier.service';
import { Supplier, SupplierStatus, SupplierType } from '../../../../core/models/supplier.model';
import { TabsComponent, Tab } from '../../../../shared/components/tabs/tabs.component';

@Component({
  selector: 'app-supplier-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TabsComponent],
  templateUrl: './supplier-detail.component.html',
  styleUrl: './supplier-detail.component.scss'
})
export class SupplierDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private supplierService = inject(SupplierService);

  supplier: Supplier | null = null;
  loading = false;

  // Tabs configuration
  activeTab = 'invoices';
  tabs: Tab[] = [
    { id: 'invoices', label: 'Facturas', count: 0 },
    { id: 'documents', label: 'Documentos', count: 0 },
    { id: 'transactions', label: 'Transacciones', count: 0 }
  ];

  // Status configuration
  statusLabels = {
    [SupplierStatus.ACTIVE]: 'Activo',
    [SupplierStatus.INACTIVE]: 'Inactivo'
  };

  statusColors = {
    [SupplierStatus.ACTIVE]: 'bg-green-100 text-green-800',
    [SupplierStatus.INACTIVE]: 'bg-red-100 text-red-800'
  };

  // Supplier type configuration
  typeLabels = {
    [SupplierType.FUEL]: 'Combustible',
    [SupplierType.MAINTENANCE]: 'Mantenimiento',
    [SupplierType.PARTS]: 'Repuestos',
    [SupplierType.INSURANCE]: 'Seguros',
    [SupplierType.SERVICE]: 'Servicios',
    [SupplierType.SUBCONTRACTOR]: 'Subcontratista',
    [SupplierType.OTHER]: 'Otro'
  };

  typeColors = {
    [SupplierType.FUEL]: 'bg-yellow-100 text-yellow-800',
    [SupplierType.MAINTENANCE]: 'bg-blue-100 text-blue-800',
    [SupplierType.PARTS]: 'bg-purple-100 text-purple-800',
    [SupplierType.INSURANCE]: 'bg-indigo-100 text-indigo-800',
    [SupplierType.SERVICE]: 'bg-pink-100 text-pink-800',
    [SupplierType.SUBCONTRACTOR]: 'bg-orange-100 text-orange-800',
    [SupplierType.OTHER]: 'bg-gray-100 text-gray-800'
  };

  ngOnInit(): void {
    this.loadSupplierDetail();
  }

  loadSupplierDetail(): void {
    const supplierId = this.route.snapshot.paramMap.get('id');
    if (!supplierId) {
      alert('ID de proveedor no válido');
      this.router.navigate(['/admin/suppliers']);
      return;
    }

    this.loading = true;
    this.supplierService.getSupplierById(supplierId).subscribe({
      next: (supplier) => {
        this.supplier = supplier;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar proveedor:', err);
        alert('Error al cargar el detalle del proveedor');
        this.loading = false;
      }
    });
  }

  onTabChange(tabId: string): void {
    this.activeTab = tabId;
    // Load data for the selected tab if needed
  }

  goBack(): void {
    this.router.navigate(['/admin/suppliers']);
  }

  formatDate(date: Date | undefined | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  formatCurrency(amount: string | number | undefined): string {
    if (amount === undefined) return '$0';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(numAmount);
  }
}
