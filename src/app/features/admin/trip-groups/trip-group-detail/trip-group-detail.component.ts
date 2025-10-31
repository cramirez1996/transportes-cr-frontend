import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TripGroup, TRIP_GROUP_STATUS_LABELS, TRIP_GROUP_STATUS_COLORS } from '../../../../core/models/trip-group.model';
import { TripGroupService } from '../../../../core/services/trip-group.service';

@Component({
  selector: 'app-trip-group-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './trip-group-detail.component.html',
  styleUrl: './trip-group-detail.component.scss'
})
export class TripGroupDetailComponent implements OnInit {
  tripGroup: TripGroup | null = null;
  isLoading = true;
  statusLabels = TRIP_GROUP_STATUS_LABELS;
  statusColors = TRIP_GROUP_STATUS_COLORS;

  constructor(
    private route: ActivatedRoute,
    private tripGroupService: TripGroupService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTripGroup(id);
    }
  }

  loadTripGroup(id: string): void {
    this.isLoading = true;
    this.tripGroupService.getById(id).subscribe({
      next: (data) => {
        this.tripGroup = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading trip group:', error);
        this.isLoading = false;
      },
    });
  }

  formatCurrency(amount: number | undefined): string {
    if (!amount) return '$0';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
