import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  TemplateRef,
  ContentChild,
  HostListener,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface CustomSelectOption {
  value: any;
  label: string;
  disabled?: boolean;
  data?: any; // Additional data for custom rendering
  searchableText?: string; // Optional searchable text (e.g., to include IDs)
}

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './custom-select.component.html',
  styleUrls: ['./custom-select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelectComponent),
      multi: true,
    },
  ],
})
export class CustomSelectComponent implements ControlValueAccessor {
  @Input() options: CustomSelectOption[] = [];
  @Input() placeholder: string = 'Seleccione una opción';
  @Input() disabled: boolean = false;
  @Input() searchable: boolean = false;
  @Input() clearable: boolean = false;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  // Custom templates for rendering
  @ContentChild('optionTemplate') optionTemplate?: TemplateRef<any>;
  @ContentChild('selectedTemplate') selectedTemplate?: TemplateRef<any>;

  @Output() selectionChange = new EventEmitter<any>();

  @ViewChild('dropdownContainer') dropdownContainer?: ElementRef;

  isOpen = false;
  searchTerm = '';
  selectedOption: CustomSelectOption | null = null;
  filteredOptions: CustomSelectOption[] = [];
  focusedIndex = -1;

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private elementRef: ElementRef) {}

  ngOnInit(): void {
    this.filteredOptions = [...this.options];
  }

  ngOnChanges(): void {
    this.filteredOptions = this.filterOptions();
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    this.selectedOption =
      this.options.find((opt) => opt.value === value) || null;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // Toggle dropdown
  toggleDropdown(): void {
    if (this.disabled) return;

    this.isOpen = !this.isOpen;

    if (this.isOpen) {
      this.searchTerm = '';
      this.filteredOptions = [...this.options];
      this.focusedIndex = this.selectedOption
        ? this.options.indexOf(this.selectedOption)
        : -1;
    } else {
      this.onTouched();
    }
  }

  // Select option
  selectOption(option: CustomSelectOption): void {
    if (option.disabled) return;

    this.selectedOption = option;
    this.onChange(option.value);
    this.selectionChange.emit(option.value);
    this.isOpen = false;
    this.searchTerm = '';
    this.onTouched();
  }

  // Clear selection
  clearSelection(event: Event): void {
    event.stopPropagation();
    this.selectedOption = null;
    this.onChange(null);
    this.selectionChange.emit(null);
    this.onTouched();
  }

  // Search/filter options
  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
    this.filteredOptions = this.filterOptions();
    this.focusedIndex = 0;
  }

  private filterOptions(): CustomSelectOption[] {
    if (!this.searchTerm) {
      return [...this.options];
    }

    const term = this.searchTerm.toLowerCase();
    return this.options.filter((opt) => {
      // Search in label first
      if (opt.label.toLowerCase().includes(term)) {
        return true;
      }
      // If searchableText is provided, search there too
      if (opt.searchableText && opt.searchableText.toLowerCase().includes(term)) {
        return true;
      }
      return false;
    });
  }

  // Keyboard navigation
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (!this.isOpen) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusedIndex = Math.min(
          this.focusedIndex + 1,
          this.filteredOptions.length - 1
        );
        this.scrollToFocusedOption();
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.focusedIndex = Math.max(this.focusedIndex - 1, 0);
        this.scrollToFocusedOption();
        break;

      case 'Enter':
        event.preventDefault();
        if (
          this.focusedIndex >= 0 &&
          this.focusedIndex < this.filteredOptions.length
        ) {
          this.selectOption(this.filteredOptions[this.focusedIndex]);
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.isOpen = false;
        this.onTouched();
        break;
    }
  }

  private scrollToFocusedOption(): void {
    // Scroll to focused option (implement if needed)
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
      this.onTouched();
    }
  }

  // Get size classes
  getSizeClasses(): string {
    const sizeMap = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-3 py-2.5 text-sm', // py-2.5 = 10px top + 10px bottom = 20px total padding (matches native inputs)
      lg: 'px-4 py-3 text-base',
    };
    return sizeMap[this.size];
  }
}
