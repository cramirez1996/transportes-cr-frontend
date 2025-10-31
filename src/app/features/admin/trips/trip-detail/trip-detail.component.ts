import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TripService } from '../../../../core/services/trip.service';
import { TransactionService } from '../../../../core/services/transaction.service';
import { Trip, TripStatus } from '../../../../core/models/trip.model';
import { Transaction, TransactionType, TransactionCategory, CreateTransactionDto, PaymentMethod } from '../../../../core/models/transaction.model';
import { EntityDocumentsComponent } from '../../../../shared/components/entity-documents/entity-documents.component';
import { DocumentEntityType } from '../../../../core/models/document.model';

interface RouteStats {
  distanceKm: number;
  travelTime: string;
  avgSpeed: number;
  progressPercent: number;
}

@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, EntityDocumentsComponent],
  templateUrl: './trip-detail.component.html',
  styleUrl: './trip-detail.component.scss'
})
export class TripDetailComponent implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tripService = inject(TripService);
  private transactionService = inject(TransactionService);
  private fb = inject(FormBuilder);

  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  @ViewChild('mapMiniature', { static: false }) mapMiniature!: ElementRef;

  trip: Trip | null = null;
  expenses: Transaction[] = [];
  expenseCategories: TransactionCategory[] = [];
  loading = false;
  showExpenseForm = false;
  expenseForm!: FormGroup;
  editingExpenseId: string | null = null;

  // Map-related properties
  map: google.maps.Map | null = null;
  mapMini: google.maps.Map | null = null;
  showMapModal = false;
  showRouteHistory = false;
  lastGPSUpdate: Date | null = null;
  routeStats: RouteStats | null = null;
  currentLocationMarker: google.maps.Marker | null = null;
  originMarker: google.maps.Marker | null = null;
  destinationMarker: google.maps.Marker | null = null;
  routePolyline: google.maps.Polyline | null = null;
  // Miniature map markers
  currentLocationMarkerMini: google.maps.Marker | null = null;
  originMarkerMini: google.maps.Marker | null = null;
  destinationMarkerMini: google.maps.Marker | null = null;

  // Status configuration
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

  // Payment methods
  paymentMethods = [
    { value: PaymentMethod.CASH, label: 'Efectivo' },
    { value: PaymentMethod.TRANSFER, label: 'Transferencia' },
    { value: PaymentMethod.CARD, label: 'Tarjeta' },
    { value: PaymentMethod.CHECK, label: 'Cheque' }
  ];

  // Document entity type
  DocumentEntityType = DocumentEntityType;

  ngOnInit(): void {
    this.initExpenseForm();
    this.loadExpenseCategories();
    this.loadTripDetail();
  }

  ngAfterViewInit(): void {
    // Initialize miniature map after view is ready
    this.initializeMiniatureMap();
  }

  initializeMiniatureMap(): void {
    if (!this.mapMiniature) return;

    // Default center (Santiago, Chile)
    const defaultCenter = { lat: -33.4489, lng: -70.6693 };

    this.mapMini = new google.maps.Map(this.mapMiniature.nativeElement, {
      center: defaultCenter,
      zoom: 10,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: false,
      disableDefaultUI: true,
      gestureHandling: 'none',
    });

    // Load trip route data when available
    if (this.trip) {
      this.loadTripRouteMini();
    }
  }

  initializeFullMap(): void {
    if (!this.mapContainer) return;

    // Default center (Santiago, Chile)
    const defaultCenter = { lat: -33.4489, lng: -70.6693 };

    this.map = new google.maps.Map(this.mapContainer.nativeElement, {
      center: defaultCenter,
      zoom: 12,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
    });

    // Load trip route data when available
    if (this.trip) {
      this.loadTripRoute();
    }
  }

  loadTripRoute(): void {
    if (!this.map || !this.trip) return;

    // TODO: Replace with actual coordinates from trip data
    // For now, using placeholder coordinates
    const origin = { lat: -33.4489, lng: -70.6693 }; // Origin placeholder
    const destination = { lat: -33.0472, lng: -71.6127 }; // Destination placeholder

    // Add origin marker
    this.originMarker = new google.maps.Marker({
      position: origin,
      map: this.map,
      title: this.trip.origin,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#10B981',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2,
      },
    });

    // Add destination marker
    this.destinationMarker = new google.maps.Marker({
      position: destination,
      map: this.map,
      title: this.trip.destination,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#EF4444',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2,
      },
    });

    // Fit map bounds to show both markers
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(origin);
    bounds.extend(destination);
    this.map.fitBounds(bounds);

    // TODO: Load current vehicle position if trip is in progress
    if (this.trip.status === TripStatus.IN_PROGRESS) {
      this.loadCurrentVehiclePosition();
    }

    // TODO: Load route history if available
    if (this.showRouteHistory) {
      this.loadRouteHistory();
    }
  }

  loadCurrentVehiclePosition(): void {
    // TODO: Implement real-time GPS tracking
    // This will be connected to your GPS tracking service
    if (!this.map) return;

    // Placeholder current position
    const currentPosition = { lat: -33.2489, lng: -70.8693 };
    this.lastGPSUpdate = new Date();

    this.currentLocationMarker = new google.maps.Marker({
      position: currentPosition,
      map: this.map,
      title: 'Posición Actual',
      icon: {
        path: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0',
        fillColor: '#2563EB',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2,
        scale: 1.5,
      },
    });

    // Mock route stats
    this.routeStats = {
      distanceKm: 85.3,
      travelTime: '2h 15m',
      avgSpeed: 68,
      progressPercent: 45,
    };
  }

  loadRouteHistory(): void {
    // TODO: Load historical GPS points and draw polyline
    if (!this.map) return;

    // Placeholder route path
    const routePath = [
      { lat: -33.4489, lng: -70.6693 },
      { lat: -33.3489, lng: -70.7693 },
      { lat: -33.2489, lng: -70.8693 },
    ];

    this.routePolyline = new google.maps.Polyline({
      path: routePath,
      geodesic: true,
      strokeColor: '#60A5FA',
      strokeOpacity: 0.8,
      strokeWeight: 4,
      map: this.map,
    });
  }

  centerMapOnVehicle(): void {
    if (!this.map || !this.currentLocationMarker) return;

    const position = this.currentLocationMarker.getPosition();
    if (position) {
      this.map.setCenter(position);
      this.map.setZoom(15);
    }
  }

  toggleRouteHistory(): void {
    if (this.showRouteHistory) {
      this.loadRouteHistory();
    } else {
      // Hide route history
      if (this.routePolyline) {
        this.routePolyline.setMap(null);
        this.routePolyline = null;
      }
    }
  }

  loadTripRouteMini(): void {
    if (!this.mapMini || !this.trip) return;

    // TODO: Replace with actual coordinates from trip data
    const origin = { lat: -33.4489, lng: -70.6693 };
    const destination = { lat: -33.0472, lng: -71.6127 };

    // Add origin marker
    this.originMarkerMini = new google.maps.Marker({
      position: origin,
      map: this.mapMini,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#10B981',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2,
      },
    });

    // Add destination marker
    this.destinationMarkerMini = new google.maps.Marker({
      position: destination,
      map: this.mapMini,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#EF4444',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2,
      },
    });

    // Add current position if in progress
    if (this.trip.status === TripStatus.IN_PROGRESS) {
      const currentPosition = { lat: -33.2489, lng: -70.8693 };
      this.lastGPSUpdate = new Date();

      this.currentLocationMarkerMini = new google.maps.Marker({
        position: currentPosition,
        map: this.mapMini,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: '#2563EB',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
      });

      // Mock route stats
      this.routeStats = {
        distanceKm: 85.3,
        travelTime: '2h 15m',
        avgSpeed: 68,
        progressPercent: 45,
      };
    }

    // Fit map bounds to show all markers
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(origin);
    bounds.extend(destination);
    this.mapMini.fitBounds(bounds);
  }

  openMapModal(): void {
    this.showMapModal = true;
    // Initialize full map after modal is shown
    setTimeout(() => {
      this.initializeFullMap();
    }, 100);
  }

  closeMapModal(): void {
    this.showMapModal = false;
    // Clean up full map
    this.map = null;
    this.originMarker = null;
    this.destinationMarker = null;
    this.currentLocationMarker = null;
    this.routePolyline = null;
  }

  initExpenseForm(): void {
    this.expenseForm = this.fb.group({
      categoryId: ['', Validators.required],
      description: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      paymentMethod: [PaymentMethod.CASH, Validators.required],
      referenceNumber: [''],
      date: [new Date().toISOString().split('T')[0], Validators.required]
    });
  }

  loadExpenseCategories(): void {
    this.transactionService.getCategories(TransactionType.EXPENSE).subscribe({
      next: (categories) => {
        this.expenseCategories = categories;
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
      }
    });
  }

  loadTripDetail(): void {
    const tripId = this.route.snapshot.paramMap.get('id');
    if (!tripId) {
      alert('ID de viaje no válido');
      this.router.navigate(['/admin/trips']);
      return;
    }

    this.loading = true;
    this.tripService.getTripById(tripId).subscribe({
      next: (trip) => {
        this.trip = trip;
        this.loadExpenses(tripId);
        // Initialize maps if they're already created
        if (this.mapMini) {
          this.loadTripRouteMini();
        }
        if (this.map) {
          this.loadTripRoute();
        }
      },
      error: (err) => {
        console.error('Error al cargar viaje:', err);
        alert('Error al cargar el detalle del viaje');
        this.loading = false;
      }
    });
  }

  loadExpenses(tripId: string): void {
    this.transactionService.getTransactions({
      type: TransactionType.EXPENSE,
      tripId: tripId
    }).subscribe({
      next: (response) => {
        this.expenses = response.data;
        this.updateTripCalculations();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar gastos:', err);
        this.loading = false;
      }
    });
  }

  updateTripCalculations(): void {
    if (!this.trip) return;

    const totalExpenses = this.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const agreedPrice = parseFloat(this.trip.agreedPrice);

    this.trip.totalExpenses = totalExpenses;
    this.trip.profit = agreedPrice - totalExpenses;
  }

  toggleExpenseForm(): void {
    this.showExpenseForm = !this.showExpenseForm;
    if (!this.showExpenseForm) {
      this.resetExpenseForm();
    }
  }

  resetExpenseForm(): void {
    this.editingExpenseId = null;
    this.expenseForm.reset({
      categoryId: '',
      description: '',
      amount: 0,
      paymentMethod: PaymentMethod.CASH,
      referenceNumber: '',
      date: new Date().toISOString().split('T')[0]
    });
  }

  saveExpense(): void {
    if (this.expenseForm.invalid || !this.trip) return;

    const formValue = this.expenseForm.value;
    const expenseData: CreateTransactionDto = {
      type: TransactionType.EXPENSE,
      categoryId: formValue.categoryId,
      description: formValue.description,
      amount: parseFloat(formValue.amount),
      paymentMethod: formValue.paymentMethod,
      referenceNumber: formValue.referenceNumber || undefined,
      date: new Date(formValue.date),
      tripId: this.trip.id
    };

    if (this.editingExpenseId) {
      // Update existing expense
      this.transactionService.updateTransaction(this.editingExpenseId, expenseData).subscribe({
        next: () => {
          alert('Gasto actualizado exitosamente');
          this.loadExpenses(this.trip!.id);
          this.toggleExpenseForm();
        },
        error: (err) => {
          console.error('Error al actualizar gasto:', err);
          alert('Error al actualizar el gasto');
        }
      });
    } else {
      // Create new expense
      this.transactionService.createTransaction(expenseData).subscribe({
        next: () => {
          alert('Gasto agregado exitosamente');
          this.loadExpenses(this.trip!.id);
          this.toggleExpenseForm();
        },
        error: (err) => {
          console.error('Error al agregar gasto:', err);
          alert('Error al agregar el gasto');
        }
      });
    }
  }

  editExpense(expense: Transaction): void {
    this.editingExpenseId = expense.id;
    this.showExpenseForm = true;

    this.expenseForm.patchValue({
      categoryId: expense.category?.id || '',
      description: expense.description,
      amount: expense.amount,
      paymentMethod: expense.paymentMethod,
      referenceNumber: expense.referenceNumber || '',
      date: expense.date ? this.formatDateForInput(expense.date) : ''
    });
  }

  deleteExpense(expense: Transaction): void {
    if (!this.trip) return;

    if (confirm(`¿Eliminar el gasto "${expense.description}"?`)) {
      this.transactionService.deleteTransaction(expense.id).subscribe({
        next: () => {
          alert('Gasto eliminado exitosamente');
          this.loadExpenses(this.trip!.id);
        },
        error: (err) => {
          console.error('Error al eliminar gasto:', err);
          alert('Error al eliminar el gasto');
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/trips']);
  }

  formatDate(date: Date | undefined | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateForInput(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatCurrency(amount: string | number | undefined): string {
    if (amount === undefined) return '$0';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(numAmount);
  }

  canEditExpenses(): boolean {
    return this.trip?.status !== TripStatus.CANCELLED;
  }

  calculateProfitMargin(): number {
    if (!this.trip || !this.trip.profit) return 0;
    const agreedPrice = parseFloat(this.trip.agreedPrice);
    if (agreedPrice === 0) return 0;
    return (this.trip.profit / agreedPrice) * 100;
  }
}
