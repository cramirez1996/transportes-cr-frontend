# Notifications Component

## Overview

The notifications system provides a real-time notification center in the application header, following the platform's design guidelines.

## Features

✅ **Real-time updates** - Auto-refreshes every 30 seconds
✅ **Unread badge** - Shows count of unread notifications
✅ **Rich notifications** - Different types with icons and colors
✅ **Mark as read** - Individual or bulk actions
✅ **Navigation** - Click to navigate to related resource
✅ **Delete** - Individual or bulk delete
✅ **Empty state** - User-friendly empty state
✅ **Responsive** - Works on mobile and desktop

## Architecture

### Components

- **NotificationsComponent** - Dropdown UI component in navbar
- **NotificationService** - Service managing notification state and API calls
- **Notification Model** - TypeScript interfaces and enums

### Files

```
frontend/src/app/
├── core/
│   ├── models/
│   │   └── notification.model.ts      # Types and interfaces
│   └── services/
│       └── notification.service.ts    # Service with signals
└── shared/
    └── components/
        └── notifications/
            ├── notifications.component.ts
            ├── notifications.component.html
            ├── notifications.component.scss
            └── README.md (this file)
```

## Usage

### Integration in Header

Already integrated in `app-header`:

```html
<!-- header.component.html -->
<app-notifications></app-notifications>
```

### Notification Types

```typescript
enum NotificationType {
  INFO = 'INFO',                       // General information
  SUCCESS = 'SUCCESS',                 // Success messages
  WARNING = 'WARNING',                 // Warning alerts
  ERROR = 'ERROR',                     // Error alerts
  TRIP_UPDATE = 'TRIP_UPDATE',         // Trip status changes
  INVOICE_GENERATED = 'INVOICE_GENERATED',  // Invoice created
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',    // Payment confirmed
  MAINTENANCE_DUE = 'MAINTENANCE_DUE',      // Maintenance reminder
  DOCUMENT_EXPIRING = 'DOCUMENT_EXPIRING',  // Document expiration
}
```

Each type has:
- Unique icon
- Color scheme (icon color + background)
- Visual distinction in the UI

### Priority Levels

```typescript
enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}
```

## Service API

### NotificationService

```typescript
import { NotificationService } from '@core/services/notification.service';

// Inject service
private notificationService = inject(NotificationService);

// Access reactive state (signals)
notifications = this.notificationService.notifications;
unreadCount = this.notificationService.unreadCount;
hasUnread = this.notificationService.hasUnread;

// Methods
this.notificationService.startAutoRefresh();
this.notificationService.stopAutoRefresh();
this.notificationService.fetchNotifications().subscribe(...);
this.notificationService.markAsRead(id).subscribe(...);
this.notificationService.markAllAsRead().subscribe(...);
this.notificationService.deleteNotification(id).subscribe(...);
this.notificationService.clearAll().subscribe(...);
```

### Signal-based State

The service uses Angular signals for reactive state management:

```typescript
// Read-only signals
notifications = signal<Notification[]>([]);
unreadCount = computed(() => this.stats().unread);
hasUnread = computed(() => this.stats().unread > 0);
```

## Backend Integration

### Required Endpoints

The service expects these API endpoints:

```
GET    /api/notifications           - Get all notifications
PATCH  /api/notifications/:id/read  - Mark notification as read
PATCH  /api/notifications/read-all  - Mark all as read
DELETE /api/notifications/:id       - Delete notification
DELETE /api/notifications/clear-all - Clear all notifications
```

### Response Format

```typescript
interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  isRead: boolean;
  createdAt: Date;
  link?: string;
  metadata?: Record<string, any>;
}
```

## Design Patterns

### Following Platform Guidelines

✅ **Custom Dropdown** - Uses platform's dropdown pattern
✅ **Color Scheme** - Follows Tailwind CSS utility classes
✅ **Hover States** - Consistent hover effects
✅ **Icons** - Heroicons stroke icons
✅ **Typography** - Consistent font sizes and weights
✅ **Spacing** - Standard gap and padding utilities
✅ **Transitions** - Smooth animations

### Consistent with Other Components

- Similar to user dropdown in header
- Matches custom-select styling
- Follows table action buttons pattern
- Uses same color palette

## User Interactions

### Bell Icon
- Shows unread count badge
- Highlights when dropdown is open
- Hover state for visual feedback

### Dropdown
- Click bell to toggle
- Click outside to close
- Click notification to navigate
- Hover to show delete button

### Actions
- **Mark as read** - Click unread notification
- **Mark all as read** - Button in header
- **Delete** - Hover + click trash icon
- **Clear all** - Button in footer
- **Navigate** - Click notification with link

## Auto-refresh

The component automatically:
1. Starts refresh on `ngOnInit`
2. Stops refresh on `ngOnDestroy`
3. Fetches notifications every 30 seconds
4. Updates badge count in real-time

## Empty State

User-friendly empty state with:
- Large bell icon
- Helpful message
- Centered layout
- Subtle colors

## Accessibility

- ✅ Semantic HTML
- ✅ ARIA labels (can be improved)
- ✅ Keyboard navigation (via dropdown)
- ✅ Focus states
- ✅ Screen reader friendly

## Mobile Responsive

- Fixed positioning to prevent clipping
- Max width on small screens
- Touch-friendly tap targets
- Scroll for long lists

## Future Enhancements

- [ ] WebSocket integration for real-time push
- [ ] Sound notifications
- [ ] Browser notifications API
- [ ] Filter by type/priority
- [ ] Search notifications
- [ ] Archive feature
- [ ] Notification preferences
- [ ] Mark as unread
- [ ] Notification grouping

## Testing

To test locally:

1. **Start backend** with notification endpoints
2. **Create test notifications** via API or database
3. **Open application** and check header
4. **Click bell icon** to see dropdown
5. **Test interactions** (mark as read, delete, etc.)

## Example Notification Creation

```typescript
// Backend example (NestJS)
await notificationsService.create({
  userId: user.id,
  tenantId: tenant.id,
  title: 'Viaje completado',
  message: 'El viaje a Valparaíso se completó exitosamente',
  type: NotificationType.TRIP_UPDATE,
  priority: NotificationPriority.MEDIUM,
  link: '/admin/trips/123',
  metadata: { tripId: '123', status: 'completed' }
});
```

## Support

For questions or issues, refer to:
- Project documentation: `/docs`
- CLAUDE.md: Design patterns and guidelines
- Component source code
