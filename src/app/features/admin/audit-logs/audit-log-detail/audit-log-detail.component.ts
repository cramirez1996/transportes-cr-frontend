import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuditLogService } from '../../../../core/services/audit-log.service';
import { AuditLog } from '../../../../core/models/audit-log.model';

interface FieldChange {
  field: string;
  oldValue: any;
  newValue: any;
  type: 'added' | 'removed' | 'changed';
}

@Component({
  selector: 'app-audit-log-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './audit-log-detail.component.html',
  styleUrls: ['./audit-log-detail.component.scss'],
})
export class AuditLogDetailComponent implements OnInit {
  auditLog: AuditLog | null = null;
  loading = false;
  error: string | null = null;
  changes: FieldChange[] = [];

  constructor(
    private route: ActivatedRoute,
    private auditLogService: AuditLogService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadAuditLog(id);
    }
  }

  loadAuditLog(id: string): void {
    this.loading = true;
    this.error = null;

    this.auditLogService.getAuditLogById(id).subscribe({
      next: (log) => {
        this.auditLog = log;
        this.detectChanges();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading audit log:', error);
        this.error = 'Error al cargar el registro de auditoría';
        this.loading = false;
      },
    });
  }

  detectChanges(): void {
    if (!this.auditLog) return;

    const { oldValues, newValues } = this.auditLog;
    this.changes = [];

    if (!oldValues && !newValues) return;

    // Get all unique keys from both objects
    const allKeys = new Set([
      ...Object.keys(oldValues || {}),
      ...Object.keys(newValues || {}),
    ]);

    allKeys.forEach((key) => {
      const oldValue = oldValues?.[key];
      const newValue = newValues?.[key];

      if (oldValue === undefined && newValue !== undefined) {
        // Field was added
        this.changes.push({
          field: key,
          oldValue: null,
          newValue,
          type: 'added',
        });
      } else if (oldValue !== undefined && newValue === undefined) {
        // Field was removed
        this.changes.push({
          field: key,
          oldValue,
          newValue: null,
          type: 'removed',
        });
      } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        // Field was changed
        this.changes.push({
          field: key,
          oldValue,
          newValue,
          type: 'changed',
        });
      }
    });
  }

  formatAction(action: string): string {
    return this.auditLogService.formatAction(action);
  }

  formatResource(resource: string): string {
    return this.auditLogService.formatResource(resource);
  }

  getStatusBadgeClass(success: boolean): string {
    return success
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  }

  getStatusText(success: boolean): string {
    return success ? 'Éxito' : 'Error';
  }

  getUserDisplayName(log: AuditLog): string {
    if (log.user) {
      return `${log.user.firstName} ${log.user.lastName}`;
    }
    return 'Sistema';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '—';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }

    return String(value);
  }

  getChangeBadgeClass(type: 'added' | 'removed' | 'changed'): string {
    switch (type) {
      case 'added':
        return 'bg-green-100 text-green-800';
      case 'removed':
        return 'bg-red-100 text-red-800';
      case 'changed':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getChangeLabel(type: 'added' | 'removed' | 'changed'): string {
    switch (type) {
      case 'added':
        return 'Agregado';
      case 'removed':
        return 'Eliminado';
      case 'changed':
        return 'Modificado';
      default:
        return '';
    }
  }

  get hasChanges(): boolean {
    return this.changes.length > 0;
  }
}
