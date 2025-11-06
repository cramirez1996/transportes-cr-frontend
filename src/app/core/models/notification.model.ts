export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  TRIP_UPDATE = 'TRIP_UPDATE',
  INVOICE_GENERATED = 'INVOICE_GENERATED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  MAINTENANCE_DUE = 'MAINTENANCE_DUE',
  DOCUMENT_EXPIRING = 'DOCUMENT_EXPIRING',
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  isRead: boolean;
  createdAt: Date;
  link?: string; // Optional link to navigate to related resource
  metadata?: Record<string, any>; // Additional data for specific notification types
}

export interface NotificationStats {
  total: number;
  unread: number;
}
