# Custom Select Component

A fully customizable select dropdown component with support for rich content (avatars, icons, secondary text, etc.).

## Features

- ✅ Fully customizable option templates
- ✅ Support for avatars, icons, and multi-line content
- ✅ Searchable options
- ✅ Keyboard navigation (Arrow keys, Enter, Escape)
- ✅ Clear selection button
- ✅ Reactive Forms compatible (ControlValueAccessor)
- ✅ Disabled state support
- ✅ Responsive sizes (sm, md, lg)
- ✅ Accessible (ARIA attributes)
- ✅ Smooth animations

## Basic Usage

### 1. Simple Select (Text Only)

```typescript
import { CustomSelectComponent, CustomSelectOption } from './shared/components/custom-select/custom-select.component';

@Component({
  // ...
  imports: [CustomSelectComponent]
})
export class MyComponent {
  statusOptions: CustomSelectOption[] = [
    { value: 'active', label: 'Activo' },
    { value: 'inactive', label: 'Inactivo' },
    { value: 'pending', label: 'Pendiente' }
  ];

  selectedStatus = 'active';
}
```

```html
<app-custom-select
  [options]="statusOptions"
  [(ngModel)]="selectedStatus"
  placeholder="Seleccione un estado"
>
</app-custom-select>
```

### 2. With Reactive Forms

```typescript
this.form = this.fb.group({
  customerId: ['', Validators.required]
});

customerOptions: CustomSelectOption[] = [
  { value: '1', label: 'Cliente A' },
  { value: '2', label: 'Cliente B' }
];
```

```html
<form [formGroup]="form">
  <app-custom-select
    formControlName="customerId"
    [options]="customerOptions"
    placeholder="Seleccione un cliente"
  >
  </app-custom-select>
</form>
```

## Advanced Usage

### 3. Custom Template - Customer/Supplier with Avatar

```typescript
import { CustomSelectComponent, CustomSelectOption } from './shared/components/custom-select/custom-select.component';

@Component({
  // ...
  imports: [CustomSelectComponent]
})
export class InvoiceFormComponent {
  customerOptions: CustomSelectOption[] = [];

  ngOnInit() {
    this.customerOptions = this.customers.map(customer => ({
      value: customer.id,
      label: customer.businessName,
      data: {
        rut: customer.rut,
        email: customer.email,
        avatar: customer.avatar || this.getInitials(customer.businessName)
      }
    }));
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}
```

```html
<app-custom-select
  formControlName="customerId"
  [options]="customerOptions"
  [searchable]="true"
  [clearable]="true"
  placeholder="Seleccione un cliente"
>
  <!-- Custom template for dropdown options -->
  <ng-template #optionTemplate let-option>
    <div class="flex items-center gap-3 w-full">
      <!-- Avatar -->
      <div class="flex-shrink-0">
        <div
          class="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold text-sm"
        >
          {{ option.data.avatar }}
        </div>
      </div>

      <!-- Customer info -->
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-900 truncate">
          {{ option.label }}
        </p>
        <p class="text-xs text-gray-500 truncate">
          RUT: {{ option.data.rut }}
        </p>
      </div>
    </div>
  </ng-template>

  <!-- Custom template for selected value (shown in trigger) -->
  <ng-template #selectedTemplate let-option>
    <div class="flex items-center gap-2">
      <!-- Avatar -->
      <div
        class="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold text-xs"
      >
        {{ option.data.avatar }}
      </div>

      <!-- Customer name -->
      <span class="text-sm font-medium text-gray-900">
        {{ option.label }}
      </span>

      <!-- RUT -->
      <span class="text-xs text-gray-500">
        ({{ option.data.rut }})
      </span>
    </div>
  </ng-template>
</app-custom-select>
```

### 4. Custom Template - Vehicle with Icon

```typescript
vehicleOptions: CustomSelectOption[] = this.vehicles.map(vehicle => ({
  value: vehicle.id,
  label: `${vehicle.brand} ${vehicle.model}`,
  data: {
    plate: vehicle.licensePlate,
    year: vehicle.year,
    type: vehicle.type,
    icon: this.getVehicleIcon(vehicle.type)
  }
}));
```

