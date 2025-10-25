import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Trip, TripStatus } from '../../../../core/models/trip.model';
import { Customer } from '../../../../core/models/business/customer.model';
import { Vehicle } from '../../../../core/models/business/vehicle.model';
import { Driver } from '../../../../core/models/business/driver.model';
import { Supplier } from '../../../../core/models/supplier.model';
import { TripService } from '../../../../core/services/trip.service';
import { CustomerService } from '../../../../core/services/business/customer.service';
import { VehicleService } from '../../../../core/services/business/vehicle.service';
import { DriverService } from '../../../../core/services/business/driver.service';
import { SupplierService } from '../../../../core/services/supplier.service';
import { ModalService } from '../../../../core/services/modal.service';
import { TripFormComponent } from '../trip-form/trip-form.component';
import { DropdownComponent } from '../../../../shared/components/dropdown/dropdown.component';
import { DropdownItemComponent } from '../../../../shared/components/dropdown-item/dropdown-item.component';
import { DropdownDividerComponent } from '../../../../shared/components/dropdown-divider/dropdown-divider.component';
import { CustomSelectComponent, CustomSelectOption } from '../../../../shared/components/custom-select/custom-select.component';

interface TripFilters {
  search?: string;
  status?: TripStatus;
  isSubcontracted?: boolean;
  startDate?: Date;
  endDate?: Date;
  customerId?: string;
  driverId?: string;
  vehicleId?: string;
  subcontractorId?: string;
  origin?: string;
  destination?: string;
  minPrice?: number;
  maxPrice?: number;
}

@Component({
  selector: 'app-trip-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DropdownComponent, DropdownItemComponent, DropdownDividerComponent, CustomSelectComponent],
  templateUrl: './trip-list.component.html',
  styleUrls: ['./trip-list.component.scss']
})
export class TripListComponent implements OnInit {
  private tripService = inject(TripService);
  private customerService = inject(CustomerService);
  private vehicleService = inject(VehicleService);
  private driverService = inject(DriverService);
  private supplierService = inject(SupplierService);
  private modalService = inject(ModalService);

  trips: Trip[] = [];
  filteredTrips: Trip[] = [];
  loading = false;

  // Catalog data for filters
  customers: Customer[] = [];
  vehicles: Vehicle[] = [];
  drivers: Driver[] = [];
  subcontractors: Supplier[] = [];

  // Custom select options
  customerOptions: CustomSelectOption[] = [];
  vehicleOptions: CustomSelectOption[] = [];
  driverOptions: CustomSelectOption[] = [];
  subcontractorOptions: CustomSelectOption[] = [];
  statusOptions: CustomSelectOption[] = [];
  serviceTypeOptions: CustomSelectOption[] = [];

  // Filters
  filters: TripFilters = {};
  showAdvancedFilters = false;
  startDateInput = '';
  endDateInput = '';

  // Para los badges de estado
  statusLabels = {
    [TripStatus.PENDING]: 'Pendiente',
    [TripStatus.IN_PROGRESS]: 'En Curso',
    [TripStatus.COMPLETED]: 'Completado',
    [TripStatus.CANCELLED]: 'Cancelado'
  };

