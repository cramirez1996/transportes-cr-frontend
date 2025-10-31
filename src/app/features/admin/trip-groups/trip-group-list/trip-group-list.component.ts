import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { TripGroup, TripGroupStatus, TRIP_GROUP_STATUS_LABELS, TRIP_GROUP_STATUS_COLORS } from '../../../../core/models/trip-group.model';
import { TripGroupService } from '../../../../core/services/trip-group.service';
import { DropdownComponent } from '../../../../shared/components/dropdown/dropdown.component';
import { DropdownItemComponent } from '../../../../shared/components/dropdown-item/dropdown-item.component';
import { DropdownDividerComponent } from '../../../../shared/components/dropdown-divider/dropdown-divider.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';

interface TripGroupFilters {
  search?: string;
  status?: TripGroupStatus;
  startDateFrom?: string;
  startDateTo?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

@Component({
  selector: 'app-trip-group-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    DropdownComponent,
    DropdownItemComponent,
    DropdownDividerComponent,
    PaginationComponent
  ],
  templateUrl: './trip-group-list.component.html',
  styleUrl: './trip-group-list.component.scss'
})
export class TripGroupListComponent implements OnInit, OnDestroy {
  private tripGroupService = inject(TripGroupService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  tripGroups: TripGroup[] = [];
  loading = false;
  error: string | null = null;

  // Pagination
  page: number = 1;
  limit: number = 10;
  total: number = 0;
  totalPages: number = 0;

  // Form
  filterForm!: FormGroup;

  // Enums
  TripGroupStatus = TripGroupStatus;
  statusLabels = TRIP_GROUP_STATUS_LABELS;
  statusColors = TRIP_GROUP_STATUS_COLORS;

  // Advanced filters toggle
  showAdvancedFilters = false;

  // Getters for template binding compatibility
  get filters() {
    return this.filterForm?.value || {};
  }

  set filters(value: any) {
    if (this.filterForm) {
      this.filterForm.patchValue(value, { emitEvent: false });
    }
  }

  // Date input getters/setters for template compatibility
  get startDateFromInput(): string {
    return this.filterForm?.get('startDateFrom')?.value || '';
  }

  set startDateFromInput(value: string) {
    this.filterForm?.patchValue({ startDateFrom: value });
  }

  get startDateToInput(): string {
    return this.filterForm?.get('startDateTo')?.value || '';
  }

  set startDateToInput(value: string) {
    this.filterForm?.patchValue({ startDateTo: value });
  }

  // Active filters count
  get activeFiltersCount(): number {
    if (!this.filterForm) return 0;
    const values = this.filterForm.value;
    return Object.keys(values).filter(key => {
      const value = values[key];
      return value !== null && value !== undefined && value !== '';
    }).length;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.subscribeToQueryParams();
    this.subscribeToFormChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      // Basic filters
      search: [null],
      status: [null],
      startDateFrom: [null],
      startDateTo: [null],

      // Sorting
      sortBy: ['startDate'],
      sortOrder: ['DESC']
    });
  }

  private subscribeToQueryParams(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        // Pagination
        this.page = params['page'] ? Number(params['page']) : 1;
        this.limit = params['limit'] ? Number(params['limit']) : 10;

        // Update form with query params (without emitting to avoid loop)
        this.filterForm.patchValue({
          search: params['search'] || null,
          status: params['status'] || null,
          startDateFrom: params['startDateFrom'] || null,
          startDateTo: params['startDateTo'] || null,
          sortBy: params['sortBy'] || 'startDate',
          sortOrder: params['sortOrder'] || 'DESC'
        }, { emitEvent: false });

        // Show advanced filters if any advanced filter is present
        this.showAdvancedFilters = !!(params['startDateFrom'] || params['startDateTo']);

        this.loadTripGroups();
      });
  }

  private subscribeToFormChanges(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.page = 1; // Reset to first page on filter change
        this.updateQueryParams();
      });
  }

  // Method for template compatibility with ngModel
  onFilterChange(): void {
    // This method is called from template but actual reactivity is handled by subscribeToFormChanges
    // Just trigger a manual update
    this.page = 1;
    this.updateQueryParams();
    this.loadTripGroups();
  }

  loadTripGroups(): void {
    this.loading = true;
    this.error = null;

    // For now, we load all and filter/paginate client-side
    // TODO: Update backend to support server-side filtering/pagination
    this.tripGroupService.getAll().subscribe({
      next: (data) => {
        // Apply filters
        let filtered = this.applyFilters(data);

        // Apply sorting
        filtered = this.applySorting(filtered);

        // Store total
        this.total = filtered.length;
        this.totalPages = Math.ceil(this.total / this.limit);

        // Apply pagination
        const startIndex = (this.page - 1) * this.limit;
        this.tripGroups = filtered.slice(startIndex, startIndex + this.limit);

        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar las vueltas';
        console.error(err);
        this.loading = false;
      }
    });
  }

  private applyFilters(data: TripGroup[]): TripGroup[] {
    const formValue = this.filterForm.value;

    return data.filter(group => {
      // Search filter
      if (formValue.search) {
        const searchLower = formValue.search.toLowerCase();
        const matchesSearch =
          group.code?.toLowerCase().includes(searchLower) ||
          group.description?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (formValue.status && group.status !== formValue.status) {
        return false;
      }

      // Start date from filter
      if (formValue.startDateFrom) {
        const filterDate = new Date(formValue.startDateFrom);
        const groupDate = new Date(group.startDate);
        if (groupDate < filterDate) return false;
      }

      // Start date to filter
      if (formValue.startDateTo) {
        const filterDate = new Date(formValue.startDateTo);
        const groupDate = new Date(group.startDate);
        if (groupDate > filterDate) return false;
      }

      return true;
    });
  }

  private applySorting(data: TripGroup[]): TripGroup[] {
    const formValue = this.filterForm.value;
    const sortBy = formValue.sortBy || 'startDate';
    const sortOrder = formValue.sortOrder || 'DESC';

    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'startDate':
          aValue = new Date(a.startDate).getTime();
          bValue = new Date(b.startDate).getTime();
          break;
        case 'code':
          aValue = a.code;
          bValue = b.code;
          break;
        case 'profit':
          aValue = a.profit || 0;
          bValue = b.profit || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'ASC' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'ASC' ? 1 : -1;
      return 0;
    });
  }

  clearFilters(): void {
    this.filterForm.reset({
      sortBy: 'startDate',
      sortOrder: 'DESC'
    });
    this.page = 1;
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  deleteTripGroup(group: TripGroup): void {
    if (group.tripCount && group.tripCount > 0) {
      alert('No se puede eliminar la vuelta porque tiene viajes asociados');
      return;
    }

    if (confirm(`¿Está seguro que desea eliminar la vuelta ${group.code}?`)) {
      this.tripGroupService.delete(group.id).subscribe({
        next: () => {
          this.loadTripGroups();
        },
        error: (err) => {
          console.error('Error al eliminar:', err);
          alert('Error al eliminar la vuelta');
        }
      });
    }
  }

  get paginatedTripGroups(): TripGroup[] {
    return this.tripGroups;
  }

  // Pagination methods
  onPageChange(page: number): void {
    this.page = Number(page);
    this.updateQueryParams();
    this.loadTripGroups();
  }

  onLimitChange(limit: number): void {
    this.limit = Number(limit);
    this.page = 1;
    this.updateQueryParams();
    this.loadTripGroups();
  }

  private updateQueryParams(): void {
    const formValue = this.filterForm.value;
    const queryParams: any = {
      page: this.page,
      limit: this.limit
    };

    // Add form values to query params (excluding null/undefined/empty)
    Object.keys(formValue).forEach(key => {
      const value = formValue[key];
      if (value !== null && value !== undefined && value !== '') {
        queryParams[key] = value;
      }
    });

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      replaceUrl: true
    });
  }

  // Expose Math for template
  Math = Math;

  getStatusLabel(status: TripGroupStatus): string {
    return this.statusLabels[status];
  }

  getStatusClass(status: TripGroupStatus): string {
    return this.statusColors[status];
  }

  formatCurrency(amount: number | undefined): string {
    if (!amount && amount !== 0) return '$0';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }
}
