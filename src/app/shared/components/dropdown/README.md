# Dropdown Component

Custom reusable dropdown component to replace ng-primitives dependency.

## Components

### DropdownComponent
Main dropdown container that handles the dropdown state and positioning.

### DropdownItemComponent
Individual menu items with support for buttons and links.

### DropdownDividerComponent
Visual separator between menu items.

## Usage

### Basic Example

```html
<app-dropdown align="right">
  <!-- Trigger button -->
  <ng-template #trigger>
    <button type="button" class="...">
      Open Menu
    </button>
  </ng-template>

  <!-- Dropdown menu content -->
  <ng-template #menu let-dropdown>
    <div class="py-1">
      <app-dropdown-item type="button" (itemClick)="handleClick(); dropdown.closeDropdown()">
        <svg>...</svg>
        Action
      </app-dropdown-item>

      <!-- Divider - Only show if there are items below -->
      <app-dropdown-divider *ngIf="hasItemsBelow"></app-dropdown-divider>

      <app-dropdown-item
        *ngIf="canDelete"
        type="button"
        variant="danger"
        (itemClick)="delete(); dropdown.closeDropdown()">
        <svg>...</svg>
        Delete
      </app-dropdown-item>
    </div>
  </ng-template>
</app-dropdown>
```

### Props

#### DropdownComponent
- `align`: `'left' | 'right'` - Menu alignment (default: `'left'`)
- `menuWidth`: `string` - Menu width (default: `'14rem'`)

#### DropdownItemComponent
- `type`: `'button' | 'link'` - Item type (default: `'button'`)
- `routerLink`: `string | any[]` - Router link (for type `'link'`)
- `variant`: `'default' | 'danger' | 'warning'` - Visual variant (default: `'default'`)
- `disabled`: `boolean` - Disable the item (default: `false`)
- `(itemClick)`: Event emitted when item is clicked

### Context

The `menu` template receives a `dropdown` context object with methods:
- `closeDropdown()`: Manually close the dropdown

Always call `dropdown.closeDropdown()` after handling a click event to close the menu.

## Features

- **Click outside to close**: Dropdown automatically closes when clicking outside
- **Escape key**: Press ESC to close the dropdown
- **Flexible positioning**: Support for left/right alignment with `position: fixed`
- **Custom width**: Configurable menu width
- **Variants**: Support for default, danger, and warning styles
- **Router integration**: Support for both buttons and router links
- **Accessibility**: Proper ARIA roles and keyboard support
- **Overflow-safe**: Uses fixed positioning to prevent clipping in tables with overflow
- **Auto-repositioning**: Automatically repositions on scroll and resize

## Best Practices

### Conditional Dividers

Always use conditional dividers to avoid empty separators when items are hidden:

```html
<!-- ❌ BAD - Divider always shows -->
<app-dropdown-divider></app-dropdown-divider>

<!-- ✅ GOOD - Divider only shows if there are items below -->
<app-dropdown-divider *ngIf="canDelete || canCancel"></app-dropdown-divider>
```

**Rule:** A divider should only appear if there are visible items on both sides of it.

### Always Close After Actions

Always call `dropdown.closeDropdown()` when handling click events:

```html
<!-- ✅ CORRECT -->
<app-dropdown-item (itemClick)="edit(item); dropdown.closeDropdown()">
  Edit
</app-dropdown-item>

<!-- ❌ WRONG - Dropdown stays open -->
<app-dropdown-item (itemClick)="edit(item)">
  Edit
</app-dropdown-item>
```

### Use Semantic Variants

Choose appropriate variants based on the action severity:

- `variant="default"` - Regular actions (Edit, View, Export)
- `variant="warning"` - Cautionary actions (Cancel, Archive, Suspend)
- `variant="danger"` - Destructive actions (Delete, Remove, Destroy)

## Migration from ng-primitives

Before (ng-primitives):
```html
<button [ngpMenuTrigger]="menuTemplate" [ngpMenuTriggerContext]="data">
  More options
</button>

<ng-template #menuTemplate let-data>
  <div ngpMenu class="...">
    <button ngpMenuItem (click)="action(data)">
      Action
    </button>
  </div>
</ng-template>
```

After (custom dropdown):
```html
<app-dropdown align="right">
  <ng-template #trigger>
    <button type="button">
      More options
    </button>
  </ng-template>

  <ng-template #menu let-dropdown>
    <div class="py-1">
      <app-dropdown-item type="button" (itemClick)="action(data); dropdown.closeDropdown()">
        Action
      </app-dropdown-item>
    </div>
  </ng-template>
</app-dropdown>
```

## Examples

See working examples in:
- `features/admin/trips/trip-list/trip-list.component.html`
- `features/admin/invoicing/invoice-list/invoice-list.component.html`
