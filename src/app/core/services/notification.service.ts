import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, of } from 'rxjs';
import { tap, switchMap, startWith, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Notification, NotificationStats } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;

  // Signals for reactive state management
  private notificationsSignal = signal<Notification[]>([]);
  private statsSignal = signal<NotificationStats>({ total: 0, unread: 0 });

  // Public readonly computed signals
  public notifications = this.notificationsSignal.asReadonly();
  public stats = this.statsSignal.asReadonly();
  public unreadCount = computed(() => this.statsSignal().unread);
  public hasUnread = computed(() => this.statsSignal().unread > 0);

  // Auto-refresh interval (30 seconds)
  private readonly REFRESH_INTERVAL = 30000;
  private refreshSubscription?: any;

  constructor(private http: HttpClient) {}

  /**
   * Start auto-refresh of notifications
   */
  startAutoRefresh(): void {
    if (this.refreshSubscription) {
      return; // Already running
    }

    // Initial load + periodic refresh
    this.refreshSubscription = interval(this.REFRESH_INTERVAL)
      .pipe(
        startWith(0), // Load immediately
        switchMap(() => this.fetchNotifications())
      )
      .subscribe({
        next: (notifications) => {
          this.notificationsSignal.set(notifications);
          this.updateStats(notifications);
        },
        error: (error) => {
          console.error('Error fetching notifications:', error);
        }
      });
  }

  /**
   * Stop auto-refresh
   */
  stopAutoRefresh(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
      this.refreshSubscription = undefined;
    }
  }

  /**
   * Fetch notifications from API
   */
  fetchNotifications(): Observable<Notification[]> {
    return this.http.get<{ data: Notification[]; total: number; unread: number }>(this.apiUrl).pipe(
      tap(response => {
        this.notificationsSignal.set(response.data || []);
        this.statsSignal.set({ total: response.total || 0, unread: response.unread || 0 });
      }),
      map(response => response.data || [])
    );
  }

  /**
   * Mark a notification as read
   */
  markAsRead(notificationId: string): Observable<Notification> {
    return this.http.patch<Notification>(`${this.apiUrl}/${notificationId}/read`, {}).pipe(
      tap(updatedNotification => {
        const notifications = this.notificationsSignal();
        const index = notifications.findIndex(n => n.id === notificationId);
        if (index !== -1) {
          const updated = [...notifications];
          updated[index] = updatedNotification;
          this.notificationsSignal.set(updated);
          this.updateStats(updated);
        }
      })
    );
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/read-all`, {}).pipe(
      tap(() => {
        const notifications = this.notificationsSignal().map(n => ({ ...n, isRead: true }));
        this.notificationsSignal.set(notifications);
        this.updateStats(notifications);
      })
    );
  }

  /**
   * Delete a notification
   */
  deleteNotification(notificationId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${notificationId}`).pipe(
      tap(() => {
        const notifications = this.notificationsSignal().filter(n => n.id !== notificationId);
        this.notificationsSignal.set(notifications);
        this.updateStats(notifications);
      })
    );
  }

  /**
   * Clear all notifications
   */
  clearAll(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/clear-all`).pipe(
      tap(() => {
        this.notificationsSignal.set([]);
        this.updateStats([]);
      })
    );
  }

  /**
   * Update notification stats
   */
  private updateStats(notifications: Notification[]): void {
    const unread = notifications.filter(n => !n.isRead).length;
    this.statsSignal.set({
      total: notifications.length,
      unread
    });
  }

  /**
   * Get icon class for notification type
   */
  getIconClass(type: string): string {
    const iconMap: Record<string, string> = {
      INFO: 'text-blue-500',
      SUCCESS: 'text-green-500',
      WARNING: 'text-yellow-500',
      ERROR: 'text-red-500',
      TRIP_UPDATE: 'text-purple-500',
      INVOICE_GENERATED: 'text-indigo-500',
      PAYMENT_RECEIVED: 'text-emerald-500',
      MAINTENANCE_DUE: 'text-orange-500',
      DOCUMENT_EXPIRING: 'text-amber-500',
    };
    return iconMap[type] || 'text-gray-500';
  }

  /**
   * Get background class for notification type
   */
  getBackgroundClass(type: string): string {
    const bgMap: Record<string, string> = {
      INFO: 'bg-blue-50',
      SUCCESS: 'bg-green-50',
      WARNING: 'bg-yellow-50',
      ERROR: 'bg-red-50',
      TRIP_UPDATE: 'bg-purple-50',
      INVOICE_GENERATED: 'bg-indigo-50',
      PAYMENT_RECEIVED: 'bg-emerald-50',
      MAINTENANCE_DUE: 'bg-orange-50',
      DOCUMENT_EXPIRING: 'bg-amber-50',
    };
    return bgMap[type] || 'bg-gray-50';
  }
}
