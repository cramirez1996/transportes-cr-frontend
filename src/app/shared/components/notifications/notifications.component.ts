import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { Notification, NotificationType } from '../../../core/models/notification.model';

@Component({
  selector: 'app-notifications',
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss'
})
export class NotificationsComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  // Expose signals from service
  notifications = this.notificationService.notifications;
  unreadCount = this.notificationService.unreadCount;
  hasUnread = this.notificationService.hasUnread;

  isOpen = false;
  isLoading = false;

  ngOnInit(): void {
    // Start auto-refresh when component is initialized
    this.notificationService.startAutoRefresh();
  }

  ngOnDestroy(): void {
    // Stop auto-refresh when component is destroyed
    this.notificationService.stopAutoRefresh();
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  onNotificationClick(notification: Notification): void {
    // Mark as read
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe({
        error: (error) => {
          console.error('Error marking notification as read:', error);
        }
      });
    }

    // Navigate if link exists
    if (notification.link) {
      this.router.navigate([notification.link]);
    }

    this.closeDropdown();
  }

  markAllAsRead(): void {
    if (this.unreadCount() === 0) return;

    this.isLoading = true;
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error marking all as read:', error);
        this.isLoading = false;
      }
    });
  }

  clearAll(): void {
    if (this.notifications().length === 0) return;

    if (confirm('¿Estás seguro de que deseas eliminar todas las notificaciones?')) {
      this.isLoading = true;
      this.notificationService.clearAll().subscribe({
        next: () => {
          this.isLoading = false;
          this.closeDropdown();
        },
        error: (error) => {
          console.error('Error clearing notifications:', error);
          this.isLoading = false;
        }
      });
    }
  }

  deleteNotification(event: Event, notificationId: string): void {
    event.stopPropagation();

    this.notificationService.deleteNotification(notificationId).subscribe({
      error: (error) => {
        console.error('Error deleting notification:', error);
      }
    });
  }

  getNotificationIcon(type: NotificationType): string {
    const iconMap: Record<NotificationType, string> = {
      [NotificationType.INFO]: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      [NotificationType.SUCCESS]: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      [NotificationType.WARNING]: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      [NotificationType.ERROR]: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
      [NotificationType.TRIP_UPDATE]: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0',
      [NotificationType.INVOICE_GENERATED]: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      [NotificationType.PAYMENT_RECEIVED]: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
      [NotificationType.MAINTENANCE_DUE]: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
      [NotificationType.DOCUMENT_EXPIRING]: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    };
    return iconMap[type] || iconMap[NotificationType.INFO];
  }

  getIconClass(type: NotificationType): string {
    return this.notificationService.getIconClass(type);
  }

  getBackgroundClass(type: NotificationType): string {
    return this.notificationService.getBackgroundClass(type);
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return notificationDate.toLocaleDateString('es-CL');
  }
}
