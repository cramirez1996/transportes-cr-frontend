import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MaintenanceService } from '../../../core/services/maintenance.service';
import { MaintenanceAlert, AlertSeverity } from '../../../core/models/maintenance.model';

@Component({
  selector: 'app-maintenance-alerts-widget',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './maintenance-alerts-widget.component.html',
  styleUrl: './maintenance-alerts-widget.component.scss'
})
export class MaintenanceAlertsWidgetComponent implements OnInit, OnDestroy {
  private maintenanceService = inject(MaintenanceService);
  private destroy$ = new Subject<void>();

  alerts: MaintenanceAlert[] = [];
  loading = false;
  error: string | null = null;

  AlertSeverity = AlertSeverity;

  // Summary counts
  criticalCount = 0;
  warningCount = 0;
  infoCount = 0;

  ngOnInit(): void {
    this.loadAlerts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAlerts(): void {
    this.loading = true;
    this.error = null;

    this.maintenanceService.getMaintenanceAlerts({ isDismissed: false })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (alerts) => {
          this.alerts = alerts.slice(0, 5); // Solo mostrar las primeras 5
          this.calculateSummaryCounts(alerts);
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Error al cargar alertas';
          console.error('Error loading alerts:', err);
          this.loading = false;
        }
      });
  }

  private calculateSummaryCounts(alerts: MaintenanceAlert[]): void {
    this.criticalCount = alerts.filter(a => a.severity === AlertSeverity.CRITICAL).length;
    this.warningCount = alerts.filter(a => a.severity === AlertSeverity.WARNING).length;
    this.infoCount = alerts.filter(a => a.severity === AlertSeverity.INFO).length;
  }

  dismissAlert(alert: MaintenanceAlert, event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    if (confirm('¿Deseas marcar esta alerta como vista?')) {
      this.maintenanceService.dismissAlert(alert.id).subscribe({
        next: () => {
          this.loadAlerts();
        },
        error: (err) => {
          console.error('Error dismissing alert:', err);
          alert('Error al marcar la alerta');
        }
      });
    }
  }

  getSeverityBadgeClass(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return 'bg-red-100 text-red-800 border-red-200';
      case AlertSeverity.WARNING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case AlertSeverity.INFO:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  getSeverityIcon(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      case AlertSeverity.WARNING:
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
      case AlertSeverity.INFO:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  getSeverityLabel(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return 'Crítico';
      case AlertSeverity.WARNING:
        return 'Advertencia';
      case AlertSeverity.INFO:
        return 'Información';
      default:
        return severity;
    }
  }

  getAlertTimeText(alert: MaintenanceAlert): string {
    if (alert.daysRemaining !== null && alert.daysRemaining !== undefined) {
      if (alert.daysRemaining <= 0) {
        return 'Vencido';
      }
      return `${alert.daysRemaining} día${alert.daysRemaining !== 1 ? 's' : ''}`;
    }
    if (alert.kmRemaining !== null && alert.kmRemaining !== undefined) {
      if (alert.kmRemaining <= 0) {
        return 'Vencido';
      }
      return `${alert.kmRemaining.toLocaleString()} km`;
    }
    return '';
  }
}