```html
<app-custom-select
  formControlName="vehicleId"
  [options]="vehicleOptions"
  [searchable]="true"
  placeholder="Seleccione un vehículo"
>
  <ng-template #optionTemplate let-option>
    <div class="flex items-center gap-3 w-full">
      <!-- Icon -->
      <div class="flex-shrink-0 text-gray-400">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            [attr.d]="option.data.icon"
          />
        </svg>
      </div>

      <!-- Vehicle info -->
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-900">
          {{ option.label }}
        </p>
        <p class="text-xs text-gray-500">
          {{ option.data.plate }} • {{ option.data.year }}
        </p>
      </div>
    </div>
  </ng-template>

  <ng-template #selectedTemplate let-option>
    <div class="flex items-center gap-2">
      <span class="text-sm font-medium">{{ option.label }}</span>
      <span class="text-xs text-gray-500">({{ option.data.plate }})</span>
    </div>
  </ng-template>
</app-custom-select>
```

### 5. Custom Template - Status with Badge

```typescript
statusOptions: CustomSelectOption[] = [
  {
    value: 'completed',
    label: 'Completado',
    data: { color: 'green', icon: '✓' }
  },
  {
    value: 'pending',
    label: 'Pendiente',
    data: { color: 'yellow', icon: '⏱' }
  },
  {
    value: 'cancelled',
    label: 'Cancelado',
    data: { color: 'red', icon: '✕' }
  }
];
```

```html
<app-custom-select
  formControlName="status"
  [options]="statusOptions"
  placeholder="Seleccione un estado"
>
  <ng-template #optionTemplate let-option>
    <div class="flex items-center gap-2">
      <span
        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
        [ngClass]="{
          'bg-green-100 text-green-800': option.data.color === 'green',
          'bg-yellow-100 text-yellow-800': option.data.color === 'yellow',
          'bg-red-100 text-red-800': option.data.color === 'red'
        }"
      >
        {{ option.data.icon }} {{ option.label }}
      </span>
    </div>
  </ng-template>

  <ng-template #selectedTemplate let-option>
    <span
      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      [ngClass]="{
        'bg-green-100 text-green-800': option.data.color === 'green',
        'bg-yellow-100 text-yellow-800': option.data.color === 'yellow',
        'bg-red-100 text-red-800': option.data.color === 'red'
      }"
    >
      {{ option.data.icon }} {{ option.label }}
    </span>
  </ng-template>
</app-custom-select>
```

## API Reference

### Inputs

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `options` | `CustomSelectOption[]` | `[]` | Array of options to display |
| `placeholder` | `string` | `'Seleccione una opción'` | Placeholder text when no value selected |
| `disabled` | `boolean` | `false` | Disable the select |
| `searchable` | `boolean` | `false` | Enable search/filter functionality |
| `clearable` | `boolean` | `false` | Show clear button to reset selection |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size of the select |

### Outputs

| Event | Type | Description |
|-------|------|-------------|
| `selectionChange` | `EventEmitter<any>` | Emits when selection changes |

### Templates

| Template | Context | Description |
|----------|---------|-------------|
| `#optionTemplate` | `{ $implicit: CustomSelectOption }` | Custom template for each option in dropdown |
| `#selectedTemplate` | `{ $implicit: CustomSelectOption }` | Custom template for selected value display |

### CustomSelectOption Interface

```typescript
interface CustomSelectOption {
  value: any;           // The value to bind
  label: string;        // Display text (used in default template)
  disabled?: boolean;   // Disable this option
  data?: any;          // Custom data for your templates
}
```

## Keyboard Navigation

- **Arrow Down**: Move focus to next option
- **Arrow Up**: Move focus to previous option
- **Enter**: Select focused option
- **Escape**: Close dropdown

## Styling

The component uses Tailwind CSS classes and follows the project's design system:

- Primary color: Blue (`#3B82F6`)
- Border radius: `rounded-md` (0.375rem)
- Consistent with other form elements

## Examples in Codebase

- **Invoice Form**: Customer/Supplier selection with avatar and RUT
- **Trip Form**: Vehicle selection with plate and type
- **Status Changes**: Status selection with colored badges

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support

## Notes

- The component implements `ControlValueAccessor` for full Angular Forms integration
- Dropdown uses `position: absolute` to avoid clipping issues
- Custom scrollbar styling for dropdown list (Chrome/Edge)
- Animations are optional and can be disabled via CSS
