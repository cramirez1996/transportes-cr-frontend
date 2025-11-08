export interface AuditLog {
  id: string;
  userId?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogFilters {
  userId?: string;
  resource?: string;
  resourceId?: string;
  action?: string;
  success?: boolean;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedAuditLogs {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditLogStatistics {
  totalLogs: number;
  successfulOperations: number;
  failedOperations: number;
  actionBreakdown: Record<string, number>;
  resourceBreakdown: Record<string, number>;
}