  statusColors = {
    [TripStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [TripStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
    [TripStatus.COMPLETED]: 'bg-green-100 text-green-800',
    [TripStatus.CANCELLED]: 'bg-red-100 text-red-800'
  };

  // Expose TripStatus enum to template
  TripStatus = TripStatus;

  ngOnInit(): void {
    this.loadCatalogs();
    this.loadTrips();
  }

  loadCatalogs(): void {
    // Load catalog data in parallel
    Promise.all([
      this.customerService.getCustomers().toPromise(),
      this.vehicleService.getVehicles().toPromise(),
      this.driverService.getDrivers().toPromise(),
      this.supplierService.getSuppliers().toPromise()
    ]).then(([customers, vehicles, drivers, suppliers]) => {
      this.customers = customers || [];
      this.vehicles = vehicles || [];
      this.drivers = drivers || [];
      // Filter only SUBCONTRACTOR type suppliers
      this.subcontractors = (suppliers || []).filter(s => s.supplierType === 'SUBCONTRACTOR');

      // Prepare custom select options
      this.prepareSelectOptions();
    }).catch(err => {
      console.error('Error loading catalogs:', err);
    });
  }

  prepareSelectOptions(): void {
    // Customer options with avatar
    this.customerOptions = this.customers.map(customer => ({
      value: customer.id,
      label: customer.businessName,
      data: {
        rut: customer.rut,
        email: customer.email,
        avatar: this.getInitials(customer.businessName),
        color: this.getColorFromName(customer.businessName)
      }
    }));

    // Vehicle options with details
    this.vehicleOptions = this.vehicles.map(vehicle => ({
      value: vehicle.id,
      label: `${vehicle.brand} ${vehicle.model}`,
      data: {
        plate: vehicle.licensePlate,
        year: vehicle.year,
        type: vehicle.type,
        status: vehicle.status
      }
    }));

    // Driver options with details
    this.driverOptions = this.drivers.map(driver => {
      const fullName = `${driver.firstName} ${driver.lastName}`;
      return {
        value: driver.id,
        label: fullName,
        data: {
          rut: driver.rut,
          licenseNumber: driver.licenseNumber,
          avatar: this.getInitials(fullName),
          color: this.getColorFromName(fullName)
        }
      };
    });

    // Subcontractor options with avatar
    this.subcontractorOptions = this.subcontractors.map(subcontractor => ({
      value: subcontractor.id,
      label: subcontractor.businessName,
      data: {
        rut: subcontractor.rut,
        contactName: subcontractor.contactName,
        avatar: this.getInitials(subcontractor.businessName),
        color: this.getColorFromName(subcontractor.businessName)
      }
    }));

    // Status options with colors (simple select, no custom template needed)
    this.statusOptions = [
      { value: TripStatus.PENDING, label: 'Pendiente', data: { color: 'yellow' } },
      { value: TripStatus.IN_PROGRESS, label: 'En Curso', data: { color: 'blue' } },
      { value: TripStatus.COMPLETED, label: 'Completado', data: { color: 'green' } },
      { value: TripStatus.CANCELLED, label: 'Cancelado', data: { color: 'red' } }
    ];

    // Service type options (simple select, no custom template needed)
    this.serviceTypeOptions = [
      { value: false, label: 'Flota Propia', data: {} },
      { value: true, label: 'Subcontratado', data: {} }
    ];
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getColorFromName(name: string): string {
    // Same color generation logic as app-avatar component
    const colors = [
      '#3B82F6', // blue-500
      '#10B981', // green-500
      '#F59E0B', // amber-500
      '#EF4444', // red-500
      '#8B5CF6', // violet-500
      '#EC4899', // pink-500
      '#06B6D4', // cyan-500
      '#F97316', // orange-500
    ];

    const hash = name.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    return colors[Math.abs(hash) % colors.length];
  }

  loadTrips(): void {
    this.loading = true;
    this.tripService.getTrips().subscribe({
      next: (trips) => {
        this.trips = trips;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar viajes:', err);
        alert('Error al cargar los viajes. Por favor, intente nuevamente.');
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let result = [...this.trips];

    // Quick search
    if (this.filters.search) {
      const searchLower = this.filters.search.toLowerCase();
      result = result.filter(trip =>
        trip.customer?.businessName?.toLowerCase().includes(searchLower) ||
        trip.origin?.toLowerCase().includes(searchLower) ||
        trip.destination?.toLowerCase().includes(searchLower) ||
        trip.driver?.firstName?.toLowerCase().includes(searchLower) ||
        trip.driver?.lastName?.toLowerCase().includes(searchLower) ||
        trip.vehicle?.licensePlate?.toLowerCase().includes(searchLower) ||
        trip.subcontractor?.businessName?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (this.filters.status !== undefined) {
      result = result.filter(trip => trip.status === this.filters.status);
    }

    // Subcontracted filter
    if (this.filters.isSubcontracted !== undefined) {
      result = result.filter(trip => trip.isSubcontracted === this.filters.isSubcontracted);
    }

    // Date range filter
    if (this.filters.startDate) {
      result = result.filter(trip => new Date(trip.departureDate) >= this.filters.startDate!);
    }
    if (this.filters.endDate) {
      const endDate = new Date(this.filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter(trip => new Date(trip.departureDate) <= endDate);
    }

    // Customer filter
    if (this.filters.customerId) {
      result = result.filter(trip => trip.customer?.id === this.filters.customerId);
    }

    // Driver filter
    if (this.filters.driverId) {
      result = result.filter(trip => trip.driver?.id === this.filters.driverId);
    }

    // Vehicle filter
    if (this.filters.vehicleId) {
      result = result.filter(trip => trip.vehicle?.id === this.filters.vehicleId);
    }

    // Subcontractor filter
    if (this.filters.subcontractorId) {
      result = result.filter(trip => trip.subcontractor?.id === this.filters.subcontractorId);
    }

    // Origin filter
    if (this.filters.origin) {
      const originLower = this.filters.origin.toLowerCase();
      result = result.filter(trip => trip.origin?.toLowerCase().includes(originLower));
    }

    // Destination filter
    if (this.filters.destination) {
      const destLower = this.filters.destination.toLowerCase();
      result = result.filter(trip => trip.destination?.toLowerCase().includes(destLower));
    }

    // Price range filter
    if (this.filters.minPrice !== undefined && this.filters.minPrice !== null) {
      result = result.filter(trip => {
        const price = typeof trip.agreedPrice === 'string' ? parseFloat(trip.agreedPrice) : trip.agreedPrice;
        return price >= this.filters.minPrice!;
      });
    }
    if (this.filters.maxPrice !== undefined && this.filters.maxPrice !== null) {
      result = result.filter(trip => {
        const price = typeof trip.agreedPrice === 'string' ? parseFloat(trip.agreedPrice) : trip.agreedPrice;
        return price <= this.filters.maxPrice!;
      });
    }

    this.filteredTrips = result;
  }

  onFilterChange(): void {
    // Sync date inputs with filter object
    if (this.startDateInput) {
      this.filters.startDate = new Date(this.startDateInput);
    } else {
      this.filters.startDate = undefined;
    }

    if (this.endDateInput) {
      this.filters.endDate = new Date(this.endDateInput);
    } else {
      this.filters.endDate = undefined;
    }

    this.applyFilters();
  }

  clearFilters(): void {
    this.filters = {};
    this.startDateInput = '';
    this.endDateInput = '';
    this.applyFilters();
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  get activeFiltersCount(): number {
    let count = 0;
    if (this.filters.search) count++;
    if (this.filters.status !== undefined) count++;
    if (this.filters.isSubcontracted !== undefined) count++;
    if (this.filters.startDate) count++;
    if (this.filters.endDate) count++;
    if (this.filters.customerId) count++;
    if (this.filters.driverId) count++;
    if (this.filters.vehicleId) count++;
    if (this.filters.subcontractorId) count++;
    if (this.filters.origin) count++;
    if (this.filters.destination) count++;
    if (this.filters.minPrice !== undefined && this.filters.minPrice !== null) count++;
    if (this.filters.maxPrice !== undefined && this.filters.maxPrice !== null) count++;
    return count;
  }

  openCreateModal(): void {
    const modalRef = this.modalService.open(TripFormComponent, {
      title: 'Nuevo Viaje'
    });

    modalRef.result
      .then((tripData) => {
        this.tripService.createTrip(tripData).subscribe({
          next: () => {
            alert('Viaje creado exitosamente');
            this.loadTrips();
          },
          error: (err) => {
            console.error('Error al crear viaje:', err);
            alert('Error al crear el viaje. Por favor, verifique los datos e intente nuevamente.');
          }
        });
      })
      .catch(() => {
        // Modal dismissed
      });
  }

  openEditModal(trip: Trip): void {
    const modalRef = this.modalService.open(TripFormComponent, {
      title: 'Editar Viaje',
      data: { trip }
    });

    modalRef.result
      .then((tripData) => {
        this.tripService.updateTrip(trip.id, tripData).subscribe({
          next: () => {
            alert('Viaje actualizado exitosamente');
            this.loadTrips();
          },
          error: (err) => {
            console.error('Error al actualizar viaje:', err);
            alert('Error al actualizar el viaje. Por favor, intente nuevamente.');
          }
        });
      })
      .catch(() => {
        // Modal dismissed
      });
  }

  startTrip(trip: Trip): void {
    if (confirm(`¿Iniciar el viaje a ${trip.destination}?`)) {
      this.tripService.startTrip(trip.id).subscribe({
        next: () => {
          alert('Viaje iniciado exitosamente');
          this.loadTrips();
        },
        error: (err) => {
          console.error('Error al iniciar viaje:', err);
          alert('Error al iniciar el viaje. Solo los viajes pendientes pueden ser iniciados.');
        }
      });
    }
  }

  completeTrip(trip: Trip): void {
    if (confirm(`¿Marcar como completado el viaje a ${trip.destination}?`)) {
      this.tripService.completeTrip(trip.id).subscribe({
        next: () => {
          alert('Viaje completado exitosamente');
          this.loadTrips();
        },
        error: (err) => {
          console.error('Error al completar viaje:', err);
          alert('Error al completar el viaje. Solo los viajes en curso pueden ser completados.');
        }
      });
    }
  }

  cancelTrip(trip: Trip): void {
    const notes = prompt('Motivo de cancelación (opcional):');
    if (notes !== null) {
      this.tripService.cancelTrip(trip.id, notes).subscribe({
        next: () => {
          alert('Viaje cancelado exitosamente');
          this.loadTrips();
        },
        error: (err) => {
          console.error('Error al cancelar viaje:', err);
          alert('Error al cancelar el viaje. Por favor, intente nuevamente.');
        }
      });
    }
  }

  deleteTrip(trip: Trip): void {
    if (confirm(`¿Está seguro de eliminar el viaje a ${trip.destination}?`)) {
      this.tripService.deleteTrip(trip.id).subscribe({
        next: () => {
          alert('Viaje eliminado exitosamente');
          this.loadTrips();
        },
        error: (err) => {
          console.error('Error al eliminar viaje:', err);
          alert('Error al eliminar el viaje. Solo los viajes pendientes o cancelados pueden ser eliminados.');
        }
      });
    }
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: string | number): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(numAmount);
  }

  canStart(trip: Trip): boolean {
    return trip.status === TripStatus.PENDING;
  }

  canComplete(trip: Trip): boolean {
    return trip.status === TripStatus.IN_PROGRESS;
  }

  canCancel(trip: Trip): boolean {
    return trip.status === TripStatus.PENDING || trip.status === TripStatus.IN_PROGRESS;
  }

  canEdit(trip: Trip): boolean {
    // Permitir editar viajes en cualquier estado
    return true;
  }

  canDelete(trip: Trip): boolean {
    return trip.status === TripStatus.PENDING || trip.status === TripStatus.CANCELLED;
  }

  // Métodos para contar trips por estado (para el template)
  getPendingCount(): number {
    return this.trips.filter(t => t.status === TripStatus.PENDING).length;
  }

  getInProgressCount(): number {
    return this.trips.filter(t => t.status === TripStatus.IN_PROGRESS).length;
  }

  getCompletedCount(): number {
    return this.trips.filter(t => t.status === TripStatus.COMPLETED).length;
  }

  getCancelledCount(): number {
    return this.trips.filter(t => t.status === TripStatus.CANCELLED).length;
  }
}
