import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AuditLogService } from '../../../../core/services/audit-log.service';
import {
  AuditLog,
  AuditLogFilters,
  PaginatedAuditLogs,
} from '../../../../core/models/audit-log.model';

@Component({
  selector: 'app-audit-log-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './audit-log-list.component.html',
  styleUrls: ['./audit-log-list.component.scss'],
})
export class AuditLogListComponent implements OnInit {
  auditLogs: AuditLog[] = [];
  loading = false;
  error: string | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 0;

  // Filters
  filterForm!: FormGroup;
  showFilters = false;

  // Dropdown options
  resourceTypes: string[] = [];
  actionTypes: string[] = [];

  // Expose Math to template
  protected readonly Math = Math;

  constructor(
    private auditLogService: AuditLogService,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadResourceTypes();
    this.loadActionTypes();
    this.loadAuditLogs();
  }

  initForm(): void {
    this.filterForm = this.fb.group({
      resource: [''],
      action: [''],
      success: [''],
      search: [''],
      fromDate: [''],
      toDate: [''],
    });
  }

  loadResourceTypes(): void {
    this.resourceTypes = this.auditLogService.getResourceTypes();
  }

  loadActionTypes(): void {
    this.actionTypes = this.auditLogService.getActionTypes();
  }

  loadAuditLogs(): void {
    this.loading = true;
    this.error = null;

    const filters: AuditLogFilters = {
      ...this.filterForm.value,
      page: this.currentPage,
      limit: this.pageSize,
    };

    // Remove empty filters
    Object.keys(filters).forEach((key) => {
      if (filters[key as keyof AuditLogFilters] === '' || filters[key as keyof AuditLogFilters] === null) {
        delete filters[key as keyof AuditLogFilters];
      }
    });

    this.auditLogService.getAuditLogs(filters).subscribe({
      next: (response: PaginatedAuditLogs) => {
        this.auditLogs = response.data;
        this.totalItems = response.total;
        this.totalPages = response.totalPages;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading audit logs:', error);
        this.error = 'Error al cargar los registros de auditoría';
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    this.currentPage = 1; // Reset to first page
    this.loadAuditLogs();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.currentPage = 1;
    this.loadAuditLogs();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadAuditLogs();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadAuditLogs();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadAuditLogs();
    }
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

  get pages(): number[] {
    const maxPages = 5;
    const half = Math.floor(maxPages / 2);
    let start = Math.max(this.currentPage - half, 1);
    let end = Math.min(start + maxPages - 1, this.totalPages);

    if (end - start < maxPages - 1) {
      start = Math.max(end - maxPages + 1, 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
}
